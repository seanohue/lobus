# lobus

Multiple choice input-event library meant to be used with Ranvier.

## Tell me more...

Lobus is made to work with [RanvierMUD](http://www.ranviermud.com/), a relatively unopinionated text-based multiplayer game engine. Lobus also aims to be unopinionated, though right now it functions solely as a library for creating sequenced, multiple-choice menus in conjunction with an [EventEmitter-like](https://nodejs.org/api/events.html) socket and a `say` function used for handling output to the client.

That said, this documentation assumes you will be using Lobus with Ranvier, or a fork thereof.

## Design/Philosophy

Lobus exposes all of the classes it uses internally, in case you want to compose your own menu system using parts of Lobus. These classes and their uses are as follows:

- **Choices:**
  This is the main class that one needs to import to use Lobus out of the box. It allows you to create a group of scenarios which prompt the user to make a choice, and then run the user through said group of scenarios. See the _Example Use_ section below for usage information. The choices made by the user in each scenario are stored in an internal state, to be used by future scenarios.

- **Scenario:**
  Each scenario has a title and/or description, and a group of choices that the user can make when presented with a description of the scenario. Developers can set a prerequisite to determine if the user is presented with this scenario or not.

- **Choice:**
  Each scenario involves one or more choices that can be made. Each choice made will be recorded in the **Choices** class' state. Developers can specify a prerequisite for a choice to be shown to the user, and can also specify a side effect for any choices that are made.


## Example Use

  ```javascript
  let startingAttributes = {
    willpower: 5,
    might: 6
  };
  let startingClass = 'warrior';

  // Choices.createScenario takes a scenario ID and a config with a title and/or description. Scenarios use a chaining API to add choices.
  const scenario = Choices
    .createScenario('toughChoice', {
      title: 'Make a tough decision',
      description: 'This will have an effect on your character\'s starting equipment or whatever.'
    })
    .addChoices({
      beGood: {
        description: 'Do the right thing',
        effect() {
          startingAttributes.willpower++;
        }
      },
      beBad: {
        description: 'Do the wrong thing via brute force.',
        effect() {
          startingAttributes.might++;
        }
      }
    });

  const secondScenario = Choices
    .createScenario('job', {
      title: 'Choose a career path'.
      description: 'This will have an effect on your character\'s starting skills or whatever.'
    })
    .addChoices({
      bePaladin: {
        description: 'Become a paladin',
        effect() {
          startingClass = 'paladin';
        },
        prerequisite(choices) {
          return choices.toughChoice !== 'beBad'
        }
      }
    },
    {
      beThief: {
        description: 'Become a thief',
        effect() {
          startingClass = 'thief';
        }
        prerequisite(choices) {
          return choices.toughChoice === 'beBad'
        }
      }
    });

  Choices.run({
    scenarios: [           // a list of scenarios, ran in the order they are defined
      scenario,
      secondScenario
    ],
    socket                 // socket to emit input-events to
    say                   // function to broadcast to socket or player
  })
  .then(() => socket.emit('done'));

  ```
