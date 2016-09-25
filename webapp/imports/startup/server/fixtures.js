import Nodes from '/imports/api/nodes/collection';
import Jobs from '/imports/api/jobs/collection';
import Logs from '/imports/api/logs/collection';
import { _ } from 'meteor/underscore';
import dedent from 'dedent-js';

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
// 
// const fixtures = [{
//   job: {
//     _id: 'demo',
//     fn: {
//       definition: 'function exampleFunction() {\n  return 3;\n  eval(\'\');\n}\n',
//       call: 'exampleFunction()',
//       name: 'exampleFunction',
//     },
//     // fn: {
//     //   definition: 'var sum = function(xs) {\n  return xs.reduce(function(acc, cur) {\n    return eval(\'acc + cur\');\n  }, 0);\n};\nvar numbers;',
//     //   call: 'numbers = _.chain(_.range(0, 50)).map(function(n) {\n  return _.random(10000)\n}).value();\nsum(numbers);\n',
//     //   name: 'sum',
//     // },
//     nodes: _.pluck(Nodes.find({ disabled: false, enabledByDefault: true }).fetch(), '_id'),
//     logs: [],
//   },
//   logs: [
//     {
//       _jobId: 'demo',
//       _nodeId: Nodes.findOne({ packageVersion: '4.5.0' })._id,
//       time: new Date(),
//       message: dedent`
//         [disabled optimization for 0xd1c256df671 <SharedFunctionInfo NativeModule.compile>, reason: TryFinallyStatement]
//         [disabled optimization for 0x126cdf8f8a21 <SharedFunctionInfo createUnsafeBuffer>, reason: TryFinallyStatement]
//         [didn't find optimized code in optimized code map for 0x2454f460c169 <SharedFunctionInfo>]
//         [disabled optimization for 0xd1c25652d21 <SharedFunctionInfo Join>, reason: TryFinallyStatement]
//         [disabled optimization for 0xd1c25671bd1 <SharedFunctionInfo WeakMap>, reason: TryCatchStatement]
//         [disabled optimization for 0x2454f4632e01 <SharedFunctionInfo>, reason: TryCatchStatement]
//         [didn't find optimized code in optimized code map for 0x2454f46143e1 <SharedFunctionInfo debugs.(anonymous function)>]
//         [disabled optimization for 0xd1c25670ac9 <SharedFunctionInfo Map>, reason: TryCatchStatement]
//         [didn't find optimized code in optimized code map for 0x2454f46143e1 <SharedFunctionInfo debugs.(anonymous function)>]
//         [disabled optimization for 0x2454f462c9c1 <SharedFunctionInfo tryModuleLoad>, reason: TryFinallyStatement]
//         [disabled optimization for 0x2454f4634991 <SharedFunctionInfo tryStatSync>, reason: TryFinallyStatement]
//         [disabled optimization for 0x2454f4634a51 <SharedFunctionInfo tryCreateBuffer>, reason: TryFinallyStatement]
//         [disabled optimization for 0x2454f4634b11 <SharedFunctionInfo tryReadSync>, reason: TryFinallyStatement]
//         [disabled optimization for 0x2454f465d2f9 <SharedFunctionInfo exampleFunction>, reason: Function calls eval]
//         [disabled optimization for 0x2454f465d2f9 <SharedFunctionInfo exampleFunction>, reason: Function calls eval]
//         [aborted optimizing 0x2a8cd1de1839 <JS Function exampleFunction (SharedFunctionInfo 0x2454f465d2f9)> because: no reason]
//         [didn't find optimized code in optimized code map for 0x2454f46143e1 <SharedFunctionInfo debugs.(anonymous function)>]
//         [didn't find optimized code in optimized code map for 0x2454f4682fb9 <SharedFunctionInfo WritableState.onwrite>]
//         [didn't find optimized code in optimized code map for 0x2454f4683681 <SharedFunctionInfo CorkedRequest.finish>]
//         [disabled optimization for 0xd1c256de801 <SharedFunctionInfo installInspectorConsoleIfNeeded>, reason: TryCatchStatement]
//         Function is not optimized (OptimizationStatus {2})`,
//     },
//     {
//       _jobId: 'demo',
//       _nodeId: Nodes.findOne({ packageVersion: '6.6.0' })._id,
//       time: new Date(),
//       message: dedent`
//         [disabled optimization for 0x3198e8947b11 <SharedFunctionInfo SAR>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8946621 <SharedFunctionInfo ADD>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8947d79 <SharedFunctionInfo SHR>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8948099 <SharedFunctionInfo IN>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e89c02c9 <SharedFunctionInfo NativeModule.require>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e89bf849 <SharedFunctionInfo NativeModule>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e89c08d1 <SharedFunctionInfo NativeModule.compile>, reason: TryFinallyStatement]
//         [disabled optimization for 0x3198e89473f1 <SharedFunctionInfo BIT_OR>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e89d04f9 <SharedFunctionInfo createBuffer>, reason: TryFinallyStatement]
//         [disabled optimization for 0x3198e8946e69 <SharedFunctionInfo MUL>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e89d6271 <SharedFunctionInfo exports.deprecate>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8947fd1 <SharedFunctionInfo DELETE>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8951b79 <SharedFunctionInfo Join>, reason: TryFinallyStatement]
//         [disabled optimization for 0x3198e8946c11 <SharedFunctionInfo SUB>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x1d9d08e12fb1 <SharedFunctionInfo Module._load>, reason: TryFinallyStatement]
//         [disabled optimization for 0x3198e8947649 <SharedFunctionInfo BIT_AND>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x1d9d08e1a201 <SharedFunctionInfo fs.readFileSync>, reason: TryFinallyStatement]
//         [disabled optimization for 0x3198e8947259 <SharedFunctionInfo MOD>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8948671 <SharedFunctionInfo APPLY_PREPARE>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x1d9d08e3efd1 <SharedFunctionInfo exampleFunction>, reason: Function calls eval]
//         [disabled optimization for 0x1d9d08e3efd1 <SharedFunctionInfo exampleFunction>, reason: Function calls eval]
//         [compiling method 0x286934086331 <JS Function exampleFunction (SharedFunctionInfo 0x1d9d08e3efd1)> using TurboFan]
//         Function is optimized by TurboFan (OptimizationStatus {7})
//         [optimizing 0x286934086331 <JS Function exampleFunction (SharedFunctionInfo 0x1d9d08e3efd1)> - took 0.448, 0.000, 0.000 ms]
//         [disabled optimization for 0x3198e89477e1 <SharedFunctionInfo BIT_XOR>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x3198e8948229 <SharedFunctionInfo INSTANCE_OF>, reason: Call to a JavaScript runtime function]
//         [disabled optimization for 0x1d9d08e0a329 <SharedFunctionInfo nextTickCallbackWithManyArgs>, reason: TryFinallyStatement]`,
//     },
//     {
//       _jobId: 'demo',
//       time: new Date(),
//       message: dedent`
//         job demo started running...
//         job demo done.
//         6.6.0 and 4.5.0 are done running.`,
//     },
//   ],
// }];
//
// fixtures.forEach(fixture => {
//   Jobs.remove({ _id: fixture.job._id });
//   Logs.remove({ _jobId: fixture.job._id });
//
//   Jobs.insert(fixture.job);
//   fixture.logs.forEach(log => {
//     Logs.insert(log);
//   });
// });
