import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';

import Logs from '/imports/api/logs/collection';

Meteor.methods({
  'docker:imageTags'(repo) {
    check(repo, String);
    try {
      const auth = HTTP.get(`https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repo}:pull`);
      const { token } = JSON.parse(auth.content);
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const response = HTTP.get(`https://index.docker.io/v2/${repo}/tags/list`, { headers });
      const { tags } = JSON.parse(response.content);
      return tags;
    } catch (e) {
      Logs.insert({
        type: 'refresh',
        queue: 'build-v8',
        title: 'docker:imageTags error',
        message: e,
      });
      return false;
    }
  },
});
