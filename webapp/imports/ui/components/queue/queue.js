import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { _ } from 'meteor/underscore';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import {
  deoptimizedVerdicts,
  unsureVerdicts,
  optimizedVerdicts,
  killedVerdicts,
} from '/imports/api/jobs/utils';

Template.queue.onCreated(function onCreated() {
  this.detailId = new ReactiveVar();
  this.detail = new ReactiveVar();
  this.autorun(() => {
    this.subscribe('nodes');
    this.subscribe('jobs');
    this.subscribe('unlistedJobs');
    this.subscribe('queue');
    const _id = this.detailId.get();
    if (_id) {
      this.subscribe('detail', _id);
      this.detail.set(Jobs.findOne({ _id }));
    }
  });
});

Template.queue.helpers({
  jobs() {
    const listed = Jobs.find({ listed: true }, { limit: 100, sort: { createdAt: -1 } }).fetch();
    const unlisted = Jobs.find({ listed: false }, { limit: 100 - listed.length, sort: { createdAt: -1 } }).fetch();
    const all = _
      .chain(listed)
      .union(unlisted)
      .sort((a, b) => (+b.createdAt) - (+a.createdAt))
      .first(75)
      .value();
    return all;
  },
  status(job, str) {
    if (job.status === str) {
      return true;
    }
    return false;
  },
  // currentJob(_id) {
  //   const _publicId = FlowRouter.getParam('_publicId');
  //   if (!_publicId) return false;
  //   return _id === _publicId;
  // },
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
  'click .queue-item': (event) => {
    event.preventDefault();
    const _id = $(event.target).closest('li.queue-item').data('id');
    if (_id) {
      Template.instance().detailId.set(_id);
    }
  },
  'click .job-link': (event) => {
    event.preventDefault();
    const _id = $(event.target).closest('li.queue-item').data('id');
    const job = Template.instance().detail.get();
    if (job && job._id === _id && job._publicId) {
      FlowRouter.go(`/job/${job._publicId}`);
    }
  },
});

Template.queue.onRendered(() => {
  // $('.new-btn-wrapper').pushpin({ top: $('.new-btn-wrapper').offset().top });
  // $('.job-queue-col').pushpin({ top: $('.job-queue-col').offset().top });
});
