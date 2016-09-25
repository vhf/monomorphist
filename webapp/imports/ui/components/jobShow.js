import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

Template.jobShow.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');
  this.autorun(() => {
    this.subscribe('queue');
    this.subscribe('nodes');
  });
});

Template.jobShow.helpers({});

Template.jobShow.onRendered(() => {
  Meteor.call('job:instrument', Template.instance().getJobId(), (err, code) => {
    $('#instrumented').html(code);
    console.log(code);
  });
});
