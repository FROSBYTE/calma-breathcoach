(function () {
  'use strict';

  var noMenu = function (e) { e.preventDefault(); };

  // Discourage saving videos: no right-click menu, no download/PiP/remote-playback options
  var allVideos = [].slice.call(document.querySelectorAll('video'));
  allVideos.forEach(function (v) {
    v.setAttribute('controlsList', 'nodownload noremoteplayback');
    v.setAttribute('disablePictureInPicture', '');
    v.setAttribute('disableRemotePlayback', '');
    v.addEventListener('contextmenu', noMenu);
    if (v.parentElement) v.parentElement.addEventListener('contextmenu', noMenu);
  });

  // Lazy-load videos that use data-src: load near the viewport, play on screen, pause off screen
  var lazy = allVideos.filter(function (v) { return v.hasAttribute('data-src'); });
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function load(v) {
    if (!v.getAttribute('data-src')) return;
    v.src = v.getAttribute('data-src');
    v.removeAttribute('data-src');
    play(v);
  }
  if (lazy.length) {
    if (!('IntersectionObserver' in window)) {
      lazy.forEach(load);
    } else {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) { load(v); if (v.paused) play(v); }
          else if (!v.paused) v.pause();
        });
      }, { rootMargin: '300px 0px' });
      lazy.forEach(function (v) { vio.observe(v); });
    }
  }

  // Sound control on every guide video (same look as the home page hero)
  var vids = [].slice.call(document.querySelectorAll('.article .frame video'));
  var ICON_MUTED = '<svg class="icon-muted" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  var ICON_SOUND = '<svg class="icon-sound" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var controls = [];

  function muteOthers(current) {
    controls.forEach(function (c) {
      if (c.video !== current && !c.video.muted) { c.video.muted = true; c.sync(); }
    });
  }

  vids.forEach(function (v) {
    var frame = v.closest('.frame');
    var box = document.createElement('div');
    box.className = 'hero-sound';
    box.innerHTML =
      '<input type="range" class="hero-sound-slider" min="0" max="1" step="0.05" value="0.6" aria-label="Video volume">' +
      '<button type="button" class="hero-sound-btn" aria-label="Unmute video" aria-pressed="false">' + ICON_MUTED + ICON_SOUND + '</button>';
    frame.appendChild(box);
    box.addEventListener('contextmenu', noMenu);

    var btn = box.querySelector('button');
    var slider = box.querySelector('input');

    function sync() {
      var on = !v.muted && v.volume > 0;
      box.classList.toggle('is-unmuted', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Mute video' : 'Unmute video');
    }

    v.muted = true;
    v.volume = parseFloat(slider.value);

    btn.addEventListener('click', function () {
      if (v.muted || v.volume === 0) {
        muteOthers(v);
        v.muted = false;
        if (v.volume === 0) { v.volume = 0.6; slider.value = 0.6; }
      } else {
        v.muted = true;
      }
      sync();
    });

    slider.addEventListener('input', function () {
      var val = parseFloat(slider.value);
      if (val > 0) muteOthers(v);
      v.volume = val;
      v.muted = val === 0;
      sync();
    });

    v.addEventListener('volumechange', sync);
    controls.push({ video: v, sync: sync });
    sync();
  });

  // Table of contents: highlight the section being read
  var tocLinks = [].slice.call(document.querySelectorAll('.toc-side a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('active'); });
          var a = map[e.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) tio.observe(el);
    });
  }

  // Back to top: appears once you have scrolled down a little
  var toTop = document.getElementById('back-to-top');
  if (toTop) {
    var ticking = false;
    var update = function () {
      ticking = false;
      toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    update();
  }

  // Guides dropdown in the header
  var btns = [].slice.call(document.querySelectorAll('[data-guides-btn]'));
  if (btns.length) {
    var closeAll = function () {
      btns.forEach(function (b) {
        var p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.classList.add('hidden');
        b.setAttribute('aria-expanded', 'false');
      });
    };
    btns.forEach(function (b) {
      var p = document.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasHidden = p.classList.contains('hidden');
        closeAll();
        if (wasHidden) { p.classList.remove('hidden'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-guides-panel]')) closeAll();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }
})();
