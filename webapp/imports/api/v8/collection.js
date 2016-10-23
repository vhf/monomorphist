import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const V8Schema = new SimpleSchema({
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
  This version can be used, it'll show up in the form.
  */
  enabled: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  /*
  v8 for this node version can be built using gn instead of gyp
  */
  gnCompatible: {
    type: Boolean,
    defaultValue: true,
  },
  tag: {
    // e.g. '5.3.332.41'
    type: String,
  },
  nodeVersion: {
    // e.g. '6.6.0'
    type: String,
    optional: true,
  },
  chromeVersion: {
    // e.g. '53.0.2785.86'
    type: String,
    optional: true,
  },
  /*
  Used to fetch all versions we'd like to build
  */
  rebuild: {
    type: Boolean,
    optional: true,
  },
  // /*
  // Whether this image has been successfully built+tagged+pushed
  // */
  // built: {
  //   type: Boolean,
  //   defaultValue: false,
  //   optional: true,
  // },
});

const V8 = new Meteor.Collection('v8');
V8.attachSchema(V8Schema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    V8._ensureIndex({ tag: 1 }, { unique: true });
  });
}

export default V8;
