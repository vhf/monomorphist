# monomorphist
## a JavaScript (V8) performance companion

### TODO

- [x] Security: Node containers shouldn't be able to network at all
- [x] Live preview of the instrumented code when filling the form
- [x] Dynamically add panes when adding an engine.
- [ ] [IRHydra](https://github.com/mraleph/irhydra)?
- [x] Visual queues of the job status and optimization status
- [ ] Validate function call and function name
- [x] Highlight relevant parts from the logs. Give an aggregated overview, store this aggregated overview together with the job for stats purposes.
- [ ] Fake a job for demo purposes. Make it interesting.
- [x] Implement queue
- [x] Display queue status. Is it running at full capacity?
- [ ] Stats:
  - [ ] how long does a job usually last
  - [x] how long until my job runs
  - [ ] what are the common mistakes
- [x] Kill jobs after 30s
- [ ] In the job logs per node, highlight every occurrence of the function name
- [ ] Sort the node packageVersions by version comparison
- [ ] Compare several exampleFunctions and see what could be removed if printStatus() wasn't defined in the file being profiled
- [ ] Install a few popular packages inside the node containers (lodash, bluebird, …?)
- [ ] use `parallel` to benchmark the server
