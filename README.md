# AMQP Plus

amqp-plus is a wrapper for the original npm [amqplib library](https://www.npmjs.com/package/amqplib) which add more functionalities.

## Features

* Promise based
* Message acknowledgement functions on message itself
* Thanks to [amqp-connection-manager](https://www.npmjs.com/package/amqp-connection-manager):

  * Automatically reconnect when your amqplib broker dies in a fire.
  * Round-robin connections between multiple brokers in a cluster.
  * If messages are sent while the broker is unavailable, queues messages in memory until we reconnect.

## Installation

```sh
npm install amqp-plus
```

## Usage
For code snippets checkout [examples](./examples) folder.

### Configuration

```js
const AmqpPlus = require('amqp-plus');

const rabbitClient = new AmqpPlus({
  urls: [
    'amqp://guest:guest@firsthost:5672',
    'amqp://guest:guest@secondhost:5672'
  ],
  exchanges: [
    {
      name: 'ex-1', type: 'direct', durable: true, autoDelete: false
    },
    {
      name: 'ex-2', type: 'fanout', durable: false, autoDelete: true
    },
    {
      name: 'ex-3', type: 'topic'
    }
  ],
  queues: [
    {
      name: 'q-1', durable: true, exclusive: false
    },
    {
      name: 'q-2', durable: false, autoDelete: true
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
      exchange: 'ex-2', queue: 'q-3'
    },
    {
      exchange: 'ex-3', queue: 'q-2', keys: 'key.#'
    }
  ]
});
```

### Events

```js
rabbitClient.on('connect', () => {
  console.log('connected');
});

rabbitClient.on('disconnect', (err) => {
  console.error('disconnected', err);
});

rabbitClient.on('channel:connect', () => {
  console.log('channel connected');
});

rabbitClient.on('channel:error', (error, name) => {
  console.error('channel error: ', error, name);
});

rabbitClient.on('channel:close', () => {
  console.log('channel closed');
});
```

### Publish

```js
rabbitClient.publish(
  'ex-1',
  'key-1',
  { data: 'json msg' },
  { persistent: true, expiration: 5000 }
)
.then(() => console.log('Message delivered'))
.catch((err) => console.error('Message rejected:', err));

rabbitClient.publish('ex-2', '', 'string msg');
rabbitClient.publish('ex-3', 'key.3', Buffer.from('buffer msg'));
```

### sendToQueue

```js
rabbitClient.sendToQueue(
  'q-1',
  { data: 'json msg' },
  { persistent: false }
)
.then(() => console.log('Message delivered'))
.catch((err) => console.error('Message rejected:', err));
```

### bulkPublish

```js
rabbitClient.bulkPublish(
  'ex-2',
  'routing-key-is-ignored-for-fanout-exchange',
  [
    { msg: 'json msg' },
    'string msg',
    Buffer.from('buffer msg')
 ]
)
.then(() => console.log('All messages delivered'))
.catch((err) => console.error('Atleast one of the messages rejected', err));

rabbitClient.bulkPublish(
  'ex-1',
  'key-2', // All messages get sent with routing key "key-2"
  [
    { msg: 'json msg' },
    'string msg',
    Buffer.from('buffer msg')
  ]
);

rabbitClient.bulkPublish(
  'ex-3',
  ['key.1', 'key.2', 'key.3'],
  [
    { msg: 'msg with routing key "key.1"' },
    'msg with routing key "key.2"',
    Buffer.from('msg with routing key "key.3"')
  ]
);
```

### bulkSendToQueue

```js
rabbitClient.bulkSendToQueue(
  'q-3', 
  [
    { msg: 'json msg' },
    'string msg',
    Buffer.from('buffer msg')
  ]
)
.then(() => console.log('All messages delivered'))
.catch((err) => console.error('Atleast one of the messages rejected', err));

rabbitClient.bulkSendToQueue(
  ['q-1', 'q-2', 'q-3'],
  [
    { msg: 'msg goes to queue "q-1"' },
    'msg goes to queue "q-2"',
    Buffer.from('msg goes to queue "q-3"')
  ]
);
```

### subscribe

```js
function consumer(msg) {
  console.log(msg);

  if (msg.content === 'ok') {
    msg.ack(); // Successfully processed, dequeue the msg
  }

  if (msg.content === 'failure') {
    msg.nack(); // Failed processing, requeue the msg
  }

  if (msg.content === 'bad') {
    msg.reject(); // Bad msg, dequeue the msg
  }
}

rabbitClient.subscribe('q-1', consumer, { noAck: false });
```