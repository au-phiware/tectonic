describe("Directives", function() {
  var fixit = document.getElementsByClassName('fix');
  for (var i = 0, ii = fixit.length; i < ii; i++) {
    renderIt(fixit[i].attributes, fixit[i].children[0], fixit[i].children[1]);
  }

  it("rerenders loop", function() {
    var element = document.getElementById(4);
    var expected = element.children[1];
    element = new Pure(element.children[0]);
    var template = element.compile({span: {'i<-list':{'.':'i'}}});
    expect(element
        .render({list: [0, 1]}, template)
        .render({list: []}, template)
        .render({list: [2]}, template)
        .get()
        .outerHTML)
      .toEqual(expected.outerHTML);
  });

  it("rerenders", function() {
    var element = document.getElementById(3);
    var expected = element.children[1];
    element = new Pure(element.children[0]);
    var template = element.compile({span:'i'});
    expect(element
        .render({i: 0}, template)
        .render({i: 1}, template)
        .render({i: 2}, template)
        .get()
        .outerHTML)
      .toEqual(expected.outerHTML);
  });

  it("double renders", function() {
    var data = {
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
    };
    var element = document.getElementById(1);
    var expected = element.children[1];
    element = element.children[0];
    expect(new Pure(
          new Pure(element)
          .render(data, {
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
          })
          .get())
        .render(data, {
          'tbody tr':{
            'animal<-animals':{
              'td.name':'animal.name',
              'td.food':'animal.food',
              'td.legs':'animal.legs'
            }
          }
        })
        .get()
        .outerHTML)
      .toEqual(expected.outerHTML);
  });

  it("renders recursively", function() {
    var element = document.getElementById(2);
    var expected = element.children[1];
    element = element.children[0];
    expect(new Pure(element)
        .render({
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
        }, {
          "li": {
            "child <- children": {
              "a": "child.name",
              "a@onclick": "\"alert('\"child.name\"');\""
            }
          }
        })
        .get()
        .outerHTML)
      .toEqual(expected.outerHTML);
  });
});

function renderIt(context, element, expected) {
  it(context.it.value, function() {
    expect(new Pure(element).render(
          JSON.parse(context.data.value),
          context.directive && JSON.parse(context.directive.value))
        .get()
        .outerHTML)
        .toEqual(expected.outerHTML);
  });
}
