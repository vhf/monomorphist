import { HTTP } from 'meteor/http';
import { _ } from 'meteor/underscore';
import { Job } from 'meteor/vsivsi:job-collection';

import Nodes from '/imports/api/nodes/collection';
import { BuildQueue } from '/imports/api/queue/collection';

const fs = require('fs');
const glob = require('glob');
const ejs = require('ejs');

const isAllowed = (ctx) => ctx.userId || ctx.connection === null;

const root = (() => {
  const cwd = process.cwd().split('.meteor')[0];
  try {
    if (fs.statSync(`${cwd}/mononodes`)) {
      return `${cwd}/mononodes`;
    }
  } catch (e) {
    //
  }
  return '/mononodes';
})();

const pinnedVersions = [];

Meteor.methods({
  'nodes:refresh'() {
    if (!isAllowed(this)) return;
    const queuedJob = new Job(BuildQueue, 'refresh-nodes', {});
    queuedJob.priority('normal').save();
  },
  'nodes:fetchNodeVersions'() {
    // anonymous remote users cannot call this method
    if (!isAllowed(this)) return false;
    const rLatestVersion = /node-v(\d+\.\d+\.\d+)-/m;

    const urls = [
      { name: 'latest-v0.10.x', url: 'https://nodejs.org/dist/latest-v0.10.x/' },
      { name: 'latest-v0.12.x', url: 'https://nodejs.org/dist/latest-v0.12.x/' },
      { name: 'latest-v4.x', url: 'https://nodejs.org/dist/latest-v4.x/' },
      { name: 'latest-v6.x', url: 'https://nodejs.org/dist/latest-v6.x/' },
      { name: 'latest-v7.x', url: 'https://nodejs.org/dist/latest-v7.x/' },
      { name: 'dist', url: 'https://nodejs.org/dist/index.json' },
      { name: 'nightly', url: 'https://nodejs.org/download/nightly/index.json' },
    ];

    const results = _.map(urls, ({ name, url }) => {
      const response = HTTP.get(url);
      const body = (url.slice(-4) === 'json') ?
                    JSON.parse(response.content)
                    : response.content;
      return { name, body };
    });

    const genericToExact = _
      .chain(results)
      .filter(o => o.name.slice(0, 6) === 'latest')
      .map(({ name, body }) => {
        const versionMatched = body.match(rLatestVersion);
        if (versionMatched) {
          const [, exact] = versionMatched;
          return { name, exact };
        }
        return false;
      })
      .compact()
      .value();

    const distDict = _
      .chain(results)
      .findWhere({ name: 'dist' })
      .result('body')
      .map((_o) => {
        const o = _.omit(_o, 'files');
        o.version = o.version[0] === 'v' ? o.version.substr(1) : o.version;
        return o;
      })
      .indexBy('version')
      .value();

    const descendingNightlies = _
      .chain(results)
      .findWhere({ name: 'nightly' })
      .result('body')
      .map(_o => {
        const o = _.omit(_o, 'files');
        const shortMatch = o.version.match(/v(\d+\.\d+\.\d+-nightly2\d{7})(.*)/);
        if (shortMatch) {
          const [, short, hash] = shortMatch;
          o.version = short;
          o.hash = hash;
        }
        return o;
      })
      .sortBy(obj => {
        if (!('version' in obj)) {
          return false;
        }
        const sortMatch = obj.version.match(/(\d+)\.\d+\.\d+-nightly2(\d{7})/);
        if (sortMatch) {
          const [, v, sort] = sortMatch;
          return `${v}${sort}`;
        }
        return false;
      })
      .compact()
      .reverse()
      .value();

    return {
      genericToExact,
      distDict,
      descendingNightlies,
    };
  },
  'nodes:updateVersions'() {
    // anonymous remote users cannot call this method
    if (!isAllowed(this)) return false;
    // 1. fetch new node versions info from nodejs.org
    const { genericToExact, distDict, descendingNightlies } = Meteor.call('nodes:fetchNodeVersions');
    if (!(Object.keys(genericToExact).length && Object.keys(distDict).length && descendingNightlies.length)) {
      // TODO: handle error
      return false;
    }
    // 2. disable all versions
    Nodes.update({},
                 { $set: { enabled: false, toBuild: false } },
                 { multi: 1 });
    // 3. put all "latest" flag to false (separate step because it's an option flag)
    Nodes.update({ latest: true },
                 { $set: { latest: false } },
                 { multi: 1 });
    // 4. insert and build the "pinned" versions
    pinnedVersions.forEach(version => {
      if (!(version in distDict)) return;
      const versionInfo = distDict[version];
      const node = _.chain(versionInfo).omit('version').extend({
        toBuild: true,
      }).value();
      if (node.lts === false) {
        node.lts = ''; // '' is falsy, better than 'false'
      }
      Nodes.update({ version },
                   { $set: node },
                   { upsert: true });
    });
    // 5. add latest versions of each major release if they don't already exist
    genericToExact.forEach(version => {
      if (!(version.exact in distDict)) return;
      const versionInfo = distDict[version.exact];
      // 6. build the latest version of each major version
      const node = _
        .chain(versionInfo)
        .omit('version')
        .extend({
          latest: true,
          toBuild: true,
          enabledByDefault: false,
        })
        .value();
      node.date = new Date(node.date);
      // 7. enable by default the latest version of each LTS release
      if (node.lts === false) {
        node.lts = ''; // '' is falsy, better than 'false'
      } else {
        node.enabledByDefault = true;
      }
      Nodes.update({ version: version.exact },
                   { $set: node },
                   { upsert: true });
    });
    // 8. upsert the latest nightly build
    const latestNightly = descendingNightlies[0];
    const node = _
      .chain(latestNightly)
      .omit('version', 'lts')
      .extend({
        latest: true,
        toBuild: true,
        nightly: true,
      })
      .value();
    Nodes.update({ version: latestNightly.version },
                 { $set: node },
                 { upsert: true });
    return true;
  },
  'nodes:createDockerConfig'() {
    // anonymous remote users cannot call this method
    if (!isAllowed(this)) return false;
    const distURL = 'https://nodejs.org/dist/v';
    const nightlyURL = 'https://nodejs.org/download/nightly/v';
    const urls = { distURL, nightlyURL };
    const nodes = Nodes.find(
      { toBuild: true },
      {
        fields: {
          _id: 0,
          version: 1,
          hash: 1,
          nightly: 1,
        },
        sort: {
          version: 1,
        },
      }
    ).fetch();
    const { repo } = Meteor.settings.public.node;
    const tags = Meteor.call('docker:imageTags', repo);
    const tplData = nodes.map(_node => {
      const node = _node;
      node.__build = node.nightly || tags.indexOf(node.version) === -1;
      return node;
    });
    const composeTemplate = fs.readFileSync(`${root}/tpl-docker-compose.yml`).toString();
    const compose = ejs.compile(composeTemplate);
    fs.writeFileSync(`${root}/docker-compose.yml`, compose({ nodes: tplData, repo }));

    const dockerfileTemplate = fs.readFileSync(`${root}/tpl-Dockerfile`).toString();
    const dockerfile = ejs.compile(dockerfileTemplate);
    // ejs will crash if these properties aren't defined, and they are optional in our node collection
    const nodeDefaults = {
      hash: '',
      nightly: false,
    };
    // delete all previous Dockerfiles
    const existingDockerfiles = glob.sync(`${root}/Dockerfile.*`);
    existingDockerfiles.forEach(file => {
      fs.unlinkSync(file);
    });
    nodes.filter(node => node.__build).forEach(node => {
      const content = dockerfile(_.extend(nodeDefaults, node, urls));
      fs.writeFileSync(`${root}/Dockerfile.${node.version}`, content);
    });
    return true;
  },
  'nodes:test'() {
    const queuedJob = new Job(BuildQueue, 'refresh-nodes', {});
    queuedJob.priority('normal').save();
    return true;
  },
});
