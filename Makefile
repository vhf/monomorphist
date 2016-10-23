.SILENT:

# how many instances we'd like
instances = 3

help:
	echo "make"
	echo "  build - build the meteor project, create compose ENV file(s)"
	echo "  all - build, upload, start"
	echo "  start - start $(instances) containers"
	echo "  logs - tail logs"

all: build up start

up:
	find . -name '*.DS_Store' -type f -ls -delete
	ssh monomorphist 'mkdir -p /opt/monomorphist/irhydra/irhydra/'
	-rsync --progress -avhe ssh mononodes/tpl-* monomorphist:/opt/monomorphist/mononodes
	-ssh monomorphist 'sudo chown vhf: -R /opt/monomorphist/irhydra/irhydra/'
	-rsync --progress -avhe ssh irhydra/irhydra/build monomorphist:/opt/monomorphist/irhydra/irhydra/
	-rsync --progress -avhe ssh monoserver monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh monod8 monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh d8-artifacts monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh volume/start.sh monomorphist:/opt/monomorphist/volume/start.sh
	-rsync --progress -avhe ssh monomorphist.tar.gz monomorphist:/opt/monomorphist/

start:
	bash ./monoserver/seq-compose-up.sh $(instances)

generate-env-files:
	bash ./monoserver/generate-env-files.sh $(instances)

build-irhydra:
	cd irhydra/irhydra && \
	pub get && \
	pub build

build: build-irhydra generate-env-files
	bash ./monoserver/build-webapp-bundle.sh $(instances)

# backup:
# 	docker run --network traefik_traefik_enabled --rm --link monoserver_mongodb_1:mongo -v /opt/monomorphist/backup:/backup mongo:3.2 bash -c 'mongodump --out /backup --host mongo:27017'
