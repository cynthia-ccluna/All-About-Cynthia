/* ============================================================
   site.js — nav, scroll animation, media slots, marquee,
   event rail, click-through galleries, the credo, the score
   Shared by index.html and travel.html
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function svgArrow(back) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      (back ? '<path d="M19 12H5M11 6l-6 6 6 6"/>' : '<path d="M5 12h14M13 6l6 6-6 6"/>') +
      '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- nav ---------------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');

  if (nav && !nav.classList.contains('is-stuck')) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- event cards ----------------
     Built from js/events-data.js. Everything is on the card itself:
     photo (or a results sheet), then date, name, and result underneath. */
  function eventCard(ev) {
    var li = document.createElement('li');
    li.className = 'ev';
    var top;
    if (ev.results) {
      top = '<div class="ev__sheet">' +
        '<span class="ev__sheet-kicker">Results</span>' +
        ev.results.map(function (r) {
          return '<div class="ev__league">' +
            '<b>' + esc(r.league) + '</b><i>' + esc(r.at) + '</i>' +
            '<dl>' + r.rows.map(function (row) {
              return '<div><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) +
                (row[2] ? '<small>' + esc(row[2]) + '</small>' : '') + '</dd></div>';
            }).join('') + '</dl>' +
          '</div>';
        }).join('') +
      '</div>';
    } else {
      top = '<figure class="ev__media gallery" data-gallery>' +
        ev.images.map(function (src, n) {
          return '<img src="' + esc(src) + '" alt="' + esc(ev.name) + '"' +
            (n ? ' hidden' : '') + ' loading="lazy" draggable="false">';
        }).join('') +
      '</figure>';
    }
    li.innerHTML = top +
      '<div class="ev__meta">' +
        '<span class="ev__when">' + esc(ev.date) + ' &middot; ' + esc(ev.place) + '</span>' +
        '<span class="ev__name">' + esc(ev.name) + '</span>' +
        (ev.title && ev.title !== ev.name ? '<span class="ev__title">' + esc(ev.title) + '</span>' : '') +
        (ev.result ? '<span class="ev__result">' + esc(ev.result) + '</span>' : '') +
        (ev.note ? '<span class="ev__note">' + esc(ev.note) + '</span>' : '') +
      '</div>';
    return li;
  }

  var hh = document.getElementById('hhEvents');
  if (hh && typeof HH_EVENTS !== 'undefined') {
    HH_EVENTS.forEach(function (ev) { hh.appendChild(eventCard(ev)); });
  }

  var rail = document.getElementById('eventRail');
  if (rail && typeof RACE_EVENTS !== 'undefined') {
    RACE_EVENTS.forEach(function (ev) { rail.appendChild(eventCard(ev)); });

    var step = function () {
      var card = rail.querySelector('.ev');
      return card ? card.getBoundingClientRect().width + 16 : 300;
    };

    /* ---- drag the car to drive the rail ----
       The car's position along the track is the rail's scroll position.
       Scrolling the rail any other way (trackpad, keys) moves the car. */
    var drive = document.querySelector('[data-drive]');
    var car = drive && drive.querySelector('.drive__car');
    if (car) {
      var lastX = 0, dragging = false, grabX = 0;
      var maxScroll = function () { return rail.scrollWidth - rail.clientWidth; };
      var room = function () { return drive.clientWidth - car.offsetWidth; };

      var place = function () {
        var m = maxScroll();
        drive.classList.toggle('is-idle', m <= 1);
        var p = m > 1 ? Math.min(1, Math.max(0, rail.scrollLeft / m)) : 0;
        var x = p * room();
        if (Math.abs(x - lastX) > 0.5) car.classList.toggle('is-reversing', x < lastX);
        lastX = x;
        // wheel radius is ~13px at the car's rendered size
        car.style.setProperty('--x', x.toFixed(1) + 'px');
        car.style.setProperty('--spin', (x / 13 * 57.3).toFixed(0) + 'deg');
        car.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      };
      var driveTo = function (x, smooth) {
        var r = room();
        var p = r > 0 ? Math.min(1, Math.max(0, x / r)) : 0;
        rail.scrollTo({ left: p * maxScroll(), behavior: smooth && !reduced ? 'smooth' : 'auto' });
      };

      rail.addEventListener('scroll', place, { passive: true });
      window.addEventListener('resize', place);
      window.addEventListener('load', place);
      place();

      car.addEventListener('pointerdown', function (e) {
        dragging = true;
        grabX = e.clientX - lastX;
        car.setPointerCapture(e.pointerId);
        car.classList.add('is-driving');
        e.preventDefault();
      });
      car.addEventListener('pointermove', function (e) {
        if (dragging) driveTo(e.clientX - grabX, false);
      });
      var release = function () { dragging = false; car.classList.remove('is-driving'); };
      car.addEventListener('pointerup', release);
      car.addEventListener('pointercancel', release);

      // click anywhere on the track and the car drives there
      drive.addEventListener('pointerdown', function (e) {
        if (car.contains(e.target)) return;
        var box = drive.getBoundingClientRect();
        driveTo(e.clientX - box.left - car.offsetWidth / 2, true);
      });

      car.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowLeft') {
          rail.scrollBy({ left: (k === 'ArrowRight' ? 1 : -1) * step(), behavior: reduced ? 'auto' : 'smooth' });
        } else if (k === 'Home' || k === 'End') {
          rail.scrollTo({ left: k === 'Home' ? 0 : maxScroll(), behavior: reduced ? 'auto' : 'smooth' });
        } else return;
        e.preventDefault();
      });
    }
  }

  /* ---------------- click-through galleries ---------------- */
  document.querySelectorAll('[data-gallery]').forEach(function (fig) {
    var imgs = Array.prototype.slice.call(fig.querySelectorAll('img'));
    if (imgs.length < 2) { fig.classList.add('gallery--single'); return; }

    var i = 0;
    var ui = document.createElement('div');
    ui.className = 'gallery__ui';
    ui.innerHTML =
      '<span class="gallery__dots">' +
        imgs.map(function (_, n) { return '<i' + (n ? '' : ' class="is-on"') + '></i>'; }).join('') +
      '</span>' +
      '<button class="gallery__next" type="button" aria-label="Next picture">' + svgArrow() + '</button>';
    fig.appendChild(ui);

    var dots = ui.querySelectorAll('.gallery__dots i');
    function show(n) {
      imgs[i].hidden = true;
      dots[i].classList.remove('is-on');
      i = (n + imgs.length) % imgs.length;
      imgs[i].hidden = false;
      dots[i].classList.add('is-on');
    }
    var advance = function (e) { e.preventDefault(); show(i + 1); };
    fig.addEventListener('click', advance);
    ui.querySelector('.gallery__next').addEventListener('click', advance);
  });

  /* ---------------- the score ----------------
     Opens itself once it scrolls into view; the sheet also toggles it. */
  var score = document.querySelector('[data-score]');
  if (score) {
    var toggle = score.querySelector('[data-score-toggle]');
    var setOpen = function (open) {
      score.classList.toggle('is-open', open);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        var cue = toggle.querySelector('.score__cue');
        if (cue) cue.textContent = open ? 'Close' : 'Open';
      }
    };
    if (toggle) toggle.addEventListener('click', function () {
      setOpen(!score.classList.contains('is-open'));
    });
    if (reduced || !('IntersectionObserver' in window)) {
      setOpen(true);
    } else {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          setTimeout(function () { setOpen(true); }, 260);
          so.unobserve(e.target);
        });
      }, { threshold: 0.3 });
      so.observe(score);
    }
  }

  /* ---------------- the credo ----------------
     The big lines are split into words so they can rise one at a time.
     The text itself stays plain in index.html — edit it there. */
  document.querySelectorAll('[data-credo] .credo__big').forEach(function (line) {
    var words = line.textContent.trim().split(/\s+/);
    var before = 0;
    line.innerHTML = words.map(function (w, n) {
      var span = '<span class="w" style="--wi:' + n + ';--wc:' + before + ';--wl:' + w.length + '">' +
        esc(w) + '</span>';
      before += w.length;
      return span;
    }).join(' ');
  });

  /* ---------------- scroll animation ---------------- */
  var animated = document.querySelectorAll('.reveal, .lines, .uncover');

  document.querySelectorAll('.lines').forEach(function (h) {
    h.querySelectorAll('.line > span').forEach(function (s, i) {
      s.style.setProperty('--d', (i * 90) + 'ms');
    });
  });

  if (reduced || !('IntersectionObserver' in window)) {
    animated.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    animated.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- marquee ---------------- */
  document.querySelectorAll('[data-marquee]').forEach(function (row) {
    var clone = row.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    row.parentElement.appendChild(clone);
  });

  /* ---------------- media slots ---------------- */
  function markEmpty(fig, path) {
    if (!fig) return;
    fig.classList.add('is-empty');
    fig.setAttribute('data-slot', 'DROP FILE HERE\n' + path);
  }
  document.querySelectorAll('.media').forEach(function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    var src = img.getAttribute('src') || '';
    if (img.complete) { if (!img.naturalWidth) markEmpty(fig, src); }
    else img.addEventListener('error', function () { markEmpty(fig, src); });
  });

  /* images outside a .media simply step aside if they are missing */
  document.querySelectorAll('.hero__side img, .intro__media img, .gallery img, .teaser__bg img, .score__item img')
    .forEach(function (img) {
      var hide = function () {
        var g = img.closest('[data-gallery]');
        img.remove();
        if (g) g.classList.toggle('gallery--single', g.querySelectorAll('img').length < 2);
      };
      if (img.complete) { if (!img.naturalWidth) hide(); }
      else img.addEventListener('error', hide);
    });

  /* ---------------- year ---------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
