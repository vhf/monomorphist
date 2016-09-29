import Future from 'fibers/future';
import Nodes from '/imports/api/nodes/collection';
import { _ } from 'meteor/underscore';

const https = require('https');

const pinnedVersions = [
  '0.10.46',
  '4.4.0',
  '4.5.0',
  '6.6.0',
];

const logUpdate = (err, mod, str) => {
  if (err) {
    console.log(`${str} errored: ${err}`);
  } else {
    console.log(`${str} modified ${mod} docs`);
  }
};

const logUpsert = (err, mod, selector, data) => {
  if (err) {
    console.log(`upsert ${JSON.stringify(selector)} errored: ${err}`);
  }
  if (mod) {
    console.log(`upsert modified ${mod} docs, ${JSON.stringify(selector)} - ${JSON.stringify(data)}`);
  }
};

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
        o.version = o.version[0] === 'v' ? o.version.substr(1) : o.version;
        return o;
      })
      .sortBy(obj => {
        if (!('version' in obj)) {
          return false;
        }
        const sortMatch = obj.version.match(/v(\d+)\.[\d+]\.[\d+]-nightly2(\d{7})/);
        if (sortMatch) {
          const [, v, sort] = sortMatch;
          return parseInt(`${v}${sort}`, 10);
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
      return;
    }
    // 2. disable all versions
    Nodes.update({},
                 { $set: { enabled: false } },
                 { multi: 1 },
                 (err, mod) => logUpdate(err, mod, 'disabling all versions'));
    // 3. put all "latest" flag to false
    Nodes.update({ latest: true },
                 { $set: { latest: false } },
                 { multi: 1 },
                 (err, mod) => logUpdate(err, mod, 'resetting "latest" flag'));
    // 4. insert and enable the "pinned" versions
    pinnedVersions.forEach(version => {
      if (!(version in distDict)) return;
      const versionInfo = distDict[version];
      const node = _.chain(versionInfo).omit('version').extend({
        enabled: true,
      }).value();
      Nodes.update({ version },
                   { $set: node },
                   { upsert: true },
                   (err, mod) => logUpsert(err, mod, { version }, node));
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
      if (versionInfo.lts !== false) {
        node.enabledByDefault = true;
      }
      Nodes.update({ version: version.exact },
                   { $set: node },
                   { upsert: true },
                   (err, mod) => logUpsert(err, mod, { version: version.exact }, node));
    });
    // 8. upsert the latest nightly build
    const latestNightly = descendingNightlies[0];
    const node = _
      .chain(latestNightly)
      .omit('version')
      .extend({
        nightly: true,
        enabled: true,
      })
      .value();
    Nodes.update({ version: latestNightly.version },
                 { $set: node },
                 { upsert: true },
                 (err, mod) => logUpsert(err, mod, { version: latestNightly.version }, node));
    return true;
  },
});
