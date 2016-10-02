FROM abernix/meteord:base

RUN curl -L https://github.com/docker/compose/releases/download/1.8.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

HEALTHCHECK CMD curl --fail http://localhost:80/ || exit 1

ENTRYPOINT bash /opt/meteord/run_app.sh
