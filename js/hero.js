/* ============================================================
   hero.js — the split hero.

   Machine panel on the left, Cynthia on the right, the two cards
   between them. Hovering either card (or either panel) widens that
   side, brings it back to full colour and eases the other away.
   ============================================================ */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var locked = null;
  var hovered = null;

  function apply() {
    var side = locked || hovered;
    hero.classList.toggle('side-machine', side === 'machine');
    hero.classList.toggle('side-human',   side === 'human');
  }

  function bind(el) {
    var side = el.getAttribute('data-side');
    if (!side) return;
    el.addEventListener('pointerenter', function () { hovered = side; apply(); });
    el.addEventListener('pointerleave', function () { hovered = null;  apply(); });
    el.addEventListener('focus',        function () { hovered = side; apply(); });
    el.addEventListener('blur',         function () { hovered = null;  apply(); });
  }
  hero.querySelectorAll('[data-side]').forEach(bind);

  /* ---- the marker scribble draws itself once it is on screen ---- */
  hero.querySelectorAll('[data-mark] path').forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 1200;
    p.style.setProperty('--len', len.toFixed(0));
    var mark = p.closest('.mark');
    if (reduced) { mark.classList.add('is-drawn'); return; }
    setTimeout(function () { mark.classList.add('is-drawn'); }, 900);
  });

  /* ---- a whisper of parallax on the two panels ---- */
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    var panels = hero.querySelectorAll('.hero__side img');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var dy = (e.clientY - r.top) / r.height - 0.5;
      panels.forEach(function (img, i) {
        var dir = i === 0 ? 1 : -1;
        img.style.translate = '0 ' + (dy * 14 * dir).toFixed(1) + 'px';
      });
    });
    hero.addEventListener('pointerleave', function () {
      panels.forEach(function (img) { img.style.translate = '0 0'; });
    });
  }
})();
