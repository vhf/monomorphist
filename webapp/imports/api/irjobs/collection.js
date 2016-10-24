import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const IRJobsSchema = new SimpleSchema({
  _publicId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
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
  code: {
    label: 'Your code',
    type: String,
    autoform: {
      rows: 14,
    },
    optional: true,
  },
  _v8Id: {
    type: String,
    optional: true,
  },
  status: {
    type: String,
    defaultValue: 'editing',
    autoform: {
      options: (): Object[] => {
        const statuses = ['editing', 'ready', 'running', 'done'];
        return statuses.map(status => ({ label: status, value: status }));
      },
    },
  },
  killed: {
    type: Boolean,
    defaultValue: false,
  },
  listed: {
    label: 'labels are hardcoded in listedCheckbox.html',
    type: Boolean,
    defaultValue: true,
  },
});

const IRJobs = new Meteor.Collection('irjobs');
IRJobs.attachSchema(IRJobsSchema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    IRJobs._ensureIndex({ _publicId: 1 }, { unique: true });
  });
}

export default IRJobs;
