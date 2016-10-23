import { Meteor } from 'meteor/meteor';
import V8 from '../collection';

Meteor.publish('v8', () => V8.find({}));
