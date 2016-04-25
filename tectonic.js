//     (c) 2015-2016 Corin Lawson
//
//     Permission is hereby granted, free of charge, to any person obtaining a copy of
//     this software and associated documentation files (the "Software"), to deal in
//     the Software without restriction, including without limitation the rights to
//     use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//     the Software, and to permit persons to whom the Software is furnished to do so,
//     subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
//     copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
//     FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
//     COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
//     IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//     CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

(function (root, factory) {
  // AMD. Register as an anonymous module.
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  }
  // Node. Does not work with strict CommonJS, but only CommonJS-like
  // environments that support module.exports, like Node.
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  }
  // Browser globals (root is window)
  else {
    root.Tectonic = factory();
  }
}(this, function () {

// Introduction
// ============
//
// Tectonic is a functional rendering engine for DOM nodes, heavily inspired by
// [Beebole's PURE](https://github.com/pure/pure) rendering engine.
// It ascribes to PURE's unobtusive philosophy, whereby HTML code is completely
// free of any application logic or new syntax and JavaScript code is
// uninhibited by presentational concerns. This is achieved by both PURE and
// Tectonic by the use of a directive object that marries HTML referenced by CSS
// selectors to properties in your application's data.
// Where Tectonic departs from PURE is in the use of functions, known as
// renderers, to directly manipulate DOM nodes. This permits Tectonic to
// provide two-way data flow via a `parse` method, which makes use of an inverse
// function that is attached to a renderer.
// Tectonic takes the stance that it is your responsiblity to provide a context
// to any function that you provide. I.e. Tectonic won't be using `call` or
// `apply` on functions that you define, consider using
// [underscore](http://underscorejs.org/)'s `bind` method or simply defining
// your methods inside a closure.
//
// The directive object's keys are used to find elements and/or element
// attributes in the DOM. That element's content or its attribute is then updated
// according to the directive's value for that key. The directive's value can
// specify a literal string, a property in a given data object, or a combination
// of both. It can also duplicate the element and recursively render those
// elements for each item of an array in the given data object.

// Constructor
// ===========

// A Tectonic object wraps the specified `element` and defines methods for
// compile, render, parse, etc. An optional `basis` may also be specified; think
// of the basis as an untouched version of `element`, which will be used by
// Tectonic as a point of reference.
function Tectonic(element, basis) {
  // `element` is expected to be a DOM `Node`, otherwise we assume it's a
  // different Tectonic object and get its element.  Note this also works well
  // with jQuery objects.
  if (!(element instanceof Node)) {
    element = element.get(0);
  }
  // The most common use case is to wrap an element that's already in the
  // browser's DOM before any DOM changes, hence the element is currently
  // *untouched* so the basis is simply a clone of the element.
  if (arguments.length < 2) {
    basis = element.cloneNode(true);
  }

  // Accessor for this object's `element`. Think `jQuery#get`.
  this.get = function() {
    return element;
  };

  this.clone = function(deep) {
    // Creates a deep copy of this object. Note that returned object's `element`
    // will be detached from the browser's DOM.
    if (deep) {
      return new Tectonic(element.cloneNode(true), basis.cloneNode(true));
    }

    // Creates a shallow copy of this object.
    return new Tectonic(element, basis);
  };

  // Compares the specified `other` object to this object.
  // When a single argument is provided, returns `true` if and only if `other`
  // is an instance of Tectonic and both its `element` and `basis` are identical
  // to this object's `element` and `basis`, respectively.
  // When two arguments are specified, returns `true` if and only if `other` and
  // `otherBasis` are identical to this object's `element` and `basis`,
  // respectively.
  this.equals = function(other, otherBasis) {
    switch (arguments.length) {
      case 2:
        return element === other && basis === otherBasis;
      case 1:
        if (other instanceof Tectonic) {
          return this === other || other.equals(element, basis);
        }
    }
    return false;
  };

  // Updates this object's `element` to reflect the specified `data` according
  // to the specified `directive`. Returns this object for chaining.
  // The `directive` may be an object (to be compiled) or a pre-compiled
  // renderer function.
  this.render = function(data, directive) {
    // Behave like `autoRender` when there's no directive.
    if (!directive) {
      directive = autoCompile(data);
    }
    // Accept a pre-compiled renderer (or any function really!), otherwise
    // create a renderer function by compiling the `directive`.
    if (typeof directive !== 'function') {
      directive = this.compile(directive);
    }
    // Execute the renderer!
    // Although the common use case is for the renderer to simply make changes
    // directly to `element`, we are nevertheless prepared for the renderer to
    // create a new element.
    var newElement = directive.call(this, data);
    if (newElement !== element) {
      // If it is the case that a new element was created then replace this
      // object's `element` with the `newElement`.
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
      element = newElement;
    }
    // Return this object to support chaining.
    return this;
  };

  // Creates a data object from this object's `element` according to the
  // specified `directive`. Returns an object that contains the data that would
  // be required to `render` this object, that would result in this object's
  // `element`. Note that this can be called before `render`, consider using
  // `parse` to extract default values from your browser's DOM.
  this.parse = function(directive) {
    // There's no autoParse here...
    if (!directive) {
      throw new Error("Directive missing.");
    }
    // Accept a pre-compiled renderer, otherwise create a renderer function by
    // compiling the `directive`.
    if (typeof directive !== 'function') {
      directive = this.compile(directive);
    }
    // Parse is only posible because [`compile`](#compilers) attaches an
    // `inverse` function to the renderer function.
    return directive.inverse.call(this);
  };

  // Create a renderer and its inverse function, according to the specified
  // `directive`. Returns a function that can be used in place of a directive to
  // `render` and `parse`.
  this.compile = function(directive) {
    // The real work is done by [`Tectonic.plugin.compile`](#compilers).
    var renderer = Tectonic.plugin.compile([basis], directive);
    // The resulting function is curried with this object's `element` or a clone
    // of `element` if it is called within a different context.
    // For example you can produce many nodes like so
    //
    //     var render = new Tectonic(element).compile(directive);
    //     for (var i in models) {
    //       document.body.appendChild(render(models[i]));
    //     }
    var tectonic = this;
    var bounded = function(data) {
      return renderer(tectonic.equals(this) ? element : basis.cloneNode(true), data);
    };
    bounded.inverse = function(el) {
      return renderer.inverse(tectonic.equals(this) ? element : el || basis, {});
    };
    return bounded;
  };

  // Like compile but also inspects this object's `element`'s class names for
  // additional directives.
  function autoCompile(data, directive) {
    return Tectonic.plugin.autoCompile(element, directive || {}, data);
  }

  // Almost exactly like `render`, except this object's `element`'s class names
  // are inspected for additional directives.
  this.autoRender = function(data, directive) {
    return this.render(data, autoCompile(data, directive));
  };
}

// Selectors
// =========

// Creates an object that specifies what part of the DOM should be manipulated,
// given the specified key from a directive. The directive's key is broken into
// four optional parts.
function parseSelector(str) {
  var spec = { raw: str };
  var match = str.match(/^ *([^@]*?)?? *(\@([^ ]+?))? *(:(before|after|toggle))? *$/);

  if (!match)
    throw new Error("invalid selector: '" + str + "'");

  // The first part specifies a (CSS) selector used to find the element to be
  // updated.
  spec.selector = match[1];
  // The next part, if present, must be preceeded by an `@`, and names the
  // attribute of the element to be updated.
  spec.attr     = match[3];
  // The last part, is like a pseudo-class selector, but in this case it
  // signifies that the content should be prepended (before) or appended
  // (after). Note that it doesn't make sense for tectonic is manipulate
  // pseudo-classes.
  spec.prepend  = match[5] === 'before';
  spec.append   = match[5] === 'after';
  // A special pseudo-class, just for Tectonic, the that signifies that the
  // content must be switched between two alternative values.
  spec.toggle   = match[5] === 'toggle';

  return spec;
}

// Compiler
// ========

// Creates a renderer function for one key-value pair (i.e. the specified `spec`
// and `template` pair). Note that the specified `basis` is an array of DOM
// nodes to support recursively calling [`compile`](#compilers) with the results
// [`Tectonic.plugin.find`](#section-79) as the `basis` (e.g. see
// [`Tectonic.plugin.loopWriter`](#section-90)).
// This method is responsible for coordinating the five methods that is
// generated from the [`Tectonic.plugin`](#plugin), namely a finder, writer,
// formatter, parser and reader. To that end, no assumption is made about the
// information that these five plugin methods need, therefore they are called
// with all the information that we have.
function compiler(basis, spec, template) {
  // The real work of finding the correct element to update is done by
  // the function returned from [`Tectonic.plugin.finder`](#finders).
  // The resulting `find` function mostly likely doesn't need `template` but
  // finder does use it to despatch on its type. Likewise, `basis` is unlikely
  // to be used except in the event that the element in the DOM has already been
  // removed by a previous renderer.
  // The important peice of information that finder needs is `spec.selector`.
  var find = Tectonic.plugin.finder(basis, spec, template);
  // The real work of updating the DOM is done by the function returned from
  // [`Tectonic.plugin.writer`](#writers).
  // Similar to finder, writer is unlikely to need `basis` or `template`.
  // The important information that writer needs is `spec.attr`, `spec.append`,
  // `spec.prepend`, etc.
  var write = Tectonic.plugin.writer(basis, spec, template);
  // The real work of finding the content to place into the DOM is done by
  // the function returned from [`Tectonic.plugin.formatter`](#formatters).
  // Unlike finder and writer, formatter is unlikely to need `spec` or `basis`.
  // The important information is almost exclusively contained with in template.
  var format = Tectonic.plugin.formatter(basis, spec, template);
  // The real work of extracting data back out of the DOM is done by
  // the function returned from [`Tectonic.plugin.parser`](#parsers).
  // It is the converse of write, and uses the same information contained in
  // `spec`.
  var parse = Tectonic.plugin.parser(basis, spec, template);
  // The real work of putting data back into a data object is done by the
  // function returned from [`Tectonic.plugin.reader`](#readers).
  // It is the converse of format, and as such the important information is
  // almost exclusively contained with in template.
  var read = Tectonic.plugin.reader(basis, spec, template);

  // These renderers take a signgle `target` element to be rendered with `data`.
  // The other arguments are optional and typically only present when handling
  // loop directives.
  var renderAction = function(target, data, index, elements, values) {
    // The same data will be applied to every node selected by `spec`.
    // The common use case will be a single node for the data.
    var bindData = format(data, target, index, elements, values);
    var nodes = find(target, bindData, basis);

    for (var i = 0, ii = nodes.length; i < ii; i++) {
      var boundData = bindData;
      // Data can be tailored to each and every node by supplying a function
      // that returns a function as the value of the directive. E.g. see
      // [`Tectonic.toggleClass`](#section-147).
      if (typeof boundData === 'function') {
        boundData = bindData(data, nodes[i], i, nodes);
      }
      // Now, update the DOM.
      var newNode = write(nodes[i], boundData, i, nodes);
      // Typically `write` simply updates the DOM, but if a different node is
      // produced, update the DOM with that node instead.
      if (newNode !== nodes[i]) {
        if (newNode && nodes[i].parentNode) {
          nodes[i].parentNode.replaceChild(newNode, nodes[i]);
        }
        nodes[i] = newNode;
      }
    }
  };
  // Parsing relies on `parse` and `read`
  if (parse && read) {
    renderAction.inverse = function(source, data) {
      return read(data, parse(source, find));
    };
  }
  return renderAction;
}

// Plugin
// ======

// Used by [`Tectonic.plugin.formatter`](#formatters) and
// [`Tectonic.plugin.reader`](#readers) to break a template string into literal
// strings and paths of a property in a data object.
var stringDataPattern = / *(?:"([^"]*)"|'([^']*)'|([^'" ]+)) */g;

