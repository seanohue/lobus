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
  const Lobus = require('lobus');
  const Choices = Lobus.Choices;

  // This uses Ranvier's EventUtil class.
  const say = EventUtil.genSay(socket);

  let startingAttributes = {
    willpower: 5,
    might: 6
  };
  let startingClass = 'warrior';

  // Choices.createScenario takes a scenario ID and
  // a config with a title and/or description.
  // It returns a Scenario.
  // Scenarios use a chaining API to add choices or prerequisites.
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
      title: 'Choose a career path',
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
    // a list of scenarios, ran in the order they are defined
    scenarios: [
      scenario,
      secondScenario
    ],
    // socket to emit input-events to, see also Ranvier's input-events
    socket,
     // function to broadcast to socket or player (or log for testing)
    say
  })
  .then(() => socket.emit('done'));

  ```

  ## Development

  If you would like to contribute to Lobus or develop your own fork of it (and please PR improvements!), please clone this repository. Then, in your local repo, use `npm link` to globally link Lobus. In your Ranvier repository, use `npm link lobus`. After doing this, `require('lobus')` should work and the require statement will pull in the code from your local repository.
