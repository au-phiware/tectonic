function Pure(element) {
  var basis = element.cloneNode(true);

  this.get = function() {
    return element;
  };

  this.render = function(data, directive) {
    if (!directive) {
      directive = autoCompile(element, data);
    }
    if (typeof directive !== 'function') {
      directive = this.compile(directive);
    }
    var newElement = directive(data);
    if (newElement !== element) {
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
      element = newElement;
    }
    return this;
  };

  this.compile = function(directive) {
    var renderer = plugin.compile([basis], directive);
    return function(data) {
      return renderer(element, data);
    }
  };
}

function compiler(root, spec, template) {
  var find = plugin.finder(root, spec, template);
  var write = plugin.writer(root, spec, template);
  var format = plugin.formatter(root, spec, template);

  return function(targets, data) {
    for (var j = 0, jj = targets.length; j < jj; j++) {
      var target = targets[j];
      var bindData = format(target, data, j, targets);
      var nodes = find(target, bindData, root);
      for (var i = 0, ii = nodes.length; i < ii; i++) {
        write(nodes[i], bindData, i, nodes);
      }
    }
  }
}

function parseSelector(str) {
  var spec = { raw: str };
  var match = str.match(/^([+-])? *([^\@\+]+)? *(\@([^\+]+))? *([+-])?$/);

  if (!match)
    throw "invalid selector: '" + str + "'";

  spec.prepend  = match[1] === '+';
  spec.shift    = match[1] === '-';
  spec.selector = match[2];
  spec.attr     = match[4];
  spec.append   = match[5] === '+';
  spec.pop      = match[5] === '-';
  spec.toggle   = spec.prepend && spec.pop || spec.shift && spec.append;

  return spec;
}

