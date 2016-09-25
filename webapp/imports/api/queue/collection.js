import { JobCollection as jobCollection } from 'meteor/vsivsi:job-collection';

const Queue = jobCollection('myJobQueue');
// queue.allow({
//   // Grant full permission to any authenticated user
//   admin: (userId) => !!userId,
// });

export default Queue;
