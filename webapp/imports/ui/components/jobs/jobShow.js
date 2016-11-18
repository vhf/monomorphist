import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Jobs from '/imports/api/jobs/collection';
import { instrument } from '/imports/api/jobs/utils';
import { fixJobQueueHeight } from '/imports/ui/utils';

Template.jobShow.onCreated(function onCreated() {
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('queue');
    this.subscribe('nodes');
    this.subscribe('job', _publicId);
  });
});

Template.jobShow.helpers({
  shortId() {
    return FlowRouter.getParam('_publicId').slice(0, 8);
  },
  code() {
    const job = Jobs.findOne({ _publicId: FlowRouter.getParam('_publicId') });
    if (job) {
      const { definition, call, name } = job.fn;
      return instrument(definition, call, name);
    }
    return '';
  },
  editorOptions() {
    return {
      lineNumbers: true,
      readOnly: true,
      mode: 'javascript',
      tabSize: 2,
      theme: 'xq-light',
    };
  },
});

Template.jobShow.onRendered(function rendered() {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange();
    const wait = Meteor.setInterval(() => {
      if (this.subscriptionsReady()) {
        fixJobQueueHeight();
        Meteor.clearInterval(wait);
      }
    }, 87);
  });
});
