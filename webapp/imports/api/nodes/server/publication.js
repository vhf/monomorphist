import { Meteor } from 'meteor/meteor';
import Nodes from '../collection';

Meteor.publish('nodes', () => Nodes.find({}));
