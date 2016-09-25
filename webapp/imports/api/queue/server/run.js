import { Meteor } from 'meteor/meteor';
import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';
import Queue from '/imports/api/queue/collection';
import { Job } from 'meteor/vsivsi:job-collection';
import { optimizationStatus, parseRawOutput } from '/imports/api/jobs/utils';

const fs = require('fs');
const childProcess = require('child_process');

const { concurrency, pollInterval, timeout } = Meteor.settings.public;
const workTimeout = timeout;

const exec = (resolve, reject, _jobId, _nodeId, container) => {
  childProcess.exec(
    `docker-compose run -e JOB_ID=${_jobId} ${container}`, {
      cwd: '/mononodes',
    },
    // `sleep ${Math.random() * 100}`, { timeout },
    // `pwd`, { timeout: 10 * 1000 },
    Meteor.bindEnvironment((err, stdout, stderr) => {
      let killed = false;
      let verdict = -1;
      if (err) {
        killed = true;
        const raw = JSON.stringify(err);
        Logs.insert({ _jobId, _nodeId, time: new Date(), raw, message: `error: ${raw}` });
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
        Logs.insert({ _jobId, _nodeId, time: new Date(), raw, message: parsed.accLines.join('\n') });
      }
      if (stderr) {
        const raw = stderr;
        Logs.insert({ _jobId, _nodeId, time: new Date(), raw, message: `stderr: ${stderr}` });
      }
      const status = verdict in optimizationStatus ? optimizationStatus[verdict] : '';
      Jobs.update({ _id: _jobId }, { killed, $push: { nodesStatus: { _id: _nodeId, verdict, status } } });
      resolve(_nodeId);
    })
  );
};

Job.processJobs(Queue, 'run', { concurrency, pollInterval, workTimeout },
  (qObj, cb) => {
    const { _jobId } = qObj.data;
    const job = Jobs.findOne({ _id: _jobId });

    Jobs.update({ _id: _jobId, status: 'queued' }, { $set: { status: 'running' } });
    Logs.insert({ _jobId, time: new Date(), message: `job ${_jobId} started running...` });

    const instrumented = Meteor.call('job:instrument', job.fn, false);
    fs.mkdirSync(`/src/${_jobId}`);
    fs.writeFileSync(`/src/${_jobId}/${_jobId}.js`, instrumented);

    const containers = job.nodes.map(_id => {
      const node = Nodes.findOne({ _id, disabled: false });
      return {
        _nodeId: _id,
        container: `node-${node.packageVersion}`,
      };
    });

    const runningJobs = containers.map(({ _nodeId, container }) =>
      new Promise((resolve, reject) =>
        exec(resolve, reject, _jobId, _nodeId, container)));

    Promise.all(runningJobs).then(() => {
      fs.unlinkSync(`/src/${_jobId}/${_jobId}.js`);
      Jobs.update({ _id: _jobId, status: 'running' }, { $set: { status: 'done' } });
      Logs.insert({ _jobId, time: new Date(), message: 'job done.' });
      qObj.done();
      cb();
    });
  }
);
