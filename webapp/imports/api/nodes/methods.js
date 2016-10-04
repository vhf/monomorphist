import Future from 'fibers/future';
import Nodes from '/imports/api/nodes/collection';
import { _ } from 'meteor/underscore';

const https = require('https');
const fs = require('fs');
const glob = require('glob');
const ejs = require('ejs');
const childProcess = require('child_process');

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

const pinnedVersions = [
  '0.10.46',
  '4.4.0',
  '4.5.0',
  '6.6.0',
];

Meteor.methods({
  'nodes:fetchNodeVersions'() {
    if (this.connection !== null) return false; // make sure the client cannot call this
    const rLatestVersion = /node-v(\d+\.\d+\.\d+)-/m;

    const urls = [
      { name: 'latest-v0.10.x', url: 'https://nodejs.org/dist/latest-v0.10.x/' },
      { name: 'latest-v0.12.x', url: 'https://nodejs.org/dist/latest-v0.12.x/' },
      { name: 'latest-v4.x', url: 'https://nodejs.org/dist/latest-v4.x/' },
      { name: 'latest-v6.x', url: 'https://nodejs.org/dist/latest-v6.x/' },
      { name: 'dist', url: 'https://nodejs.org/dist/index.json' },
      { name: 'nightly', url: 'https://nodejs.org/download/nightly/index.json' },
    ];

    const futures = _.map(urls, ({ name, url }) => {
      const future = new Future();
      const onComplete = future.resolver();
      https.get(url, (response) => {
        response.setEncoding('utf8');
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          let body = chunks.join('');
          if (url.slice(-4) === 'json') {
            body = JSON.parse(body);
          }
          onComplete(null, { name, body });
        });
      }).on('error', (error) => {
        onComplete(error, null);
      });
      return future;
    });

    // wait for all requests to finish
    Future.wait(futures);

    const results = _.invoke(futures, 'get');

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
    if (this.connection !== null) return false; // make sure the client cannot call this
    // 1. fetch new node versions info from nodejs.org
    const { genericToExact, distDict, descendingNightlies } = Meteor.call('nodes:fetchNodeVersions');
    if (!(Object.keys(genericToExact).length && Object.keys(distDict).length && descendingNightlies.length)) {
      return false;
    }
    // 2. disable all versions
    Nodes.update({},
                 { $set: { enabled: false } },
                 { multi: 1 });
    // 3. put all "latest" flag to false
    Nodes.update({ latest: true },
                 { $set: { latest: false } },
                 { multi: 1 });
    // 4. insert and enable the "pinned" versions
    pinnedVersions.forEach(version => {
      if (!(version in distDict)) return;
      const versionInfo = distDict[version];
      const node = _.chain(versionInfo).omit('version').extend({
        enabled: true,
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
      // 6. enable the latest version of each major version
      const node = _
        .chain(versionInfo)
        .omit('version')
        .extend({
          latest: true,
          enabled: true,
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
        enabled: true,
        nightly: true,
      })
      .value();
    Nodes.update({ version: latestNightly.version },
                 { $set: node },
                 { upsert: true });
    return true;
  },
  'nodes:createDockerConfig'() {
    if (this.connection !== null) return false; // make sure the client cannot call this
    const distURL = 'https://nodejs.org/dist/v';
    const nightlyURL = 'https://nodejs.org/download/nightly/v';
    const urls = { distURL, nightlyURL };
    const nodes = Nodes.find(
                            { enabled: true },
                            { fields: { _id: 0, version: 1, hash: 1, nightly: 1 }, sort: { version: 1 } }
                          ).fetch();
    const data = { nodes };
    const composeTemplate = fs.readFileSync(`${root}/tpl-docker-compose.yml`).toString();
    const compose = ejs.compile(composeTemplate);
    fs.writeFileSync(`${root}/docker-compose.yml`, compose(data));

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
    nodes.forEach(node => {
      const content = dockerfile(_.extend(nodeDefaults, node, urls));
      fs.writeFileSync(`${root}/Dockerfile.${node.version}`, content);
    });
    return true;
  },
  'nodes:buildImages'() {
    if (this.connection !== null) return false; // make sure the client cannot call this
    const future = new Future();

    childProcess.exec(
      'docker-compose build',
      { cwd: root },
      (err, stdout, stderr) => future.return({ err, stdout, stderr })
    );

    const { err, stdout, stderr } = future.wait(future);
    let ret = true;
    if (err) {
      console.log(JSON.stringify({ err }));
      if (err && (err.killed || err.code === 1)) ret = false;
    }
    // this would be a good place to identify which nodes were successfully built
    // and enable them...
    if (stdout) console.log(JSON.stringify({ stdout }));
    if (stderr) console.log(JSON.stringify({ stderr }));
    return ret;
  },
  'nodes:imagesUpdate'() {
    if (this.connection !== null) return false; // make sure the client cannot call this
    console.log('Updating images!');
    if (Meteor.call('nodes:updateVersions') !== true) {
      console.log('updateVersions failed');
      return false;
    }
    console.log('updateVersions succeeded');
    if (Meteor.call('nodes:createDockerConfig') !== true) {
      console.log('createDockerConfig failed');
      return false;
    }
    console.log('createDockerConfig succeeded');
    if (Meteor.call('nodes:buildImages') !== true) {
      console.log('buildImages failed');
      return false;
    }
    console.log('buildImages succeeded');
    console.log('nodes:imagesUpdate succeeded!');
    return true;
  },
});
