#!/bin/bash
cwd=$(dirname $0)
cd $cwd

BASE_FILE=meteor.env

echo "Generating environment files"

sed=$(which sed)
if [ "${OSTYPE//[0-9.]/}" == "darwin" ]
then
  sed=$(which gsed)
  [ -f $sed ] && echo "Using GNU sed" || echo "You need GNU sed: brew install gnu-sed"
elif  [ "${OSTYPE//[0-9.]/}" == "linux-gnu" ]
then
  sed=$(which sed)
fi

TAG=$(git describe --tags --abbrev=0)

# we load into this script all bash variables 'export'ed by meteor.env.secret
[ -f ./meteor.env.secret ] && source ./meteor.env.secret

FILE=meteor.env.prod
rm -f $FILE

# -c minifies the JSON
# |= updates the serverInstance value in settings.json
SETTINGS=$(jq -c ".public.serverInstance |= 1" < ../webapp/settings.json)

# now with $UA variable from meteor.env.secret, we update the JSON
SETTINGS=$(echo $SETTINGS | jq -c --arg x "$UA" '.public.analyticsSettings["Google Analytics"].trackingId |= $x')
echo "Installed UA settings: $UA"

# update oauth settings for prod
SETTINGS=$(echo $SETTINGS | jq -c --arg x "$OAUTH_GITHUB_CLIENT" '.githubOauthClientId |= $x')
SETTINGS=$(echo $SETTINGS | jq -c --arg x "$OAUTH_GITHUB_SECRET" '.githubOauthSecret |= $x')
SETTINGS=$(echo $SETTINGS | jq -c --arg x "$GITHUB_AUTHORIZED_USERNAMES" '.githubAuthorizedUsernames |= ($x | fromjson)')
echo "Installed oauth settings:"
echo "github: $OAUTH_GITHUB_CLIENT / $OAUTH_GITHUB_SECRET / $GITHUB_AUTHORIZED_USERNAMES"

# git tag
SETTINGS=$(echo $SETTINGS | jq -c --arg x "$TAG" '.public.gittag |= $x')
echo "Tagged: $TAG"
# finally we write the JSON string
LINE="METEOR_SETTINGS=$SETTINGS"
cat $BASE_FILE > $FILE

# append settings env var
echo $LINE >> $FILE

# if we got secret sauce to add, add secret sauce
[ -f ./meteor.env.secret ] && grep '#MAIL_URL=' meteor.env.secret | $sed 's/^##*//' >> $FILE
[ -f ./meteor.env.secret ] && grep '#PREPEND=' meteor.env.secret | $sed 's/^##*//' >> $FILE

source meteor.env
SERVER_NAME=$(echo $ROOT_URL | $sed -r 's_^([^:/?#]+:)?(//([^/:?#]*))?.*_\3_g')

cat tpl-nginx.conf | $sed s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/ > nginx.conf
