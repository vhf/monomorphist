import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import IRJobs from '/imports/api/irjobs/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

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
    return job;
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
});

Template.irjobHome.onRendered(function rendered() {
  const _publicId = FlowRouter.getParam('_publicId');
  // when leaving the page, we delete the job if it's empty
  window.addEventListener('beforeunload', () => {
    const job = IRJobs.findOne({ _publicId });
    if (typeof job.updatedAt === 'undefined') {
      IRJobs.remove({ _id: job._id });
    }
    return null; // avoids confirmation popup
  });
  Tracker.autorun(() => {
    FlowRouter.watchPathChange();
    const wait = Meteor.setInterval(() => {
      if (this.subscriptionsReady()) {
        fixJobQueueHeight();
        Meteor.clearInterval(wait);
      }
    }, 87);
  });
});
