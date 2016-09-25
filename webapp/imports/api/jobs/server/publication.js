import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Jobs from '../collection';

Meteor.publish('job', _id => {
  check(_id, String);
  return Jobs.find(_id);
});

Meteor.publish('jobs', () => Jobs.find({ status: 'done', unlisted: false }));

Jobs.allow({
  update: (userId, doc) => doc.status === 'editing',
});
