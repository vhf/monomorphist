#!/bin/bash

function spawn() {
  echo "$(date) Spawning monomorphist-$1"
  ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose up -d monomorphist-$1" 2>&1 | grep 'up-to-date' &> /dev/null
  if [ $? == 0 ]; then
    echo "monomorphist-$1 config unchanged, restarting..."
    ssh monomorphist "docker stop monoserver_monomorphist-$1_1"
    ssh monomorphist "docker rm monoserver_monomorphist-$1_1"
    ssh monomorphist "cd /opt/monomorphist/monoserver && docker-compose up -d monomorphist-$1"
  fi
  RET=1
  while [[ $RET != 0 ]]; do
    sleep 7
    ssh monomorphist "docker ps" 2>&1 | grep "monomorphist-$1" | grep '(healthy)' &> /dev/null
    RET=$?
  done
  echo "$(date) monomorphist-$1 is healthy - moving on"
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
