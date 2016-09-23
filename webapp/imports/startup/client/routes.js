import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// import '../../ui/layouts/layout.js';
// import '../../ui/pages/root-redirector.js';
import '../../ui/pages/index.js';

// Below here are the route definitions

FlowRouter.route('/', {
  name: 'index',
  action() {
    FlowRouter.go(`/job/${Random.id()}`);
  },
});

FlowRouter.route('/job/:_id', {
  name: 'job',
  action({ _id }) {
    Meteor.call('job:new', { _id }, () => BlazeLayout.render('layout', { main: 'index' }));
  },
});
