.PHONY: do

do: build-webapp up

fix-settings:
	bash ./monoserver/fix-settings.sh

up: fix-settings
	-rsync --progress -avhe ssh mononodes monoserver volume monomorphist:/opt/monomorphist
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose up -d --remove-orphans && docker-compose restart'

build-webapp:
	bash ./monoserver/build-webapp-bundle.sh

logs:
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose logs -f monomorphist'
