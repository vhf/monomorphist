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
  /*
  Cannot be used. Doesn't show up in the form.
  */
  disabled: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  /*
  Switched on by default in the form.
  */
  enabledByDefault: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  /*
  this version is the latest version of this major release
  */
  latest: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  /*
  this a nightly build
  */
  nightly: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  // <https://nodejs.org/dist/index.json>
  version: {
    // e.g. '6.6.0'
    type: String,
  },
  date: {
    type: Date,
  },
  npm: {
    type: String,
  },
  v8: {
    type: String,
  },
  uv: {
    type: String,
  },
  zlib: {
    type: String,
  },
  openssl: {
    type: String,
  },
  modules: {
    type: String,
  },
  lts: {
    type: String,
  },
  // </https://nodejs.org/dist/index.json>
});

const Nodes = new Meteor.Collection('nodes');
Nodes.attachSchema(NodesSchema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    Nodes._ensureIndex({ version: 1 }, { unique: true });
  });
}

export default Nodes;