// Most of the core functionality of Tectonic is exposed here, in order to allow
// other authors to extend the functionality. For example, authors working with
// SVG could override [`Tectonic.plugin.writer`](#writers) and
// [`Tectonic.plugin.parser`](#parsers) (or some of its helpers, such as
// `attrWriter` and `loopParser`); authors using Backbone models could override
// `Tectonic.plugin.reader` and [`Tectonic.plugin.formatter`](#formatters) (or
// just `propFormatter` and `propReader`); or if you wish to use jQuery/Sizzle,
// [`Tectonic.plugin.find`](#section-79) needs to be overridden.
//
// The five plugin methods used in [`compiler`](#compiler) above, act as despatchers based on
// either the spec or the template.
Tectonic.plugin = {

  // Finders
  // -------

  // Returns a function to retrieve an array of Nodes that need to be updated.
  // The returned function's parameters must be a DOM `Node` and data object.
  // The returned function's return value must be an array of nodes.
  finder: function(basis, spec, template) {
    if (!spec.selector || /^ *\.? *$/.test(spec.selector)) {
      return this.topFinder(basis, spec, template);
    } else if (typeof template === 'object' && !this.isArray(template)) {
      return this.loopFinder(basis, spec, template);
    } else {
      return this.queryFinder(basis, spec, template);
    }
  },

  // Used in the case of when the directive refers to the current element being
  // rendered. All the selectors in the following directive will result in
  // calling this method.
  //     {
  //       '': 'empty string',
  //       '@attr': 'also works with attributes',
  //       '.': 'dot',
  //       '.@attr': 'as you would expect'
  //     }
  topFinder: function(basis, spec, template) {
    return function topFinder(target, data) {
      return [target];
    };
  },

  // Used in the case of looping directives.
  // Additionally, this method also ensures that there is the correct number of
  // elements, one for each item in the loop.
  loopFinder: function(basis, spec, template) {
    var p = this;
    return function loopFinder(target, data, basis) {
      var length = data && data.length || 0;
      var ownerDocument = target.ownerDocument || document;
      var nodes = p.find([target], spec.selector);
      var i, ii = nodes.length;
      // When there is no data...
      if (!length) {
        // ...remove all the nodes in the DOM.
        if (ii) {
          // First, remove all but one node.
          for (i = 1; i < ii; i++) {
            nodes[i].parentNode.removeChild(nodes[i]);
          }
          if (ownerDocument) {
            // Replace the last node with a marker so that we may insert new
            // nodes in the future
            nodes[0].parentNode.replaceChild(ownerDocument.createComment(spec.raw), nodes[0]);
          } else {
            // Otherwise remove the last node if a valid document cannot be
            // found.
            nodes[0].parentNode.removeChild(nodes[0]);
          }
        }
        // No data means no nodes.
        return [];
      }
      // When the number of nodes matches the number of data items. There's
      // nothing more to do.
      else if (length === ii) {
        return nodes;
      }
      // Otherwise, add or remove nodes as needed.
      else {
        // Newly created nodes are sourced from the original DOM element. This
        // permits easy striping behaviour.
        var newNodes = p.find(basis, spec.selector);
        var sentinal, lastNode, mod = newNodes.length;
        // When no nodes are found in the DOM we must search for the specail
        // marker that is placed into the DOM when there is no data. Here we
        // perform a breadth-first search starting with `target` and exiting
        // when the comment matching the directive's key is found.
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
        }
        // Otherwise, take note of the lastNode so that we may insert more nodes
        // as needed.
        if (length !== ii) {
          lastNode = nodes[ii - 1];
          // Insertion will be either before the element after the last matching
          // node or (because `lastNode` is infact the last node of it's parent)
          // insertion will be achieved by appending to the parent node.
          var insert;
          sentinal = lastNode.nextSibling;
          lastNode = lastNode.parentNode;
          if (lastNode) {
            insert = sentinal ? function(newNode) {
              lastNode.insertBefore(newNode, sentinal);
              nodes.push(newNode);
            } : function(newNode) {
              lastNode.appendChild(newNode);
              nodes.push(newNode);
            };
          }
          // Alternatively, there is no parent, hence nowhere to insert.
          else {
            insert = function(newNode) {
              nodes.push(newNode);
            };
          }

          // Continue to insert nodes while the number of nodes is less then the
          // number of items in the data.
          for (i = Math.min(ii, length); i < length; i++) {
            insert(newNodes[i % mod].cloneNode(true));
          }
          // Alternatively, remove nodes until the number of nodes matches the
          // number of items in the data.
          for (; i < ii; i++) {
            lastNode.removeChild(nodes[i]);
          }
          // And remove nodes from the returned array as necessary.
          nodes.length = length;
        }
      }
      return nodes;
    };
  },

  // Used in the default case, passes `spec.selector` to
  // [`Tectonic.plugin.find`](#section-79).
  queryFinder: function(basis, spec, template) {
    var p = this;
    return function queryFinder(target, data) {
      return p.find([target], spec.selector);
    };
  },

  // Finds elements within the specified array of Nodes, `contexts`, matching
  // the specified `selector`. Returns an array of Nodes.
  //
  // The default implementation uses `querySelectorAll` and this method is used
  // by various other plugin methods. This is the best point for a jQuery/Sizzle
  // (or similar) plugin to introduce its own functionality.
  //
  // It's important to return a real array (not a `NodeList`) for use in other
  // plugin methods (e.g. `loopFinder`).
  find: function(contexts, selector) {
    var elements = [];
    var found, i, ii, j, jj;
    for (i = 0, ii = contexts.length; i < ii; i++) {
      found = contexts[i].querySelectorAll(selector);
      for (j = 0, jj = found.length; j < jj; j++) {
        elements.push(found[j]);
      }
    }
    return elements;
  },

  // Writers
  // -------

  // Returns a function to update the DOM for a given `spec`.
  // The returned function's parameters must be a `target` DOM `Node` and data
  // object.  The returned function's return value must be the DOM `Node`
  // written to, if this node is not the `target` then the `target` will be
  // replaced with the returned node.
  writer: function(basis, spec, template) {
    if (spec.attr) {
      return this.attrWriter(basis, spec, template);
    } else if (typeof template === 'object' && !this.isArray(template)) {
      return this.loopWriter(basis, spec, template);
    } else {
      return this.elementWriter(basis, spec, template);
    }
  },

  // Used in the case where `spec` refers to an element's attribute.
  attrWriter: function(basis, spec, template) {
    return function attrWriter(target, value) {
      // Attribute selectors are particularly useful for elements.
      if (target.nodeType === 1) {
        // As a convenience, handle dropdown boxes specially.
        if (target.tagName.toUpperCase() === "OPTION" && spec.attr === "selected") {
          var selected = value === 'false' ? false : Boolean(value);
          target.selected = selected;
          if (selected) {
            target.setAttribute("selected", value);
          } else {
            target.removeAttribute("selected");
          }
        }
        // Check and radio boxes also require specail handling.
        else if (target.tagName.toUpperCase() === "INPUT" && spec.attr === "checked") {
          var checked = value === 'false' ? false : Boolean(value);
          target.checked = checked;
          if (checked) {
            target.setAttribute("checked", value);
          } else {
            target.removeAttribute("checked");
          }
        }
        // Treat class attribute (and aliases) specially.
        else if (spec.attr === "class" || spec.attr === "className" || spec.attr === "classList") {
          if (spec.toggle) {
            var classList = ' ' + (target.getAttribute('class') || '') + ' ';
            if (classList.indexOf(' ' + value + ' ') >= 0) {
              classList = classList.replace(' ' + value + ' ', ' ');
            } else {
              classList += value;
            }
            value = classList.replace(/^ +| +$/g, '');
          } else if (spec.append) {
            value = target.getAttribute('class') + ' ' + value;
          } else if (spec.prepend) {
            value = value + ' ' + target.getAttribute('class');
          }
          target.setAttribute('class', value);
        }
        // Otherwise, use `setAttribute` with `spec.attr` as-is and support
        // append and prepend.
        else {
          if (spec.append) {
            value = target.getAttribute(spec.attr) + value;
          } else if (spec.prepend) {
            value = value + target.getAttribute(spec.attr);
          }
          target.setAttribute(spec.attr, value);
        }
      }
      // Attribute selectors might also be useful for other node types, but
      // since other node types do not have a `setAttribute` method then we'll
      // just assign values directly to properties of the `target` node.
      else {
        if (spec.append) {
          value = target[spec.attr] + value;
        } else if (spec.prepend) {
          value = value + target[spec.attr];
        }
        target[spec.attr] = value;
      }
      return target;
    };
  },

  // Used in the case of looping directives.
  loopWriter: function(basis, spec, template) {
    // Find the key that contains the loop spec (e.g. `'<-'`).
    var loopSpec = this.parseLoopSpec(template);
    // Recursively call [`compile`](#compilers) where a subtree of `basis` becomes the new
    // `basis` and the object referenced by `loopSpec` becomes the new
    // directive.
    var renderer = this.compile(this.find(basis, spec.selector), loopSpec.directive);

    return function loopWriter(target, items, i, targets) {
      // An item of the array becomes the data for the recursive call.
      var data = items[i];
      // The lefthand side of `<-`, if present, is used to refer to the data.
      if (loopSpec.lhs) {
        (data = {})[loopSpec.lhs] = items[i];
      }
      return renderer(target, data, i, targets, items);
    };
  },

  // Used in the case where `spec` refers to an element.
  elementWriter: function(basis, spec, template) {
    return function elementWriter(target, value) {
      // When `target` and `value` are the same, there's nothing to do.
      if (target !== value) {
        // Particularly useful for elements.
        if (target.nodeType === 1) {
          // `value` will probably need to be appended, hence we need a node.
          var valueNode = value;
          if (!(value instanceof Node)) {
            valueNode = document.createTextNode(value);
          }

          // Since input elements do not allow child nodes it is more useful to
          // treat the `value` property as its content. This behaviour also
          // works well for textareas.
          if (value !== valueNode && (target.tagName.toUpperCase() === 'INPUT' || target.tagName.toUpperCase() === 'TEXTAREA')) {
            if (spec.append) {
              value = target.value + value;
            } else if (spec.prepend) {
              value = value + target.value;
            }
            target.value = value;
          }
          // Appending is straightforward and happens to be equivalent to
          // prepend when `target` is already empty.
          else if (spec.append || spec.prepend && !target.childNodes.length) {
            target.appendChild(valueNode);
          }
          // Prepend is now straightforward since `target` is not empty.
          else if (spec.prepend) {
            target.insertBefore(valueNode, target.childNodes[0]);
          }
          // When `value` is text, hold back from replacing the entire node.
          else if (value !== valueNode) {
            if (target.childNodes.length) {
              target.innerHTML = "";
            }
            target.appendChild(valueNode);
          }
          // Otherwise, let the renderer complete the replacement.
          // See [`renderAction`](#section-47).
          else target = value;
        }
        // To extend the functionality to other node types, simply use
        // `nodeValue`.
        else if (!(value instanceof Node)) {
          if (spec.append) {
            value = target.nodeValue + value;
          } else if (spec.prepend) {
            value = value + target.nodeValue;
          }
          target.nodeValue = value;
        }
        // Otherwise, let the renderer complete the replacement.
        // See [`renderAction`](#section-47).
        else target = value;
      }
      return target;
    };
  },

  // Formatters
  // ----------

  // Returns a function to find, extract and prepare, from a data object, the
  // content to be written into the DOM.
  // The returned function's parameters must be the data object and the target
  // DOM `Node`.
  // The returned function's return value can be either a string that will be
  // set as the content of the target element or attribute or an element, in
  // which case the target node will be replaced.
  formatter: function(basis, spec, template) {
    var key, found, parts;
    switch (typeof template) {
      case 'function':
        return template;
      case 'object':
        if (this.isArray(template)) {
          return this.propFormatter(basis, spec, template);
        } else {
          return this.loopFormatter(basis, spec, template);
        }
      // Strings specify either a path of a property in the data object, or a
      // literal string or both. Literal strings can be surrounded by either
      // single or double quotes.
      case 'string':
        parts = [];
        while ((found = stringDataPattern.exec(template))) {
          if (found[3]) {
            parts.push(this.propFormatter(basis, spec, found[3].split('.')));
          } else {
            parts.push(this.stringFormatter(basis, spec, found[1] || found[2]));
          }
        }
        if (parts.length == 1) {
          return parts[0];
        }
        else if (parts.length > 1) {
          return this.concatenator(parts);
        } else {
          return this.emptyFormatter();
        }
    }
    return this.emptyFormatter();
  },

  // Used in the case where the data should be treated as a literal string.
  stringFormatter: function(basis, spec, literal) {
    return function stringFormatter() { return String(literal); };
  },

  // Used for directives that do not specify either a function, object, data
  // property, nor literal string.
  emptyFormatter: function(basis, spec, template) {
    return function emptyFormatter() { return ''; };
  },

  // Used for directives that specify a property in a data object. The `path`
  // argument must be an array of strings.
  propFormatter: function(basis, spec, path) {
    return function propFormatter(data, target) {
      // Stop following the path as soon as data is a false-y.
      for (var i = 0, ii = path.length; i < ii && data; i++)
        // Treat empty string in `path` as no-op.
        if (path[i])
          data = data[path[i]];
      return data;
    }
  },

  // Used in the case of looping directives.
  loopFormatter: function(basis, spec, template) {
    // The righthand side specifies the property in the data that is the array.
    var formatter = this.propFormatter(basis, spec, this.parseLoopSpec(template).rhs.split('.'));
    // The array will be used without further processing unless sort or filter
    // is specified.
    if (!('sort' in template) && !template.filter) {
      return formatter;
    }
    return function loopFormatter(data, target) {
      var filtered;
      var array = formatter.apply(this, arguments);
      if (template.filter) {
        filtered = [];
        for (var i = 0, ii = array.length; i < ii; i++) {
          // Execute the `filter` function bound to the loop spec, providing it
          // with the item, index and array.
          if (template.filter(array[i], i, array)) {
            filtered.push(array[i]);
          }
        }
      } else {
        // Do not attempt to sort the original array.
        filtered = Array.prototype.slice.call(array);
      }
      if ('sort' in template) {
        filtered.sort(template.sort);
      }
      return filtered;
    };
  },

  // Returns a function that executes each function of `parts` in turn and
  // concatenates each, returning the result.
  concatenator: function(parts) {
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
  },

  // Parsers
  // -------

  // Returns a function to recontruct, from the DOM, the value to be placed in a
  // data object.
  // The returned function's parameters must be a `source` node from the DOM and
  // a `finder` function (such as a function returned by
  // [`Tectonic.plugin.finder`](#finders)). The `finder` function may be used to
  // find nodes within `source` or `basis`.
  // The returned function's return value must be the value to be placed into a
  // reconstructed data object.
  parser: function(basis, spec, template) {
    if (spec.attr) {
      return this.attrParser(basis, spec, template);
    } else if (typeof template === 'object' && !this.isArray(template)) {
      return this.loopParser(basis, spec, template);
    } else {
      return this.elementParser(basis, spec, template);
    }
  },

  // Used in the case of looping directives.
  loopParser: function(basis, spec, template) {
    // Find the key that contains the loop spec (e.g. `'<-'`).
    var loopSpec = this.parseLoopSpec(template);
    // Recursively call [`Tectonic.plugin.compile`](#compilers) where a subtree
    // of `basis` becomes the new `basis` and the object referenced by
    // `loopSpec` becomes the new directive.
    var renderer = this.compile(this.find(basis, spec.selector), loopSpec.directive);
    var p = this;

    return function loopParser(source, finder) {
      // Each node in the DOM corresponds to one item in the returned array.
      var nodes = p.find([source], spec.selector);
      var array = [], data;
      for (var i = 0, ii = nodes.length; i < ii; i++) {
        // Recontruct the data from the DOM node.
        data = renderer.inverse(nodes[i], data = {});
        // The lefthand side of `<-`, if present, is used to refer to the data.
        if (loopSpec.lhs) {
          data = data[loopSpec.lhs];
        }
        array[i] = data;
      }
      return array;
    };
  },

  // Used in the case where `spec` refers to an element.
  elementParser: function(basis, spec, template) {
    var p = this;
    return function elementParser(source, finder) {
      var value, original;
      var target = finder(source)[0]; //TODO: handle missing or many
      // When appending or prepending, also find the same element in the basis
      // in order to compare later.
      if (spec.append || spec.prepend) {
        original = finder(basis[0])[0];
      }
      // Particularly useful for elements.
      if (target.nodeType === 1) {
        // Since input elements do not allow child nodes it is more useful to
        // treat the `value` property as its content. This behaviour also works
        // well for textareas.
        if (target.tagName.toUpperCase() === 'INPUT' || target.tagName.toUpperCase() === 'TEXTAREA') {
          value = target.value;
          // Given that we earlier found the same element from the `basis`,
          // compare `value` to the original value and find the difference.
          if (original) {
            if (target.tagName.toUpperCase() === 'INPUT') {
              value = p.diff(value, original.getAttribute('value'), spec.append);
            } else {
              value = p.diff(value, original.textContent, spec.append);
            }
          }
        }
        // Otherwise `textContent` is considered to be the data.
        else {
          value = target.textContent;
          if (original) {
            value = p.diff(value, original.textContent, spec.append);
          }
        }
      }
      // To extend the functionality to other node types, simply use
      // `nodeValue`.
      else {
        value = target.nodeValue;
        if (original) {
          value = p.diff(value, original.nodeValue, spec.append);
        }
      }
      return value;
    };
  },

  // Used in the case where `spec` refers to an element's attribute.
  attrParser: function(basis, spec, template) {
    var p = this;
    return function attrParser(source, finder) {
      var value, original;
      var target = finder(source)[0]; //TODO: handle missing
      // When appending or prepending, also find the same element in the basis
      // in order to compare later.
      if (spec.append || spec.prepend) {
        original = finder(basis[0])[0];
      }
      // Attribute selectors are particularly useful for elements.
      if (target.nodeType === 1) {
        // Both `selected` and `checked` attributes are booleans.
        if (target.tagName.toUpperCase() === "OPTION" && spec.attr === "selected") {
          value = target.selected;
        } else if (target.tagName.toUpperCase() === "INPUT" && spec.attr === "checked") {
          value = target.checked;
        }
        // Treat class attribute (and aliases) specially.
        else if (spec.attr === "class" || spec.attr === "className" || spec.attr === "classList") {
          if (spec.toggle) {
            throw new Error("Unable to parse '" + spec.raw + "', cannot determine value of toggle.");
          } else {
            value = target.getAttribute('class');
            if (original) {
              value = p.diff(value, original.getAttribute('class'), spec.append);
              value = value.replace(/^ +| +$/g, '');
            }
          }
        }
        // For all other attributes of elements use `getAttribute`.
        else {
          value = target.getAttribute(spec.attr);
          if (original) {
            value = p.diff(value, original.getAttribute(spec.attr), spec.append);
          }
        }
      }
      // For other node types simply use properties of the `target` node.
      else {
        value = target[spec.attr];
        if (original) {
          value = p.diff(value, original[spec.attr], spec.append);
        }
      }
      return value;
    };
  },

  // If the specified `original` string is located in tne specified `value`
  // string, then return the proceeding portion if `end` is true or the
  // preceeding portion if `end` is `false`. Otherwise, return an empty string.
  diff: function(value, original, end) {
    var index = value.indexOf(original);
    if (index >= 0) {
      if (end) {
        return value.substr(index + original.length);
      } else {
        return value.substr(0, index);
      }
    }
    return '';
  },

  // Readers
  // -------

  // Returns a function to place reconstructed values from the DOM back into a
  // data object.
  // The returned function's parameters must be a `data` object and the
  // reconstructed `value`.
  // The returned function's return value must be the `data` object. Typically,
  // the `data` argument is simply passed through (after modification).
  reader: function(basis, spec, template) {
    var i;
    if (typeof template === 'function') {
      template = template.inverse || function deferReaderException() {
        throw new Error("Unable to parse '" + spec.raw + "', cannot find inverse of function.");
      };
    }
    switch (typeof template) {
      case 'function':
        return template;
      case 'object':
        if (this.isArray(template)) {
          return this.propReader(basis, spec, template);
        } else {
          return this.propReader(basis, spec, this.parseLoopSpec(template).rhs.split('.'));
        }
      // As per [`Tectonic.plugin.formatter`](#formatters) strings may be any
      // combination of literal strings (surrounded by either single or double
      // quotes) or a path of a property in the data object.
      case 'string':
        i = -1;
        parts = [];
        while ((found = stringDataPattern.exec(template))) {
          if (found[3]) {
            parts.push(this.propReader(basis, spec, found[3].split('.')));
            i++;
          } else if (i < 0 || typeof parts[i] == 'function') {
            parts.push(found[1] || found[2]);
            i++;
          }
          // Otherwise, treat the two strings as one.
          else {
            parts[i] += found[1] || found[2];
          }
        }
        if (parts.length == 1 && typeof parts[0] === 'function') {
          return parts[0];
        } else if (parts.length > 1) {
          return this.deconcatenator(parts);
        } else {
          return this.emptyReader(basis, spec, template);
        }
    }
  },

  // A reader that does nothing simply returns the data object (i.e. the first
  // argument).
  emptyReader: function() { return identity; },

  // Set a property in the data object.
  propReader: function(basis, spec, path) {
    return function propReader(data, value) {
      var target = data;
      for (var i = 0, ii = path.length - 1; i < ii; i++) {
        if (!target[path[i]]) {
          // If the property looks like a non-negative number then it should
          // probably be an array.
          if (path[i] == parseInt(path[i]) && path[i] >= 0) {
            target[path[i]] = [];
          } else {
            target[path[i]] = {};
          }
        }
        target = target[path[i]];
      }
      target[path[i]] = value;
      return data;
    };
  },

  // Returns a reader function that consumes the `value` by either discarding
  // literal strings or other readers.
  deconcatenator: function(parts) {
    return function deconcatenator(data, value) {
      var part, partValue, index;
      for (var i = 0, ii = parts.length; i < ii; i++) {
        part = parts[i];
        switch (typeof part) {
          // When `part` is a reader it will consume `value` up to the next
          // string.
          case 'function':
            if (i + 1 === ii || typeof parts[i + 1] !== 'function') {
              if (i + 1 !== ii) {
                // Next part is a string (because it's not a function), extract
                // the preceeding string (and pass it to the `part` reader) and
                // skip the next part.
                index = value.indexOf(parts[++i]);
                partValue = value.substr(0, index);
                value = value.substr(index + parts[i].length);
              } else {
                partValue = value;
              }
              data = part(data, partValue);
            }
            // When the next part is not a string there is no way to tell how
            // the value should be split across the two readers.
            else {
               throw new Error("Unable to parse '" + spec.raw + "', cannot separate consecutive data paths that have been concatenated together.");
            }
            break;
          // When `part` is a string it will be at the beginning of `value`.
          case 'string':
            value = value.substr(part.length);
            break;
         }
      }
      return data;
    }
  },

  // Compilers
  // ---------

  // Compile the specified `basis` element according to the specified
  // `directive`.
  compile: function(basis, directive) {
    // Each selector-directive pair in the `directive` object is compiled
    // individually.
    var actions = [];
    for (var selector in directive) {
      actions.push(compiler(basis, parseSelector(selector), directive[selector]));
    }
    // The renderer function is the accumulation of all `actions`.
    var renderer = function(element, data, index, elements, values) {
      for (var i in actions) {
        actions[i](element, data, index, elements, values);
      }
      return element;
    };
    // Likewise, parsing is the accumulation of all the inverse functions
    // produced by [`compiler`](#compiler).
    renderer.inverse = function(element, data) {
      for (var i in actions) {
        if (actions[i].inverse) {
          data = actions[i].inverse(element, data);
        }
      }
      return data;
    };
    return renderer;
  },

  // Auto compile inspects the class names of every descendant of the specified
  // `element` and searches the specified `data` object for a matching property.
  // When a matching property is found the class name is incorporated into the
  // specified `directive` to produce the final renderer function.
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
                if (this.isArray(d)) {
                  if (e.parentNode) {
                    up = e.parentNode;
                  } else {
                    up = document.createDocumentFragment();
                    up.appendChild(e);
                  }
                  els = this.loopFinder(element, spec, d)(up, d, [up]);
                  for (j = 0, jj = d.length; j < jj; j++) {
                    if (typeof d[j] === 'object') {
                      stack.unshift(d[j]);
                      q.push(false, els[j]);
                    } else {
                      spec.selector = void 0;
                      compiler([els[j]], spec, this.stringFormatter(element, spec, d[j]))(els[j], d[j]);
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
                compiler([e], spec, this.stringFormatter(element, spec, d))(e, d);
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
      compiler([element], parseSelector(selector), directive[selector])(element, data);
    }
    return function() { return element; };
  },

  // Helpers
  // -------

  // Used when a looping directive is encountered to extract the template and
  // nested directive.
  parseLoopSpec: function(template) {
    var loopSpec;
    for (var key in template) if (template.hasOwnProperty(key)) {
      // The loopSpec takes the form of `lhs<-rhs` or `lhs<=rhs`.  The lefthand
      // side (if present) specifies the property name that the nested directive
      // uses to refer to an item in the loop and the righthand side specifies
      // the property in the data object of the array to loop over.
      loopSpec = key.match(/^ *([^ ]*) *<([-=]) *([^ ]*) *$/);
      if (loopSpec) {
        return {
          directive: template[key],
          lhs: loopSpec[1],
          type: loopSpec[2],
          rhs: loopSpec[3]
        }; // TODO: ensure no other key matches /<[-=]/
      }
    }
    throw new Error("Expected looping directive (<-) is missing.");
  },

  // Returns `true` if the first argument is an array, `false` otherwise.
  isArray: Array.isArray ? function(o) { return Array.isArray(o); } : function(o) {
    return Object.prototype.toString.call(o) === "[object Array]";
  }
};