var plugin = {
  find: function(root, selector) {
    var elements = [];
    var found, i, ii, j, jj;
    for (i = 0, ii = root.length; i < ii; i++) {
      found = root[i].querySelectorAll(selector);
      for (j = 0, jj = found.length; j < jj; j++) {
        elements.push(found[j]);
      }
    }
    return elements;
  },

  isArray: Array.isArray ? function(o) { return Array.isArray(o); } : function(o) {
    return Object.prototype.toString.call(o) === "[object Array]";
  },

  // retrieve the nodes that need to be transformed, also ensure that the nodes exist.
  finder: function(root, spec, template) {
    if (!spec.selector || /^ *\.? *$/.test(spec.selector)) {
      return topFinder;
    } else if (typeof template === 'object') {
      return arrayFinder;
    } else {
      return queryFinder;
    }
    function topFinder(target, data) {
      return [target];
    };
    function queryFinder(target, data) {
      return plugin.find([target], spec.selector);
    };
    function arrayFinder(target, data, root) {
      var length = data.length;
      var ownerDocument = target.ownerDocument || document;
      var nodes = plugin.find([target], spec.selector);
      var i, ii = nodes.length;
      if (!length) {
        if (ii) {
          for (i = 1; i < ii; i++) {
            nodes[i].parentNode.removeChild(nodes[i]);
          }
          if (ownerDocument) {
            nodes[0].parentNode.replaceChild(ownerDocument.createComment(spec.raw), nodes[0]);
          } else {
            nodes[0].parentNode.removeChild(nodes[0]);
          }
        }
        return [];
      } else if (length === ii) {
        return nodes;
      } else {
        var newNodes = plugin.find(root, spec.selector);
        var sentinal, lastNode, mod = newNodes.length;
        if (!ii) {
          lastNode = newNodes[0].cloneNode(true);
          var q = [target];
          while (q.length) {
            var comment = q.pop();
            if (comment.nodeType === 8 && comment.nodeValue === spec.raw) {
              comment.parentNode.replaceChild(lastNode, comment);
              q.length = 0;
            } else if (comment.childNodes.length) {
              q.splice.apply(q, [0, 0].concat(Array.prototype.slice.call(comment.childNodes)));
            }
          }
          ii = 1;
        } else {
          lastNode = nodes[ii - 1];
        }
        sentinal = lastNode.nextSibling;
        lastNode = lastNode.parentNode;
        var insert = sentinal ? function(newNode) {
            lastNode.insertBefore(newNode, sentinal);
          } : function(newNode) {
            lastNode.appendChild(newNode);
          };

        for (i = Math.min(ii, length); i < length; i++) {
          insert(newNodes[i % mod].cloneNode(true));
        }
        for (; i < ii; i++) {
          lastNode.removeChild(nodes[i]);
        }
      }
      return plugin.find([target], spec.selector);
    };
  },

  // set the contents or attribute of the node.
  writer: function(root, spec, template) {
    var loopSpec, renderer;
    if (spec.attr) {
      return attrWriter;
    } else if (typeof template === 'object') {
      loopSpec = plugin.parseLoopSpec(template);
      renderer = plugin.compile(plugin.find(root, spec.selector), template[loopSpec[0]]);
      return arrayWriter;
    } else {
      return elementWriter;
    }
    function elementWriter(target, value) {
      if (target.nodeType === 1) {
        if (target.tagName.toUpperCase() === 'INPUT') {
          target.attributes.value = value;
        } else {
          target.innerHTML = value;
        }
      } else {
        target.nodeValue = value;
      }
    }
    function arrayWriter(target, value, i, targets) {
      var data = {};
      data[loopSpec[1]] = value[i];
      renderer(target, data);
    }
    function attrWriter(target, value) {
      if (target.tagName.toUpperCase() === "OPTION" && spec.attr === "selected") {
        var selected = value === 'false' ? false : Boolean(value);
        target.selected = selected;
        if (selected) {
          target.setAttribute("selected", value);
        } else {
          target.removeAttribute("selected");
        }
      } else if (target.nodeType === 1) {
        target.setAttribute(spec.attr, value);
      } else {
        target[spec.attr] = value;
      }
    }
  },

  // get the new value that will be past to set.
  formatter: function(root, spec, template) {
    var pathExp = /^[\da-zA-Z\$_\@\#][\w\$:\-\#]*(\.[\w\$:\-\#]*[^\.])*$/;
    var key, loopSpec, search, found, parts;
    switch (typeof template) {
      case 'function':
        return template;
      case 'object':
        if (plugin.isArray(template)) {
          return walkFormatter(template);
        } else {
          return walkFormatter(plugin.parseLoopSpec(template)[3].split('.'));
        }
        break;
      case 'string':
        parts = [];
        search = / *(?:"([^"]*)"|'([^']*)'|([^'" ]+)) */g;
        while ((found = search.exec(template))) {
          if (found[3]) {
            parts.push(walkFormatter(found[3].split('.')));
          } else {
            parts.push(stringFormatter(found[1] || found[2]));
          }
        }
        if (parts.length == 1) {
          return parts[0];
        } else if (parts.length > 1) {
          return concatenator(parts);
        }
        break;
    }
    function walkFormatter(path) {
      return function(target, data) {
        for (var i = 0, ii = path.length; i < ii && data; i++) {
          data = data[path[i]];
        }
        return data;
      }
    }
    function stringFormatter(literal) {
      return function() { return literal; };
    }
    function concatenator(parts) {
      return function() {
        var i, str = "";
        for (i in parts) {
          str += parts[i].apply(this, arguments);
        }
        return str;
      };
    }
  },

  parseLoopSpec: function(template) {
    var loopSpec;
    for (var key in template) if (template.hasOwnProperty(key)) {
      loopSpec = key.match(/^ *([^ ]*) *<([-=]) *([^ ]*) *$/);
      if (loopSpec) {
        return loopSpec;
        // TODO: ensure no other key matches /<[-=]/
      }
    }
    throw "Expected looping directive (<-) is missing.";
  },

  compile: function(basis, directive) {
    var actions = [];
    for (var selector in directive) {
      actions.push(compiler(basis, parseSelector(selector), directive[selector]));
    }
    return function(element, data) {
      for (var i in actions) {
        actions[i]([element], data);
      }
      return element;
    };
  }
};
