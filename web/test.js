const dgram = require('dgram');
const Producer = require('glossy').Produce;

const presetProducer = new Producer({
  facility: 'ntp',
  host: 'localhost',
  appName: 'kill',
});

const debugMsg = presetProducer.debug({
  facility: 'local2',
  message: 'Debug Message',
  date: new Date(1234567890000),
  pid: 91,
});

const infoMsg = presetProducer.info({
  facility: 'ntp',
  message: 'Info Message',
  pid: 42,
  date: new Date(1234567890000),
});

const noticeMsg = presetProducer.debug({
  facility: 'local2',
  message: 'Notice Message',
  pid: 16,
  date: new Date(1234567890000),
});

const warnMsg = presetProducer.debug({
  facility: 'local4',
  message: 'Warning Message',
  pid: 91,
  date: new Date(1234567890000),
});

const errorMsg = presetProducer.debug({
  facility: 'clock',
  message: 'Error Message',
  pid: 91,
  date: new Date(1234567890000),
});

const criticalMsg = presetProducer.crit({
  facility: 'local0',
  message: 'Critical Message',
  pid: 91,
  date: new Date(1234567890000),
});

const alertMsg = presetProducer.alert({
  facility: 'clock',
  message: 'Alert Message',
  pid: 91,
  date: new Date(1234567890000),
});

const emergencyMsg = presetProducer.emergency({
  facility: 'news',
  message: 'Emergency Message',
  pid: 91,
  date: new Date(1234567890000),
});

const structuredMsg = presetProducer.produce({
  facility: 'local4',
  severity: 'error',
  host: 'mymachine.example.com',
  appName: 'evntslog',
  msgID: 'ID47',
  date: new Date(1234567890000),
  structuredData: {
    'exampleSDID@32473': {
      iut: '3',
      eventSource: 'Application',
      eventID: '1011',
      seqNo: '1',
    },
  },
  message: 'BOMAn application event log entry...',
});

const messageWithOneDigitDate = presetProducer.emergency({
  facility: 'news',
  message: 'Emergency Message',
  pid: 91,
  date: new Date(1233531090000),
});

const msgs = [
  debugMsg,
  infoMsg,
  noticeMsg,
  warnMsg,
  errorMsg,
  criticalMsg,
  alertMsg,
  emergencyMsg,
  structuredMsg,
  messageWithOneDigitDate,
];

msgs.forEach((msg) => {
  const server = dgram.createSocket('udp4');
  const buff = new Buffer(msg);
  server.send(buff, 0, buff.length, 1337, '127.0.0.1', (err, res) => {
    if (err) console.error("[UDP-SERVER] Received error: ", err);
    else console.log("[UDP-SERVER] Received response: ", res);
    server.close();
  });
});
