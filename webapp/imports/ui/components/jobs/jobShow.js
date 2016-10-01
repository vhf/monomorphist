import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

Template.jobShow.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('queue');
    this.subscribe('nodes');
  });
});

Template.jobShow.onRendered(() => {
  Meteor.call('job:instrument', FlowRouter.getParam('_publicId'), (err, code) => {
    $('#instrumented').html(code);
  });
});
