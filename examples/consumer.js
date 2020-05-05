const rabbitClient = require('./config');

function consumer(msg) {
  // console.log(msg);

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
