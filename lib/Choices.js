const Scenario = require('./Scenario');

/**
 * @typedef {Object} ChoicesConfig
 * @property {Object} scenarios
 * @property {EventEmitter} socket
 * @property {Function} say
 */

 /**
  * @typedef {Object} Choices
  * @augments {ChoicesConfig}
  * @property {Object} decisions
  */
module.exports = class Choices {
  /**
   * Create a set of Scenarios and Choices to make.
   * @param {ChoicesConfig} config defining scenarios, socket, and say
   */
  constructor({scenarios, socket, say}) {
    if (!scenarios || !scenarios.length) {
      throw new Error('Your choices must include an Array of at least one scenario.');
    }
    if (!socket || !socket.once) {
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

  /**
   * Reduces the series of scenarios to a single promise that resolves then the user is done making decisions.
   *
   * @returns {Promise}
   */
  decideAll() {
    return this.scenarios.reduce(
      (previous, scenario) => previous.then(this.decide.bind(this, scenario)),
      Promise.resolve()
    );
  }

  /** 
   * Allows the user to make a decision about a single scenario.
   * @param {Scenario} scenario
   * @returns {Promise}
   */
  decide(scenario) {
    return new Promise((resolve) => {
      if (typeof scenario === 'function') {
        scenario = scenario();
        if (!(scenario instanceof Scenario)) {
          throw new Error('Functional scenarios must return an instance of Scenario. Got ' + scenario);
        }
      }
      const predicate = scenario.prerequisite && scenario.prerequisite.bind(scenario);
      const shouldAsk = predicate ? predicate(Object.assign({}, this.decisions)) : true;
      
      if (!shouldAsk) {
        this.decisions[scenario.name] = false;
        return resolve(this);
      }

      if (scenario.decided) {
        return resolve(this);
      }

      const redo = () => this.decide(scenario).then(resolve.bind(this, this));
      
      this.displayMenu(scenario, redo, resolve);
    });
  }

  /**
   * Set custom menu adapter.
   * @param {function} customDisplayMenu 
   */
  setDisplayMenu(customDisplayMenu) {
    if (typeof customDisplayMenu !== 'function') {
      throw new Error(`Custom menu handler must be a function, got ${typeof customDisplayMenu}`);
    }

    this.customDisplayMenu = customDisplayMenu;
    return this;
  } 

  /**
   * Default method for displaying a menu to the user. 
   * Can be 'overwritten'.
   * @param {Scenario} scenario
   * @param {function} redo
   * @param {function} resolve
   */
  displayMenu(scenario, redo, resolve) {

    // Evaluate valid choices thus far.
    const validChoices = scenario.choices
      .filter((choice) => choice.prerequisite.call(this, this.decisions));

    // Default listener for data.
    // If there is a custom display in use, the developer
    // can choose to use this, or not.
    const listenForData = (_redo = redo) => {
      this.socket.once('data', (data) => {
        const input = parseInt(data, 10) - 1;
        if (isNaN(input) || !validChoices[input]) {
          this.say('Invalid selection...');
          return redo();
        }

        const selection = validChoices[input];
        selection.effect.call(this, scenario);
        this.decisions[scenario.name] = selection.id;
        resolve(this);
      });

      return this.socket;
    }

    if (this.customDisplayMenu) {
      return this.customDisplayMenu({
        scenario, 
        redo, 
        resolve, 
        listenForData
      });
    }
  
    this.say('');
    this.say(scenario.title);
    if (scenario.description) {
      this.say(scenario.description);
    }

    this.say('');

    if (!scenario.choices.length) {
      throw new Error ('A scenario was made without any choices: ' + scenario.name);
    }

    validChoices.forEach((choice, i) => 
      this.say(`| <cyan>[${i + 1}]</cyan> ${choice.description}`)
    );

    this.say('|\r\n`-> ');

    listenForData();

  }

  /**
   * Factory function to create a new scenario.
   *
   * @static
   * @param {String} name
   * @param {ScenarioConfig} config
   * @returns {Scenario}
   */
  static createScenario(name, config) {
    return new Scenario(name, config);
  }

  /**
   * Creates and runs through a new set of Choices.
   * @param {ChoicesConfig} config
   * @returns {Promise} 
   */
  static run(config) {
    let choices;

    try {
      choices = new Choices(config);
    } catch(e) {
      console.log(e);
      return Promise.resolve(this, 'Failed, please contact an Admin.');
    }

    return choices.decideAll.call(choices);
  }
}