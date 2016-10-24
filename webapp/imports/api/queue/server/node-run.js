import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Job } from 'meteor/vsivsi:job-collection';
import { optimizationStatuses, parseRawOutput } from '/imports/api/jobs/utils';

import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';
import { Queue } from '/imports/api/queue/collection';

const fs = require('fs');
const childProcess = require('child_process');

const { concurrency, pollInterval, timeout } = Meteor.settings.public.node;
const workTimeout = timeout;

const timeoutFail = (jc, type, timeOut) => {
  const autofail = () => {
    const stale = new Date(new Date() - timeOut);
    jc.find({ status: 'running', type: type, updated: { $lt: stale } })
      .forEach(job => {
        Jobs.update({ _id: job.data._jobId }, { $set: { killed: true, status: 'done' } });
        Logs.insert({ _jobId: job.data._jobId, message: 'Killed by server (timeout).' });
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
        const updated = Jobs.update({ _id: job.data._jobId, killed: false, status: 'running' }, { $set: { killed: true, status: 'done' } });
        if (updated) {
          Logs.insert({ _jobId: job.data._jobId, message: 'This job died.' });
        }
      });
  };
  return Meteor.setInterval(markDeadAsDone, Math.floor(timeOut / 1.95));
};

timeoutFail(Queue, 'run', timeout);
queueFailsAsDoneJobs(Queue, 'run', timeout);

const envVarRegex = /^[a-z0-9][a-z0-9\-\.]+$/mi;
const composeRun = (resolve, reject, _jobId, _nodeId, container) => {
  if (!envVarRegex.test(_jobId) || !envVarRegex.test(container)) {
    const raw = `Env var security check failed: ${_jobId} is ${envVarRegex.test(_jobId)}, ${container} is ${envVarRegex.test(container)}`;
    Logs.insert({ _jobId, _nodeId, raw, message: 'error: security check failed' });
    reject('security check failed');
  }
  childProcess.exec(
    `docker-compose run --rm -e JOB_ID=${_jobId} -u 1010 --name=${Random.id()} ${container}`, {
      cwd: '/mononodes',
    },
    Meteor.bindEnvironment((err, stdout, stderr) => {
      let killed = false;
      let verdict = -1;
      if (err) {
        killed = true;
        const raw = JSON.stringify(err);
        Logs.insert({ _jobId, _nodeId, raw, message: `error: ${raw}` });
      }
      if (stdout) {
        const raw = stdout;
        const parsed = raw
          .split('\n')
          .reduce(({ accLines, finalVerdict }, line) => {
            const { line: currentLine, verdict: currentVerdict } = parseRawOutput(line);
            accLines.push(currentLine);
            return { accLines, finalVerdict: currentVerdict !== -1 ? currentVerdict : finalVerdict };
          }, { accLines: [], finalVerdict: -1 });
        verdict = parsed.finalVerdict;
        Logs.insert({ _jobId, _nodeId, raw, message: parsed.accLines.join('\n') });
      }
      if (stderr) {
        const raw = stderr;
        Logs.insert({ _jobId, _nodeId, raw, message: `stderr: ${stderr}` });
      }
      const status = verdict in optimizationStatuses ? optimizationStatuses[verdict] : '';
      Jobs.update({ _id: _jobId }, { $set: { killed }, $push: { nodesStatus: { _id: _nodeId, verdict, status } } });
      resolve(_nodeId);
    })
  );
};

Job.processJobs(Queue, 'run', { concurrency, pollInterval, workTimeout },
  (qObj, cb) => {
    const { _jobId } = qObj.data;
    const job = Jobs.findOne({ _id: _jobId });

    Jobs.update({ _id: _jobId, status: 'ready' }, { $set: { status: 'running' } });
    Logs.insert({ _jobId, message: `job ${_jobId} started running...` });

    const instrumented = Meteor.call('job:instrument', job.fn, false);
    fs.mkdirSync(`/src/${_jobId}`);
    fs.writeFileSync(`/src/${_jobId}/${_jobId}.js`, instrumented);

    const containers = _
      .chain(job.nodes)
      .map(_id => {
        // we make sure the job cannot run on disabled node version
        const node = Nodes.findOne({ _id, enabled: true });
        if (node) {
          return {
            _nodeId: _id,
            container: `node-${node.version}`,
          };
        }
        return false;
      })
      .compact()
      .value();

    if (!containers.length) {
      const err = 'Job failed because no valid node version found.';
      Jobs.update({ _id: _jobId }, { $set: { status: 'done' } });
      Logs.insert({ _jobId, message: err });
      qObj.fail(err);
      cb();
    }

    const runJobs = containers.map(({ _nodeId, container }) =>
      new Promise((resolve, reject) =>
        composeRun(resolve, reject, _jobId, _nodeId, container)));

    Promise.all(runJobs).then(() => {
      // make sure to completely wipe the directory
      childProcess.execSync(`rm -rf /src/${_jobId}/`, (err) => {
        console.log(err);
      });
      Jobs.update({ _id: _jobId, status: 'running' }, { $set: { status: 'done' } });
      Logs.insert({ _jobId, message: 'job done.' });
      qObj.done();
      cb();
    }).catch(() => {
      // make sure to completely wipe the directory
      childProcess.execSync(`rm -rf /src/${_jobId}/`, (err) => {
        console.log(err);
      });
      Jobs.update({ _id: _jobId, status: 'running' }, { $set: { status: 'done' } });
      Logs.insert({ _jobId, message: 'job done: a node failed for security reason, so we quit.' });
      qObj.fail();
      cb();
    });
  }
);
