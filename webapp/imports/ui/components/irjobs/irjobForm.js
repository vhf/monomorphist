import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { AutoForm } from 'meteor/aldeed:autoform';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';
import V8 from '/imports/api/v8/collection';

const { concurrency, timeout } = Meteor.settings.public.v8;

const codeMirror = () => {
  const $code = $("textarea[data-schema-key='code']");

  const codeEditor = CodeMirror.fromTextArea($code.get(0), {
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  const _publicId = FlowRouter.getParam('_publicId');

  codeEditor.on('inputRead', (cMirror) => {
    $code.val(cMirror.getValue());
    const modifier = AutoForm.getFormValues('irjobForm').updateDoc;
    const irjob = IRJobs.findOne({ _publicId });
    if (irjob) {
      IRJobs.update(irjob._id, modifier);
    }
  });
};

Template.irjobForm.onCreated(function onCreated() {
  this.v8s = new ReactiveVar();
  this.job = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
    this.subscribe('irlogs', _publicId);
    this.subscribe('v8');
    if (this.subscriptionsReady()) {
      this.v8s.set(V8.find({}, { sort: { tag: 1 } }).fetch());
      this.job.set(IRJobs.findOne({ _publicId }));
    }
  });
});

Template.irjobForm.helpers({
  job() {
    const job = Template.instance().job.get();
    return job;
  },
  v8ColA() {
    const v8s = Template.instance().v8s.get();
    if (!v8s || !v8s.length) {
      return [];
    }
    return v8s.slice(0, Math.ceil(v8s.length / 2));
  },
  v8ColB() {
    const v8s = Template.instance().v8s.get();
    if (!v8s || !v8s.length) {
      return [];
    }
    return v8s.slice(Math.ceil(v8s.length / 2));
  },
  formInvalid(job) {
    if (job && ('_v8Id' in job) && job._v8Id && ('code' in job) && job.code) {
      return false;
    }
    return true;
  },
  IRJobs() {
    return IRJobs;
  },
  estimate() {
    const ready = ReactiveMethod.call('irjobs:ready');
    const running = ReactiveMethod.call('irjobs:running');
    const time = (((ready + running) / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
});

Template.irjobForm.events({
  'change .v8-radio': event => {
    const _v8Id = $(event.target).attr('id');
    const job = Template.instance().job.get();
    if (job) {
      IRJobs.update(job._id, { $set: { _v8Id } });
    }
  },
  'click #run': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('irjob:submit', FlowRouter.getParam('_publicId'));
    $('body').scrollTop(0);
  },
  'click .d8-modal-trigger': (event) => {
    event.preventDefault();
    const version = $(event.target).closest('.d8-modal-trigger').data('id');
    $('#d8-versions-table tr').removeClass('selected-version');
    $(`#d8-versions-table tr[data-version="${version}"]`).addClass('selected-version');
    $('#d8-info-modal').openModal();
  },
});

Template.irjobForm.onRendered(() => {
  codeMirror();
});
