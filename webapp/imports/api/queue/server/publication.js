import { Meteor } from 'meteor/meteor';
import Queue from '../collection';

Meteor.publish('queue', () => Queue.find({}, { fields: { data: 0 } }));
