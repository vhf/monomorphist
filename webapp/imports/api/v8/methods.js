import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';
import { Job } from 'meteor/vsivsi:job-collection';

import V8 from '/imports/api/v8/collection';
import { BuildQueue } from '/imports/api/queue/collection';

const _ = require('lodash');
const parse = require('csv-parse/lib/sync');
const ejs = require('ejs');
const fs = require('fs');
const glob = require('glob');
const semver = require('semver');

const isAllowed = (ctx) => ctx.userId || ctx.connection === null;

const root = (() => {
  const cwd = process.cwd().split('.meteor')[0];
  try {
    if (fs.statSync(`${cwd}/monod8`)) {
      return `${cwd}/monod8`;
    }
  } catch (e) {
    //
  }
  return '/monod8';
})();

const dockerfileTemplateGN = fs.readFileSync(`${root}/tpl-Dockerfile-gn-ninja`).toString();
const dockerfileGN = ejs.compile(dockerfileTemplateGN);

const dockerfileTemplateGYP = fs.readFileSync(`${root}/tpl-Dockerfile-gyp-make`).toString();
const dockerfileGYP = ejs.compile(dockerfileTemplateGYP);

const chromeTagList = url => {
  const request = HTTP.get(url);
  if (!request.content) {
    return [];
  }
  const parsed = parse(request.content);
  const tags = parsed
    .filter(([, channel = false, chromeVersion = false]) =>
      channel === 'stable' && chromeVersion);
  return tags;
};

const v8FromChromeVersion = ([, , chromeVersion, , , , , , , , tag = false]) => {
  const out = {
    chromeVersion,
    tag,
  };
  if (!tag || tag === 'N/A') {
    try {
      const request = HTTP.get(`https://omahaproxy.appspot.com/v8.json?version=${chromeVersion}`);
      if (!request.content) {
        return [];
      }
      const o = JSON.parse(request.content);
      if (o && o.v8_version) {
        out.tag = o.v8_version;
      }
    } catch (e) {
      console.log(`V8 version for chrome ${chromeVersion} failed: ${e}`);
    }
  }
  return out;
};

const nodeTagList = () => {
  const request = HTTP.get('https://nodejs.org/dist/index.json');
  if (!request.content) {
    return [];
  }
  const xs = JSON.parse(request.content);
  const validBuilds = xs
    .map(({ version, v8 }) => ({ nodeVersion: version.slice(1), tag: v8 }))
    .filter(({ tag }) => parseInt(tag[0], 10) >= 4);
  return validBuilds;
};

const merger = (objValue, srcValue, key) => {
  if (
    ['chromeVersion', 'nodeVersion'].indexOf(key) !== -1 &&
    objValue &&
    srcValue &&
    objValue !== srcValue) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
    return [srcValue, objValue];
  }
  return objValue;
};

Meteor.methods({
  'v8:refresh'() {
    if (!isAllowed(this)) return;
    const queuedJob = new Job(BuildQueue, 'refresh-v8s', {});
    queuedJob.priority('normal').save();
  },
  'v8:createDockerfile'(_v8) {
    check(_v8, Object);
    const v8 = _.defaults(_v8, { gnCompatible: true, nodeVersion: '', chromeVersion: '' });
    const content = (v8.gnCompatible === true) ? dockerfileGN(v8) : dockerfileGYP(v8);
    fs.writeFileSync(`${root}/dockerfiles/Dockerfile.${v8.tag}`, content);
  },
  'v8:deleteDockerfiles'() {
    // anonymous remote users cannot call this method
    if (!isAllowed(this)) return false;
    // delete all previous Dockerfiles
    const existingDockerfiles = glob.sync(`${root}/dockerfiles/Dockerfile.*`);
    existingDockerfiles.forEach(file => {
      fs.unlinkSync(file);
    });
    return true;
  },
  'v8:refreshTags'(forced = []) {
    // anonymous remote users cannot call this method
    if (!isAllowed(this)) return false;
    const history = chromeTagList('https://omahaproxy.appspot.com/history');
    const current = chromeTagList('https://omahaproxy.appspot.com/all');

    const chromeTags = _
      .chain(history)
      .concat(current)
      .map(tag => v8FromChromeVersion(tag))
      .value();

    const index = _
      .chain(nodeTagList())
      .concat(chromeTags)
      .groupBy('tag')
      .values()
      .value();

    const merged = _
      .chain(index)
      .map(group => group.reduce((prev, val) => _.mergeWith(prev, val, merger)))
      .map(group => _.mapValues(group, val => (_.isArray(val) ?
        _
          .chain(val)
          .sort()
          .join(', ')
          .value()
        : val)))
      .concat([{ tag: 'master' }])
      .value();

    const { repo } = Meteor.settings.public.v8;
    const tags = Meteor.call('docker:imageTags', repo);

    merged.forEach(_obj => {
      const obj = _obj;
      if (obj.tag) {
        const shortV = obj.tag.slice(0, obj.tag.lastIndexOf('.'));
        try {
          obj.gnCompatible = semver.gt(shortV, '5.4.500');
        } catch (e) {
          obj.gnCompatible = true;
        }
      }
      obj.chromeVersion = obj.chromeVersion || '';
      obj.nodeVersion = obj.nodeVersion || '';
      const v8 = V8.findOne({ tag: obj.tag });
      // if doesn't exist or not explicitely disabled, enable
      obj.enabled = (!v8 || v8.enabled !== false);

      const isMaster = obj.tag === 'master';
      const isForced = forced.indexOf(obj.tag) !== -1;
      const tagExists = tags.indexOf(obj.tag) !== -1;
      console.log(obj);
      obj.rebuild = !tagExists || isMaster || isForced;
      V8.upsert({ tag: obj.tag }, { $set: obj });
    });
    return true;
  },
});
