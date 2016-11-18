import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { fixJobQueueHeight } from '/imports/ui/utils';

Template.home.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
  'click .d8-modal-trigger': () => {
    $('#d8-info-modal').openModal();
  },
});

Template.home.onRendered(function rendered() {
  $('#title').fitText(0.676);
  $('.subtitle').fitText(2.4);
});


Template.home.onRendered(function rendered() {
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
