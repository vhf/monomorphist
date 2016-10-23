import { Template } from 'meteor/templating';

import V8 from '/imports/api/v8/collection';

Template.v8InfoModal.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('v8');
  });
});

Template.v8InfoModal.helpers({
  v8s() {
    const v8s = V8.find({}, { sort: { tag: 1 } }).fetch();
    v8s.forEach(_v8 => {
      const v8 = _v8;
      if (v8.nodeVersion) {
        const xs = v8.nodeVersion.split(', ');
        if (xs.length > 1) {
          v8.nodeVersion = [xs[0], xs[xs.length - 1]].join(' → ');
        }
      }
      if (v8.chromeVersion) {
        const xs = v8.chromeVersion.split(', ');
        if (xs.length > 1) {
          v8.chromeVersion = [xs[0], xs[xs.length - 1]].join(' → ');
        }
      }
    });
    return v8s;
  },
});
