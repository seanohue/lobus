# lobus

Multiple choice input-event library meant to be used with Ranvier.

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