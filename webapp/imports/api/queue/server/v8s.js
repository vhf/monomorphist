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
    Logs.insert({ time: new Date(), message: JSON.stringify({ title: 'Build v8' }) });
    const { _v8Id, tag } = qObj.data;
    const v8 = V8.findOne({ _id: _v8Id });
    if (!v8) {
      Logs.insert({
        time: new Date(),
        message: JSON.stringify({
          title: `v8 ${_v8Id} ${tag} not found`,
          body: qObj.data,
        }),
      });
      cb();
      qObj.fail();
      return;
    }
    Logs.insert({
      time: new Date(),
      message: JSON.stringify({
        title: `v8 ${_v8Id} ${tag} found`,
      }),
    });
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
    let { err, stdout, stderr } = execSync(`${v8Root}/dockerfiles`, `docker build -t dockervhf/d8:${tag} -f Dockerfile.${tag} .`);
    Logs.insert({ time: new Date(), message: JSON.stringify({ err, stdout, stderr }) });
    if (err && (err.killed || ('code' in err && err.code !== 0))) {
      cb();
      qObj.fail();
    }

    const { repo } = Meteor.settings.public.v8;
    ({ err, stdout, stderr } = execSync(`${v8Root}/dockerfiles`, `docker push ${repo}:${tag}`));
    Logs.insert({ time: new Date(), message: JSON.stringify({ err, stdout, stderr }) });
    if (err && (err.killed || ('code' in err && err.code !== 0))) {
      cb();
      qObj.fail();
    }
    V8.update({ _id: v8._id }, { $set: { rebuild: false } });
    cb();
    qObj.done();
  }
);
