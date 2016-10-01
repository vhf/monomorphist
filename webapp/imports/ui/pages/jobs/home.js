import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import Queue from '/imports/api/queue/collection';

import '/imports/ui/components/jobs/';
import '/imports/ui/components/footer.js';

const { concurrency, timeout } = Meteor.settings.public;

Template.jobHome.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.autorun(() => {
    const _publicId = this.getPublicId();
    this.subscribe('job', _publicId);
  });
});

Template.jobHome.helpers({
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
});

Template.jobHome.onRendered(() => {
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
