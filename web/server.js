const dgram = require('dgram');
const syslogParser = require('glossy').Parse;
const WebSocketServer = require('ws').Server;

const syslogServer = dgram.createSocket('udp4');

syslogServer.on('listening', () => {
  const address = syslogServer.address();
  console.log(`Server now listening at ${address.address}:${address.port}`);
  const wsServer = new WebSocketServer({ port: 7331 });

  wsServer.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log('received: %s', message);
      ws.send('b');
    });
    syslogServer.on('message', (rawMessage) => {
      syslogParser.parse(rawMessage.toString('utf8', 0), (parsed) => {
        ws.send(JSON.stringify(parsed));
      });
    });
  });
});

syslogServer.bind(1337);
