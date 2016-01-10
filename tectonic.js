function Tectonic(element, basis) {
  if (!(element instanceof Node)) {
    element = element.get(0);
  }
  if (arguments.length < 2) {
    basis = element.cloneNode(true);
  }

  this.get = function() {
    return element;
  };

  this.clone = function() {
    return new Tectonic(element, basis);
  };

  this.equals = function(otherElement, otherBasis) {
    switch (arguments.length) {
      case 2:
        return element === otherElement && basis === otherBasis;
      case 1:
        if (otherElement instanceof Tectonic) {
          return this === otherElement || otherElement.equals(element, basis);
        }
    }
    return false;
  };

  function autoCompile(data, directive) {
    return plugin.autoCompile(element, directive || {}, data);
  }

  this.autoRender = function(data, directive) {
    return this.render(data, autoCompile(data, directive));
  };

  this.render = function(data, directive) {
    if (!directive) {
      directive = autoCompile(data);
    }
    if (typeof directive !== 'function') {
      directive = this.compile(directive);
    }
    var newElement = directive.call(this, data);
    if (newElement !== element) {
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
      element = newElement;
    }
    return this;
  };

  this.parse = function(directive) {
    if (!directive) {
      throw "Directive missing.";
    }
    if (typeof directive !== 'function') {
      directive = this.compile(directive);
    }
    return directive.inverse.call(this);
  };

  this.compile = function(directive) {
    var renderer = plugin.compile([basis], directive);
    var tectonic = this;
    var bounded = function(data) {
      return renderer(tectonic.equals(this) ? element : basis.cloneNode(true), data);
    };
    bounded.inverse = function() {
      return renderer.inverse(tectonic.equals(this) ? element : basis, {});
    };
    return bounded;
  };
}

function compiler(root, spec, template) {
  var find = plugin.finder(root, spec, template);
  var write = plugin.writer(root, spec, template);
  var format = plugin.formatter(root, spec, template);
  var parse = plugin.parser(root, spec, template);
  var read = plugin.reader(root, spec, template);

  var renderAction = function(targets, data, index, elements, collection) {
    for (var j = 0, jj = targets.length; j < jj; j++) {
      var target = targets[j];
      var bindData = format(data, target, index, elements, collection);
      var nodes = find(target, bindData, root);
      for (var i = 0, ii = nodes.length; i < ii; i++) {
        write(nodes[i], bindData, i, nodes);
      }
    }
  };
  if (read && parse) {
    renderAction.inverse = function(source, data) {
      read(data, parse(source, find));
    };
  }
  return renderAction;
}

