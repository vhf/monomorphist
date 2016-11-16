import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
  name: 'home',
  action() {
    BlazeLayout.render('layout', { main: 'home' });
  },
});

FlowRouter.route('/new', {
  name: 'create',
  action() {
    BlazeLayout.render('layout', { main: 'new' });
  },
});

FlowRouter.route('/admin', {
  name: 'adminActions',
  action() {
    BlazeLayout.render('layout', { main: 'adminActions' });
  },
});

FlowRouter.route('/job/new', {
  name: 'jobCreate',
  triggersEnter: [(context, redirect) => {
    redirect(`/job/${Random.id()}`);
  }],
});

FlowRouter.route('/job/:_publicId', {
  name: 'jobHome',
  action({ _publicId }) {
    Meteor.call('job:getOrCreate', { _publicId }, () => BlazeLayout.render('layout', { main: 'jobHome' }));
  },
});

FlowRouter.route('/ir/new', {
  name: 'irjobCreate',
  triggersEnter: [(context, redirect) => {
    redirect(`/ir/${Random.id()}`);
  }],
});

FlowRouter.route('/ir', {
  name: 'irjobCreateRoot',
  triggersEnter: [(context, redirect) => {
    redirect(`/ir/${Random.id()}`);
  }],
});

FlowRouter.route('/irhydra', {
  name: 'irhydraRedirect',
  action() {
    const root = process.env.ROOT_URL || 'localhost:3000';
    const path = FlowRouter.current().path;
    document.location.assign(`${root}/${path}`);
    window.location.reload();
    return;
  },
});

FlowRouter.route('/ir/:_publicId', {
  name: 'irjobHome',
  action({ _publicId }) {
    Meteor.call('irjob:getOrCreate', { _publicId }, () => BlazeLayout.render('layout', { main: 'irjobHome' }));
  },
});
