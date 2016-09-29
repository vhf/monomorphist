import Queue from '/imports/api/queue/collection';

Queue.startJobServer((err, succ) => {
  if (succ) {
    console.log('Queue server started.');
  } else {
    console.log('Failed to start queue server');
  }
});
