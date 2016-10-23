import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveMethod } from 'meteor/simple:reactive-method';

Template.irjobShow.onCreated(function onCreated() {
  this.subscribe('queue');
});

Template.irjobShow.helpers({
  code() {
    return '';
  },
});
