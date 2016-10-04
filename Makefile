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
	-rsync --progress -avhe ssh monoserver volume monomorphist:/opt/monomorphist
	-rsync --progress -avhe ssh mononodes/tpl-* monomorphist:/opt/monomorphist/mononodes

start:
	bash ./monoserver/seq-compose-up.sh $(instances)

build:
	bash ./monoserver/build-webapp-bundle.sh $(instances)

logs:
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose logs -f monomorphist-1 monomorphist-2 monomorphist-3'
