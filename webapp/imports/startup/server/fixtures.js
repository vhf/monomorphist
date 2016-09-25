import Nodes from '/imports/api/nodes/collection';
import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import { _ } from 'meteor/underscore';
import { Random } from 'meteor/random';

const nodesFixture = [
  { packageVersion: '0.10.46', enabledByDefault: false },
  { packageVersion: '0.12.15', enabledByDefault: false },
  { packageVersion: '4.5.0', enabledByDefault: true },
  { packageVersion: '5.12.0', enabledByDefault: false },
  { packageVersion: '6.6.0', enabledByDefault: true },
];

const existingNodes = _.pluck(Nodes.find({}, { fields: { _id: 0, packageVersion: 1 } }).fetch(), 'packageVersion');

nodesFixture.forEach(node => {
  if (existingNodes.indexOf(node.packageVersion) === -1) {
    Nodes.insert(node);
  }
});

const demoJobs = [
  {
    _id: 'v8rumAfiEuaB47xDa',
    fn: {
      definition: 'var sum = function(xs) {\n  return xs.reduce(function(acc, cur) {\n    return eval(\'acc + cur\');\n  }, 0);\n};\nvar numbers;',
      call: 'numbers = _.chain(_.range(0, 50)).map(function(n) {\n  return _.random(10000)\n}).value();\nsum(numbers);\n',
      name: 'sum',
    },
    nodes: _.pluck(Nodes.find({ disabled: false, enabledByDefault: true }).fetch(), '_id'),
    logs: [],
  },
];

// TODO
// demoJobs.forEach(job => Meteor.call('job:run', job._id));

// const allNodes = Nodes.find({ disabled: false, enabledByDefault: true }).fetch();
// const allJobs = Jobs.find({}).fetch();
//
// allJobs.forEach(job => {
//   const _jobId = job._id;
//   allNodes.forEach(node => {
//     const _nodeId = node._id;
//     if (Logs.find({ _jobId, _nodeId }).count() < 25) {
//       for (let i = 0; i < 25; i++) {
//         Logs.insert({ _jobId, _nodeId, time: new Date(), host: 'some-host', message: Random.id() });
//       }
//     }
//   });
// });
