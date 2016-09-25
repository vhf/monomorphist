import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const JobsSchema = new SimpleSchema({
  createdAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      }
      this.unset();
      return undefined; // don't modify the doc
    },
  },
  updatedAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isUpdate) {
        return new Date();
      }
      return undefined; // don't modify the doc
    },
    denyInsert: true,
    optional: true,
  },
  fn: {
    type: Object,
    optional: true,
  },
  'fn.definition': {
    label: 'Your function.',
    type: String,
    autoform: {
      rows: 1,
    },
    optional: true,
  },
  'fn.call': {
    label: 'How to call the function.',
    type: String,
    autoform: {
      rows: 1,
    },
    optional: true,
  },
  'fn.name': {
    label: 'The name of the function to optimize.',
    type: String,
    optional: true,
  },
  nodes: {
    type: [String],
    optional: true,
  },
  'nodes.$': {
    type: String,
  },
  nodesStatus: {
    type: [Object],
    optional: true,
  },
  'nodesStatus.$': {
    type: Object,
  },
  'nodesStatus.$._id': {
    type: String,
  },
  'nodesStatus.$.verdict': {
    type: Number,
  },
  'nodesStatus.$.status': {
    type: String,
  },
  result: {
    type: [String],
    optional: true,
  },
  'result.$': {
    type: String,
  },
  status: {
    type: String,
    defaultValue: 'editing',
    autoform: {
      options: (): Object[] => {
        const statuses = ['editing', 'queued', 'running', 'done'];
        return statuses.map(status => ({ label: status, value: status }));
      },
    },
  },
  killed: {
    type: Boolean,
    defaultValue: false,
  },
  unlisted: {
    label: 'Unlisted',
    type: Boolean,
    defaultValue: false,
  },
});

const Jobs = new Meteor.Collection('jobs');
Jobs.attachSchema(JobsSchema);

export default Jobs;
