import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

Template.adminActions.events({
  'click #rebuild': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('nodes:imagesUpdate');
  },
});
