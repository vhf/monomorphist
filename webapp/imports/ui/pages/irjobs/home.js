import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import IRJobs from '/imports/api/irjobs/collection';

import '/imports/ui/components/irjobs';
import '/imports/ui/components/footer.js';

Template.irjobHome.onCreated(function onCreated() {
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
  });
});

Template.irjobHome.helpers({
  job() {
    const _publicId = FlowRouter.getParam('_publicId');
    const job = IRJobs.findOne({ _publicId });
    console.log(job);
    return job;
  },
  compareStatus(job, status) {
    console.log(job);
    return (job && job.status) ? job.status === status : false;
  },
});

Template.irjobHome.onRendered(() => {
  const _publicId = FlowRouter.getParam('_publicId');
  // when leaving the page, we delete the job if it's empty
  window.addEventListener('beforeunload', () => {
    const job = IRJobs.findOne({ _publicId });
    if (typeof job.updatedAt === 'undefined') {
      IRJobs.remove({ _id: job._id });
    }
    return null; // avoids confirmation popup
  });
});
