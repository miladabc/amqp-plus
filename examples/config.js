const AmqpPlus = require('../src');

const rabbitClient = new AmqpPlus({
  urls: [
    'amqp://guest:guest@firsthost:5672',
    'amqp://guest:guest@secondhost:5672'
  ],
  exchanges: [
    {
      name: 'ex-1',
      type: 'direct',
      durable: true,
      autoDelete: false
    },
    {
      name: 'ex-2',
      type: 'fanout',
      durable: false,
      autoDelete: true
    },
    {
      name: 'ex-3',
      type: 'topic'
    }
  ],
  queues: [
    {
      name: 'q-1',
      durable: true,
      exclusive: false,
      autoDelete: false
    },
    {
      name: 'q-2',
      durable: false,
      autoDelete: true
    },
    {
      name: 'q-3'
    }
  ],
  bindings: [
    {
      exchange: 'ex-1',
      queue: 'q-1',
      keys: ['key-1', 'key-2', 'key-3']
    },
    {
      exchange: 'ex-2',
      queue: 'q-3'
    },
    {
      exchange: 'ex-3',
      queue: 'q-2',
      keys: 'key.#'
    }
  ]
});

rabbitClient.on('connect', () => console.log('connected'));
rabbitClient.on('disconnect', (err) => console.error('disconnected', err));
rabbitClient.on('channel:connect', () => {
  console.log('channel connected');
});
rabbitClient.on('channel:error', (error, name) =>
  console.error('channel error: ', error, name)
);
rabbitClient.on('channel:close', () => console.log('channel closed'));

module.exports = rabbitClient;
