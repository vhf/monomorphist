import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

const { githubOauthClientId, githubOauthSecret, githubAuthorizedUsernames } = Meteor.settings;

ServiceConfiguration.configurations.update(
  { service: 'github' },
  {
    $set: {
      clientId: githubOauthClientId,
      secret: githubOauthSecret,
    },
  },
  { upsert: true },
);

Accounts.validateLoginAttempt((attempt: Object): boolean => {
  if (attempt.user.services && attempt.user.services.github) {
    if (githubAuthorizedUsernames.indexOf(attempt.user.services.github.username) !== -1) {
      return true;
    }
  }
  return false;
});
