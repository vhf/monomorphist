import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const LogsSchema = new SimpleSchema({
  _jobId: {
    type: String,
    label: 'The job these log lines belong to.',
    optional: true,
  },
  _irjobId: {
    type: String,
    label: 'The irjob these log lines belong to.',
    optional: true,
  },
  _nodeId: {
    type: String,
    optional: true,
  },
  time: {
    type: Date,
  },
  raw: {
    type: String,
    optional: true,
  },
  message: {
    type: String,
  },
});

const Logs = new Meteor.Collection('logs');
Logs.attachSchema(LogsSchema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    Logs._ensureIndex({ _jobId: 1 });
  });
}

export default Logs;
