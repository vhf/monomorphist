import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

import { deoptimizedVerdicts, unsureVerdicts, optimizedVerdicts } from '/imports/api/jobs/utils';

Template.jobLogs.onCreated(function onCreated() {
  this.job = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
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
      const node = _.findWhere(job.nodesStatus, { _id: _nodeId });
      if (job.killed && node && node.status) {
        node.status = `${node.status} - killed`;
      }
      return node;
    }
    return false;
  },
  optimizationClass(status) {
    if (status && status.verdict) {
      if (deoptimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'color-bad';
      }
      if (unsureVerdicts.indexOf(status.verdict) !== -1) {
        return 'color-unsure';
      }
      if (optimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'color-good';
      }
    }
    return '';
  },
  optimizationIcon(status, killed) {
    if (killed) {
      return 'block';
    }
    if (status && status.verdict) {
      if (deoptimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'error';
      }
      if (unsureVerdicts.indexOf(status.verdict) !== -1) {
        return 'help_outline';
      }
      if (optimizedVerdicts.indexOf(status.verdict) !== -1) {
        return 'check';
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
  'click .collapsible-header': () => Meteor.setTimeout(fixJobQueueHeight, 250),
});

Template.jobLogs.onRendered(function jobLogsRendered() {
  const wait = Meteor.setInterval(() => {
    if (this.subscriptionsReady()) {
      fixJobQueueHeight();
      Meteor.clearInterval(wait);
    }
  }, 87);
  let count = 0;
  const wait2 = Meteor.setInterval(() => {
    if ($('.collapsible').length) {
      const job = this.job.get();
      if (job && job.nodes && job.nodes.length && (job.nodes.length + 1 === $('.logs-collapsibles .collapsible-header').length)) {
        count += 1;
        $('.collapsible').collapsible({
          accordion: false,
        });
        if (count > 3) {
          Meteor.clearInterval(wait2);
        }
      }
    }
  }, 587);
});
