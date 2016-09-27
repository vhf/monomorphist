import { Template } from 'meteor/templating';
import { ReactiveMethod } from 'meteor/simple:reactive-method';

const { concurrency, timeout } = Meteor.settings.public;

Template.footer.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('queue');
  });
});

Template.footer.helpers({
  totalJobsCount() {
    return ReactiveMethod.call('jobs:total');
  },
  doneJobsCount() {
    return ReactiveMethod.call('jobs:done');
  },
  killedJobsCount() {
    return ReactiveMethod.call('jobs:killed');
  },
  queueLength() {
    return ReactiveMethod.call('jobs:ready');
  },
  estimate() {
    const ready = ReactiveMethod.call('jobs:ready');
    const running = ReactiveMethod.call('jobs:running');
    const time = (((ready + running) / concurrency) * timeout) / 1000;
    const rounded = Math.round(time / 100) * 100;
    return rounded;
  },
});