function parseSelector(str) {
  var spec = { raw: str };
  var match = str.match(/^([+-])? *([^\@\+]+)? *(\@([^ ]+?))? *([+-])?$/);

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
    } else if (typeof template === 'object' && !plugin.isArray(template)) {
      return arrayFinder(spec);
    } else {
      return queryFinder;
    }
    function topFinder(target, data) {
      return [target];
    };
    function queryFinder(target, data) {
      return plugin.find([target], spec.selector);
    };
  },

  // set the contents or attribute of the node.
  writer: function(root, spec, template) {
    var loopSpec, renderer;
    if (spec.attr) {
      return attrWriter;
    } else if (typeof template === 'object' && !plugin.isArray(template)) {
      loopSpec = plugin.parseLoopSpec(template);
      renderer = plugin.compile(plugin.find(root, spec.selector), template[loopSpec[0]]);
      return arrayWriter;
    } else {
      return elementWriter;
    }
    function elementWriter(target, value) {
      if (target.nodeType === 1) {
        if (target.tagName.toUpperCase() === 'INPUT') {
          if (spec.append) {
            value = target.getAttribute('value') + value;
          } else if (spec.prepend) {
            value = value + target.getAttribute('value');
          }
          target.setAttribute('value', value);
        } else {
          if (!(value instanceof Node)) {
            value = document.createTextNode(value);
          }
          if (spec.append) {
            target.appendChild(value);
          } else if (spec.prepend && target.childNodes.length) {
            target.insertBefore(value, target.childNodes[0]);
          } else {
            if (target.childNodes.length) {
              target.innerHTML = "";
            }
            target.appendChild(value);
          }
        }
      } else {
        if (spec.append) {
          value = target.nodeValue + value;
        } else if (spec.prepend) {
          value = value + target.nodeValue;
        }
        target.nodeValue = value;
      }
    }
    function arrayWriter(target, value, i, targets) {
      var data = value[i];
      if (loopSpec[1]) {
        (data = {})[loopSpec[1]] = value[i];
      }
      renderer(target, data, i, targets, value);
    }
    function attrWriter(target, value) {
      if (target.nodeType === 1) {
        if (target.tagName.toUpperCase() === "OPTION" && spec.attr === "selected") {
          var selected = value === 'false' ? false : Boolean(value);
          target.selected = selected;
          if (selected) {
            target.setAttribute("selected", value);
          } else {
            target.removeAttribute("selected");
          }
        } else if (target.tagName.toUpperCase() === "INPUT" && spec.attr === "checked") {
          var checked = value === 'false' ? false : Boolean(value);
          target.checked = checked;
          if (checked) {
            target.setAttribute("checked", value);
          } else {
            target.removeAttribute("checked");
          }
        } else if (spec.attr === "class" || spec.attr === "className" || spec.attr === "classList") {
          if (spec.toggle) {
            var classList = ' ' + target.getAttribute('class') + ' ';
            if (classList.indexOf(' ' + value + ' ') >= 0) {
              classList = classList.replace(' ' + value + ' ', ' ');
            } else if (spec.append) {
              classList += value;
            } else {
              classList = value + classList;
            }
            value = classList.replace(/^ +| +$/g, '');
          } else if (spec.append) {
            value = target.getAttribute('class') + ' ' + value;
          } else if (spec.prepend) {
            value = value + ' ' + target.getAttribute('class');
          }
          target.setAttribute('class', value);
        } else {
          if (spec.append) {
            value = target.getAttribute(spec.attr) + value;
          } else if (spec.prepend) {
            value = value + target.getAttribute(spec.attr);
          }
          target.setAttribute(spec.attr, value);
        }
      } else {
        if (spec.append) {
          value = target[spec.attr] + value;
        } else if (spec.prepend) {
          value = value + target[spec.attr];
        }
        target[spec.attr] = value;
      }
    }
  },

  parser: function(root, spec, template) {
    var loopSpec, renderer;
    if (spec.attr) {
      return attrParser;
    } else if (typeof template === 'object' && !plugin.isArray(template)) {
      loopSpec = plugin.parseLoopSpec(template);
      renderer = plugin.compile(plugin.find(root, spec.selector), template[loopSpec[0]]);
      return arrayParser(loopSpec, renderer);
    } else {
      return elementParser;
    }
    function arrayParser(loopSpec, renderer) {
      return function arrayParser(source, finder) {
        var nodes = plugin.find([source], spec.selector);
        var array = [], data;
        for (var i = 0, ii = nodes.length; i < ii; i++) {
          data = {};
          renderer.inverse(nodes[i], data);
          array[i] = data[loopSpec[1]];
        }
        return array;
      }
    }
    function elementParser(source, finder) {
      var value, basis;
      var target = finder(source)[0]; //TODO: handle missing
      if (spec.append || spec.prepend) {
        basis = finder(root[0])[0];
      }
      if (target.nodeType === 1) {
        if (target.tagName.toUpperCase() === 'INPUT') {
          value = target.getAttribute('value');
          if (basis) {
            value = diff(value, basis.getAttribute('value'), spec.append);
          }
        } else {
          value = target.textContent;
          if (basis) {
            value = diff(value, basis.textContent, spec.append);
          }
        }
      } else {
        value = target.nodeValue;
        if (basis) {
          value = diff(value, basis.nodeValue, spec.append);
        }
      }
      return value;
    }
    function attrParser(source, finder) {
      var value, basis;
      var target = finder(source)[0]; //TODO: handle missing
      if (spec.append || spec.prepend) {
        basis = finder(root[0])[0];
      }
      if (target.nodeType === 1) {
        if (target.tagName.toUpperCase() === "OPTION" && spec.attr === "selected") {
          value = target.selected;
        } else if (target.tagName.toUpperCase() === "INPUT" && spec.attr === "checked") {
          value = target.checked;
        } else if (spec.attr === "class" || spec.attr === "className" || spec.attr === "classList") {
          if (spec.toggle) {
            throw "Unable to parse '" + spec.raw + "', cannot determine value of toggle.";
          } else {
            value = target.getAttribute('class');
            if (basis) {
              value = diff(value, basis.getAttribute('class'), spec.append);
              value = value.replace(/^ +| +$/g, '');
            }
          }
        } else {
          value = target.getAttribute(spec.attr);
          if (basis) {
            value = diff(value, basis.getAttribute(spec.attr), spec.append);
          }
        }
      } else {
        value = target[spec.attr];
        if (basis) {
          value = diff(value, basis[spec.attr], spec.append);
        }
      }
      return value;
    }
    function diff(value, original, end) {
      if (end) {
        if (value.indexOf(original) === 0) {
          return value.substr(original.length);
        }
      } else {
        var index = value.indexOf(original);
        if (index >= 0 /*&& index === value.length - original.length*/) {
          return value.substr(0, index);
        }
      }
      return value;
    }
  },

  // get the new value that will be past to set.
  formatter: function(root, spec, template) {
    var pathExp = /^[\da-zA-Z\$_\@\#][\w\$:\-\#]*(\.[\w\$:\-\#]*[^\.])*$/;
    var key, looper, search, found, parts;
    switch (typeof template) {
      case 'function':
        return template;
      case 'object':
        if (plugin.isArray(template)) {
          return walkFormatter(template);
        } else {
          looper = walkFormatter(plugin.parseLoopSpec(template)[3].split('.'));
          if ('sort' in template || template.filter) {
            looper = arrayFormatter(looper, template);
          }
          return looper;
        }
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
        } else {
          return function emptyFormatter() { return ''; };
        }
    }
    function arrayFormatter(formatter, template) {
      return function arrayFormatter(data, target) {
        var filtered;
        var array = formatter.apply(this, arguments);
        if (template.filter) {
          filtered = [];
          for (var i = 0, ii = array.length; i < ii; i++) {
            if (template.filter(array[i])) {
              filtered.push(array[i]);
            }
          }
        } else {
          filtered = Array.prototype.slice.call(array);
        }
        if ('sort' in template) {
          filtered.sort(template.sort);
        }
        return filtered;
      };
    }
    function walkFormatter(path) {
      return function walkFormatter(data, target) {
        for (var i = 0, ii = path.length; i < ii && data; i++) {
          data = data[path[i]];
        }
        return data;
      }
    }
    function concatenator(parts) {
      return function concatenator() {
        var i, part, cat = "";
        for (i in parts) {
          part = parts[i].apply(this, arguments);
          if (typeof part !== 'undefined') {
            cat += part;
          }
        }
        return cat;
      };
    }
  },

  reader: function(root, spec, template) {
    if (typeof template === 'function') {
      template = template.inverse || function deferReaderException() {
        throw "Unable to parse '" + spec.raw + "', cannot find inverse of function.";
      };
    }
    switch (typeof template) {
      case 'function':
        return template;
      case 'object':
        if (plugin.isArray(template)) {
          return walkReader(template);
        } else {
          return walkReader(plugin.parseLoopSpec(template)[3].split('.'));
        }
      case 'string':
        parts = [];
        search = / *(?:"([^"]*)"|'([^']*)'|([^'" ]+)) */g;
        while ((found = search.exec(template))) {
          if (found[3]) {
            parts.push(walkReader(found[3].split('.')));
          } else {
            parts.push(found[1] || found[2]);
          }
        }
        if (parts.length == 1 && typeof parts[0] === 'function') {
          return parts[0];
        } else if (parts.length > 1) {
          return deconcatenator(parts);
        } else {
          return function emptyReader() {};
        }
    }
    function deconcatenator(parts) {
      return function deconcatenator(data, value) {
        var part, partValue, index;
        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];
          switch (typeof part) {
            case 'string':
              value = value.substr(part.length);
              break;
            case 'function':
              if (i + 1 === ii || typeof parts[i + 1] !== 'function') {
                if (i + 1 !== ii) {
                  // Next part is a string (because it's not a function)
                  index = value.indexOf(parts[++i]);
                  partValue = value.substr(0, index);
                  value = value.substr(index + parts[i].length);
                } else {
                  partValue = value;
                }
                part(data, partValue);
              } else {
                throw "Unable to parse '" + spec.raw + "', cannot separate consecutive data paths that have been concatenated together.";
              }
              break;
          }
        }
      }
    }
    function walkReader(path) {
      return function walkReader(data, value) {
        for (var i = 0, ii = path.length - 1; i < ii; i++) {
          if (!data[path[i]]) {
            if (path[i] == parseInt(path[i])) {
              data[path[i]] = [];
            } else {
              data[path[i]] = {};
            }
          }
          data = data[path[i]];
        }
        return data[path[i]] = value;
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

  autoCompile: function(element, directive, data) {
    var e, up, q = [element];
    var d, head, stack = [data];
    var classNames, specs, spec, i, ii;
    var children, els, j, jj;
    while (q.length) {
      e = q.pop();
      if (e) {
        if (e.nodeType === 1) {
          children = e.children;
          if (e.className) {
            specs = [];
            classNames = e.className.split(/ +/);
            head = stack[0];
            for (i = 0, ii = classNames.length; i < ii; i++) {
              if (classNames[i] && /^[+-]?([^\@\+]+)(\@([^\+]+))?[+-]?$/.test(classNames[i])) {
                spec = parseSelector(classNames[i]);
                if (spec.selector in head) {
                  specs.push(spec);
                  if (spec.selector !== classNames[i]) {
                    e.className = e.className.replace(classNames[i], spec.selector);
                  }
                }
              }
            }
            for (i = 0, ii = specs.length; i < ii; i++) {
              spec = specs[i];
              d = head[spec.selector];
              if (typeof d === 'object') {
                spec.selector = '.' + spec.selector;
                if (plugin.isArray(d)) {
                  if (e.parentNode) {
                    up = e.parentNode;
                  } else {
                    up = document.createDocumentFragment();
                    up.appendChild(e);
                  }
                  els = arrayFinder(spec)(up, d, [up]);
                  for (j = 0, jj = d.length; j < jj; j++) {
                    if (typeof d[j] === 'object') {
                      stack.unshift(d[j]);
                      q.push(false, els[j]);
                    } else {
                      spec.selector = void 0;
                      compiler([els[j]], spec, stringFormatter(d[j]))([els[j]], d[j]);
                    }
                  }
                } else {
                  stack.unshift(d);
                  q.push(false);
                  q.push.apply(q, children);
                  children = [];
                }
              } else {
                spec.selector = void 0;
                compiler([e], spec, stringFormatter(d))([e], d);
              }
            }
            stack.unshift(head);
            q.push(false);
          }
          q.push.apply(q, children);
        }
      } else {
        stack.shift();
      }
    }
    for (var selector in directive) {
      compiler([element], parseSelector(selector), directive[selector])([element], data);
    }
    return function() { return element; };
  },

  compile: function(basis, directive) {
    var actions = [];
    for (var selector in directive) {
      actions.push(compiler(basis, parseSelector(selector), directive[selector]));
    }
    var renderer = function(element, data, index, elements, collection) {
      for (var i in actions) {
        actions[i]([element], data, index, elements, collection);
      }
      return element;
    };
    renderer.inverse = function(element, data) {
      for (var i in actions) {
        if (actions[i].inverse) {
          actions[i].inverse(element, data);
        }
      }
      return data;
    };
    return renderer;
  }
};

function stringFormatter(literal) {
  return function stringFormatter() { return String(literal); };
}

function arrayFinder(spec) {
  return function arrayFinder(target, data, root) {
    var length = data && data.length || 0;
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
        nodes = [lastNode];
      } else {
        lastNode = nodes[ii - 1];
        nodes = Array.prototype.slice.call(nodes);
      }
      sentinal = lastNode.nextSibling;
      lastNode = lastNode.parentNode;
      var insert = sentinal ? function(newNode) {
          lastNode.insertBefore(newNode, sentinal);
          nodes.push(newNode);
        } : function(newNode) {
          lastNode.appendChild(newNode);
          nodes.push(newNode);
        };

      for (i = Math.min(ii, length); i < length; i++) {
        insert(newNodes[i % mod].cloneNode(true));
      }
      for (; i < ii; i++) {
        lastNode.removeChild(nodes[i]);
      }
      nodes.length = length;
    }
    return nodes;
  };
}

Tectonic.position = function(_, _, i) {
  return i + 1;
};
Tectonic.position.inverse = function() {};
