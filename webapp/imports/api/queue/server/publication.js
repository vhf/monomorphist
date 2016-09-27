import { Meteor } from 'meteor/meteor';
import Queue from '../collection';

Meteor.publish('queue', () => Queue.find({}, { fields: { data: 0 } }));

// Run the job queue
Queue.startJobServer((err, succ) => {
  if (succ) {
    console.log('Queue server started.');
  } else {
    console.log('Failed to start queue server');
  }
});
