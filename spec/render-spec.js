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

  it("custom formatter in loop", function() {
    var data = {
      "teams": [ "Cats", "Dogs", "Birds", "Mice" ]
    };
    var directive = {
      "tt": {
        "team<-teams": {
          "+.": "team",
          ".+": function(element, data, i, elements) {
            return i + 1;
          }
        }
      }
    };
    var element = document.getElementById(6);
    var expected = element.children[1];
    element = element.children[0];
    expect(new Pure(element)
        .render(data, directive)
        .get()
        .outerHTML)
      .toEqual(expected.outerHTML);
  });

  it("double nested loop", function() {
    var data = {
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
    };
    var directive = {
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
    };
    var element = document.getElementById(5);
    var expected = element.children[1];
    element = element.children[0];
    expect(new Pure(element)
        .render(data, directive)
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
              "a@onclick": "\"alert('\"child.name\"');\"",
              ".children": function() {
                debugger;
              }
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
    expect(new Pure(element)
        [context.method && context.method.value || 'render'](
          JSON.parse(context.data.value),
          context.directive && JSON.parse(context.directive.value))
        .get()
        .outerHTML)
        .toEqual(expected.outerHTML);
  });
}
