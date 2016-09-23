import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const NodesSchema = new SimpleSchema({
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
  packageVersion: {
    label: 'The package version used to download node when building the image.',
    type: String,
  },
  disabled: {
    type: Boolean,
    defaultValue: false,
  },
  enabledByDefault: {
    type: Boolean,
    defaultValue: false,
  },
});

const Nodes = new Meteor.Collection('nodes');
Nodes.attachSchema(NodesSchema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    Nodes._ensureIndex({ packageVersion: 1 }, { unique: true });
  });
}

export default Nodes;
