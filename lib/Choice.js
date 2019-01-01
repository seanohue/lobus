module.exports = class Choice {
  constructor(id, config) {
    if (!config.description) throw new Error('Your choice should have a description.')
    this.id = id;
    this.description = config.description;
    this.effect = typeof config.effect === 'function' ? config.effect : () => {};
    this.prerequisite = typeof config.prerequisite === 'function' ? config.prerequisite : () => true;
  }
}
