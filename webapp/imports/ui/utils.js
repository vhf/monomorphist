function fixJobQueueHeight() {
  let visibleFooterHeight = $(window).height() - ($('.page-footer').offset().top - $(window).scrollTop());
  if (visibleFooterHeight < 0) {
    visibleFooterHeight = 0;
  }
  if ($('.job-queue').hasClass('adjust')) {
    $('.job-queue').css('max-height', `calc(100vh - ${130 + visibleFooterHeight}px)`);
  } else {
    $('.job-queue').css('max-height', `calc(100vh - ${80 + visibleFooterHeight}px)`);
  }
}

export { fixJobQueueHeight };
