import { Template } from 'meteor/templating';

import Nodes from '/imports/api/nodes/collection';

Template.nodeInfoModal.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('nodes');
  });
});

Template.nodeInfoModal.helpers({
  formatDate(date) {
    return date.toLocaleDateString();
  },
  nodes() {
    // all nodes except the old nightlies
    // WHERE nightly = false OR enabled = true
    return Nodes.find({ $or: [{ nightly: false }, { enabled: true }] }, { sort: { version: 1 } }).fetch();
  },
});
