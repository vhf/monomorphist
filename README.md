# monomorphist
## a JavaScript performance companion

This repo contains the code running at <https://mono.morph.ist>. It's still early stage / beta software.

The goal is to provide a few online tools helping devs understand JavaScript performance things.

What's available right now is a tool to trace [V8 bailouts / deopts](http://vhf.github.io/blog/2016/01/22/chromium-chrome-v8-crankshaft-bailout-reasons/) by running snippets on various Node versions.

## Node versions

Node versions are automatically kept up to date via a daily scheduled job. In the process, a docker container for this node version is also created.

We provide at least the following version:

- `0.10.46` (pinned)
- `4.4.0` (pinned)
- `4.5.0` (pinned)
- `6.6.0` (pinned)
- latest `0.10.x`
- latest `0.12.x`
- latest `4.x`
- latest `5.x`
- latest `6.x`
- latest `nightly`

Since I might have forgotten to add/enable a particularly historically important node version you might still be using, you can request a particular version by opening an issue.

What happens every night is the following:

1. fetch new node versions info from nodejs.org
2. disable all versions
3. put all "latest" flag to false
4. insert and enable the ["pinned" versions](https://github.com/vhf/monomorphist/blob/master/webapp/imports/api/nodes/methods.js#L7)
5. add latest versions of each major release if they don't already exist
6. enable the latest version of each major version
7. enable by default the latest version of each LTS release
8. upsert the latest nightly build

### What I'd like to add:

* A hosted [IRHydra](https://github.com/mraleph/irhydra) instance
* Provide insights, tips, stats

### What you can do:

* Open issues to discuss features, suggest improvements or notify me of a bug
* Via PRs, fix bugs, improve the design, the docs or anything else

### TODO

- [x] Security: Node containers shouldn't be able to network at all
- [x] Live preview of the instrumented code when filling the form
- [x] Dynamically add panes when adding an engine.
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
- [ ] Sort the node versions by version comparison
- [ ] Compare several exampleFunctions and see what could be removed if printStatus() wasn't defined in the file being profiled
- [ ] Install a few popular packages inside the node containers (lodash, bluebird, …?)
- [ ] use `parallel` to benchmark the server
- [ ] provide all node versions info we got to the user. Modal? Popover?
