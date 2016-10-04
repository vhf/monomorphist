import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveMethod } from 'meteor/simple:reactive-method';

Template.jobShow.onCreated(function onCreated() {
  this.subscribe('queue');
  this.subscribe('nodes');
});

Template.jobShow.helpers({
  code() {
    return ReactiveMethod.call('job:instrument', FlowRouter.getParam('_publicId'));
  },
});
