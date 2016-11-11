import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Cookie } from 'meteor/chuangbo:cookie';

import Nodes from '/imports/api/nodes/collection';
import { fixJobQueueHeight } from '/imports/ui/utils';

function deleteAllCookies() {
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

Template.layout.onCreated(function onCreated() {
  this.autorun(() => {
    this.subscribe('nodes');
  });
});

Template.layout.helpers({
  rebuilding() {
    const isAdmin = FlowRouter.current().path.startsWith('/admin');
    // at least one node is being rebuilt
    return !isAdmin && Nodes.find({ toBuild: true }, { fields: { _id: 1 } }).count() > 0;
  },
});

Template.layout.onRendered(() => {
  const breaker = Cookie.get('break');
  if (!breaker) {
    Cookie.set('break', '1', { expires: 120 });
  } else {
    const broken = parseInt(breaker, 10);
    Cookie.set('break', `${broken + 1}`, { expires: 30 });
    if (broken >= 2) {
      deleteAllCookies();
    }
  }
  const adjust = 36;
  $(window).scroll(() => {
    const $btn = $('.new-btn-wrapper');
    const $queue = $('.job-queue');
    const scroll = $(window).scrollTop();
    if ($btn.hasClass('adjust') && $queue.hasClass('adjust') && scroll > adjust) {
      $btn.removeClass('adjust');
      $queue.removeClass('adjust');
    }
    if (!$btn.hasClass('adjust') && !$queue.hasClass('adjust') && scroll < adjust) {
      $btn.addClass('adjust');
      $queue.addClass('adjust');
    }

    fixJobQueueHeight();
  });
});
