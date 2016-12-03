import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

const codeMirror = (code) => {
  $('.CodeMirror').remove();
  const $code = $('textarea#code');
  const codeEditor = CodeMirror.fromTextArea($code.get(0), {
    readOnly: true,
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    theme: 'xq-light',
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });
  codeEditor.setValue(code);
};

Template.irjobShow.onCreated(function onCreated() {
  this.job = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
    if (this.subscriptionsReady()) {
      this.job.set(IRJobs.findOne({ _publicId }));
    }
  });
});

Template.irjobShow.helpers({
  shortId() {
    return FlowRouter.getParam('_publicId').slice(0, 8);
  },
  job() {
    const job = Template.instance().job.get();
    return job;
  },
});

Template.irjobShow.onRendered(function onRendered() {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange();
    const wait = Meteor.setInterval(() => {
      if (this.subscriptionsReady()) {
        fixJobQueueHeight();
        const job = this.job.get();
        if (job && job.code) {
          codeMirror(job.code);
          Meteor.clearInterval(wait);
        }
      }
    }, 87);
  });
});
