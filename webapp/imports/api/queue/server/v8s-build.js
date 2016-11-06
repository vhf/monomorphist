import Future from 'fibers/future';
import { Meteor } from 'meteor/meteor';
import { Job } from 'meteor/vsivsi:job-collection';

import Logs from '/imports/api/logs/collection';
import V8 from '/imports/api/v8/collection';
import { BuildQueue } from '/imports/api/queue/collection';

const childProcess = require('child_process');

const v8Root = '/monod8';

const timeoutFail = (jc, type, timeOut) => {
  const autofail = () => {
    const stale = new Date(new Date() - timeOut);
    jc.find({ status: 'running', type: type, updated: { $lt: stale } })
      .forEach(job => {
        // TODO: send email
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

const v8BuildTimeout = 1000 * 60 * 60;

timeoutFail(BuildQueue, 'build-v8', v8BuildTimeout);
timeoutFail(BuildQueue, 'refresh-v8s', v8BuildTimeout);

Job.processJobs(BuildQueue, 'refresh-v8s', { concurrency: 1, pollInterval: 1000 * 10, v8BuildTimeout },
  (qObj, cb) => {
    Meteor.call('v8:deleteDockerfiles');
    Meteor.call('v8:refreshTags');
    const v8s = V8.find({ rebuild: true }).fetch();
    v8s.forEach(v8 => {
      const queuedJob = new Job(BuildQueue, 'build-v8', { _v8Id: v8._id, tag: v8.tag });
      queuedJob.priority('normal').save();
    });
    cb();
    qObj.done();
  },
);

Job.processJobs(BuildQueue, 'build-v8', { concurrency: 1, pollInterval: 1000 * 10, v8BuildTimeout },
  (qObj, cb) => {
    const { _v8Id, tag } = qObj.data;
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: `Building v8 ${tag}`,
      miscJSON: JSON.stringify(qObj.data),
    });
    const v8 = V8.findOne({ _id: _v8Id });
    if (!v8) {
      Logs.insert({
        type: 'refresh',
        queue: 'build-v8',
        title: `v8 ${_v8Id} not found (${tag})`,
      });
      V8.update({ _id: v8._id }, { $set: { rebuild: false } });
      cb();
      qObj.fail();
      return;
    }
    Meteor.call('v8:createDockerfile', v8);
    /*
      # how to test this stuff
      1. queue up building images for
        * inexistant dockerfile
        * wrong build pipeline (e.g. gn-building a gyp-release)
        * inexistant gn tag
        * inexistant gyp tag
        * successful gn
        * successful gyp
      2. write ({ err, stdout, stderr }) to a file
         for each execSync call
    */
    const noCache = tag === 'master' ? '--no-cache' : '';
    let { err, stdout, stderr } = execSync(`${v8Root}/dockerfiles`, `docker build ${noCache} -t dockervhf/d8:${tag} -f Dockerfile.${tag} .`);

    const tagNotFound = stdout.indexOf('did not match any file(s) known to git') !== -1;
    let d8NotBuilt = stdout.indexOf('d8 not built!') !== -1;
    if (d8NotBuilt) {
      const index = stdout.indexOf('echo "d8 not built!');
      if (index !== -1) {
        d8NotBuilt = stdout.slice(index).indexOf('d8 not built!') !== -1;
      }
    }
    let failedMsg = d8NotBuilt ? ` failed: ${tag} : d8 not built` : '';
    failedMsg = tagNotFound ? ` failed: ${tag} : git tag not found` : failedMsg;

    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: `v8 ${v8.tag} docker build${failedMsg}`,
      stdout,
      stderr,
      miscJSON: JSON.stringify(err),
    });

    if (tagNotFound || d8NotBuilt || (err && (err.killed || ('code' in err && err.code !== 0)))) {
      V8.update({ _id: v8._id }, { $set: { rebuild: false } });
      cb();
      qObj.fail();
      return;
    }

    const { repo } = Meteor.settings.public.v8;
    ({ err, stdout, stderr } = execSync(`${v8Root}/dockerfiles`, `docker push ${repo}:${tag}`));
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: `v8 ${v8.tag} docker push`,
      stdout,
      stderr,
      miscJSON: JSON.stringify(err),
    });
    if (err && (err.killed || ('code' in err && err.code !== 0))) {
      V8.update({ _id: v8._id }, { $set: { rebuild: false } });
      cb();
      qObj.fail();
      return;
    }

    V8.update({ _id: v8._id }, { $set: { rebuild: false } });
    Logs.insert({
      type: 'refresh',
      queue: 'build-v8',
      title: `v8 ${v8.tag} built and pushed!`,
    });
    cb();
    qObj.done();
  }
);
