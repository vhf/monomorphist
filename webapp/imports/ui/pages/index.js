import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import Jobs from '/imports/api/jobs/collection';
import Queue from '/imports/api/queue/collection';

import '../components/jobForm.js';
import '../components/jobShow.js';
import '../components/jobLogs.js';
import '../components/jobQueue.js';

Template.index.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    const _jobId = this.getJobId();
    this.subscribe('job', _jobId);
  });
});

Template.index.helpers({
  job() {
    const _id = Template.instance().getJobId();
    const job = Jobs.findOne({ _id });
    return job;
  },
  compareStatus(job, status) {
    return (job && job.status) ? job.status === status : false;
  },
  jobsCounts() {
    return Jobs.find().fetch();
  },
  queueLength() {
    return Queue.find().count();
  },
});
