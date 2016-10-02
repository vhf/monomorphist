#!/bin/bash
cd `dirname $0`
cd ../webapp

if [ "$1" ]; then
  N=$1
else
  N=1
fi

npm install --production
meteor build ../monoserver --architecture os.linux.x86_64 --server https://mono.morph.ist --server-only && \
cd ../monoserver && \
mv webapp.tar.gz monomorphist.tar.gz && \
echo "Build done!"

bash ./generate-env-files.sh $N && \
echo "Env files generated!"
