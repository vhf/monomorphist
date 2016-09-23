import { Meteor } from 'meteor/meteor';
import Nodes from '/imports/api/nodes/collection';

Meteor.methods({
  'nodes:all'(selector = { disabled: false }) {
    return Nodes.find(selector).fetch();
  },
});
