class AmqpPlus {
  constructor(config) {
    if (AmqpPlus.instance) {
      return AmqpPlus.instance;
    }
    AmqpPlus.instance = this;

    if (!config || !config.urls) {
      throw new Error('Atleast one url is needed');
    }

    if (
      (config.exchanges && !Array.isArray(config.exchanges)) ||
      (config.queues && !Array.isArray(config.queues)) ||
      (config.bindings && !Array.isArray(config.bindings))
    ) {
      throw new Error('Exchanges, queues or bindings must be an array');
    }
  }
}

module.exports = AmqpPlus;
