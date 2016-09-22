#!/bin/sh
node -v
node --trace_opt --trace_deopt --allow-natives-syntax /src/main.js
