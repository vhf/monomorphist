import { Template } from 'meteor/templating';

import V8 from '/imports/api/v8/collection';

Template.v8InfoModal.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('v8');
  });
});

Template.v8InfoModal.helpers({
  v8s() {
    let v8s = V8.find({ enabled: true }, { sort: { tag: 1 } }).fetch();
    v8s = _.chain(v8s).map(_v8 => {
      const v8 = _v8;
      v8.naturalTag = v8.tag.split('.').reduce((sum, part, idx) => sum + (Math.pow(1000, 4 - idx) * parseInt(part, 10)), 0);
      return v8;
    }).sortBy('naturalTag').value();
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
