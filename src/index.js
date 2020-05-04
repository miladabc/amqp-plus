const { EventEmitter } = require('events');
const amqp = require('amqp-connection-manager');

class AmqpPlus extends EventEmitter {
  constructor({ urls, exchanges = [], queues = [], bindings = [] }) {
    super();
    if (AmqpPlus.instance) {
      return AmqpPlus.instance;
    }
    AmqpPlus.instance = this;

    this._validateConfig(urls, exchanges, queues, bindings);

    const serverUrls = Array.isArray(urls) ? urls : [urls];
    this._connection = amqp.connect(serverUrls);
    this._emitConnectionEvents();

    this._confirmChannel = this._connection.createChannel({
      setup: (channel) => {
        const exchangesSetup = exchanges.map((exchange) => {
          if (!exchange.name || !exchange.type) {
            throw new Error('Exchange must have name and type');
          }

          return channel.assertExchange(exchange.name, exchange.type, {
            durable: exchange.durable || true,
            autoDelete: exchange.autoDelete || false
          });
        });

        const queuesSetup = queues.map((queue) => {
          if (!queue.name) {
            throw new Error('Queue must have a name');
          }

          return channel.assertQueue(queue.name, {
            durable: queue.durable || true,
            autoDelete: queue.autoDelete || false,
            exclusive: queue.exclusive || false
          });
        });

        const bindingsSetup = [];
        bindings.forEach((binding) => {
          const bindingKeys = Array.isArray(binding.keys)
            ? binding.keys
            : [binding.keys];

          bindingKeys.forEach((bindingKey) => {
            bindings.push(
              channel.bindQueue(binding.queue, binding.exchange, bindingKey)
            );
          });
        });

        return Promise.all([
          ...exchangesSetup,
          ...queuesSetup,
          ...bindingsSetup
        ]);
      }
    });
    this._emitChannelEvents();
  }

  _validateConfig(urls, exchanges, queues, bindings) {
    if (!urls || (Array.isArray(urls) && urls.length === 0)) {
      throw new Error('Atleast one url is needed');
    }

    if (
      !Array.isArray(exchanges) ||
      !Array.isArray(queues) ||
      !Array.isArray(bindings)
    ) {
      throw new Error('Exchanges, queues or bindings must be an array');
    }

    this._configuredExchanges = exchanges.reduce((acc, exchange) => {
      acc[exchange.name] = exchange;
      return acc;
    }, {});
    this._configuredQueues = queues.reduce((acc, queue) => {
      acc[queue.name] = queue;
      return acc;
    }, {});

    bindings.forEach((binding) => {
      if (!binding.exchange || !binding.queue) {
        throw new Error('Binding must have an exchange and a queue');
      }

      if (!this._configuredExchanges[binding.exchange]) {
        throw new Error(
          `Exchange "${binding.exchange}" must be configured before binding`
        );
      }

      if (!this._configuredQueues[binding.queue]) {
        throw new Error(
          `Queue "${binding.queue}" must be configured before binding`
        );
      }

      if (Array.isArray(binding.keys) && binding.keys.length === 0) {
        throw new Error('Binding keys can NOT be an empty array');
      }

      if (
        this._configuredExchanges[binding.exchange].type !== 'fanout' &&
        !('keys' in binding)
      ) {
        throw new Error(
          `Binding of queue "${binding.queue}" to exchange "${binding.exchange}" must have keys`
        );
      }
    });
  }

  _emitConnectionEvents() {
    this._connection.on('connect', ({ connection, url }) =>
      this.emit('connect', { connection, url })
    );
    this._connection.on('disconnect', (err) => this.emit('disconnect', err));
  }

  _emitChannelEvents() {
    this._confirmChannel.on('connect', () => this.emit('channel:connect'));
    this._confirmChannel.on('error', (err, name) =>
      this.emit('channel:error', err, name)
    );
    this._confirmChannel.on('close', () => this.emit('channel:close'));
  }

  sendToQueue(queue, content, options = {}) {
    return this.publish('', queue, content, options);
  }

  publish(exchange, routingKey, content, options = {}) {
    let msg;
    const defaultOptions = options;
    defaultOptions.persistent = options.persistent || true;

    if (typeof content === 'string') {
      msg = Buffer.from(content);
      defaultOptions.contentType = 'text/plain';
    }
    if (typeof content === 'object') {
      msg = Buffer.from(JSON.stringify(content));
      defaultOptions.contentType = 'application/json';
    }

    return this._confirmChannel.publish(
      exchange,
      routingKey,
      msg,
      defaultOptions
    );
  }

  subscribe(queueName, handler, options) {
    if (!this._configuredQueues[queueName]) {
      throw new Error(
        `Queue "${queueName}" must be configured before subscribing`
      );
    }

    return this._confirmChannel.addSetup((channel) => {
      return channel.consume(queueName, handler, options);
    });
  }

  async close() {
    await this._confirmChannel.close();
    await this._connection.close();
  }
}

module.exports = AmqpPlus;
