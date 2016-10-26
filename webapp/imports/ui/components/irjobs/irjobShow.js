import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';

const codeMirror = (code) => {
  const $code = $('textarea#code');

  const codeEditor = CodeMirror.fromTextArea($code.get(0), {
    readOnly: true,
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
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
  job() {
    const job = Template.instance().job.get();
    return job;
  },
});

Template.irjobShow.onRendered(function onRendered() {
  const wait = Meteor.setInterval(() => {
    const job = this.job.get();
    if (job && job.code) {
      codeMirror(job.code);
      Meteor.clearInterval(wait);
    }
  }, 50);
});
