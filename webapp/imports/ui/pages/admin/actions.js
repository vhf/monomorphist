import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import Logs from '/imports/api/logs/collection';

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
      try {
        log.message = JSON.parse(log.message);
        log.message.parsed = true;
        if ('stdout' in log.message && log.message.stdout.indexOf('\nStep ')) {
          log.message.title = 'Docker log';
          const split = log.message.stdout.split('\nStep ');
          log.message.steps = split.reduce((prev = [], curr, i) => {
            if (i > 0) {
              if (i === split.length - 1) {
                const tmp = _.compact(curr.split('\n'));
                const title = `Step ${tmp[0]}`;
                const body = tmp.slice(1, tmp.length - 2).join('\n');
                const end = tmp.slice(tmp.length - 2);
                prev.push({ title, body });
                prev.push({ title: end[end.length - 1], body: end.join('\n') });
                return prev;
              }

              const tmp = _.compact(curr.split('\n'));
              const title = `Step ${tmp[0]}`;
              const body = tmp.slice(1).join('\n');
              prev.push({ title, body });
              return prev;
            }
            return prev;
          }, []);
          log.message.steps = log.message.steps.concat(log.message.stderr.split('\n'));
          log.message.steps.push(JSON.stringify(log.message.err));
        }
      } catch (e) {
        //
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
