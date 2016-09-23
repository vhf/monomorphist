import { Meteor } from 'meteor/meteor';
import { Parse as parser } from 'glossy';

import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';

const dgram = require('dgram');

const syslogServer = dgram.createSocket('udp4');

syslogServer.on('close', () => {
  console.log('server close');
});

syslogServer.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  syslogServer.close();
});

syslogServer.on('listening', () => {
  const address = syslogServer.address();
  console.log(`Syslog server now listening at ${address.address}:${address.port}`);
});

const nodes = Meteor.call('nodes:all');

syslogServer.on('message', Meteor.bindEnvironment((rawMessage) => {
  console.log('received something!');
  parser.parse(rawMessage.toString('utf8', 0), Meteor.bindEnvironment((parsed) => {
    const match = parsed.message.match(/^monomorph (running|done) \{([^\}]+)\}\{([^\}]+)\}/);
    if (match) {
      const [, status, _id, packageVersion] = match;
      if (status === 'running') {
        Jobs.update({ _id, status: 'editing' }, { $set: { status: 'running' } });
        console.log({ _id, status: 'running' });
      }
      if (status === 'done') {
        Jobs.update({ _id, status: 'running' }, { $set: { status: 'done' } });
        console.log({ _id, status: 'done' });
      }
    } else {
      console.log({ host: parsed.host });
      const tag = parsed.host.match(/^([23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17})-([^:]+)/);
      console.log({ tag });
      if (tag) {
        const [, _jobId, packageVersion] = tag;
        const node = Nodes.find({ disabled: false, packageVersion }).fetch();
        console.log(node);
        if (node.length) {
          const { _id: _nodeId } = node[0];
          console.log(node[0]);
          const { time, message } = parsed;
          console.log(time);
          console.log(message);
          Logs.insert({ _jobId, _nodeId, time, message });
          console.log('inserted:');
        }
        console.log(parsed);
      }
    }
  }));
}));

syslogServer.bind(1337);
