import Future from 'fibers/future';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Job } from 'meteor/vsivsi:job-collection';

import IRJobs from '/imports/api/irjobs/collection';
import V8 from '/imports/api/v8/collection';
import Logs from '/imports/api/logs/collection';
import { Queue } from '/imports/api/queue/collection';

const childProcess = require('child_process');

const { concurrency, pollInterval, timeout } = Meteor.settings.public.v8;
const workTimeout = timeout;

const timeoutFail = (jc, type, timeOut) => {
  const autofail = () => {
    const stale = new Date(new Date() - timeOut);
    jc.find({ status: 'running', type: type, updated: { $lt: stale } })
      .forEach(job => {
        IRJobs.update({ _id: job.data._irjobId }, { $set: { killed: true, status: 'done' } });
        new Job(jc, job).fail('Timed out by autofail');
      });
  };
  return Meteor.setInterval(autofail, timeOut);
};

const queueFailsAsDoneJobs = (jc, type, timeOut) => {
  const markDeadAsDone = () => {
    const stale = new Date(new Date() - (timeOut * 3));
    jc.find({ status: 'failed', type: type, updated: { $lt: stale } })
      .forEach(job => {
        IRJobs.update({ _id: job.data._irjobId, killed: false, status: 'running' }, { $set: { killed: true, status: 'done' } });
      });
  };
  return Meteor.setInterval(markDeadAsDone, Math.floor(timeOut / 1.95));
};

timeoutFail(Queue, 'run-ir', timeout);
queueFailsAsDoneJobs(Queue, 'run-ir', timeout);

const execSync = (cwd, command) => {
  const future = new Future();
  childProcess.exec(
    command,
    { cwd },
    (err, stdout, stderr) => future.return({ err, stdout, stderr })
  );
  return future.wait(future);
};

Job.processJobs(Queue, 'run-ir', { concurrency, pollInterval, workTimeout },
  (qObj, cb) => {
    const { _irjobId, _irjobPublicId, _v8Id } = qObj.data;
    const v8 = V8.findOne({ _id: _v8Id });

    if (!v8) {
      qObj.fail(`v8 ${_v8Id} not found!`);
      cb();
    }

    IRJobs.update({ _publicId: _irjobPublicId, status: 'ready' }, { $set: { status: 'running' } });
    Logs.insert({ _irjobId, message: `job ${_irjobId} started running...` });

    const dockerCmd = [
      'docker run',
      '--rm',
      `--name=${Random.id()}`,
      `-v /opt/monomorphist/d8-artifacts/${_irjobPublicId}:/io`,
      '-v /opt/monomorphist/monod8/start.sh:/start.sh',
      '--entrypoint=/start.sh',
      `dockervhf/d8:${v8.tag}`,
    ];

    const { stdout, stderr, err } = execSync('/', dockerCmd.join(' '));

    if (err && (err.killed || ('code' in err && err.code !== 0))) {
      Logs.insert({ _irjobId, message: `${err}\n${stderr}` });
      qObj.fail(`killed ${{ err }} ${{ stderr }}`);
      cb();
    }

    Logs.insert({ _irjobId, message: `\n${stdout}` });
    IRJobs.update({ _publicId: _irjobPublicId, status: 'running' }, { $set: { status: 'done' } });
    Logs.insert({ _irjobId, message: 'job done.' });
    qObj.done();
    cb();
  }
);
