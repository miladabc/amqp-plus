const rabbitClient = require('./config');

rabbitClient
  .publish(
    'ex-1',
    'key-1',
    { data: 'json msg' },
    { persistent: true, expiration: 5000 }
  )
  .then(() => console.log('Message delivered'))
  .catch((err) => console.error('Message rejected:', err));

rabbitClient
  .sendToQueue('q-1', { data: 'json msg' }, { persistent: false })
  .then(() => console.log('Message delivered'))
  .catch((err) => console.error('Message rejected:', err));

rabbitClient.publish('ex-2', '', 'string msg');
rabbitClient.publish('ex-3', 'key.3', Buffer.from('buffer msg'));

rabbitClient
  .bulkPublish('ex-2', 'routing-key-is-ignored-for-fanout-exchange', [
    { msg: 'json msg' },
    'string msg',
    Buffer.from('buffer msg')
  ])
  .then(() => console.log('All messages delivered'))
  .catch((err) => console.error('Atleast one of the messages rejected', err));

rabbitClient.bulkPublish(
  'ex-1',
  'key-2', // All messages get sent with routing key "key-2"
  [{ msg: 'json msg' }, 'string msg', Buffer.from('buffer msg')]
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

rabbitClient
  .bulkSendToQueue('q-3', [
    { msg: 'json msg' },
    'string msg',
    Buffer.from('buffer msg')
  ])
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
