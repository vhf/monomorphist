#!/bin/bash
cd /opt/input
d8 --trace_hydrogen --trace_phase=Z --trace_deopt \
    --code_comments --hydrogen_track_positions --redirect_code_traces \
    --redirect_code_traces_to=/opt/input/out.asm --print_opt_code /opt/input/in.js
ls /opt/input

cat hydrogen.cfg
cat out.asm
