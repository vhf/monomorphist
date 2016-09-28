import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';

const { concurrency } = Meteor.settings.public;

Template.jobQueue.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.autorun(() => {
    this.subscribe('nodes');
    this.subscribe('jobs');
    this.subscribe('unlistedJobs');
    this.subscribe('queue');
  });
});

Template.jobQueue.helpers({
  runningStatus() {
    const ready = Jobs.find({ status: 'ready' }).count();
    const running = Jobs.find({ status: 'running' }).count();
    if (ready + running === 0) {
      return 'No work, go ahead.';
    }
    return `${running}/${concurrency} running`;
  },
  jobsDone() {
    const listed = Jobs.find({ status: 'done', listed: true }, { limit: 50, sort: { createdAt: -1 } }).fetch();
    const unlisted = Jobs.find({ status: 'done', listed: false }, { limit: 50, sort: { createdAt: -1 } }).fetch();
    const all = _.chain(listed).union(unlisted).sort((a, b) => (+b) - (+a)).value();
    return all;
  },
  jobsReady() {
    return Jobs.find({ status: 'ready' }, { sort: { created: -1 } }).fetch();
  },
  jobsRunning() {
    return Jobs.find({ status: 'running' }).fetch();
  },
  currentJob(_jobId) {
    const _publicId = Template.instance().getPublicId();
    return _jobId === _publicId;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.version : '';
  },
});
