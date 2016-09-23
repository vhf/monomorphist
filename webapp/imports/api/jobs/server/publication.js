import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Jobs from '../collection';

Meteor.publish('job', _id => {
  check(_id, String);
  return Jobs.find(_id);
});

Jobs.allow({
  update: () => true,
});
