import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

Template.home.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
  'click .d8-modal-trigger': () => {
    $('#d8-info-modal').openModal();
  },
});

Template.home.onRendered(() => {
  $('#title').fitText(0.663);
});
