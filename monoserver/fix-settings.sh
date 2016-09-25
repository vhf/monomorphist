#!/bin/bash
cwd=$(dirname $0)
cd $cwd
SETTINGS=$(jq -c . < ../webapp/settings.json)
LINE="METEOR_SETTINGS=$SETTINGS"
grep -v METEOR_SETTINGS meteor.env > meteor.env.tmp
echo $LINE >> meteor.env.tmp
rm meteor.env
mv meteor.env.tmp meteor.env


