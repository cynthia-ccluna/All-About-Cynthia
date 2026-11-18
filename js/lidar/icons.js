/* ============================================================
   icons.js — the little point-cloud object at each waypoint.

   Every icon is generated here from simple shapes (boxes, cylinders,
   ellipsoids, tubes) — no model files. Each function returns a flat
   array [x, y, z, x, y, z, …], base at y = 0, about 2.4 units tall.

   To change which icon a stop uses, set `icon` in scenes.js.
   ============================================================ */
(function () {
  'use strict';

  var rnd = Math.random;
  function jit(a) { return (rnd() - 0.5) * a; }

  /* ---------- primitives: each pushes n points into P ---------- */

  function box(P, cx, cy, cz, w, h, d, n) {
    var faces = [w * h, w * h, w * d, w * d, h * d, h * d], tot = 0, k;
    for (k = 0; k < 6; k++) tot += faces[k];
    for (var i = 0; i < n; i++) {
      var r = rnd() * tot, f = 0;
      while (r > faces[f]) { r -= faces[f]; f++; }
      var a = rnd() - 0.5, b = rnd() - 0.5, x, y, z;
      if (f < 2) { x = a * w; y = b * h; z = (f ? 0.5 : -0.5) * d; }
      else if (f < 4) { x = a * w; z = b * d; y = (f === 3 ? 0.5 : -0.5) * h; }
      else { y = a * h; z = b * d; x = (f === 5 ? 0.5 : -0.5) * w; }
      P.push(cx + x, cy + y, cz + z);
    }
  }

  /* cylinder along `axis` ('x' | 'y' | 'z'); caps: 0 none, 1 bottom, 2 both */
  function cyl(P, cx, cy, cz, r, h, n, axis, caps) {
    var side = 2 * Math.PI * r * h, cap = Math.PI * r * r, tot = side + cap * (caps || 0);
    for (var i = 0; i < n; i++) {
      var t = rnd() * Math.PI * 2, a, b, c;
      var pick = rnd() * tot;
      if (pick < side) { a = Math.cos(t) * r; b = Math.sin(t) * r; c = (rnd() - 0.5) * h; }
      else {
        var rr = Math.sqrt(rnd()) * r;
        a = Math.cos(t) * rr; b = Math.sin(t) * rr;
        c = (caps === 1 || pick < side + cap) ? -h / 2 : h / 2;
      }
      if (axis === 'x') P.push(cx + c, cy + a, cz + b);
      else if (axis === 'z') P.push(cx + a, cy + b, cz + c);
      else P.push(cx + a, cy + c, cz + b);
    }
  }

  /* ellipsoid surface; rotZ tilts it in the x–y plane; top = upper half only */
  function ell(P, cx, cy, cz, rx, ry, rz, n, rotZ, top) {
    var c = Math.cos(rotZ || 0), s = Math.sin(rotZ || 0);
    for (var i = 0; i < n; i++) {
      var x = jit(2), y = jit(2), z = jit(2), l = Math.sqrt(x * x + y * y + z * z) || 1;
      x = x / l * rx; y = y / l * ry; z = z / l * rz;
      if (top && y < 0) y = -y;
      P.push(cx + x * c - y * s, cy + x * s + y * c, cz + z);
    }
  }

  /* points along a curve fn(t) → [x, y, z], with radius r of scatter */
  function tube(P, fn, r, n) {
    for (var i = 0; i < n; i++) {
      var q = fn(rnd());
      P.push(q[0] + jit(r * 2), q[1] + jit(r * 2), q[2] + jit(r * 2));
    }
  }

  function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function bez(a, b, c) { return function (t) { return lerp3(lerp3(a, b, t), lerp3(b, c, t), t); }; }

  function transform(P, from, fn) {
    for (var i = from; i < P.length; i += 3) {
      var q = fn(P[i], P[i + 1], P[i + 2]);
      P[i] = q[0]; P[i + 1] = q[1]; P[i + 2] = q[2];
    }
  }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return function (x, y, z) { return [x * c + z * s, y, -x * s + z * c]; }; }
  function rotX(a, oy) { var c = Math.cos(a), s = Math.sin(a); return function (x, y, z) { y -= oy; return [x, oy + y * c - z * s, y * s + z * c]; }; }
  function scale(k) { return function (x, y, z) { return [x * k, y * k, z * k]; }; }

  /* ---------- the icons ---------- */
  var ICONS = {

    /* NTU DeepSpeed — a 1:10 F1TENTH car with its LiDAR puck */
    car: function () {
      var P = [];
      box(P, 0, 0.30, 0, 0.9, 0.06, 2.2, 320);
      box(P, 0, 0.52, 0.15, 0.62, 0.32, 1.1, 360);
      cyl(P, 0, 0.66, -0.72, 0.16, 0.18, 110, 'y', 2);
      [[-0.56, -0.75], [0.56, -0.75], [-0.56, 0.75], [0.56, 0.75]].forEach(function (w) {
        cyl(P, w[0], 0.26, w[1], 0.26, 0.2, 130, 'x', 2);
      });
      transform(P, 0, scale(1.25));
      transform(P, 0, rotY(-0.5));
      return P;
    },

    /* Robo@EEE / RoboCup@Home — a gripper about to pick up a mug */
    mug: function () {
      var P = [];
      cyl(P, 0, 0.55, 0, 0.5, 1.1, 520, 'y', 1);
      tube(P, function (t) { var a = -Math.PI / 2 + t * Math.PI; return [0.5 + 0.3 * Math.cos(a), 0.55 + 0.3 * Math.sin(a), 0]; }, 0.05, 160);
      box(P, -0.36, 1.62, 0, 0.08, 0.5, 0.22, 90);
      box(P, 0.36, 1.62, 0, 0.08, 0.5, 0.22, 90);
      box(P, 0, 1.92, 0, 0.86, 0.1, 0.26, 120);
      cyl(P, 0, 2.2, 0, 0.1, 0.46, 70, 'y', 0);
      return P;
    },

    /* Delta — a fire extinguisher, the kind of thing the VLM is asked about */
    extinguisher: function () {
      var P = [];
      cyl(P, 0, 0.75, 0, 0.38, 1.5, 620, 'y', 1);
      ell(P, 0, 1.5, 0, 0.38, 0.2, 0.38, 140, 0, true);
      box(P, 0, 1.8, 0, 0.14, 0.22, 0.14, 50);
      box(P, 0.16, 1.93, 0, 0.42, 0.05, 0.1, 50);
      tube(P, bez([0.08, 1.78, 0], [0.75, 1.65, 0.05], [0.6, 0.85, 0.12]), 0.04, 170);
      cyl(P, 0.6, 0.75, 0.12, 0.06, 0.22, 40, 'y', 0);
      return P;
    },

    /* URECA — an FPGA chip, tilted up so you can see the die */
    chip: function () {
      var P = [];
      box(P, 0, 0, 0, 1.6, 0.18, 1.6, 520);
      box(P, 0, 0.11, 0, 0.7, 0.04, 0.7, 140);
      for (var k = 0; k < 7; k++) {
        var o = -0.6 + k * 0.2;
        [[o, 0.9, 'z'], [o, -0.9, 'z'], [0.9, o, 'x'], [-0.9, o, 'x']].forEach(function (p) {
          if (p[2] === 'z') { box(P, p[0], 0, p[1], 0.08, 0.04, 0.22, 10); box(P, p[0], -0.14, p[1] * 1.12, 0.08, 0.3, 0.04, 10); }
          else { box(P, p[0], 0, p[1], 0.22, 0.04, 0.08, 10); box(P, p[0] * 1.12, -0.14, p[1], 0.04, 0.3, 0.08, 10); }
        });
      }
      transform(P, 0, rotX(-0.95, 0));
      transform(P, 0, function (x, y, z) { return [x, y + 1.25, z]; });
      return P;
    },

    /* Hearing Hypertension — a heart (Taubin's heart surface) */
    heart: function () {
      var P = [], tries = 0;
      while (P.length < 1300 * 3 && tries++ < 600000) {
        var x = jit(2.6), y = jit(1.8), z = -1.15 + rnd() * 2.5;
        var a = x * x + 2.25 * y * y + z * z - 1;
        var f = a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z;
        if (Math.abs(f) < 0.012) P.push(x, z, y);
      }
      // flatter than the true surface, so it reads as a heart, not a ball
      transform(P, 0, function (x, y, z) { return [x * 1.05, (y + 1.2) * 1.05, z * 0.6]; });
      return P;
    },

    /* Teaching — a graduation cap */
    mortarboard: function () {
      var P = [];
      box(P, 0, 1.45, 0, 1.8, 0.06, 1.8, 520);
      transform(P, 0, rotY(Math.PI / 4));
      cyl(P, 0, 1.15, 0, 0.56, 0.56, 300, 'y', 0);
      ell(P, 0, 1.5, 0, 0.07, 0.04, 0.07, 30);
      tube(P, bez([0, 1.5, 0], [0.8, 1.52, 0], [1.25, 1.46, 0]), 0.025, 90);
      tube(P, function (t) { return [1.25, 1.46 - t * 0.6, 0]; }, 0.025, 60);
      ell(P, 1.25, 0.78, 0, 0.07, 0.16, 0.07, 70);
      return P;
    },

    /* Off the Clock — two beamed eighth notes */
    note: function () {
      var P = [];
      ell(P, -0.55, 0.38, 0, 0.34, 0.23, 0.22, 260, 0.4);
      ell(P, 0.6, 0.62, 0, 0.34, 0.23, 0.22, 260, 0.4);
      cyl(P, -0.25, 1.28, 0, 0.04, 1.75, 120, 'y', 0);
      cyl(P, 0.9, 1.52, 0, 0.04, 1.75, 120, 'y', 0);
      for (var i = 0; i < 260; i++) {
        var t = rnd(), x = -0.25 + t * 1.15, y = 2.06 + t * 0.24 + rnd() * 0.18;
        P.push(x, y, jit(0.16));
      }
      return P;
    },

    /* 日本語 — the torii */
    torii: function () {
      var P = [], from;
      cyl(P, -0.85, 1.1, 0, 0.11, 2.2, 260, 'y', 0);
      cyl(P, 0.85, 1.1, 0, 0.11, 2.2, 260, 'y', 0);
      cyl(P, -0.85, 0.07, 0, 0.15, 0.14, 40, 'y', 2);
      cyl(P, 0.85, 0.07, 0, 0.15, 0.14, 40, 'y', 2);
      from = P.length;
      box(P, 0, 2.34, 0, 2.7, 0.14, 0.26, 330);
      transform(P, from, function (x, y, z) { var e = x / 1.35; return [x, y + 0.12 * e * e * e * e, z]; });
      box(P, 0, 2.18, 0, 2.3, 0.1, 0.2, 200);
      box(P, 0, 1.76, 0, 2.15, 0.1, 0.14, 190);
      box(P, 0, 1.97, 0, 0.12, 0.32, 0.1, 30);
      return P;
    }
  };

  window.LIDAR_ICONS = ICONS;
})();
