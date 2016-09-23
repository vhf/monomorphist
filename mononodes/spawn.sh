#!/bin/bash
COMPOSE_PROJECT_NAME=$1 docker-compose create
COMPOSE_PROJECT_NAME=$1 docker-compose start ${@:2}

# for node in ${@:2}; do
# COMPOSE_PROJECT_NAME=$1 docker-compose run -e ${@:2}
