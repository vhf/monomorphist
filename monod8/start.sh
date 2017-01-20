#!/bin/bash
cd /io

wc code.js
echo ''

rm -f code.asm
rm -f code.asm.gz

rm -f hydrogen.cfg
rm -f hydrogen.cfg.gz

rm -f no_hydrogen_output
rm -f no_asm_output

d8 \
  --trace-hydrogen \
  --trace-phase=Z \
  --trace-deopt \
  --code-comments \
  --hydrogen-track-positions \
  --redirect-code-traces \
  --redirect-code-traces-to=/io/code.asm \
  --print-opt-code \
  code.js

STATUS=$?

gzip hydrogen.cfg || touch no_hydrogen_output
gzip code.asm || touch no_asm_output

exit $STATUS
