import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { AutoForm } from 'meteor/aldeed:autoform';

import Jobs from '/imports/api/jobs/collection';
import Nodes from '/imports/api/nodes/collection';
import Logs from '/imports/api/logs/collection';

const refreshCode = (p) =>
  Meteor.call('job:instrument', p, (err, code) => {
    $('#instrumented').html(code);
  });

const save = () => {
  if (AutoForm.validateForm('formJob')) {
    $('#formJob').submit();
  }
};

Template.formJob.onCreated(function onCreated() {
  this.getJobId = () => FlowRouter.getParam('_id');

  this.autorun(() => {
    const _jobId = this.getJobId();
    this.subscribe('job', _jobId);
    this.subscribe('nodes');
    this.subscribe('logs', _jobId);
    refreshCode(_jobId);
  });
});

Template.formJob.helpers({
  job() {
    const instance = Template.instance();
    const _id = instance.getJobId();
    const job = Jobs.findOne({ _id });
    return job;
  },
  nodeVersion(_id) {
    const node = Nodes.findOne({ _id });
    return node ? node.packageVersion : '';
  },
  nodes() {
    return Nodes.find({ disabled: false }).fetch();
  },
  enabled(job, node) {
    return job ? job.nodes.indexOf(node) !== -1 : false;
  },
  Jobs(): Jobs {
    return Jobs;
  },
  editorOptions() {
    return {
      lineNumbers: true,
      mode: 'javascript',
    };
  },
  logsFrom(_nodeId) {
    const _jobId = Template.instance().getJobId();
    return Logs.find({ _jobId, _nodeId }).fetch();
  },
  execLogs() {
    const _jobId = Template.instance().getJobId();
    return Logs.find({ _jobId, host: { $exists: false } }).fetch();
  },
});

Template.formJob.events({
  'change .node-checkbox': event => {
    const id = $(event.target).attr('id');
    const checked = $(event.target).is(':checked');
    Meteor.call(checked ? 'job:addNode' : 'job:removeNode', Template.instance().getJobId(), id);
  },
  'keyup input[name="fn.name"]': _.throttle(() => refreshCode({
    definition: $('[name="fn.definition"]').val(),
    call: $('[name="fn.call"]').val(),
    name: $('[name="fn.name"]').val(),
  }), 251),
  'click #run': event => {
    // $(event.target).prop('disabled', true);
    Meteor.call('job:run', Template.instance().getJobId());
  },
});

Template.formJob.onRendered(() => {
  $('.collapsible').collapsible({
    accordion: false,
  });

  const selectors = [
    'textarea[name="fn.definition"]',
    'textarea[name="fn.call"]',
  ];

  selectors.forEach(selector => {
    const textarea = $(selector)[0];
    const editor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: 'javascript',
      tabSize: 2,
      indentWithTabs: false,
      inputStyle: 'contenteditable',
      value: $(textarea).val(),
      extraKeys: { Tab: false, 'Shift-Tab': false },
    });
    editor.doc.on('change', _.throttle(() => {
      $(textarea).val(editor.doc.getValue());
      const definition = $(editor.getTextArea()).attr('name').indexOf('definition') !== -1
                          ? editor.doc.getValue()
                          : $('textarea[name="fn.definition"]').val();
      const call = $(editor.getTextArea()).attr('name').indexOf('call') !== -1
                    ? editor.doc.getValue()
                    : $('textarea[name="fn.call"]').val();
      refreshCode({
        definition,
        call,
        name: $('input[name="fn.name"]').val(),
      });
      save();
    }, 251));
  });
});
