import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';

import { deoptimizedVerdicts, unsureVerdicts, optimizedVerdicts } from '/imports/api/jobs/utils';

Template.jobLogs.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.job = new ReactiveVar();
  this.autorun(() => {
    const _publicId = this.getPublicId();
    this.subscribe('job', _publicId);
    this.subscribe('nodes');
    if (this.subscriptionsReady()) {
      this.job.set(Jobs.findOne({ _publicId }));
    }
  });
});

Template.jobLogs.helpers({
  job() {
    return Template.instance().job.get();
  },
  jobNodes() {
    const job = Template.instance().job.get();
    if (job && job.nodes && job.nodes.length) {
      const nodes = Nodes.find({ _id: { $in: job.nodes } }, { fields: { _id: 1 }, sort: { version: 1 } }).fetch();
      return _.pluck(nodes, '_id');
    }
    return [];
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    if (node && node.version) {
      return node.nightly ? 'nightly' : node.version;
    }
    return '';
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
  status(_nodeId) {
    const job = Template.instance().job.get();
    if (job && job.nodesStatus && job.nodesStatus.length) {
      return _.findWhere(job.nodesStatus, { _id: _nodeId });
    }
    return false;
  },
  optimizationClass(status) {
    if (status && status.verdict) {
      if (deoptimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'deep-orange darken-1';
      }
      if (unsureVerdicts.indexOf(status.verdict) !== -1) {
        return 'blue lighten-4';
      }
      if (optimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'light-green';
      }
    }
    return '';
  },
  logs(_nodeId = 'undefined') {
    const job = Template.instance().job.get();
    const logs = ReactiveMethod.call('logs:job', job);
    if (logs && _nodeId in logs) {
      return logs[_nodeId];
    }
    return [];
  },
  isoTime(time) {
    return new Date(time).toISOString();
  },
});

Template.jobLogs.events({
  'click .collapse-column': () => {
    $('.collapse-column').toggleClass('collapsed');
    $('.collapse-column').toggleClass('uncollapsed');
  },
});

Template.jobLogs.onRendered(() => {
  $('.collapsible').collapsible({
    accordion: false,
  });
});
