.SILENT:

# how many instances we'd like
instances = 2
started = 2

help:
	echo "make"
	echo "  build - build the meteor project, create compose ENV file(s)"
	echo "  all - build, upload, start"
	echo "  start - start $(instances) containers"
	echo "  logs - tail logs"

all: build up start
ir: build-ir up-ir up-conf start
mono: build-mono up-conf start

up-ir:
	ssh monomorphist 'mkdir -p /opt/monomorphist/irhydra/irhydra/'
	-ssh monomorphist 'sudo chown vhf: -R /opt/monomorphist/irhydra/irhydra/'
	-rsync --progress -avhe ssh irhydra/irhydra/build monomorphist:/opt/monomorphist/irhydra/irhydra/

up-mono:
	-rsync --progress -avhe ssh monomorphist.tar.gz monomorphist:/opt/monomorphist/

up-conf:
	find . -name '*.DS_Store' -type f -ls -delete
	-rsync --progress -avhe ssh mononodes/tpl-* monomorphist:/opt/monomorphist/mononodes
	-rsync --progress -avhe ssh monoserver monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh monod8 monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh d8-artifacts monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh volume/start.sh monomorphist:/opt/monomorphist/volume/start.sh

up: up-ir up-mono up-conf

start:
	bash ./monoserver/seq-compose-up.sh $(started)

generate-env-files:
	bash ./monoserver/generate-env-files.sh $(instances)

build-ir:
	cd irhydra/irhydra && \
	pub get && \
	pub build

build-mono: generate-env-files
	bash ./monoserver/build-webapp-bundle.sh

build: build-ir build-mono
