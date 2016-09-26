import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveMethod } from 'meteor/simple:reactive-method';

import Queue from '/imports/api/queue/collection';

const { concurrency, timeout } = Meteor.settings.public;

Template.footer.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    const _jobId = this.getJobId();
    this.subscribe('job', _jobId);
    this.subscribe('jobs');
  });
});

Template.footer.helpers({
  totalJobsCount() {
    return ReactiveMethod.call('jobs:total');
  },
  doneJobsCount() {
    return ReactiveMethod.call('jobs:done');
  },
  killedJobsCount() {
    return ReactiveMethod.call('jobs:killed');
  },
  queueLength() {
    return Queue.find({ status: 'ready' }).count();
  },
  estimate() {
    const jobs = Queue.find({ status: 'ready' }).count();
    const time = ((jobs / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
});
