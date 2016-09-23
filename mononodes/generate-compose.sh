#!/bin/sh
cd `dirname $0`
cat docker-compose-pre.yml > docker-compose.yml

rm -rf ./mononodes
mkdir -p mononodes

declare -a NODE_VERSIONS=("0.10.46" "0.12.15" "4.5.0" "5.12.0" "6.6.0")

for NODE_VERSION in "${NODE_VERSIONS[@]}"
do
cat > mononodes/Dockerfile.$NODE_VERSION <<- EOM
FROM buildpack-deps:jessie-curl

# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "\$key"; \
  done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION $NODE_VERSION

RUN buildDeps='xz-utils' \
    && set -x \
    && apt-get update \
    && apt-get install -y \$buildDeps --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && curl -SLO "https://nodejs.org/dist/v\$NODE_VERSION/node-v\$NODE_VERSION-linux-x64.tar.xz" \
    && curl -SLO "https://nodejs.org/dist/v\$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v\$NODE_VERSION-linux-x64.tar.xz\\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v\$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
    && rm "node-v\$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && apt-get purge -y --auto-remove \$buildDeps \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs

ENTRYPOINT bash /start.sh
EOM

cat >> docker-compose.yml <<- EOM
  node-$NODE_VERSION:
    build:
      context: ./mononodes
      dockerfile: Dockerfile.$NODE_VERSION
    environment:
      - NODE_VERSION=$NODE_VERSION
      - JOB_ID=\${COMPOSE_PROJECT_NAME}-$NODE_VERSION
    volumes:
      - /opt/monomorphist/volume/start.sh:/start.sh
      - /opt/monomorphist/volume/src:/src
    labels:
      - "node_container=1"
    external_links:
      - "monomorphist:syslogserver"

EOM
done

cat docker-compose-post.yml >> docker-compose.yml
