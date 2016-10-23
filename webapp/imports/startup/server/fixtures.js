// import { Meteor } from 'meteor/meteor';
//
// import Nodes from '/imports/api/nodes/collection';
//
// if (Nodes.find({ enabled: true }).count() < 1) {
//   // if no nodes, create them
//   Meteor.call('nodes:imagesUpdate');
// } else {
//   const latestNightlies = Nodes.find({ enabled: true, nightly: true }, { sort: { version: -1 } }).fetch();
//   if (latestNightlies.length) {
//     const latestNightly = latestNightlies[0];
//     const date = latestNightly.date;
//     const now = new Date();
//     // if latest nightly was created more than 48h ago, create it again
//     if ((((+now) - (+date)) / 1000 / 60 / 60) > 48) {
//       Meteor.call('nodes:imagesUpdate');
//     }
//   }
// }
