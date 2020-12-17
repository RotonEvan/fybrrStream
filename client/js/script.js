(function($){'use strict';$('.animsition').animsition({loadingClass:'preloader',loadingInner:'<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'});$('.a-nav-toggle').on('click',function(){if($('html').hasClass('body-menu-opened')){$('html').removeClass('body-menu-opened').addClass('body-menu-close');}else{$('html').addClass('body-menu-opened').removeClass('body-menu-close');}});var offset=$('.header').outerHeight()+200;if($('.a-affix').length){$(window).scroll(function(){var scroll=$(window).scrollTop();if(scroll>=offset){$('.header').addClass('header-affix');}else{$('.header').removeClass('header-affix');}});};$('.navbar-nav a, .menu-main a, .a-scroll').bind('click',function(event){var $anchor=$(this);$('html, body').stop().animate({scrollTop:$($anchor.attr('href')).offset().top},1000);event.preventDefault();});$('.menu-main a').on('click',function(){$('html').removeClass('body-menu-opened').addClass('body-menu-close');});}($));
function copyLink() {
  var dummy = document.createElement('input'),
      text = window.location.href;
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
  //alert("Copied the text: " + dummy.value);
  document.getElementsByClassName('copy-button')[0].innerHTML = 'Copied!  <i class="fa fa-check"></i>';
  setTimeout(function() {
  document.getElementsByClassName('copy-button')[0].innerHTML = 'Copy meeting link  <i class="fa fa-copy"></i>';
}, 4000);
};
function getLink() {
  // alert("Getlink called");
  //document.getElementById("meetLink").setAttribute("value", window.location.href);
}
