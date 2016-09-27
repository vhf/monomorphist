import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Jobs from '../collection';

Meteor.publish('job', _publicId => {
  check(_publicId, String);
  return Jobs.find({ _publicId });
});

Meteor.publish('jobs', () => Jobs.find({ status: 'done', listed: true }));
Meteor.publish('unlistedJobs', () => Jobs.find({ status: 'done', listed: false }, { fields: { _publicId: 0 } }));

Jobs.allow({
  update: (userId, doc) => doc.status === 'editing',
});
