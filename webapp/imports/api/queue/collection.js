import { JobCollection as jobCollection } from 'meteor/vsivsi:job-collection';

const Queue = jobCollection('queue');

export default Queue;
