import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Job } from 'meteor/vsivsi:job-collection';

import { BuildQueue } from '/imports/api/queue/collection';

SyncedCron.config({
  log: true,
  utc: true,
  collectionTTL: 172800,
});

SyncedCron.add({
  name: 'nodesRefresh',
  schedule: parser => parser.text('at 00:05 am'),
  job: () => {
    const queuedJob = new Job(BuildQueue, 'refresh-nodes', {});
    queuedJob.priority('normal').save();
  },
});

SyncedCron.add({
  name: 'v8Refresh',
  schedule: parser => parser.text('at 00:55 am'),
  job: () => {
    const queuedJob = new Job(BuildQueue, 'refresh-v8s', {});
    queuedJob.priority('normal').save();
  },
});

SyncedCron.start();
