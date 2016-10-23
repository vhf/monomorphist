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
  time: {
    type: Date,
    autoValue: function autoValue(): any {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      } else if (this.isUpdate) {
        return new Date();
      }
      this.unset();
      return undefined;
    },
  },
  _nodeId: {
    type: String,
    optional: true,
  },
  raw: {
    type: String,
    optional: true,
  },
  message: {
    type: String,
    optional: true,
  },
  type: {
    type: String,
    optional: true,
  },
  queue: {
    type: String,
    optional: true,
  },
  title: {
    type: String,
    optional: true,
  },
  stdout: {
    type: String,
    optional: true,
  },
  stderr: {
    type: String,
    optional: true,
  },
  miscJSON: {
    type: String,
    optional: true,
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
