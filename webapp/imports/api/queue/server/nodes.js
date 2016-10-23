import Future from 'fibers/future';
import { Meteor } from 'meteor/meteor';
import { Job } from 'meteor/vsivsi:job-collection';

import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';
import { BuildQueue } from '/imports/api/queue/collection';

const fs = require('fs');
const childProcess = require('child_process');

const nodeRoot = (() => {
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

const timeoutFail = (jc, type, timeOut) => {
  const autofail = () => {
    const stale = new Date(new Date() - timeOut);
    jc.find({ status: 'running', type: type, updated: { $lt: stale } })
      .forEach(job => {
        new Job(jc, job).fail(`Timed out by autofail (${{ type }})`);
      });
  };
  return Meteor.setInterval(autofail, timeOut);
};

const execSync = (cwd, command) => {
  const future = new Future();
  childProcess.exec(
    command,
    { cwd },
    (err, stdout, stderr) => future.return({ err, stdout, stderr })
  );
  return future.wait(future);
};

const nodesBuildTimeout = 1000 * 60 * 60;

timeoutFail(BuildQueue, 'refresh-nodes', nodesBuildTimeout);

Job.processJobs(BuildQueue, 'refresh-nodes', { concurrency: 1, pollInterval: 1000 * 60, nodesBuildTimeout },
  (qObj, cb) => {
    if (Meteor.call('nodes:updateVersions') !== true) {
      Logs.insert({
        time: new Date(),
        message: JSON.stringify({
          title: "nodes:updateVersions didn't properly return",
        }),
      });
      cb();
      qObj.fail();
      return;
    }
    if (Meteor.call('nodes:createDockerConfig') !== true) {
      Logs.insert({
        time: new Date(),
        message: JSON.stringify({
          title: "nodes:createDockerConfig didn't properly return",
        }),
      });
      cb();
      qObj.fail();
      return;
    }
    const { err, stdout, stderr } = execSync(nodeRoot, 'docker-compose build');
    Logs.insert({ time: new Date(), message: JSON.stringify({ err, stdout, stderr }) });
    if (err) {
      if (err && (err.killed || ('code' in err && err.code !== 0))) {
        cb();
        qObj.fail();
      }
    }
    // we'll have to grep the logs to find out what was tentatively built
    // although they should be the same versions as the one with toBuild: true
    const buildAttempts = [];
    let re = /ENV NODE_VERSION (\d+\.\d+\.\d+)(-nightly2\d{7})?/g;
    let versionMatch = '';
    do {
      versionMatch = re.exec(stdout);
      if (versionMatch) {
        const [, version, nightlyPart] = versionMatch;
        buildAttempts.push(`${version}${nightlyPart || ''}`);
      }
    } while (versionMatch);

    // we also need to take into account containers based on images
    re = /(\d+\.\d+\.\d+) uses an image, skipping/g;
    versionMatch = '';
    do {
      versionMatch = re.exec(stderr);
      if (versionMatch) {
        const [, version] = versionMatch;
        buildAttempts.push(version);
      }
    } while (versionMatch);

    // then we grep the stderr to see which build fail
    re = /Cannot locate specified Dockerfile: Dockerfile\.(\d+\.\d+\.\d+)(-nightly2\d{7})?/g;
    const dockerfileNotFound = [];
    do {
      versionMatch = re.exec(stderr);
      if (versionMatch) {
        const [, version, nightlyPart] = versionMatch;
        Logs.insert({
          time: new Date(),
          message: JSON.stringify({
            title: `Dockerfile not found: ${version}${nightlyPart || ''}`,
          }),
        });
        dockerfileNotFound.push(`${version}${nightlyPart || ''}`);
      }
    } while (versionMatch);

    re = /Service 'node-(\d+\.\d+\.\d+)(-nightly2\d{7})?' failed to build/g;
    const buildFailed = [];
    do {
      versionMatch = re.exec(stderr);
      if (versionMatch) {
        const [, version, nightlyPart] = versionMatch;
        Logs.insert({
          time: new Date(),
          message: JSON.stringify({
            title: `Node build failed: ${version}${nightlyPart || ''}`,
          }),
        });
        buildFailed.push(`${version}${nightlyPart || ''}`);
      }
    } while (versionMatch);

    // now we only enable the versions successfully built and return the one
    // which errored
    const failed = _.chain(dockerfileNotFound).concat(buildFailed).unique().value();
    const toEnable = _.without(buildAttempts, ...failed);
    toEnable.forEach(version => {
      Nodes.update({ version }, { $set: { enabled: true } }, { multi: true });
    });
    // make sure we quit maintenance here
    Nodes.update({}, { $set: { toBuild: false } }, { multi: 1 });

    // finally we can tag images and push them to docker hub
    const { repo } = Meteor.settings.public.node;
    toEnable.forEach(version => {
      Logs.insert({
        time: new Date(),
        message: JSON.stringify(
          execSync(nodeRoot, `docker tag mononodes_node-${version}:latest ${repo}:${version}`)
        ),
      });
      Logs.insert({
        time: new Date(),
        message: JSON.stringify(
          execSync(nodeRoot, `docker push ${repo}:${version}`)
        ),
      });
    });
    cb();
    qObj.done();
  }
);
