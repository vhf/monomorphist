import Future from 'fibers/future';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Job } from 'meteor/vsivsi:job-collection';

import IRJobs from '/imports/api/irjobs/collection';
import V8 from '/imports/api/nodes/collection';
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
    const { _irjobId, _v8Id } = qObj.data;
    const v8 = V8.findOne({ _id: _v8Id });

    if (!v8) {
      qObj.fail(`v8 ${_v8Id} not found!`);
      cb();
    }

    IRJobs.update({ _id: _irjobId, status: 'ready' }, { $set: { status: 'running' } });

    const dockerCmd = [
      'docker run',
      '--rm',
      `--name=${Random.id()}`,
      `-v /opt/monomorphist/d8-artifacts/${_irjobId}:/io`,
      '-v /opt/monomorphist/monod8/start.sh:/start.sh',
      '--entrypoint=/start.sh',
      `dockervhf/d8:${v8.tag}`,
    ];

    execSync('.', dockerCmd.join(' '));

    IRJobs.update({ _id: _irjobId, status: 'running' }, { $set: { status: 'done' } });

    qObj.done();
    cb();
  }
);
