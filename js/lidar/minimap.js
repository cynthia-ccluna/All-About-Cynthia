/* ============================================================
   minimap.js — the RViz panel, bottom right.

   Draws, in RViz's own conventions:
     Map        white = scanned free space, ink = walls
     Grid       1 line per 5 m
     LaserScan  red hits from the current scan
     Path       green, where the robot has been
     Pose       the robot, an orange arrow
     Goals      orange diamonds on the route: solid once reached, hollow
                ahead (the next one pulses). Click one to drive there.
   It always shows the whole map; what has not been scanned yet is grey.
   ============================================================ */
(function () {
  'use strict';

  // a light RViz: white paper for mapped space, ink walls
  var C_BG = '#ECE6DC', C_FREE = [255, 255, 255], C_WALL = [43, 36, 32];
  var C_GRID = 'rgba(33,26,21,.07)', C_PATH = '#1FA463', C_SCAN = '#E5483B', C_MOOSE = '#FF7A3D';

  function create(canvas, map, onPick) {
    var ctx = canvas.getContext('2d');
    var off = document.createElement('canvas');
    off.width = map.GW; off.height = map.GH;
    var octx = off.getContext('2d');
    var img = octx.createImageData(map.GW, map.GH);
    var shown = 0;
    var W = 0, H = 0, dpr = 1;
    var goals = [];            // on-screen positions of the goals, for clicks
    var view = { x: 0, z: 0, k: 1, inset: 0 };

    // the whole route's footprint: the view always fits it
    var bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9, PAD = 7;
    for (var b = 0; b < map.route.length; b += 2) {
      bx0 = Math.min(bx0, map.route[b]); bx1 = Math.max(bx1, map.route[b]);
      bz0 = Math.min(bz0, map.route[b + 1]); bz1 = Math.max(bz1, map.route[b + 1]);
    }
    bx0 -= PAD; bx1 += PAD; bz0 -= PAD; bz1 += PAD;

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr; canvas.height = H * dpr;
    }

    function setCell(k, on) {
      var o = k * 4, c = map.occ[k] === 1 ? C_FREE : C_WALL;   // walls and the face in ink
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = on ? 255 : 0;
    }

    /* reveal (or hide, when scrolling back) cells up to progress u */
    function paint(u) {
      var want = map.countSeen(map.listSeen, u);
      if (want === shown) return;
      while (shown < want) setCell(map.list[shown++], true);
      while (shown > want) setCell(map.list[--shown], false);
      octx.putImageData(img, 0, 0);
    }

    var BAR = 24;              // the title bar covers the top of the map
    function sx(x) { return W / 2 + (x - view.x) * view.k; }
    function sy(z) { return H / 2 + view.inset + (z - view.z) * view.k; }

    /* state: u, x, z, hx, hz (heading), hits, hitCount, active, next, time */
    function draw(st) {
      if (!W) resize();
      paint(st.u);

      view.k = Math.min(W / (bx1 - bx0), (H - BAR) / (bz1 - bz0));
      view.x = (bx0 + bx1) / 2;
      view.z = (bz0 + bz1) / 2;
      view.inset = BAR / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C_BG;
      ctx.fillRect(0, 0, W, H);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, sx(map.X0), sy(map.Z0), map.GW * map.CELL * view.k, map.GH * map.CELL * view.k);

      // grid, 5 m
      ctx.strokeStyle = C_GRID; ctx.lineWidth = 1;
      ctx.beginPath();
      var step = view.k * 5 > 6 ? 5 : 10, x0 = Math.floor((view.x - W / 2 / view.k) / step) * step, z0 = Math.floor((view.z - H / 2 / view.k) / step) * step;
      if (view.k * step > 5) {
        for (var gx = x0; sx(gx) < W; gx += step) { ctx.moveTo(Math.round(sx(gx)) + 0.5, 0); ctx.lineTo(Math.round(sx(gx)) + 0.5, H); }
        for (var gz = z0; sy(gz) < H; gz += step) { ctx.moveTo(0, Math.round(sy(gz)) + 0.5); ctx.lineTo(W, Math.round(sy(gz)) + 0.5); }
      }
      ctx.stroke();

      // path so far
      var last = Math.floor(st.u * map.SAMPLES);
      ctx.strokeStyle = C_PATH; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var s = 0; s <= last; s++) {
        var px = sx(map.route[s * 2]), pz = sy(map.route[s * 2 + 1]);
        if (s) ctx.lineTo(px, pz); else ctx.moveTo(px, pz);
      }
      ctx.lineTo(sx(st.x), sy(st.z));
      ctx.stroke();

      // goals: solid once reached, hollow ahead; the next one pulses
      goals.length = 0;
      ctx.lineWidth = 1.4;
      map.rooms.forEach(function (r) {
        var gx = sx(r.px), gz = sy(r.pz);
        var reached = r.u <= st.u + 0.004, isNext = r.k === st.next;
        var sz = st.active === r.k ? 5 : 3.6;
        if (isNext) sz += 1.2 * (0.5 + 0.5 * Math.sin(st.time * 5));
        ctx.beginPath();
        ctx.moveTo(gx, gz - sz); ctx.lineTo(gx + sz, gz); ctx.lineTo(gx, gz + sz); ctx.lineTo(gx - sz, gz);
        ctx.closePath();
        ctx.globalAlpha = reached || isNext ? 1 : 0.45;
        if (reached) { ctx.fillStyle = C_MOOSE; ctx.fill(); }
        else { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); ctx.strokeStyle = C_MOOSE; ctx.stroke(); }
        ctx.globalAlpha = 1;
        goals.push({ x: gx, z: gz, k: r.k });
      });

      // laser scan
      ctx.fillStyle = C_SCAN;
      var hs = Math.max(1.5, Math.min(2.5, view.k * 0.5));
      for (var h = 0; h < st.hitCount; h++) {
        ctx.fillRect(sx(st.hits[h * 2]) - hs / 2, sy(st.hits[h * 2 + 1]) - hs / 2, hs, hs);
      }

      // robot pose arrow
      var rx = sx(st.x), rz = sy(st.z), a = Math.atan2(st.hz, st.hx);
      ctx.save();
      ctx.translate(rx, rz); ctx.rotate(a);
      ctx.fillStyle = C_MOOSE; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, 5); ctx.lineTo(-2.5, 0); ctx.lineTo(-5, -5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    function pickAt(e) {
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, z = e.clientY - r.top;
      for (var i = 0; i < goals.length; i++) {
        if (Math.hypot(goals[i].x - x, goals[i].z - z) < 9) return goals[i].k;
      }
      return -1;
    }
    canvas.addEventListener('click', function (e) { var k = pickAt(e); if (k >= 0) onPick(k); });
    canvas.addEventListener('mousemove', function (e) { canvas.style.cursor = pickAt(e) >= 0 ? 'pointer' : ''; });
    window.addEventListener('resize', resize);

    return { draw: draw, resize: resize };
  }

  window.LidarMinimap = { create: create };
})();
