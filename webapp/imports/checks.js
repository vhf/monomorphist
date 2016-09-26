import { check, Match } from 'meteor/check';

const Checks = {  // eslint-disable-line import/prefer-default-export
  Id: Match.Where(x => { // eslint-disable-line new-cap
    check(x, String);
    return /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/.test(x);
  }),
};

export default Checks;
