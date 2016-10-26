import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';

Template.irjobLogs.onCreated(function onCreated() {
  this.irjob = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
    if (this.subscriptionsReady()) {
      this.irjob.set(IRJobs.findOne({ _publicId }));
    }
  });
});

Template.irjobLogs.helpers({
  irjob() {
    return Template.instance().irjob.get();
  },
  compareStatus(irjob, status) {
    return (irjob && irjob.status) ? irjob.status === status : false;
  },
  logs() {
    const irjob = Template.instance().irjob.get();
    const logs = ReactiveMethod.call('logs:irjob', irjob);
    return logs || [];
  },
  isoTime(time) {
    return new Date(time).toISOString();
  },
});

Template.irjobLogs.onRendered(() => {
  $('.collapsible-header').addClass('active');
  $('.collapsible').collapsible({ accordion: false });
});
