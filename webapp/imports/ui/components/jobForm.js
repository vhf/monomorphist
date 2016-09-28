import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { AutoForm } from 'meteor/aldeed:autoform';
import { $ } from 'meteor/jquery';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Queue from '/imports/api/queue/collection';

const { concurrency, timeout } = Meteor.settings.public;

const renderLivePreview = () => {
  const definition = $('textarea[name="fn.definition"]').val();
  const call = $('textarea[name="fn.call"]').val();
  const name = $('input[name="fn.name"]').val();
  const strict = $('input[name="fn.strict"]').is(':checked');

  Meteor.call('job:instrument', { definition, call, name, strict }, (err, code) => {
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
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  const callEditor = CodeMirror.fromTextArea($call.get(0), {
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  definitionEditor.on('keyup', (cMirror) => {
    $definition.val(cMirror.getValue());
    renderLivePreview();
  });

  callEditor.on('keyup', (cMirror) => {
    const val = cMirror.getValue();
    $call.val(val);
    // if (!$('input[name="fn.name"]').val()) {
    //   while (m = findValidIdentifierCall.exec(val)) {
    //     console.log(m[1], m[2]);
    //   }
    // }
    renderLivePreview();
  });
};

Template.jobForm.onCreated(function onCreated() {
  this.getPublicId = () => FlowRouter.getParam('_publicId');
  this.autorun(() => {
    const _publicId = this.getPublicId();
    this.subscribe('job', _publicId);
    this.subscribe('nodes');
    this.subscribe('logs', _publicId);
  });
});

Template.jobForm.helpers({
  job() {
    const _publicId = Template.instance().getPublicId();
    const job = Jobs.findOne({ _publicId });
    return job;
  },
  nodes() {
    return Nodes.find({ disabled: false }).fetch();
  },
  nodeEnabled(job, node) {
    return job ? job.nodes.indexOf(node) !== -1 : false;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.packageVersion : '';
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
    const jobs = Queue.find({ status: { $not: 'done' } }).count();
    const time = ((jobs / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
});

Template.jobForm.events({
  'change .node-checkbox': event => {
    const id = $(event.target).attr('id');
    const checked = $(event.target).is(':checked');
    Meteor.call(checked ? 'job:addNode' : 'job:removeNode', Template.instance().getPublicId(), id);
  },
  'keyup input[name="fn.name"]': renderLivePreview,
  'change input[name="fn.strict"]': renderLivePreview,
  'click #run': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('job:submit', Template.instance().getPublicId());
  },
});

Template.jobForm.onRendered(() => {
  codeMirror();
  renderLivePreview();
});
