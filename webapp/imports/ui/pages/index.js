import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Queue from '/imports/api/queue/collection';

import '../components/jobForm.js';
import '../components/jobShow.js';
import '../components/jobLogs.js';
import '../components/jobQueue.js';
import '../components/footer.js';

const { concurrency, timeout } = Meteor.settings.public;

Template.index.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.autorun(() => {
    const _publicId = this.getPublicId();
    this.subscribe('job', _publicId);
    this.subscribe('nodes');
  });
});

Template.index.helpers({
  nodes() {
    // all nodes except the old nightlies
    // WHERE nightly = false OR enabled = true
    return Nodes.find({ $or: [{ nightly: false }, { enabled: true }] }, { sort: { version: 1 } }).fetch();
  },
  job() {
    const _publicId = Template.instance().getPublicId();
    const job = Jobs.findOne({ _publicId });
    return job;
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
  jobsCounts() {
    return Jobs.find().fetch();
  },
  queueLength() {
    return Queue.find({ status: { $not: 'done' } }).count();
  },
  estimate() {
    const jobs = Queue.find({ status: { $not: 'done' } }).count();
    const time = ((jobs / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
  formatDate(date) {
    return date.toLocaleDateString();
  },
});

Template.index.onRendered(() => {
  const _publicId = Template.instance().getPublicId();
  // when leaving the page, we delete the job if it's empty
  window.addEventListener('beforeunload', () => {
    const job = Jobs.findOne({ _publicId });
    if (typeof job.updatedAt === 'undefined') {
      Jobs.remove({ _id: job._id });
    }
    return null; // avoids confirmation popup
  });
});
