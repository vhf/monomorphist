import { Meteor } from 'meteor/meteor';
import dedent from 'dedent-js';
import { _ } from 'meteor/underscore';
import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import Nodes from '/imports/api/nodes/collection';

const childProcess = require('child_process');

Meteor.methods({
  'job:new'(_job) {
    if (!Jobs.findOne(_job)) {
      const defaultNodes = Nodes.find({ disabled: false, enabledByDefault: true }).fetch();
      const job = _.extend(_job, { nodes: _.pluck(defaultNodes, '_id') });
      Jobs.insert(job);
    }
  },
  'job:addNode'(_id, nodeId) {
    Jobs.update({ _id }, { $addToSet: { nodes: nodeId } });
  },
  'job:removeNode'(_id, nodeId) {
    Jobs.update({ _id }, { $pull: { nodes: nodeId } });
  },
  'job:instrument'(p, screen = true) {
    const fn = typeof p === 'string' ? Jobs.findOne({ _id: p }).fn : p;
    if (!fn) return '';
    const boilerplate = screen ? '' : dedent`
    function printStatus(fn) {
      switch(%GetOptimizationStatus(fn)) {
        case 1: console.log("Function is optimized"); break;
        case 2: console.log("Function is not optimized"); break;
        case 3: console.log("Function is always optimized"); break;
        case 4: console.log("Function is never optimized"); break;
        case 6: console.log("Function is maybe deoptimized"); break;
        case 7: console.log("Function is optimized by TurboFan"); break;
        default: console.log("Unknown optimization status"); break;
      }
    }\n\n\n`;

    return dedent`
    ${boilerplate}${fn.definition};

    ${fn.call};
    ${fn.call};

    %OptimizeFunctionOnNextCall(${fn.name});

    ${fn.call};

    printStatus(${fn.name});`;
  },
  'job:run'(_jobId) {
    const job = Jobs.findOne({ _id: _jobId });
    if (!job) return;
    const containers = job.nodes.map(_id => {
      const node = Nodes.findOne({ _id, disabled: false });
      return `node-${node.packageVersion}`;
    }).join(' ');
    Logs.insert({ _jobId, time: new Date(), message: `executing ${_jobId} on containers ${containers}...` });
    childProcess.exec(
      `bash spawn.sh ${_jobId} ${containers}`, {
        cwd: '/mononodes',
      },
      Meteor.bindEnvironment((err, stdout, stderr) => {
        let logged = false;
        if (err) {
          Logs.insert({ _jobId, time: new Date(), message: `err: ${err}` });
          logged = true;
        }
        if (stdout) {
          Logs.insert({ _jobId, time: new Date(), message: `stdout: ${stdout}` });
          logged = true;
        }
        if (stderr) {
          Logs.insert({ _jobId, time: new Date(), message: `stderr: ${stderr}` });
          logged = true;
        }
        if (!logged) {
          Logs.insert({ _jobId, time: new Date(), message: `command ${_jobId} exited; no err/stdout/stderr.` });
        }
      })
    );
  },
});
