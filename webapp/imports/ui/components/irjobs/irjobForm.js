import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CodeMirror } from 'meteor/perak:codemirror';
import { AutoForm } from 'meteor/aldeed:autoform';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
import { $ } from 'meteor/jquery';

import IRJobs from '/imports/api/irjobs/collection';
import V8 from '/imports/api/v8/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

const { concurrency, timeout } = Meteor.settings.public.v8;

const codeMirror = () => {
  const $code = $("textarea[data-schema-key='code']");

  if ($code.length) {
    const codeEditor = CodeMirror.fromTextArea($code.get(0), {
      lineNumbers: true,
      mode: 'javascript',
      tabSize: 2,
      theme: 'xq-light',
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
    return true;
  }
  return false;
};

Template.irjobForm.onCreated(function onCreated() {
  this.job = new ReactiveVar();
  this.autorun(() => {
    const _publicId = FlowRouter.getParam('_publicId');
    this.subscribe('irjob', _publicId);
    this.subscribe('irlogs', _publicId);
    this.subscribe('v8');
    if (this.subscriptionsReady()) {
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
    let v8s = V8.find({ enabled: true }, { sort: { tag: 1 } }).fetch();
    v8s = _.chain(v8s).map(_v8 => {
      const v8 = _v8;
      v8.naturalTag = v8.tag.split('.').reduce((sum, part, idx) => sum + (Math.pow(1000, 4 - idx) * parseInt(part, 10)), 0);
      return v8;
    }).sortBy('naturalTag').value();
    return v8s;
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

Template.irjobForm.onRendered(function rendered() {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange();
    const wait = Meteor.setInterval(() => {
      if (this.subscriptionsReady()) {
        if (!$("textarea[data-schema-key='code']").next('div').hasClass('CodeMirror')) {
          if (codeMirror()) {
            fixJobQueueHeight();
            Meteor.clearInterval(wait);
          }
        }
      }
    }, 87);
  });
});
