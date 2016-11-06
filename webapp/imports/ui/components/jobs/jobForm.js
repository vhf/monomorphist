import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { AutoForm } from 'meteor/aldeed:autoform';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';

const { concurrency, timeout, maxContainersPerJob } = Meteor.settings.public.node;

const renderLivePreview = () => {
  const definition = $('textarea[name="fn.definition"]').val();
  const call = $('textarea[name="fn.call"]').val();
  const name = $('input[name="fn.name"]').val();

  Meteor.call('job:instrument', { definition, call, name }, (err, code) => {
    if (!err && code) {
      $('#instrumented').parent('div').show();
      $('#instrumented').html(code);
    }
  });
  const modifier = AutoForm.getFormValues('jobForm').updateDoc;
  const _publicId = FlowRouter.getParam('_publicId');
  const job = Jobs.findOne({ _publicId });
  if (job) {
    Jobs.update(job._id, modifier);
  }
};

const codeMirror = () => {
  const $definition = $("textarea[data-schema-key='fn.definition']");
  const $call = $("textarea[data-schema-key='fn.call']");

  const definitionEditor = CodeMirror.fromTextArea($definition.get(0), {
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    theme: 'xq-light',
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  const callEditor = CodeMirror.fromTextArea($call.get(0), {
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    theme: 'xq-light',
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  definitionEditor.on('inputRead', (cMirror) => {
    $definition.val(cMirror.getValue());
    renderLivePreview();
  });

  callEditor.on('inputRead', (cMirror) => {
    const val = cMirror.getValue();
    $call.val(val);
    renderLivePreview();
  });
};

Template.jobForm.onCreated(function onCreated() {
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('job', _publicId);
    this.subscribe('nodes');
    this.subscribe('logs', _publicId);
  });
});

Template.jobForm.helpers({
  job() {
    const _publicId = FlowRouter.getParam('_publicId');
    const job = Jobs.findOne({ _publicId });
    return job;
  },
  nodes() {
    return Nodes.find({ enabled: true }, { sort: { version: 1 } }).fetch();
  },
  nodeEnabled(job, node) {
    return job ? job.nodes && job.nodes.length && job.nodes.indexOf(node) !== -1 : false;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.version : '';
  },
  formInvalid(job) {
    if (job && job.fn) {
      return !(job.fn.definition && job.fn.call && job.fn.name);
    }
    return true;
  },
  Jobs() {
    return Jobs;
  },
  estimate() {
    const ready = ReactiveMethod.call('jobs:ready');
    const running = ReactiveMethod.call('jobs:running');
    const time = (((ready + running) / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
  maxContainersPerJob() {
    return maxContainersPerJob;
  },
  length(xs) {
    return (xs && xs.length) || 0;
  },
});

Template.jobForm.events({
  'change .node-checkbox': event => {
    const id = $(event.target).attr('id');
    const checked = $(event.target).is(':checked');
    Meteor.call(checked ? 'job:addNode' : 'job:removeNode', FlowRouter.getParam('_publicId'), id);
  },
  'keyup input[name="fn.name"]': renderLivePreview,
  'click #run': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('job:submit', FlowRouter.getParam('_publicId'));
  },
  'click .node-modal-trigger': (event) => {
    event.preventDefault();
    const version = $(event.target).text().trim();
    $('#node-versions-table tr').removeClass('selected-version');
    $(`#node-versions-table tr[data-version="${version}"]`).addClass('selected-version');
    $('#node-info-modal').openModal();
  },
});

Template.jobForm.onRendered(() => {
  codeMirror();
  renderLivePreview();
});
