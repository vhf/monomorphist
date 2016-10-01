#!/bin/bash

_timeout() { ( set +b; sleep "$1" & "${@:2}" & wait -n; r=$?; kill -9 `jobs -p`; exit $r; ) }

cat /prepend.js > /src/$JOB_ID/tmp.js
cat /src/$JOB_ID/$JOB_ID.js >> /src/$JOB_ID/tmp.js
mv /src/$JOB_ID/tmp.js /src/$JOB_ID/$JOB_ID.js

_timeout 10 node \
  --trace_opt \
  --trace_deopt \
  --allow-natives-syntax \
  /src/$JOB_ID/$JOB_ID.js
