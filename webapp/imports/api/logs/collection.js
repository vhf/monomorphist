import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const LogsSchema = new SimpleSchema({
  _jobId: {
    type: String,
    label: 'The user who ran this job.',
    autoform: {
      type: 'select',
    },
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

export default Logs;
