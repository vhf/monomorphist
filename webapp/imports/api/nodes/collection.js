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
  This Docker image should be (re-)built
  */
  toBuild: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  /*
  This version can be used, it'll show up in the form.
  */
  enabled: {
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
  hash: {
    // only used for nightlies
    type: String,
    optional: true,
  },
  date: {
    type: Date,
    optional: true,
  },
  npm: {
    type: String,
    optional: true,
  },
  v8: {
    type: String,
    optional: true,
  },
  uv: {
    type: String,
    optional: true,
  },
  zlib: {
    type: String,
    optional: true,
  },
  openssl: {
    type: String,
    optional: true,
  },
  modules: {
    type: String,
    optional: true,
  },
  lts: {
    type: String,
    optional: true,
    defaultValue: '',
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
