import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import './new.html';

Template.new.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
  'click .d8-modal-trigger': () => {
    $('#d8-info-modal').openModal();
  },
});

Template.new.onRendered(() => {
});
