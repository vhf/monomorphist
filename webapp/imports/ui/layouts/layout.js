import { Template } from 'meteor/templating';

import Nodes from '/imports/api/nodes/collection';

Template.layout.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('nodes');
  });
});

Template.layout.helpers({
  rebuilding() {
    // at least one node is being rebuilt
    return Nodes.find({ toBuild: true }, { fields: { _id: 1 } }).count() > 0;
  },
});
