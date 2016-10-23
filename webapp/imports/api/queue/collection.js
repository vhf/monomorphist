import { JobCollection as jobCollection } from 'meteor/vsivsi:job-collection';

const Queue = jobCollection('queue');
const BuildQueue = jobCollection('build-queue');

export { Queue, BuildQueue };
