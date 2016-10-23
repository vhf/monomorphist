import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import Logs from '/imports/api/logs/collection';

const parseDockerBuildLogs = lines => lines.reduce((prev = [], curr, i) => {
  if (i > 0) {
    if (i === lines.length - 1) {
      const tmp = _.compact(curr.split('\n'));
      const step = `Step ${tmp[0]}`;
      const body = tmp.slice(1, tmp.length - 2).join('\n');
      const end = tmp.slice(tmp.length - 2);
      prev.push({ step, body });
      prev.push({ step: end[end.length - 1], body: end.join('\n') });
      return prev;
    }

    const tmp = _.compact(curr.split('\n'));
    const step = `Step ${tmp[0]}`;
    const body = tmp.slice(1).join('\n');
    prev.push({ step, body });
    return prev;
  }
  return prev;
}, []);

Template.adminActions.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('refreshLogs');
  });
});

Template.adminActions.helpers({
  logs() {
    const logs = Logs.find().fetch();
    logs.forEach(_log => {
      const log = _log;
      if (log.stdout && log.stdout.indexOf('\nStep ')) {
        const lines = log.stdout.split('\nStep ');
        log.steps = parseDockerBuildLogs(lines);
      }
    });
    return logs;
  },
  isoTime(time) {
    return new Date(time).toISOString();
  },
  collapsible() {
    $('.collapsible').collapsible({
      accordion: false,
    });
  },
});

Template.adminActions.events({
  'click #rebuild-nodes': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('nodes:refresh');
  },
  'click #rebuild-v8': event => {
    $(event.target).prop('disabled', true);
    Meteor.call('v8:refresh');
  },
  'click #clear': () => {
    Meteor.call('logs:clearBuilds');
  },
});
