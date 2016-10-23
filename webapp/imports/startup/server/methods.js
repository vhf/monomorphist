import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';

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
      return false;
    }
  },
});
