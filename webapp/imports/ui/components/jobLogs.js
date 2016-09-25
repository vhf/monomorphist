import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Logs from '/imports/api/logs/collection';

import { deoptimizedVerdicts, unsureVerdicts, optimizedVerdicts } from '/imports/api/jobs/utils';

Template.jobLogs.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    const _jobId = this.getJobId();
    this.subscribe('job', _jobId);
    this.subscribe('nodes');
    this.subscribe('logs', _jobId);
  });
});

Template.jobLogs.helpers({
  job() {
    const _id = Template.instance().getJobId();
    const job = Jobs.findOne({ _id });
    return job;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.packageVersion : '';
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
  status(_nodeId) {
    const _jobId = Template.instance().getJobId();
    const job = Jobs.findOne({ _id: _jobId });
    if (job && job.nodesStatus && job.nodesStatus.length) {
      return _.findWhere(job.nodesStatus, { _id: _nodeId });
    }
    return false;
  },
  optimizationClass(status) {
    if (deoptimizedVerdicts.indexOf(status.verdict) !== -1) {
      return 'deep-orange darken-1';
    }
    if (unsureVerdicts.indexOf(status.verdict) !== -1) {
      return 'blue lighten-4';
    }
    if (optimizedVerdicts.indexOf(status.verdict) !== -1) {
      return 'light-green';
    }
    return '';
  },
  logsFrom(_nodeId) {
    const _jobId = Template.instance().getJobId();
    return Logs.find({ _jobId, _nodeId }).fetch();
  },
  execLogs() {
    const _jobId = Template.instance().getJobId();
    return Logs.find({ _jobId, _nodeId: { $exists: false } }).fetch();
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
