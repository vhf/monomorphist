import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';

import '/imports/ui/components/jobs';
import '/imports/ui/components/footer.js';

Template.jobHome.onCreated(function onCreated() {
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('job', _publicId);
  });
});

Template.jobHome.helpers({
  job() {
    const _publicId = FlowRouter.getParam('_publicId');
    const job = Jobs.findOne({ _publicId });
    return job;
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
});

Template.jobHome.onRendered(() => {
  const _publicId = FlowRouter.getParam('_publicId');
  // when leaving the page, we delete the job if it's empty
  window.addEventListener('beforeunload', () => {
    const job = Jobs.findOne({ _publicId });
    if (typeof job.updatedAt === 'undefined') {
      Jobs.remove({ _id: job._id });
    }
    return null; // avoids confirmation popup
  });
});
