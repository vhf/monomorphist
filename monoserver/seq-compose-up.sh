#!/bin/bash

function spawn() {
  echo "$(date) Spawning monomorphist"
  ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose up -d monomorphist" 2>&1 | grep 'up-to-date' &> /dev/null
  if [ $? == 0 ]; then
    echo "monomorphist config unchanged, restarting..."
    ssh monomorphist "docker stop monoserver_monomorphist_1"
    ssh monomorphist "docker rm monoserver_monomorphist_1"
    ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose up -d monomorphist"
  fi
  RET=1
  while [[ $RET != 0 ]]; do
    sleep 7
    ssh monomorphist "docker ps" 2>&1 | grep "monomorphist" | grep '(healthy)' &> /dev/null
    RET=$?
  done
  echo "$(date) monomorphist is healthy - moving on"
}

if [ "$1" ]; then
  N=$1
else
  N=1
fi

ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose build" 2>&1

for n in $(seq $N); do
  spawn $n
done

# make sure it's all up and get rid of orphans
ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose up -d --remove-orphans"
