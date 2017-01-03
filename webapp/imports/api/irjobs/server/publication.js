import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import IRJobs from '../collection';

Meteor.publish('irjob', _publicId => {
  check(_publicId, String);
  return IRJobs.find({ _publicId });
});

Meteor.publish('irjobs', () => IRJobs.find({ status: { $not: { $eq: 'editing' } }, listed: true }));
Meteor.publish('unlistedIRJobs', () => IRJobs.find({ status: 'done', listed: false }, { fields: { _publicId: 0, fn: 0 } }));
Meteor.publish('irjobsAdmin', function irjobsAdmin() {
  if (this.userId) {
    return IRJobs.find({ status: { $not: { $eq: 'editing' } } });
  }
  return false;
});

IRJobs.allow({
  update: (userId, doc) => doc.status === 'editing',
  remove: (userId, doc) => !('updatedAt' in doc),
});
