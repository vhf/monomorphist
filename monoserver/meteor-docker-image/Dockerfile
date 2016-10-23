# derived from abernix/meteord:base
FROM debian:jessie

ENV NODE_VERSION=4.4.7
ENV NODE_ARCH=x64
ENV NODE_DIST=node-v${NODE_VERSION}-linux-${NODE_ARCH}

RUN apt-get update -y && \
  apt-get install -y apt-transport-https ca-certificates && \
  apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D && \
  echo 'deb https://apt.dockerproject.org/repo debian-jessie main' >> /etc/apt/sources.list.d/docker.list && \
  apt-get update -y && \
  apt-get install -y curl bzip2 build-essential python git nginx docker-engine && \
  cd /tmp && \
  curl -O -L http://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz && \
  tar xzf ${NODE_DIST}.tar.gz && \
  rm -rf /opt/nodejs && mv ${NODE_DIST} /opt/nodejs && \
  ln -sf /opt/nodejs/bin/node /usr/bin/node && ln -sf /opt/nodejs/bin/npm /usr/bin/npm && \
  npm install --global npm@3 && \
  apt-get autoremove -y && \
  rm -rf /usr/share/doc /usr/share/doc-base /usr/share/man /usr/share/locale /usr/share/zoneinfo && \
  rm -rf /var/lib/cache /var/lib/log && \
  rm -rf /tmp/* && \
  npm cache clear


RUN curl -L https://github.com/docker/compose/releases/download/1.8.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

ENV METEORD_DIR /opt/meteord

EXPOSE 80

HEALTHCHECK CMD curl --fail http://localhost:80 || exit 1

ENTRYPOINT bash $METEORD_DIR/run_app.sh
