import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Jobs from '../collection';

Meteor.publish('job', _publicId => {
  check(_publicId, String);
  return Jobs.find({ _publicId });
});

Meteor.publish('detail', _id => {
  check(_id, String);
  return Jobs.find({ _id }, { fields: { _publicId: 0 } });
});

Meteor.publish('jobs', () => Jobs.find({ status: { $not: { $eq: 'editing' } }, listed: true }));
Meteor.publish('unlistedJobs', () => Jobs.find({ status: { $not: { $eq: 'editing' } }, listed: false }, { fields: { _publicId: 0, fn: 0 } }));
Meteor.publish('jobsAdmin', function irjobsAdmin() {
  if (this.userId) {
    return Jobs.find({ status: { $not: { $eq: 'editing' } } }, { sort: { createdAt: -1 }, limit: 100 });
  }
  return false;
});

Jobs.allow({
  update: (userId, doc) => doc.status === 'editing',
  remove: (userId, doc) => !('updatedAt' in doc),
});
