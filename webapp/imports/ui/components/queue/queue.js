import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { _ } from 'meteor/underscore';

import Jobs from '/imports/api/jobs/collection';
import IRJobs from '/imports/api/irjobs/collection';
import Nodes from '/imports/api/nodes/collection';
import V8 from '/imports/api/v8/collection';

import {
  deoptimizedVerdicts,
  unsureVerdicts,
  optimizedVerdicts,
  killedVerdicts,
} from '/imports/api/jobs/utils';

Template.queue.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('nodes');
    this.subscribe('jobs');
    this.subscribe('irjobs');
    this.subscribe('v8');
    this.subscribe('queue');
  });
});

Template.queue.helpers({
  jobs() {
    const nodeJobs = Jobs.find({ listed: true, status: { $not: 'editing' } },
      { limit: 100, sort: { createdAt: -1 }, fields: { fn: 0 } }).fetch();
    const irJobs = IRJobs.find({ listed: true, status: { $not: 'editing' } },
      { limit: 100, sort: { createdAt: -1 }, fields: { code: 0 } }).fetch();
    const v8Ids = _.pluck(irJobs, '_v8Id');
    const v8s = _.indexBy(V8.find({ _id: { $in: v8Ids } }).fetch(), '_id');
    const joined = _
      .chain(irJobs)
      .map(_job => {
        const job = _job;
        if (job._v8Id in v8s) {
          const v8 = v8s[job._v8Id];
          if (v8 && v8.tag) {
            job.tag = v8.tag;
          }
        }
        return _.extend(job, { irjob: true });
      })
      .union(_.map(nodeJobs, (job) => _.extend(job, { nodejob: true })))
      .sort((a, b) => (+b.createdAt) - (+a.createdAt))
      .first(75)
      .value();
    return joined;
  },
  status(job, str) {
    if (job.status === str) {
      return true;
    }
    return false;
  },
  shortId(job) {
    const id = job._publicId;
    if (id) {
      return `#${id.slice(0, 8)}`;
    }
    return 'unlisted';
  },
  shortIdTitle(job) {
    const id = job._publicId;
    if (id) {
      return `Job #${id.slice(0, 8)}`;
    }
    return 'Unlisted Job';
  },
  verdicts(nodesStatuses) {
    const cumulatedStatuses = _
      .chain(nodesStatuses)
      .reduce((_statuses, aNode) => {
        const statuses = _statuses;
        if (deoptimizedVerdicts.indexOf(aNode.verdict) !== -1) {
          statuses.bad += 1;
        }
        if (optimizedVerdicts.indexOf(aNode.verdict) !== -1) {
          statuses.good += 1;
        }
        if (unsureVerdicts.indexOf(aNode.verdict) !== -1) {
          statuses.unsure += 1;
        }
        if (killedVerdicts.indexOf(aNode.verdict) !== -1) {
          statuses.killed += 1;
        }
        return statuses;
      }, { good: 0, bad: 0, unsure: 0, killed: 0 })
      .value();
    return cumulatedStatuses;
  },
  sortAndAugment(nodesStatuses) {
    const nodes = _.indexBy(Nodes.find().fetch(), '_id');
    const augmentedAndSorted = _
      .chain(nodesStatuses)
      .map(aNode => _.extend(aNode, nodes[aNode._id]))
      .map(_aNode => {
        const aNode = _aNode;
        if (aNode.nightly) {
          aNode.version = aNode.version.split('-')[0];
          aNode.version += ' nightly';
        }
        if (deoptimizedVerdicts.indexOf(aNode.verdict) !== -1) {
          aNode.class = 'color-bad';
          aNode.bad = true;
          return aNode;
        }
        if (optimizedVerdicts.indexOf(aNode.verdict) !== -1) {
          aNode.class = 'color-good';
          aNode.good = true;
          return aNode;
        }
        if (unsureVerdicts.indexOf(aNode.verdict) !== -1) {
          aNode.class = 'color-unsure';
          aNode.unsure = true;
          return aNode;
        }
        if (killedVerdicts.indexOf(aNode.verdict) !== -1) {
          aNode.class = 'color-killed';
          aNode.killed = true;
          return aNode;
        }
        return aNode;
      })
      .sortBy('version')
      .reduce((rows, cell, index) => {
        if (index % 2 === 0) {
          rows.push([cell]);
        } else {
          rows[rows.length - 1].push(cell);
        }
        return rows;
      }, [])
      .value();
    return augmentedAndSorted;
  },
  detail(job) {
    const detail = Template.instance().detail.get();
    if (detail && job && detail._id === job._id && job.nodesStatus && job.nodesStatus.length) {
      return detail;
    }
    return false;
  },
  getV8(tag) {
    const v8 = V8.findOne({ tag });
    if (v8.nodeVersion) {
      const xs = v8.nodeVersion.split(', ');
      if (xs.length > 1) {
        v8.nodeVersion = [xs[0], xs[xs.length - 1]].join(' → ');
      }
    }
    if (v8.chromeVersion) {
      const xs = v8.chromeVersion.split(', ');
      if (xs.length > 1) {
        v8.chromeVersion = [xs[0], xs[xs.length - 1]].join(' → ');
      }
    }
    return v8;
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
    FlowRouter.go('/new');
  },
  'click .queue-item': (event) => {
    event.preventDefault();
    const $elem = $(event.target).closest('li.queue-item');
    const $toHide = $('li.queue-item.details');
    if ($elem) {
      $elem.toggleClass('listed').toggleClass('details');
      $toHide.removeClass('details').addClass('listed');
    }
  },
  'click .details.type-nodejob > .short-id': (event) => {
    event.preventDefault();
    const _id = $(event.target).closest('li.queue-item').data('publicid');
    if (_id) {
      FlowRouter.go(`/job/${_id}`);
    }
  },
  'click .details.type-irjob > .short-id': (event) => {
    event.preventDefault();
    const _id = $(event.target).closest('li.queue-item').data('publicid');
    if (_id) {
      FlowRouter.go(`/ir/${_id}`);
    }
  },
});

Template.queue.onRendered(function rendered() {
});
