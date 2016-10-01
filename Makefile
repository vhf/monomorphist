.PHONY: do
.SILENT:

help:
	echo "make"
	echo "  build - build the meteor project"
	echo "  do - build fix upload start"
	echo "  up - fix settings and upload"
	echo "  start - compose up"
	echo "  logs - tail logs"

do: build up

fix-settings:
	bash ./monoserver/fix-settings.sh

up: fix-settings
	-rsync --progress -avhe ssh mononodes monoserver volume monomorphist:/opt/monomorphist

start:
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose up -d --remove-orphans'

build:
	bash ./monoserver/build-webapp-bundle.sh

logs:
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose logs -f monomorphist'
