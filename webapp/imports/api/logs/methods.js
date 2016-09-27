import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

import Logs from '/imports/api/logs/collection';

Meteor.methods({
  'logs:job'(job) { // eslint-disable-line meteor/audit-argument-checks
    if (job) {
      const logs = Logs.find({ _jobId: job._id }, { fields: { raw: 0 } }).fetch();
      const grouped = _.groupBy(logs, '_nodeId');
      return grouped;
    }
    return { undefined: [] };
  },
});
