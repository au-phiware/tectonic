jasmine.getFixtures().fixturesPath = '/base/spec/javascripts/fixtures';

var fixtures = [
  {
    name:       'auto renders',
    fixture:    fromString('<div><span class="hello">Hello</span></div>'),
    expected:   fromString('<div><span class="hello">Hello, World</span></div>'),
    data:       {"hello": "Hello, World"},
    exec:       autoRender
  },
  {
    name:       'render auto renders',
    fixture:    fromString('<div><span class="hello">Hello</span></div>'),
    expected:   fromString('<div><span class="hello">Hello, World</span></div>'),
    data:       {"hello": "Hello, World"},
    exec:       render
  },
  {
    name:       'auto renders with directive',
    fixture:    fromString('<div><span class="hello">Hello</span></div>'),
    expected:   fromString('<div><span class="hello">Hello, World</span></div>'),
    data:       {"hello": "Hello, World"},
    directive:  {"span": "hello"},
    exec:       autoRender
  },
  {
    name:       "renders by tag name",
    data:       {"hello": "Hello, World"},
    directive:  {"span": "hello"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Hello, World</span></div>'),
    exec:       render
  },
  {
    name:       "renders to attribute value",
    data:       {"hello": "World"},
    directive:  {"span@title": "hello"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span title="World">Hello</span></div>'),
    exec:       render
  },
  {
    name:       "appends to attribute value",
    data:       {"hello": " World"},
    directive:  {"span@title+": "hello"},
    fixture:    fromString('<div><span title="Hello">Hello</span></div>'),
    expected:   fromString('<div><span title="Hello World">Hello</span></div>'),
    exec:       render
  },
  {
    name:       "prepends to attribute value",
    data:       {"hello": "Hello "},
    directive:  {"+span@title": "hello"},
    fixture:    fromString('<div><span title="World">Hello</span></div>'),
    expected:   fromString('<div><span title="Hello World">Hello</span></div>'),
    exec:       render
  },
  {
    name:       "formats interpolated string using single quotes",
    data:       {"greet": "Hello", "name": "World"},
    directive:  {"span": "greet ', ' name"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Hello, World</span></div>'),
    exec:       render
  },
  {
    name:       "formats interpolated string using double quotes",
    data:       {"greet": "Hello", "name": "World"},
    directive:  {"span": "greet \", \" name"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Hello, World</span></div>'),
    exec:       render
  },
  {
    name:       "formats interpolated string using mixed quotes",
    data:       {"greet": "Hello", "name": "World"},
    directive:  {"span": "greet \", \" name '!'"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Hello, World!</span></div>'),
    exec:       render
  },
  {
    name:       "traverse object",
    data:       {"greet": { en: "Hello", fr: "Salut", it: "Ciao" }, "name": "World"},
    expectedData: {"greet": { en: "Hello" }, "name": "World"},
    directive:  {"span": "greet.en \", \" name '!'"},
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Hello, World!</span></div>'),
    exec:       render
  },
  {
    name:       "traverse object with array",
    data:       {"greet": { en: "Hello", fr: "Salut", it: "Ciao" }, "name": "World"},
    expectedData: {"greet": { it: "Ciao" }},
    directive:  { "span": ["greet", "it"] },
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div><span>Ciao</span></div>'),
    exec:       render
  },
  {
    name:       "render blank",
    data:       {},
    directive:  { "": "" },
    fixture:    fromString('<div><span>Hello</span></div>'),
    expected:   fromString('<div></div>'),
    exec:       render
  },
  {
    name:       "auto renders loop",
    data:       {
      "friend": [
      {
        "name": "Hughes",
        "twitter": "hugheswaroquier"
      },
      {
        "name": "Yves",
        "twitter": "yveshiernaux"
      }
      ],
      "who": {
        "name": "Mic",
        "twitter": "tchvil"
      }
    },
    fixture:    fromFile("auto-renders-loop", 0),
    expected:   fromFile("auto-renders-loop", 1),
    exec:       autoRender
  },
  {
    name:       "auto renders loop of strings",
    data:       {
      "pet": [
        "Cat",
        "Dog"
      ]
    },
    fixture:    fromString('<a><b class="pet"></b></a>'),
    expected:   fromString('<a><b class="pet">Cat</b><b class="pet">Dog</b></a>'),
    exec:       autoRender
  },
  {
    name:       "auto renders loop with directive",
    data:       {
      "friend": [
      {
        "name": "Hughes",
        "twitter": "hugheswaroquier"
      },
      {
        "name": "Yves",
        "twitter": "yveshiernaux"
      }
      ],
      "who": "dono",
      "who2": {
        "name": "Mic",
        "twitter": "tchvil"
      }
    },
    directive:  {
      ".who": "who2.name",
      ".who@title": "\"See the tweets of \"who2.twitter",
      ".who@href+": "who2.twitter"
    },
    fixture:    fromFile("auto-renders-loop-with-directive", 0),
    expected:   fromFile("auto-renders-loop-with-directive", 1),
    exec:       autoRender
  },
  {
    name:       "renders and shortens loop",
    data:       {"things": ["World", "PURE"]},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span>Sizzle</span>.</div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>World</span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div></div>'),
    exec:       render
  },
  {
    name:       "renders an empty loop",
    data:       {"things": []},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><!--.thing--></div>'),
    expected:   fromString('<div><!--.thing--></div>'),
    exec:       render
  },
  {
    name:       "empties an empty loop",
    data:       {"things": []},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><!--.thing--></div>'),
    exec:       render
  },
  {
    name:       "recovers from an empty loop",
    data:       {"things": []},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div><!--.thing--></div><div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div></div></div>'),
    exec: function(expected, element, data, directive) {
      var tectonic = new Tectonic(element);
      expect(tectonic.render(data, directive).get().outerHTML)
        .toEqual(expected.children[0].outerHTML);
      data.things.push("World", "PURE");
      expect(tectonic.render(data, directive).get().outerHTML)
        .toEqual(expected.children[1].outerHTML);
    }
  },
  {
    name:       "renders filtered and sorted loop",
    data:       {"things": ["World", "PURE", "Sizzle", "NO SHOUTY!"]},
    expectedData:{"things": ["Sizzle", "World"]},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" },
        sort: void 0,
        filter: function(word) {
          return word.toUpperCase() != word;
        }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>Sizzle</span>.</div><div class="thing">Hello, <span>World</span>.</div></div>'),
    exec:       render
  },
  {
    name:       "renders filtered loop",
    data:       {"things": ["World", "PURE", "Sizzle", "NO SHOUTY!"]},
    expectedData:{"things": ["World", "Sizzle"]},
    directive:  {
      ".thing": {
        "t<-things": { "span": "t" },
        filter: function(word) {
          return word.toUpperCase() != word;
        }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div></div>'),
    exec:       render
  },
  {
    name:       "renders sorted loop",
    data:       {"things": ["World", "PURE", "Sizzle"]},
    expectedData:{"things": ["PURE", "Sizzle", "World"]},
    directive:  {
      ".thing": {
        sort: void 0,
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div><div class="thing">Hello, <span>World</span>.</div></div>'),
    exec:       render
  },
  {
    name:       "renders sorted loop and leaves data intact",
    data:       {"things": ["World", "PURE", "Sizzle"]},
    expectedData:{"things": ["PURE", "Sizzle", "World"]},
    directive:  {
      ".thing": {
        sort: void 0,
        "t<-things": { "span": "t" }
      }
    },
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div><div class="thing">Hello, <span>World</span>.</div></div><div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div></div></div>'),
    exec: function(expected, element, data, directive) {
      render(expected.children[0], element, data, directive);
      delete directive[".thing"].sort;
      render(expected.children[1], element, data, directive);
    }
  },
  {
    name:       "sorts loop",
    data:       {"things": ["World", "PURE", "Sizzle"]},
    directive:  {".thing": {"t<-things": {"span": "t"}}},
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div></div>'),
    exec:       render
  },
  {
    name:       "throws with bad selector",
    data:       {"things": ["World", "PURE", "Sizzle"]},
    directive:  {"thing@": "things"},
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div></div>'),
    exec: function(expected, element, data, directive) {
      expect(function() { new Tectonic(element).render(data, directive); })
        .toThrow("invalid selector: 'thing@'");
    }
  },
  {
    name:       "throws with bad loop",
    data:       {"things": ["World", "PURE", "Sizzle"]},
    directive:  {".thing": {"things": {"span": ""}}},
    fixture:    fromString('<div><div class="thing">Hello, <span></span>.</div></div>'),
    expected:   fromString('<div><div class="thing">Hello, <span>World</span>.</div><div class="thing">Hello, <span>PURE</span>.</div><div class="thing">Hello, <span>Sizzle</span>.</div></div>'),
    exec: function(expected, element, data, directive) {
      expect(function() { new Tectonic(element).render(data, directive); })
        .toThrow("Expected looping directive (<-) is missing.");
    }
  },
  {
    name:       "renders class attribute",
    data:       { "class": "on" },
    directive:  {
      ".append@class+": 'class',
      "+.prepend@class": 'class'
    },
    fixture:    fromString('<a><b class="append"></b><b class="prepend"></b></a>'),
    expected:   fromString('<a><b class="append on"></b><b class="on prepend"></b></a>'),
    exec:       render
  },
  {
    name:       "renders class attribute with toggle",
    data:       { "class": "on" },
    directive:  {
      "-.toggle@class+": 'class',
      "+ .pretoggle@class -": 'class'
    },
    fixture:    fromString('<a><b class="toggle"></b><b class="toggle on"></b><b class="pretoggle"></b></a>'),
    expected:   fromString('<a><b class="toggle on"></b><b class="toggle"></b><b class="on pretoggle"></b></a>'),
    exec:       render,
    inverse:    function(_, element, directive) {
      expect(function() {
        element.parse(directive);
      }).toThrow("Unable to parse '-.toggle@class+', cannot determine value of toggle.");
    }
  },
  {
    name:       "renders class attribute with toggle helper",
    data:       { on: true, off: false },
    directive:  {
      ".toggle-on@class": Tectonic.toggleClass('toggle', 'on'),
      ".toggle-off@class": Tectonic.toggleClass('toggle', 'off')
    },
    fixture:    fromString('<a><b class="toggle-on toggle"></b><b class="toggle-on"></b><b class="toggle-off toggle"></b><b class="toggle-off"></b></a>'),
    expected:   fromString('<a><b class="toggle-on toggle"></b><b class="toggle-on toggle"></b><b class="toggle-off"></b><b class="toggle-off"></b></a>'),
    exec:       render
  },
  {
    name:       "renders class attribute with computed toggle helper",
    data:       { list: ['a', 'b'] },
    directive:  {
      ".toggle@class": Tectonic.toggleClass('found',
        function(data, element) {
          return data.list.indexOf(element.textContent) >= 0;
        },
        function() {
          throw "read function does not have access to the element(s) under parse.";
        }
      )
    },
    fixture:    fromString('<a><b class="toggle found">a</b><b class="toggle">b</b><b class="toggle found">c</b><b class="toggle">d</b></a>'),
    expected:   fromString('<a><b class="toggle found">a</b><b class="toggle found">b</b><b class="toggle">c</b><b class="toggle">d</b></a>'),
    exec:       render,
    inverse:    function(_, element, directive) {
      expect(function() {
        element.parse(directive);
      }).toThrow("read function does not have access to the element(s) under parse.");
    }
  },
  {
    name:       "renders an input",
    data:       {
      "with-attr": "A",
      "with-elem": "E",
      "append": "B",
      "prepend": "A"
    },
    fixture:    fromString('<form><input class="with-elem"/><input class="with-attr@value"/><input class="append+" value="A"/><input class="+prepend" value="B"/></form>'),
    expected:   fromString('<form><input class="with-elem"/><input class="with-attr" value="A"/><input class="append" value="A"/><input class="prepend" value="B"/></form>'),
    exec:       function(expected, element, data, directive) {
      var t = render(expected, element, data, directive);
      expect(element.children.item(0).value).toEqual('E');
      expect(element.children.item(1).value).toEqual('A');
      expect(element.children.item(2).value).toEqual('AB');
      expect(element.children.item(3).value).toEqual('AB');
    }
  },
  {
    name:       "renders a checkbox",
    data:       {
      "pets": [
      { "name": "Dog", "val": "canine", "owns": true },
      { "name": "Cat", "val": "feline", "owns": true },
      { "name": "Rat", "val": "rodent", "owns": false },
      { "name": "Snake", "val": "reptile", "owns": "false" },
      { "name": "Bird", "val": "avine" }
      ]
    },
    directive:  {
      "label": {
        "pet<-pets": {
          ".+": "pet.name",
          "input": "pet.val",
          "input@checked": "pet.owns"
        }
      }
    },
    fixture:    fromString('<form><label><input type="checkbox" value="class"/> </label></form>'),
    expected:   fromString('<form><label><input type="checkbox" value="canine" checked="true"/> Dog</label><label><input type="checkbox" value="feline" checked="true"/> Cat</label><label><input type="checkbox" value="rodent"/> Rat</label><label><input type="checkbox" value="reptile"/> Snake</label><label><input type="checkbox" value="avine"/> Bird</label></form>'),
    expectedData:{
      "pets": [
      { "name": "Dog", "val": "canine", "owns": true },
      { "name": "Cat", "val": "feline", "owns": true },
      { "name": "Rat", "val": "rodent", "owns": false },
      { "name": "Snake", "val": "reptile", "owns": false },
      { "name": "Bird", "val": "avine", "owns": false }
      ]
    },
    exec:       render
  },
  {
    name:       "renders a dropdown list",
    data:       {
      "sizes": [
      { "val": "S", "name": "small", "sel": "false" },
      { "val": "M", "name": "medium", "sel": true },
      { "val": "L", "name": "large" }
      ]
    },
    directive:  {
      "option": {
        "size<-sizes": {
          ".": " size.val \" - \" size.name ",
          "@value": "size.val",
          "@selected": "size.sel"
        }
      }
    },
    fixture:    fromString('<form class="sizes"><select><option value="XXS">Extra Small</option></select></form>'),
    expected:   fromString('<form class="sizes"><select><option value="S">S - small</option><option value="M" selected="true">M - medium</option><option value="L">L - large</option></select></form>'),
    expectedData:{
      "sizes": [
      { "val": "S", "name": "small", "sel": false },
      { "val": "M", "name": "medium", "sel": true },
      { "val": "L", "name": "large", "sel": false }
      ]
    },
    exec:       render
  },
  {
    name:       "renders a text node",
    data:       { "text": "not sure if this is useful..." },
    directive:  { ".": "text" },
    fixture:    function () { return document.createTextNode("Yup"); },
    expected:   function () { return document.createTextNode("not sure if this is useful..."); },
    exec:       render
  },
  {
    name:       "appends to a comment",
    data:       { "text": ", any non-element node can be appended to." },
    directive:  { ".+": "text" },
    fixture:    function () { return document.createTextNode("Yup"); },
    expected:   function () { return document.createTextNode("Yup, any non-element node can be appended to."); },
    exec:       render
  },
  {
    name:       "prepends to a comment",
    data:       { "text": "OR " },
    directive:  { "+.": "text" },
    fixture:    function () { return document.createTextNode("any non-element node can be prepended to."); },
    expected:   function () { return document.createTextNode("OR any non-element node can be prepended to."); },
    exec:       render
  },
  {
    name:       "renders a processing instruction",
    data:       { "app": 'progid="Excel.Document"' },
    directive:  { "@data": "app" },
    fixture:    function () { return document.createProcessingInstruction("mso-application", 'progid="Word.Document"'); },
    expected:   function () { return document.createProcessingInstruction("mso-application", 'progid="Excel.Document"'); },
    exec:       render
  },
  {
    name:       "appends to a processing instruction",
    data:       { "progid": '"Excel.Document"' },
    directive:  { "@data+": "progid" },
    fixture:    function () { return document.createProcessingInstruction("mso-application", 'progid='); },
    expected:   function () { return document.createProcessingInstruction("mso-application", 'progid="Excel.Document"'); },
    exec:       render
  },
  {
    name:       "prepends to a processing instruction",
    data:       { "attrs": 'media="print"' },
    directive:  { "+@data": "attrs ' '" },
    fixture:    function () { return document.createProcessingInstruction("xml-stylesheet", 'href="print.css" type="text/css"'); },
    expected:   function () { return document.createProcessingInstruction("xml-stylesheet", 'media="print" href="print.css" type="text/css"'); },
    exec:       render
  },
  {
    name:       "auto renders to a detached node",
    data:       { "k": "v" },
    fixture:    fromString('<b class="k"> </b>'),
    expected:   fromString('<b class="k">v</b>'),
    exec: function(expected, element, data, directive) {
      element = element.parentNode.removeChild(element);
      autoRender(expected, element, data, directive);
    }
  },
  {
    name:       "renders to a detached node",
    data:       { "k": "v" },
    directive:  { "b": "k" },
    fixture:    fromString('<div><b> </b></div>'),
    expected:   fromString('<div><b>v</b></div>'),
    exec: function(expected, element, data, directive) {
      element = element.parentNode.removeChild(element);
      render(expected, element, data, directive);
    }
  },
  {
    name:       "renders to a new detached node",
    data:       { "k": "v" },
    directive:  { "b": "k" },
    fixture:    fromString('<a><b> </b></a>'),
    expected:   fromString('<a><b>v</b></a>'),
    exec: function(expected, element, data, directive) {
      element = element.parentNode.removeChild(element);
      render(expected, element, data, new Tectonic(element).compile(directive));
    }
  },
  {
    name:       "auto renders detached loop of strings",
    data:       {
      "pet": [
        "Cat",
        "Dog"
      ]
    },
    fixture:    fromString('<b class="pet"></b>'),
    expected:   fromString('<b class="pet">Cat</b><b class="pet">Dog</b>'),
    exec: function(expected, element, data, directive) {
      element = element.parentNode.removeChild(element);
      autoRender(expected, element, data, directive);
    }
  },
  {
    name:       "double renders",
    data:       {
      "cols": [
        "name",
        "food",
        "legs"
      ],
      "animals": [
      {
        "name": "bird",
        "food": "seed",
        "legs": 2
      },
      {
        "name": "cat",
        "food": "mouse, bird",
        "legs": 4
      },
      {
        "name": "dog",
        "food": "bone",
        "legs": 4
      },
      {
        "name": "mouse",
        "food": "cheese",
        "legs": 4
      }
      ]
    },
    directive:  [
    {
      'th':{
        'col<-cols':{
          '.':'col'
        }
      },
      'td':{
        'col<-cols':{
          '@class':'col'
        }
      }
    },
    {
      'tbody tr':{
        'animal<-animals':{
          'td.name':'animal.name',
          'td.food':'animal.food',
          'td.legs':'animal.legs'
        }
      }
    }
    ],
    fixture:    fromFile("double-renders", 0),
    expected:   fromFile("double-renders", 1),
    exec: function(expected, element, data, directive) {
      expect(new Tectonic(
            new Tectonic(element)
            .render(data, directive[0]))
          .render(data, directive[1])
          .get()
          .outerHTML)
        .toEqual(expected.outerHTML);
    }
  },
  {
    name:       "renders recursively",
    data:       {
      "children": [
      {
        "name": "Europe",
        "children": [
        {
          "name": "Belgium",
          "children": [
          {
            "name": "Brussels",
            "children": null
          },
          {
            "name": "Namur"
          },
          {
            "name": "Antwerpen"
          }
          ]
        },
        {
          "name": "Germany"
        },
        {
          "name": "UK"
        }
        ]
      },
      {
        "name": "America",
        "children": [
        {
          "name": "US",
          "children": [
          {
            "name": "Alabama"
          },
          {
            "name": "Georgia"
          }
          ]
        },
        {
          "name": "Canada"
        },
        {
          "name": "Argentina"
        }
        ]
      },
      {
        "name": "Asia"
      },
      {
        "name": "Africa"
      },
      {
        "name": "Antarctica"
      }
      ]
    },
    fixture:    fromFile("renders-recursively", 0),
    expected:   fromFile("renders-recursively", 1),
    exec: function(expected, element, data) {
      var tectonic = new Tectonic(element);
      var directive = tectonic.compile({
        "li": {
          "<- children": {
            "a": "name",
            "a@onclick": "\"alert('\"name\"');\"",
            ".children": function() {
              return directive.apply(this, arguments);
            }
          }
        }
      });
      expect(new Tectonic(element)
          .render(data, directive)
          .get()
          .outerHTML)
        .toEqual(expected.outerHTML);
    }
  },
  {
    name:      "rerenders",
    directive: {span: "i"},
    fixture:   fromString('<div><span> </span></div>'),
    expected:  fromString('<div><span>2</span></div>'),
    exec: function(expected, element, _, directive) {
      element = new Tectonic(element);
      var renderer = element.compile(directive);
      expect(element
          .render({i: 0}, renderer)
          .render({i: 1}, renderer)
          .render({i: 2}, renderer)
          .get()
          .outerHTML)
        .toEqual(expected.outerHTML);
    }
  },
  {
    name:       "rerenders loop",
    directive:  {span: {'i<-list':{'.':'i'}}},
    fixture:   fromString('<div><span> </span></div>'),
    expected:  fromString('<div><span>2</span></div>'),
    exec: function(expected, element, data, directive) {
      element = new Tectonic(element);
      directive = element.compile(directive);
      expect(new Tectonic(element)
          .render({list: [0,1]}, directive)
          .render({list: [   ]}, directive)
          .render({list: [ 2 ]}, directive)
          .get()
          .outerHTML)
        .toEqual(expected.outerHTML);
    }
  },
  {
    name:       "double nested loop",
    data:       {
      "teams": [
      {
        "name": "Cats",
        "players": [
        {
          "first": "Alice",
          "last": "Keasler",
          "score": [16,15,99,100]
        },
        {
          "first": "",
          "name": "",
          "score": 0
        },
        {
          "first": "Vicky",
          "last": "Benoit",
          "score": [3,5]
        },
        {
          "first": "Wayne",
          "last": "Dartt",
          "score": [9,10]
        }
        ]
      },
      {
        "name": "Dogs",
        "players": [
        {
          "first": "Ray",
          "last": "Braun",
          "score": 14
        },
        {
          "first": "Aaron",
          "last": "Ben",
          "score": 24
        },
        {
          "first": "Steven",
          "last": "Smith",
          "score": 1
        },
        {
          "first": "Kim",
          "last": "Caffey",
          "score": 19
        }
        ]
      },
      {
        "name": "Birds",
        "players": null
      },
      {
        "name": "Mice",
        "players": [
        {
          "first": "Natalie",
          "last": "Kinney",
          "score": 16
        },
        {
          "first": "Caren",
          "last": "Cohen",
          "score": 3
        }
        ]
      }
      ]
    },
    directive:  {
      "tr.scoreBoard": {
        "team<-teams": {
          "td.teamName": "team.name",
          "tr.teamList": {
            "player<-team.players": {
              "td.player": "player.first ' (' player.last ')'",
              "td.score": "player.score",
              "td.position": function(element, data, i, elements) {
                return i + 1;
              }
            }
          }
        }
      }
    },
    fixture:    fromFile("double-nested-loop", 0),
    expected:   fromFile("double-nested-loop", 1),
    exec:       render,
    inverse:    function(_, element, directive) {
      expect(function() {
        element.parse(directive);
      }).toThrow("Unable to parse 'td.position', cannot find inverse of function.");
    }
  },
  {
    name:       "custom formatter in loop",
    data:       { "teams": [ "Cats", "Dogs", "Birds", "Mice" ] },
    directive:  {
      "tt": {
        "team<-teams": {
          "+.": "team",
          ".+": Tectonic.position
        }
      }
    },
    fixture:    fromString("<div><tt>: </tt></div>"),
    expected:   fromString("<div><tt>Cats: 1</tt><tt>Dogs: 2</tt><tt>Birds: 3</tt><tt>Mice: 4</tt></div>"),
    exec:       render
  }
];

function runner(fixture) {
  return function() {
    var expected = fixture.expected();
    var element = fixture.fixture();
    if (!expected || !element) {
      if (expected) {
        failed("No fixture specified.");
      } else {
        failed("Nothing expected?");
      }
    } else {
      fixture.exec(expected, element, fixture.data, fixture.directive);
    }
  }
}

runner.inverse = function(fixture) {
  return function() {
    var expected = fixture.expected();
    var data = fixture.expectedData || fixture.data;
    var element = fixture.fixture();
    if (!data || !element) {
      if (data) {
        failed("No fixture specified.");
      } else {
        failed("Nothing expected?");
      }
    } else {
      (fixture.inverse || fixture.exec.inverse)(data, fixture.exec(expected, element, fixture.data, fixture.directive), fixture.directive);
    }
  }
}

function failed(message) {
  return function() {
    fail(message);
  };
}

function render(expected, element, data, directive) {
  var t = new Tectonic(element);
  expect(t.render(data, directive).get().outerHTML)
      .toEqual(expected.outerHTML);
  return t;
}

render.inverse = function(expected, element, directive) {
  if (directive) {
    expect(element.parse(directive)).toEqual(expected);
  } else {
    expect("nothing").toBeDefined();
  }
}

function autoRender(expected, element, data, directive) {
  expect(new Tectonic(element).autoRender(data, directive).get().outerHTML)
      .toEqual(expected.outerHTML);
}

function fromString(html) {
  return function() {
    var body = document.createElement('body');
    body.innerHTML = html;
    return body.children[0];
  };
}

function fromFile(name, child) {
  return function() {
    loadFixtures(name + '.html');
    var body = document.getElementById('jasmine-fixtures');
    return body.children[child];
  };
}

describe("Directives", function() {
  for (var i = 0, ii = fixtures.length; i < ii; i++) {
    it(fixtures[i].name, runner(fixtures[i]));
    if (fixtures[i].inverse || fixtures[i].exec.inverse) {
      it('inverse ' + fixtures[i].name, runner.inverse(fixtures[i]));
    }
  }
});
