const Choice = require('./Choice');

 /**
  * @typedef {Object} ScenarioConfig
  * @property {[String]} title
  * @property {[String]} description
  * @property {[Function]} prerequisite
  */

module.exports = class Scenario {
  /**
   * Create a new Scenario out of a set of choices.
   * @param {String} name
   * @param {ScenarioConfig} config defining a scenario including title and/or description and optional prerequisite.
   */
  constructor(name, config) {
    if (!name || !config) throw new Error('Your scenario must have a name and a configuration.');
    if (!config.title && !config.description) throw new Error('Your scenario must have either a title or a description.');
    this.name = name;
    this.title = config.title || 'Choose wisely';
    this.description = config.description || '';
    this.prerequisite = typeof config.prerequisite === 'function' ? config.prerequisite : null;
    this.config = config;
    this.decided = false;

    this.choices = [];
  }

  /**
   * Add choices to the Scenario instance.
   * @param {Object} choices 
   * @returns {Scenario} this
   */
  addChoices(choices) {
    if (!(choices && typeof choices === 'object')) throw new Error('You must provide an object or array for your choices.')
    for (const [id, choice] of Object.entries(choices)) {
      this.choices.push(new Choice(id, choice));
    }

    return this;
  }

  /**
   * Set a prerequisite for this Scenario.
   * @param {Function} predicate
   * @returns {Scenario} this
   */
  setPrerequisite(predicate) {
    if (this.prerequisite || typeof predicate !== 'function') throw new Error('You can only provide one prerequisite per scenario, and it must be a function.');

    this.prerequisite = predicate;

    return this;
  }
}
