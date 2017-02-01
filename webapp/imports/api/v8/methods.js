import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';
import { Job } from 'meteor/vsivsi:job-collection';

import Logs from '/imports/api/logs/collection';
import V8 from '/imports/api/v8/collection';
import { BuildQueue, Queue } from '/imports/api/queue/collection';

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
  const parsed = parse(request.content).slice(1);
  const tags = parsed
    .filter(([, , chromeVersion = false]) => chromeVersion);
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
      Logs.insert({
        type: 'refresh',
        queue: 'build-v8',
        title: `Failed to find V8 version for chrome ${chromeVersion}`,
        message: `chromeVersion: "${chromeVersion}"`,
        miscJSON: JSON.stringify(e),
      });
    }
  }
  return out;
};

const nodeTagList = () => {
  let request = null;
  try {
    request = HTTP.get('https://nodejs.org/dist/index.json');
  } catch (e) {
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'Failed to retrieve node index',
      miscJSON: JSON.stringify(e),
    });
    return [];
  }
  if (!('content' in request) || !request.content) {
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
  'v8:validateBuilds'() {
    if (!this.userId) return;
    if (!isAllowed(this)) return;
    const queuedJob = new Job(Queue, 'validate-v8s', {});
    queuedJob.priority('normal').save();
  },
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

    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'Chrome tags from history',
      miscJSON: JSON.stringify(history),
    });
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'Chrome tags from current (/all)',
      miscJSON: JSON.stringify(current),
    });

    const chromeTags = _
      .chain(history)
      .concat(current)
      .map(tag => v8FromChromeVersion(tag))
      .value();

    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'chromeTags',
      message: chromeTags.map(o => JSON.stringify(o)).join('\n'),
    });

    const index = _
      .chain(nodeTagList())
      .concat(chromeTags)
      .map(_group => {
        const group = _group;
        const [major, minor, branch, patch] = group.tag.split('.');
        if (patch === '0') {
          group.tag = [major, minor, branch].join('.');
        }
        return group;
      })
      .groupBy('tag')
      .values()
      .value();

    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'index',
      message: index.map(o => JSON.stringify(o)).join('\n'),
    });

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

    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'merged',
      message: merged.map(o => JSON.stringify(o)).join('\n'),
    });

    const { repo } = Meteor.settings.public.v8;
    const tags = Meteor.call('docker:imageTags', repo);


    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'd8 tags found on docker hub',
      message: tags.map(o => JSON.stringify(o)).join('\n'),
    });

    const objs = merged.map(_obj => {
      const obj = _obj;
      obj.gnCompatible = true;
      if (obj.tag !== 'master') {
        const shortV = obj.tag.slice(0, obj.tag.lastIndexOf('.'));
        try {
          obj.gnCompatible = semver.gt(shortV, '5.4.500');
        } catch (e) {
          //
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

      obj.rebuild = !tagExists || isMaster || isForced;
      V8.upsert({ tag: obj.tag }, { $set: obj });
      return obj;
    });
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: 'upserted',
      message: objs.map(o => JSON.stringify(o)).join('\n'),
    });
    return true;
  },
});
