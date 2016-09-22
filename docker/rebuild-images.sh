#!/bin/sh
cd `dirname $0`
cat docker-compose-pre.yml > docker-compose.yml

mkdir -p build
rm -f build/*

declare -a images=("latest" "6.5" "6.5.0" "5.12" "5.12.0" "4.5" "4.5.0" "0.12" "0.12.15" "0.10" "0.10.46")

for image in "${images[@]}"
do
cat > Dockerfile.$image <<- EOM
FROM mhart/alpine-node:$image
WORKDIR /src
ADD . .
RUN apk add --no-cache make gcc g++ python
CMD ["/start.sh"]
EOM

cat >> docker-compose.yml <<- EOM
  node-$image:
    image: node-$image
    build:
      context: ./build
      dockerfile: Dockerfile.$image
    environment:
      - VERSION=$image
    volumes:
      - /opt/node/start.sh:/start.sh
      - /opt/node/src:/src
    network_mode: none
    labels:
      - "node_container=1"
    logging:
      driver: syslog
      options:
        syslog-address: "tcp://localhost:1337"

EOM
done

cat docker-compose-post.yml >> docker-compose.yml

mv Dockerfile* build/
docker-compose build
