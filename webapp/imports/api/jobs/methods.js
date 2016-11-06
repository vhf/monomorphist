import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { check, Match } from 'meteor/check';
import { Job } from 'meteor/vsivsi:job-collection';

import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';
import { Queue } from '/imports/api/queue/collection';
import Checks from '/imports/checks';
import { instrument } from './utils';

const { maxContainersPerJob } = Meteor.settings.public.node;

Meteor.methods({
  'job:getOrCreate'(selector) {
    check(selector, Match.ObjectIncluding({ _publicId: Checks.Id })); // eslint-disable-line new-cap
    if (!Jobs.findOne(selector)) {
      const defaultNodes = Nodes.find({ enabled: true, enabledByDefault: true }).fetch();
      const job = defaultNodes.length ?
          _.extend(selector, { nodes: _.pluck(defaultNodes, '_id') })
        : selector;
      Jobs.insert(job);
    }
  },
  'job:addNode'(_publicId, nodeId) {
    check(_publicId, Checks.Id);
    check(nodeId, Checks.Id);
    Jobs.update({ _publicId, status: 'editing' }, { $push: { nodes: { $each: [nodeId], $slice: -parseInt(maxContainersPerJob, 10) } } });
  },
  'job:removeNode'(_publicId, nodeId) {
    check(_publicId, Checks.Id);
    check(nodeId, Checks.Id);
    Jobs.update({ _publicId, status: 'editing' }, { $pull: { nodes: nodeId } });
  },
  'job:instrument'(p, screen = true) {
    check(p, Match.OneOf(Checks.Id, Object)); // eslint-disable-line new-cap
    let fn = p;
    if (typeof p === 'string') {
      const job = Jobs.findOne({ _publicId: p });
      if (job && 'fn' in job) {
        fn = job.fn;
      }
    }
    if (!fn || !(fn.definition || fn.call || fn.name)) {
      return '';
    }
    const prepend = process.env.PREPEND ? process.env.PREPEND : '';
    return instrument(fn.definition, fn.call, fn.name, prepend, screen);
  },
  'job:submit'(_publicId) {
    check(_publicId, Checks.Id);
    const job = Jobs.findOne({ _publicId, status: 'editing' });
    if (!job || !job.nodes.length) return;
    Jobs.update({ _id: job._id, status: 'editing' }, { $set: { status: 'ready' } });
    const queuedJob = new Job(Queue, 'run', { _jobId: job._id, nodes: job.nodes, listed: job.listed });
    queuedJob.priority('normal').save();
    Logs.insert({ _jobId: job._id, message: 'job queued...' });
  },
  'jobs:total'() {
    return Jobs.find({ updatedAt: { $exists: true } }).count();
  },
  'jobs:done'() {
    return Jobs.find({ status: 'done' }).count();
  },
  'jobs:killed'() {
    return Jobs.find({ killed: true }).count();
  },
  'jobs:ready'() {
    return Jobs.find({ status: 'ready' }).count();
  },
  'jobs:running'() {
    return Jobs.find({ status: 'running' }).count();
  },
});
