/* ============================================================
   map.js — the occupancy grid the robot "builds" as it drives.

   One grid serves both the 3D walls and the RViz minimap:
     - a corridor follows the route (free inside, wall along the edge)
     - the face (LIDAR_FACE) is drawn in when the loop closes
     - every cell remembers the route progress `u` at which it first
       came within LiDAR range — that is when it appears on the map.
   occ values: 0 unknown, 1 free, 2 wall, 3 face
   ============================================================ */
(function () {
  'use strict';

  var CELL = 0.5;             // metres per grid cell
  var X0 = -78, Z0 = -176;    // world position of cell (0, 0)
  var GW = 312, GH = 384;     // grid size in cells
  var SAMPLES = 1600;         // route samples used for the sweep
  var SCAN_R = 14;            // LiDAR range
  var HALF = 4;               // corridor half-width
  var WALL = 0.7;             // wall thickness
  var ROOM_OFF = 7.5;         // icons stand this far to the right of the route
  var FACE_W = 0.85;          // half-width of a face stroke
  var FACE_SEEN = 0.997;      // the face appears just as the loop closes

  /* is world point (x, y-up) on one of the face strokes? */
  function onFace(face, x, y) {
    for (var i = 0; i < face.length; i++) {
      var f = face[i], dx = x - f.at[0], dy = y - f.at[1];
      if (f.type === 'dot') {
        if (dx * dx + dy * dy <= f.r * f.r) return true;
      } else if (f.type === 'ellipse') {
        var q = Math.sqrt((dx / f.r[0]) * (dx / f.r[0]) + (dy / f.r[1]) * (dy / f.r[1]));
        if (Math.abs(q - 1) * Math.min(f.r[0], f.r[1]) <= FACE_W) return true;
      } else if (f.type === 'arc') {
        var d = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(d - f.r) > FACE_W) continue;
        var a = Math.atan2(dy, dx) * 180 / Math.PI;
        if (a < 0) a += 360;
        if (a >= f.from && a <= f.to) return true;
      }
    }
    return false;
  }

  /* stopU[k] — route progress of stop k */
  function build(T, curve, scenes, stopU, face) {
    var n = GW * GH;
    var seen = new Float32Array(n).fill(9);
    var dpath = new Float32Array(n).fill(99);
    var route = new Float32Array((SAMPLES + 1) * 2);
    var p = new T.Vector3(), tan = new T.Vector3();
    var rr = Math.ceil(SCAN_R / CELL);

    /* sweep the route: who is in range, and how far from the centreline */
    for (var s = 0; s <= SAMPLES; s++) {
      var u = s / SAMPLES;
      curve.getPoint(u, p);
      route[s * 2] = p.x; route[s * 2 + 1] = p.z;
      var ci = Math.floor((p.x - X0) / CELL), cj = Math.floor((p.z - Z0) / CELL);
      for (var j = Math.max(0, cj - rr); j <= Math.min(GH - 1, cj + rr); j++) {
        var cz = Z0 + (j + 0.5) * CELL - p.z;
        for (var i = Math.max(0, ci - rr); i <= Math.min(GW - 1, ci + rr); i++) {
          var cx = X0 + (i + 0.5) * CELL - p.x;
          var d = Math.sqrt(cx * cx + cz * cz);
          if (d > SCAN_R) continue;
          var k = j * GW + i;
          if (u < seen[k]) seen[k] = u;
          if (d < dpath[k]) dpath[k] = d;
        }
      }
    }

    /* each stop with an icon: where it sits on the route (px, pz) and where
       its icon stands, just inside the head (x, z) */
    var rooms = [];
    scenes.forEach(function (sc, k) {
      if (!sc.side) return;
      var u = stopU[k];
      curve.getPoint(u, p); curve.getTangent(u, tan);
      var len = Math.hypot(tan.x, tan.z) || 1;
      var rx = -tan.z / len, rz = tan.x / len;
      rooms.push({ k: k, u: u, px: p.x, pz: p.z, x: p.x + rx * ROOM_OFF * sc.side, z: p.z + rz * ROOM_OFF * sc.side });
    });

    /* occupancy: just the corridor and its walls — no rooms carved in,
       so the finished map is only the moose and its face */
    var occ = new Uint8Array(n), list = [];
    for (var k = 0; k < n; k++) {
      var x = X0 + ((k % GW) + 0.5) * CELL, z = Z0 + (Math.floor(k / GW) + 0.5) * CELL;
      if (seen[k] <= 1) {
        if (dpath[k] < HALF) occ[k] = 1;
        else if (dpath[k] < HALF + WALL) occ[k] = 2;
      }
      if (!occ[k] && face && onFace(face, x, -z)) { occ[k] = 3; seen[k] = FACE_SEEN; }
      if (occ[k]) list.push(k);
    }
    list.sort(function (a, b) { return seen[a] - seen[b]; });
    var listSeen = new Float32Array(list.length);
    for (var m = 0; m < list.length; m++) listSeen[m] = seen[list[m]];

    /* how many entries of a sorted `seen` array are ≤ u */
    function countSeen(arr, u) {
      var lo = 0, hi = arr.length;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid] <= u) lo = mid + 1; else hi = mid; }
      return lo;
    }

    function isWall(x, z) {
      var i = Math.floor((x - X0) / CELL), j = Math.floor((z - Z0) / CELL);
      if (i < 0 || j < 0 || i >= GW || j >= GH) return false;
      return occ[j * GW + i] === 2;
    }

    /* LiDAR: cast `rays` beams from (x, z); write hits into out as x, z pairs */
    function scan(x, z, rays, out) {
      var c = 0;
      for (var r = 0; r < rays; r++) {
        var a = (r / rays) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
        for (var t = 0.6; t <= SCAN_R; t += 0.3) {
          var hx = x + dx * t, hz = z + dz * t;
          if (isWall(hx, hz)) { out[c++] = hx; out[c++] = hz; break; }
        }
      }
      return c / 2;
    }

    return {
      CELL: CELL, X0: X0, Z0: Z0, GW: GW, GH: GH, SAMPLES: SAMPLES, SCAN_R: SCAN_R,
      occ: occ, seen: seen, list: list, listSeen: listSeen, route: route, rooms: rooms,
      countSeen: countSeen, scan: scan
    };
  }

  window.LidarMap = { build: build };
})();
