import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const JobsSchema = new SimpleSchema({
  _userId: {
    type: String,
    label: 'The user who ran this job.',
    autoValue: function autoValue(): string {
      return this.userId;
    },
    // autoform: {
    //   type: 'select',
    //   options(): [selectItem] {
    //     const things = Meteor.users.find({});
    //     return things.map((thing: Object): selectItem => ({ label: thing.name, value: thing._id }));
    //   },
    // },
    optional: true,
  },
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
    label: 'Code to instrument.',
    type: String,
    autoform: {
      rows: 1,
      placeholder: 'var sum = function(xs) {\n  return xs.reduce(function(acc, cur) {\n    return eval(\'acc + cur\');\n  }, 0);\n};\nvar numbers;',
    },
  },
  'fn.call': {
    label: 'How to call the fn.',
    type: String,
    autoform: {
      rows: 1,
      placeholder: 'numbers = _.chain(_.range(0, 50)).map(function(n) {\n  return _.random(10000)\n}).value();\nsum(numbers);\n',
    },
  },
  'fn.name': {
    label: 'Which function to call.',
    type: String,
    autoform: {
      placeholder: 'sum',
    },
  },
  nodes: {
    type: [String],
    optional: true,
  },
  'nodes.$': {
    type: String,
  },
  status: {
    type: String,
    defaultValue: 'editing',
    autoform: {
      options: (): Object[] => {
        const statuses = ['editing', 'running', 'done'];
        return statuses.map(status => ({ label: status, value: status }));
      },
    },
  },
});

const Jobs = new Meteor.Collection('jobs');
Jobs.attachSchema(JobsSchema);

export default Jobs;