function identity(a) { return a; }

// Utilities
// =========

// Convenience function to attached an inverse function to a user defined
// formatter.
Tectonic.defineInverse = function(fn, inverse) {
  if (inverse) {
    if (typeof inverse === 'function') {
      fn.inverse = inverse;
    } else {
      fn.inverse = function() { throw new Error(inverse); };
    }
  } else {
    fn.inverse = identity;
  }
  return fn;
};

// A formatter that returns the index of an item in a loop.
Tectonic.position = Tectonic.defineInverse(function(_, _, i) {
  return i + 1;
});

// A formatter to add or remove the specified `className` depending on the
// truthiness of the specified `property` in the data object. A formatter may be
// specified in place of `property` in which case an `inverse` function may also
// be specified.
Tectonic.toggleClass = function(className, property, inverse) {
  var format, read, path;
  if (property) {
    if (typeof property === 'string') {
      path = property.split('.');
      format = Tectonic.plugin.propFormatter(null, null, path);
      read = Tectonic.plugin.propReader(null, null, path);
    } else if (typeof property === 'function') {
      format = property;
      read = inverse || format.inverse || function() { throw new Error("Unable to parse, cannot find inverse of function."); };
    } else {
      format = Tectonic.plugin.propFormatter(null, null, property);
      read = Tectonic.plugin.propReader(null, null, property);
    }
  } else {
    format = function(data) { return data; };
    read = function() { throw new Error("Unable to parse, expected an object."); }
  }
  return Tectonic.defineInverse(function() {
    return function(data, element) {
      var value = format(data, element);
      var selected = value === 'false' ? false : Boolean(value);
      value = element.getAttribute('class') || '';
      var classList = value.split(/\s+/);
      var index = classList.indexOf(className);
      if (index >= 0) {
        if (!selected) {
          classList.splice(index, 1);
          value = classList.join(' ');
        }
      } else if (selected) {
        value += " " + className;
      }
      return value.replace(/^\s+|\s+$/g, '');
    }
  }, function(data, value) {
    var classList = value.split(/\s+/);
    var selected = classList.indexOf(className) >= 0;
    return read(data, selected);
  });
};

return Tectonic;
}));
