import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Queue from '/imports/api/queue/collection';

Template.jobQueue.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    this.subscribe('queue');
    this.subscribe('nodes');
    this.subscribe('jobs');
  });
});

Template.jobQueue.helpers({
  jobsDone() {
    return Jobs.find({ status: 'done', unlisted: false }, { sort: { createdAt: -1 } }).fetch();
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
