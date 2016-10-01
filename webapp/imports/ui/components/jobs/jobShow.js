import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

Template.jobShow.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.autorun(() => {
    this.subscribe('queue');
    this.subscribe('nodes');
  });
});

Template.jobShow.onRendered(() => {
  Meteor.call('job:instrument', Template.instance().getPublicId(), (err, code) => {
    $('#instrumented').html(code);
  });
});
