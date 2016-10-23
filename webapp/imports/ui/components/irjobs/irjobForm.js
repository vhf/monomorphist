import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';
import V8 from '/imports/api/v8/collection';

const { concurrency, timeout } = Meteor.settings.public.v8;

const codeMirror = () => {
  const $code = $("textarea[data-schema-key='code']");

  const definitionEditor = CodeMirror.fromTextArea($code.get(0), {
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  definitionEditor.on('inputRead', (cMirror) => {
    $code.val(cMirror.getValue());
  });
};

Template.irjobForm.onCreated(function onCreated() {
  this.v8s = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
    this.subscribe('irlogs', _publicId);
    this.subscribe('v8');
    if (this.subscriptionsReady()) {
      this.v8s.set(V8.find({ gnCompatible: true }, { sort: { tag: 1 } }).fetch());
    }
  });
});

Template.irjobForm.helpers({
  job() {
    const _publicId = FlowRouter.getParam('_publicId');
    const job = IRJobs.findOne({ _publicId });
    return job;
  },
  v8ColA() {
    const v8s = Template.instance().v8s.get();
    const length = v8s.length;
    return v8s.slice(0, Math.ceil(length / 2));
  },
  v8ColB() {
    const v8s = Template.instance().v8s.get();
    const length = v8s.length;
    return v8s.slice(Math.ceil(length / 2));
  },
  versionAndTag(_id) {
    const v8s = Template.instance().v8s.get();
    const v8 = _.findWhere(v8s, { _id });
    if (!v8) return '';
    if (v8.nodeVersion) {
      return `${v8.tag} (node v${v8.nodeVersion})`;
    }
    return `${v8.tag}`;
  },
  formInvalid(job) {
    return job && job.fn;
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
    const id = $(event.target).attr('id');
    console.log(id);
    // if (job) {
    //   Jobs.update(job._id, modifier);
    // }
  },
  'click #run': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('irjob:submit', FlowRouter.getParam('_publicId'));
  },
});

Template.irjobForm.onRendered(() => {
  codeMirror();
});
