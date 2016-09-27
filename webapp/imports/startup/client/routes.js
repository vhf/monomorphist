import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import '../../ui/pages/index.js';

FlowRouter.route('/', {
  name: 'index',
  action() {
    FlowRouter.go(`/job/${Random.id()}`);
  },
});

FlowRouter.route('/job/:_publicId', {
  name: 'job',
  action({ _publicId }) {
    Meteor.call('job:getOrCreate', { _publicId }, () => BlazeLayout.render('layout', { main: 'index' }));
  },
});
