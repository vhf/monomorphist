.PHONY: do
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
	ssh monomorphist mkdir -p /opt/monomorphist/irhydra/irhydra/
	-rsync --progress -avhe ssh mononodes/tpl-* monomorphist:/opt/monomorphist/mononodes
	-rsync --progress -avhe ssh irhydra/irhydra/build monomorphist:/opt/monomorphist/irhydra/irhydra/
	-rsync --progress -avhe ssh monoserver monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh volume monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh monomorphist.tar.gz monomorphist:/opt/monomorphist/monoserver
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

logs:
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose logs -f monomorphist-1 monomorphist-2 monomorphist-3'

upconf: generate-env-files
	-rsync --progress -avhe ssh monoserver/meteor* monomorphist:/opt/monomorphist/monoserver
