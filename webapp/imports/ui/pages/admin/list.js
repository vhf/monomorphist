import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import IRJobs from '/imports/api/irjobs/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

Template.adminList.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('jobsAdmin');
    this.subscribe('irjobsAdmin');
  });
});

Template.adminList.helpers({
  jobs() {
    const jobs = Jobs.find().fetch();
    return jobs;
  },
  irjobs() {
    const jobs = IRJobs.find().fetch();
    return jobs;
  },
  collapsible() {
    $('.collapsible').collapsible({
      accordion: false,
    });
  },
  shortId(id) {
    if (id) return `#${id.slice(0, 8)}`;
    return '<none>';
  },
});

Template.adminList.events({});

Template.adminList.onRendered(function rendered() {
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
