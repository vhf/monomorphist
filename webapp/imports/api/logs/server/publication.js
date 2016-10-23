import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logs from '../collection';

Meteor.publish('logs', _jobId => {
  check(_jobId, String);
  return Logs.find({ _jobId });
});

Meteor.publish('irlogs', _irjobId => {
  check(_irjobId, String);
  return Logs.find({ _irjobId });
});

Meteor.publish('refreshLogs', function refreshLogs() {
  if (this.userId) {
    return Logs.find({ _jobId: { $exists: false }, _irjobId: { $exists: false }, _nodeId: { $exists: false } });
  }
  return undefined;
});
