import { Queue, BuildQueue } from '/imports/api/queue/collection';

Queue.startJobServer((err, succ) => {
  if (succ) {
    console.log('Queue server started.');
  } else {
    console.log('Failed to start queue server');
  }
});

BuildQueue.startJobServer((err, succ) => {
  if (succ) {
    console.log('BuildQueue server started.');
  } else {
    console.log('Failed to start queue server');
  }
});
