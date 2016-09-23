.PHONY: do

do: build-webapp up

up:
	-rsync --progress -avhe ssh mononodes monoserver volume monomorphist:/opt/monomorphist
	ssh monomorphist '/opt/monomorphist/mononodes/generate-compose.sh && cd /opt/monomorphist/mononodes/ && docker-compose build'
	ssh monomorphist 'cd /opt/monomorphist/monoserver && docker-compose up -d --remove-orphans && docker-compose restart'

build-webapp:
	bash ./monoserver/build-webapp-bundle.sh
