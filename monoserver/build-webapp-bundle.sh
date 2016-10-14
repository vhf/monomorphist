#!/bin/bash
cd `dirname $0`
cd ../webapp

npm install --production
meteor build ../monoserver --architecture os.linux.x86_64 --server https://mono.morph.ist --server-only && \
cd .. && \
mv monoserver/webapp.tar.gz monomorphist.tar.gz && \
echo "Build done!"
