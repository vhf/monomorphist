import { Meteor } from 'meteor/meteor';
import Queue from '../collection';

Meteor.publish('queue', () => Queue.find({}));

// Start the queue queue running
Queue.startJobServer((err, succ) => {
  if (succ) {
    console.log('Queue server started.');
  } else {
    console.log('Failed to start queue server');
  }
});
