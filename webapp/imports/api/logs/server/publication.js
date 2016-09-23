import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logs from '../collection';

Meteor.publish('logs', _jobId => {
  check(_jobId, String);
  return Logs.find({ _jobId });
});
