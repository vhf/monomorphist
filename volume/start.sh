#!/bin/bash

if [[ -z $JOB_ID ]]; then
  JOB_ID="pourrav"
fi

function log
{
  logger --udp --server syslogserver --port 1337 -t $JOB_ID
}

echo "monomorph running {$JOB_ID}{$NODE_VERSION}" | log

# bailout deopt
node \
  --trace_opt \
  --trace_deopt \
  --allow-natives-syntax \
  /src/main.js | log

echo "monomorph done {$JOB_ID}{$NODE_VERSION}" | log

# IRHydra
# node \
#   --trace-hydrogen \
#   --trace-phase=Z \
#   --trace-deopt \
#   --code-comments \
#   --hydrogen-track-positions \
#   --redirect-code-traces \
#   --redirect-code-traces-to=code.asm \
#   /src/not-instrumented.js | log
