import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';

SyncedCron.config({
  log: true,
  utc: true, // we want the job to run at 12:05AM GMT
  collectionTTL: 172800,
});

SyncedCron.add({
  name: 'imagesUpdate',
  schedule: parser => parser.text('at 00:05 am'),
  job: () => {
    console.log('scheduled nodes:imagesUpdate');
    Meteor.call('nodes:imagesUpdate');
  },
});

SyncedCron.start();
