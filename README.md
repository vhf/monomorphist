# monomorphist
## a JavaScript performance companion

This repo contains the code running at [mono.morph.ist](https://mono.morph.ist). It's still early stage / beta software. It's a quick hack I built in airports and airplanes between New York, Hamburg, and Switzerland.

The goal is to provide a few online tools giving V8 JavaScript performance insights.

### Node/V8 bailouts

What's available right now is a tool to trace [V8 bailouts / deopts](http://draft.li/blog/2016/01/22/chromium-chrome-v8-crankshaft-bailout-reasons/) by running snippets on various Node versions. If you're not familiar with these things, take a look at [bluebird/Optimization killers](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers) and [v8 bailout reasons](https://github.com/vhf/v8-bailout-reasons).

Each job instance has the following NPM packages pre-installed:

- `lodash`
- `bluebird`
- `moment`
- `underscore`
- `q`
- `jquery`

### [IRHydra](https://github.com/mraleph/irhydra)

monomorphist also provides a hosted IRHydra instance and everything needed to generate the artefacts IRHydra needs.

We have more than 100 V8 versions compiled, choose the one for which you'd like to inspect the generated internal representation and assembly.

## Architecture of the project

* The main part is a Meteor application
    * It orchestrates docker containers running user code
    * It schedules building docker images for every node and every v8 version

## What you can do to help

* Open issues to discuss features, suggest improvements or notify me of a bug
* Via PRs, fix bugs, improve the design, the docs or anything else
* Contribute explanations about [bailout/deopt reasons](https://github.com/vhf/v8-bailout-reasons)
