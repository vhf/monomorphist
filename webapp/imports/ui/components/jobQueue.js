import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Queue from '/imports/api/queue/collection';

const { concurrency } = Meteor.settings.public;

Template.jobQueue.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    this.subscribe('queue');
    this.subscribe('nodes');
    this.subscribe('jobs');
  });
});

Template.jobQueue.helpers({
  runningStatus() {
    const running = Queue.find({ status: 'running' }).count();
    if (!running) {
      return 'No work, go ahead.';
    }
    return `${running}/${concurrency} running`;
  },
  jobsDone() {
    return Jobs.find({ status: 'done', unlisted: false }, { limit: 50, sort: { createdAt: -1 } }).fetch();
  },
  jobsReady() {
    return Queue.find({ status: 'ready' }, { sort: { created: -1 } }).fetch();
  },
  jobsRunning() {
    return Queue.find({ status: 'running' }).fetch();
  },
  currentJob(_jobId) {
    const _id = Template.instance().getJobId();
    return _jobId === _id;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.packageVersion : '';
  },
});
