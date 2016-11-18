import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

import { fixJobQueueHeight } from '/imports/ui/utils';
import './new.html';

Template.new.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
  'click .d8-modal-trigger': () => {
    $('#d8-info-modal').openModal();
  },
});

Template.new.onRendered(function rendered() {
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
