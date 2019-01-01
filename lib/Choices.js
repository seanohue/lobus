const Scenario = require('./Scenario');

module.exports = Choices;

class Choices {
  constructor({scenarios, socket, say}) {
    if (!scenarios || !scenarios.length) {
      throw new Error('Your choices must include an Array of at least one scenario.');
    }
    if (!socket || !socket.emit) {
      throw new Error('You must specify a socket that is EventEmitter-like.');
    }
    if (!say || typeof say !== 'function') {
      throw new Error('You must specify a valid say function.');
    }

    this.scenarios = scenarios;
    this.socket = socket;
    this.say = say;
    this.decisions = {};
  }

  decideAll() {
    return this.scenarios.reduce(
      (previous, scenario) => previous.then(this.decide.bind(this, scenario)),
      Promise.resolve()
    );
  }

  decide(scenario) {
    return new Promise((resolve) => {
      const predicate = scenario.prerequisite && scenario.prerequisite.bind(scenario);
      const shouldAsk = predicate ? predicate(Object.assign({}, this.decisions)) : true;
      
      if (!shouldAsk) {
        this.decisions[scenario.name] = false;
        return resolve();
      }

      if (scenario.decided) {
        return resolve();
      }

      const redo = () => this.decide(scenario).then(resolve);
      this.say('');
      this.say(scenario.title);

      if (scenario.description) {
        this.say(scenario.description);
      }

      this.say('');

      const validChoices = scenario.choices
        .filter((choice) => choice.prerequisite.call(this, this.decisions));

      validChoices.forEach((choice, i) => 
        this.say(`| <cyan>[${i + 1}]</cyan> ${choice.description}`)
      );

      this.say('|\r\n`-> ');

      this.socket.once('data', (data) => {
        const input = parseInt(data, 10) - 1;
        if (isNaN(input) || !validChoices[input]) {
          this.say('Invalid selection...');
          return redo();
        }

        const selection = validChoices[input];
        selection.effect.call(this, scenario);
        this.decisions[scenario.name] = selection.id;
        resolve();
      });
    });
  }

  static createScenario(name, config) {
    return new Scenario(name, config);
  }

  static run(config) {
    let choices;

    try {
      choices = new Choices(config);
    } catch(e) {
      console.log(e);
      return Promise.resolve('Failed, please contact an Admin.');
    }

    return choices.decideAll.call(choices);
  }
}