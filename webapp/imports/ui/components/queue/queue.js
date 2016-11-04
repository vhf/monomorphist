import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { _ } from 'meteor/underscore';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';

const { node } = Meteor.settings.public;

Template.queue.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('nodes');
    this.subscribe('jobs');
    this.subscribe('unlistedJobs');
    this.subscribe('queue');
  });
});

Template.queue.helpers({
  runningStatus() {
    const ready = Jobs.find({ status: 'ready' }).count();
    const running = Jobs.find({ status: 'running' }).count();
    if (ready + running === 0) {
      return false;
    }
    return `${running}/${node.concurrency} running`;
  },
  jobsDone() {
    const listed = Jobs.find({ status: 'done', listed: true }, { limit: 50, sort: { createdAt: -1 } }).fetch();
    const unlisted = Jobs.find({ status: 'done', listed: false }, { limit: 50, sort: { createdAt: -1 } }).fetch();
    const all = _
      .chain(listed)
      .union(unlisted)
      .sort((a, b) => (+b.createdAt) - (+a.createdAt))
      .first(50)
      .value();
    return all;
  },
  jobsReady() {
    return Jobs.find({ status: 'ready' }, { sort: { created: -1 } }).fetch();
  },
  jobsRunning() {
    return Jobs.find({ status: 'running' }).fetch();
  },
  currentJob(_id) {
    const _publicId = FlowRouter.getParam('_publicId');
    if (!_publicId) return false;
    return _id === _publicId;
  },
  link(job) {
    return `/job/${job._publicId}`;
  },
  sortAndAugment(nodesStatuses) {
    const nodes = _.indexBy(Nodes.find().fetch(), '_id');
    const augmentedAndSorted = _
      .chain(nodesStatuses)
      .map(aNode => _.extend(aNode, nodes[aNode._id]))
      .sortBy('version')
      .value();
    return augmentedAndSorted;
  },
});

Template.queue.events({
  'click .node-modal-trigger': (event) => {
    event.preventDefault();
    const version = $(event.target).text().trim();
    $('#node-versions-table tr').removeClass('selected-version');
    $(`#node-versions-table tr[data-version="${version}"]`).addClass('selected-version');
    $('#node-info-modal').openModal();
  },
  'click #new-btn': () => {
    FlowRouter.go('/#try-node');
  },
});
