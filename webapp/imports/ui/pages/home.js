import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

Template.home.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
});
