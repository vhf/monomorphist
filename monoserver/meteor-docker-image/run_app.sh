# derived from the meteor-up project
# set -e
echo 'start'

if [ -f /bundle.tar.gz ]; then
  echo 'paf'
  mkdir -p /bundle
  cd /bundle
  cp /bundle.tar.gz .
  tar xzf *.tar.gz
  cd /bundle/bundle/programs/server/
  npm install --unsafe-perm
  cd /bundle/bundle/
else
  echo "=> No Meteor bundle found at /bundle.tar.gz - I give up."
  exit 1
fi

SERVER_NAME=$(echo $ROOT_URL | sed -r 's_^([^:/?#]+:)?(//([^/?#]*))?.*_\3_g')
sed -i s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/ /etc/nginx/nginx.conf
service nginx start &

echo "=> Starting meteor app: server_name: $SERVER_NAME port:$PORT"
node main.js
