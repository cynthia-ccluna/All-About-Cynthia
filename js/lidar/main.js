/* ============================================================
   main.js — scroll drives the robot around the moose's head.

   How scroll becomes motion
     scroll position → p (0..1, smoothed)
     p falls between two stops' `at` values → segment i, fraction f
     the first DWELL of each segment the robot waits at stop i
     (turned round to face you); then it drives on.
     u (0..1) is the robot's place on the closed route; the map
     (map.js) reveals whatever has come within LiDAR range by that u.

   Words panels
     A stop's panel comes up as the robot approaches it (APPROACH of
     the way through the drive), and stays until it is well on the way
     to the next one — so there is always a panel to read.
     Clicking a polaroid shows it large in the panel's place.
   ============================================================ */
(function () {
  'use strict';

  var SCENES = window.LIDAR_SCENES || [];
  var ROUTE = window.LIDAR_ROUTE || [];
  var ALIASES = window.LIDAR_ALIASES || {};
  var N = SCENES.length, M = ROUTE.length;
  var U = SCENES.map(function (s) { return M ? s.pt / M : 0; });   // route progress of each stop
  var DWELL = 0.35;          // share of each segment spent parked at the stop
  var APPROACH = 0.55;       // the next stop's panel comes up this far into the drive
  var SPREAD = 0.62;         // fanned polaroids: each one this many card-widths along (css --spread)

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- helpers ---------- */
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wrapAngle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  /* one light look throughout: cream paper, ink points, terracotta scan */
  var CREAM = 0xF7F3ED, INK = 0x2B2420, SCAN = 0xC4562C, MOOSE = 0xFF7A3D;

  /* ---------- panels ---------- */
  var panels = SCENES.map(function (s) { return document.getElementById(s.id); });

  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
  function readScroll() { return clamp(window.scrollY / maxScroll(), 0, 1); }

  /* where on the route a given p is */
  function locate(p) {
    var i = 0;
    while (i < N - 1 && p >= SCENES[i + 1].at) i++;
    var f = 0;
    if (i < N - 1) f = (p - SCENES[i].at) / (SCENES[i + 1].at - SCENES[i].at);
    var drive = i < N - 1 ? smooth((f - DWELL) / (1 - DWELL)) : 0;
    var u = i < N - 1 ? lerp(U[i], U[i + 1], drive) : U[N - 1];
    // turned round to face the camera while parked; at the start it is already
    // facing you, and at the end the camera is overhead
    var park = i === 0 ? 1 - smooth((f - 0.22) / 0.12)
             : i < N - 1 ? smooth(f / 0.08) * (1 - smooth((f - 0.22) / 0.12)) : 0;
    var panel = i < N - 1 && drive > APPROACH ? i + 1 : i;
    return { i: i, f: f, drive: drive, u: u, park: park, panel: panel, approaching: panel !== i };
  }

  /* ---------- jump to a stop (nav links, minimap, icons, old #hashes) ---------- */
  function sceneIndex(hash) {
    var id = (hash || '').replace(/^#/, '');
    id = ALIASES[id] || id;
    for (var k = 0; k < N; k++) if (SCENES[k].id === id) return k;
    return -1;
  }
  function scrollToScene(k, instant) {
    // land after the robot has turned round to face you
    var next = k < N - 1 ? SCENES[k + 1].at : 1;
    var p = SCENES[k].at + (next - SCENES[k].at) * 0.1;
    if (k === 0) p = 0;
    window.scrollTo({ top: p * maxScroll(), behavior: instant || reduce ? 'auto' : 'smooth' });
  }
  function goTo(k) {
    history.replaceState(null, '', '#' + SCENES[k].id);
    scrollToScene(k);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var k = sceneIndex(a.getAttribute('href'));
    if (k < 0) return;
    e.preventDefault();
    goTo(k);
  });
  var relocalize = document.getElementById('relocalize');
  if (relocalize) relocalize.addEventListener('click', function () {
    history.replaceState(null, '', location.pathname);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* minimap open/close on phones */
  var rviz = document.getElementById('rviz');
  var rvizToggle = document.getElementById('rvizToggle');
  if (rviz && rvizToggle) rvizToggle.addEventListener('click', function () {
    var open = rviz.classList.toggle('is-open');
    rvizToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && minimap) minimap.resize();
  });

  /* ---------- a picked polaroid, large, in the panel's place ---------- */
  var detail = document.getElementById('detail');
  var picked = null;           // { list, n, img, k, cards }

  function closeDetail() {
    if (!picked) return;
    picked.cards.forEach(function (c) { c.classList.remove('is-picked'); });
    picked = null;
    detail.classList.remove('is-on');
    root.classList.remove('has-detail');
  }
  function openDetail(list, n, k, cards) {
    if (picked) picked.cards.forEach(function (c) { c.classList.remove('is-picked'); });
    picked = { list: list, n: n, img: 0, k: k, cards: cards };
    renderDetail();
    detail.classList.add('is-on');
    root.classList.add('has-detail');
  }
  function stepDetail(d) {
    if (!picked || picked.list.length < 2) return;
    picked.n = (picked.n + d + picked.list.length) % picked.list.length;
    picked.img = 0;
    renderDetail();
  }
  function renderDetail() {
    var st = picked, ev = st.list[st.n], sc = SCENES[st.k];
    st.cards.forEach(function (c, i) { c.classList.toggle('is-picked', i === st.n); });
    detail.textContent = '';
    var card = el('div', 'stop__card detail__card');

    var top = el('div', 'detail__top');
    var back = el('button', 'detail__back', '← ' + sc.name);
    back.type = 'button';
    back.addEventListener('click', closeDetail);
    top.appendChild(back);
    if (st.list.length > 1) {
      var nav = el('span', 'detail__nav');
      var prev = el('button', '', '‹'), next = el('button', '', '›');
      prev.type = next.type = 'button';
      prev.setAttribute('aria-label', 'Previous event'); next.setAttribute('aria-label', 'Next event');
      prev.addEventListener('click', function () { stepDetail(-1); });
      next.addEventListener('click', function () { stepDetail(1); });
      nav.appendChild(prev);
      nav.appendChild(el('span', '', (st.n + 1) + ' / ' + st.list.length));
      nav.appendChild(next);
      top.appendChild(nav);
    }
    card.appendChild(top);

    var fig = el('figure', 'detail__fig');
    if (ev.images && ev.images.length) {
      var img = el('img');
      img.src = ev.images[st.img]; img.alt = ev.name || sc.name;
      fig.appendChild(img);
      card.appendChild(fig);
      if (ev.images.length > 1) {
        var thumbs = el('div', 'detail__thumbs');
        ev.images.forEach(function (src, j) {
          var b = el('button', j === st.img ? 'is-on' : '');
          b.type = 'button';
          b.setAttribute('aria-label', 'Photo ' + (j + 1));
          var t = el('img'); t.src = src; t.alt = '';
          b.appendChild(t);
          b.addEventListener('click', function () { st.img = j; renderDetail(); });
          thumbs.appendChild(b);
        });
        card.appendChild(thumbs);
      }
    } else if (ev.results) {
      var sheet = el('div', 'detail__sheet');
      ev.results.forEach(function (r) {
        sheet.appendChild(el('b', '', r.league + ' · ' + r.at));
        r.rows.forEach(function (row) {
          var line = el('span');
          line.appendChild(el('span', '', row[0]));
          line.appendChild(el('strong', '', row[1] + (row[2] ? ' ' + row[2] : '')));
          sheet.appendChild(line);
        });
      });
      card.appendChild(sheet);
    }

    if (ev.name) {
      if (ev.date || ev.place) card.appendChild(el('p', 'stop__topic', [ev.date, ev.place].filter(Boolean).join(' · ')));
      card.appendChild(el('h2', 'stop__title', ev.name));
      if (ev.title && ev.title !== ev.name) card.appendChild(el('p', 'detail__full', ev.title));
      if (ev.result) card.appendChild(el('p', 'detail__result', ev.result));
      if (ev.note) card.appendChild(el('p', '', ev.note));
    }
    detail.appendChild(card);
  }
  document.addEventListener('keydown', function (e) {
    if (!picked) return;
    if (e.key === 'Escape') closeDetail();
    else if (e.key === 'ArrowLeft') stepDetail(-1);
    else if (e.key === 'ArrowRight') stepDetail(1);
  });

  /* ---------- status readout ---------- */
  var hudTopic = document.getElementById('hudTopic');
  var hudNext = document.getElementById('hudNext');
  var hudBar = document.getElementById('hudBar');
  var hudT = document.getElementById('hudT');
  var rvizPose = document.getElementById('rvizPose');

  /* ---------- page state that does not need WebGL ---------- */
  var shownPanel = -1, lastTopic = '', lastNext = '';
  function updatePage(p, loc) {
    var want = loc.panel;
    if (want !== shownPanel) {
      if (shownPanel >= 0 && panels[shownPanel]) panels[shownPanel].classList.remove('is-on');
      if (want >= 0 && panels[want]) panels[want].classList.add('is-on');
      shownPanel = want;
      closeDetail();
      root.classList.toggle('is-off', SCENES[want].part === 'off');
    }

    var topic = (loc.approaching ? '→ ' : '') + SCENES[want].label;
    if (topic !== lastTopic) { hudTopic.textContent = topic; lastTopic = topic; }
    var nx = want < N - 1 ? 'next ▸ ' + SCENES[want + 1].name : 'loop closed';
    if (hudNext && nx !== lastNext) { hudNext.textContent = nx; lastNext = nx; }
    hudBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    hudT.textContent = 't=' + p.toFixed(2);
  }

  /* ---------- 3D ---------- */
  var canvas = document.getElementById('stage');
  var gl = null;
  if (window.THREE && window.LidarMap && window.LidarRobot && canvas && M) {
    try { gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
  }
  if (!gl) root.classList.add('no-webgl');

  var minimap = null;
  var three = gl ? buildScene(canvas) : null;

  function shuffle(P) {
    for (var i = P.length / 3 - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      for (var d = 0; d < 3; d++) { var t = P[i * 3 + d]; P[i * 3 + d] = P[j * 3 + d]; P[j * 3 + d] = t; }
    }
    return P;
  }

  function buildScene(canvas) {
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new T.Scene();
    scene.background = new T.Color(CREAM);
    scene.fog = new T.Fog(CREAM, 40, 160);
    window.LidarRobot.lights(T, scene);

    var camera = new T.PerspectiveCamera(50, 1, 0.1, 800);

    /* the moose outline, a closed loop; route point j sits at u = j / M */
    var curve = new T.CatmullRomCurve3(ROUTE.map(function (q) {
      return new T.Vector3(q[0], 0, -q[1]);
    }), true, 'centripetal');

    var map = window.LidarMap.build(T, curve, SCENES, U, window.LIDAR_FACE);

    /* unexplored floor: a faint grid of points */
    var gridPos = [];
    for (var x = -84; x <= 84; x += 2) for (var z = -178; z <= 20; z += 2) gridPos.push(x, 0, z);
    var gridGeo = new T.BufferGeometry();
    gridGeo.setAttribute('position', new T.Float32BufferAttribute(gridPos, 3));
    var gridMat = new T.PointsMaterial({ color: INK, size: 0.07, transparent: true, opacity: 0.13 });
    scene.add(new T.Points(gridGeo, gridMat));

    /* mapped space — walls, floor and (at the end) the face — in scan order */
    var WALL_PTS = 5;
    var wallPos = [], wallCol = [], wallSeen = [], floorPos = [], floorSeen = [], facePos = [], faceSeen = [];
    map.list.forEach(function (k) {
      var cx = map.X0 + ((k % map.GW) + 0.5) * map.CELL, cz = map.Z0 + (Math.floor(k / map.GW) + 0.5) * map.CELL;
      var o = map.occ[k];
      if (o === 2) {
        for (var q = 0; q < WALL_PTS; q++) {
          var h = Math.random() * 1.9;
          wallPos.push(cx + (Math.random() - 0.5) * map.CELL, h, cz + (Math.random() - 0.5) * map.CELL);
          var v = 0.45 + 0.35 * (h / 1.9) + 0.2 * Math.random();
          wallCol.push(v, v, v);
        }
        wallSeen.push(map.seen[k]);
      } else if (o === 3) {
        for (var r = 0; r < 2; r++) facePos.push(cx + (Math.random() - 0.5) * map.CELL, 0.05, cz + (Math.random() - 0.5) * map.CELL);
        faceSeen.push(map.seen[k], map.seen[k]);
      } else if (Math.random() < 0.22) {
        floorPos.push(cx + (Math.random() - 0.5) * map.CELL, 0.01, cz + (Math.random() - 0.5) * map.CELL);
        floorSeen.push(map.seen[k]);
      }
    });
    function cloud(pos, size, opacity, colors) {
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      if (colors) geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      var mat = new T.PointsMaterial({ color: INK, size: size, transparent: true, opacity: opacity, vertexColors: !!colors });
      mat.userData.base = size;
      scene.add(new T.Points(geo, mat));
      return { geo: geo, mat: mat };
    }
    var walls = cloud(wallPos, 0.07, 0.95, wallCol);
    var floor = cloud(floorPos, 0.06, 0.45);
    var faceC = cloud(facePos, 0.12, 1);
    wallSeen = Float32Array.from(wallSeen); floorSeen = Float32Array.from(floorSeen); faceSeen = Float32Array.from(faceSeen);
    gridMat.userData.base = 0.07;

    /* the route line: drawn as far as the robot has driven */
    var SAMPLES = 1600;
    var trailGeo = new T.BufferGeometry().setFromPoints(curve.getPoints(SAMPLES).map(function (v) { v.y = 0.02; return v; }));
    var trailMat = new T.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.7 });
    scene.add(new T.Line(trailGeo, trailMat));

    /* each room: an orange goal ring on the floor, its point-cloud icon, floating photos */
    var floats = document.getElementById('floats');

    /* the polaroids above a stop: one photo, or every event in its list
       (js/events-data.js) fanned out. Click one to see it large. */
    function polaroids(sc, k) {
      var list = sc.events ? (window[sc.events] || []) : sc.photo ? [{ images: [sc.photo] }] : [];
      if (!list.length) return null;
      var set = el('div', 'float-set' + (sc.events ? ' float-set--fan' : ''));
      var n = list.length, cards = [];
      list.forEach(function (ev, i) {
        var card = el('figure', 'float');
        var o = i - (n - 1) / 2;
        card.style.setProperty('--o', o.toFixed(2));
        card.style.setProperty('--lift', (o * o * 7).toFixed(1) + 'px');
        card.style.setProperty('--rot', (n > 1 ? o * 4.5 : (k % 2 ? 2.5 : -2.5)).toFixed(1) + 'deg');
        if (ev.images && ev.images.length) {
          var img = el('img'); img.src = ev.images[0]; img.alt = ev.name || ''; img.loading = 'lazy';
          card.appendChild(img);
        } else if (ev.results) {     // the sim racing card: a results sheet instead of a photo
          var sheet = el('div', 'float__sheet');
          ev.results.forEach(function (r) {
            sheet.appendChild(el('b', '', r.at));
            r.rows.forEach(function (row) { sheet.appendChild(el('span', '', row[0] + ' · ' + row[1] + (row[2] ? ' ' + row[2] : ''))); });
          });
          card.appendChild(sheet);
        }
        if (ev.name) {
          var cap = el('figcaption');
          cap.appendChild(el('b', '', ev.name));
          if (ev.date || ev.place) cap.appendChild(el('span', '', [ev.date, ev.place].filter(Boolean).join(' · ')));
          if (ev.result) cap.appendChild(el('em', '', ev.result));
          card.appendChild(cap);
        }
        card.addEventListener('click', function () { openDetail(list, i, k, cards); });
        cards.push(card);
        set.appendChild(card);
      });
      return set;
    }
    var rooms = map.rooms.map(function (r) {
      var sc = SCENES[r.k];
      var make = window.LIDAR_ICONS && window.LIDAR_ICONS[sc.icon];
      var g = new T.Group();
      g.position.set(r.x, 0.15, r.z);
      scene.add(g);

      var ring = new T.Mesh(new T.RingGeometry(1.7, 1.85, 56), new T.MeshBasicMaterial({ color: MOOSE, transparent: true, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.13;
      g.add(ring);

      var icon = null;
      if (make) {
        var P = shuffle(make());
        var geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
        icon = new T.Points(geo, new T.PointsMaterial({ color: INK, size: 0.055, transparent: true, opacity: 1 }));
        g.add(icon);
      }

      var photo = floats ? polaroids(sc, r.k) : null;
      if (photo) floats.appendChild(photo);
      return { r: r, group: g, ring: ring, icon: icon, photo: photo, faint: false, size: null, anchor: new T.Vector3(r.x, 3.4, r.z) };
    });

    /* live LiDAR returns */
    var RAYS = 180;
    var hits = new Float32Array(RAYS * 2);
    var scanPos = new Float32Array(RAYS * 3);
    var scanGeo = new T.BufferGeometry();
    scanGeo.setAttribute('position', new T.BufferAttribute(scanPos, 3));
    var scanMat = new T.PointsMaterial({ color: SCAN, size: 0.16, transparent: true, opacity: 0.95 });
    var scanPts = new T.Points(scanGeo, scanMat);
    scanPts.frustumCulled = false;
    scene.add(scanPts);

    /* the moose robot */
    var bot = window.LidarRobot.build(T);
    scene.add(bot.group);

    /* RViz minimap */
    var mm = document.getElementById('minimap');
    if (mm && window.LidarMinimap) minimap = window.LidarMinimap.create(mm, map, goTo);

    /* the overhead view: high enough that the whole head fits the screen
       beside the words panel (or above the bottom sheet on phones) */
    var bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9, EDGE = 6;
    for (var b = 0; b < map.route.length; b += 2) {
      bx0 = Math.min(bx0, map.route[b]); bx1 = Math.max(bx1, map.route[b]);
      bz0 = Math.min(bz0, map.route[b + 1]); bz1 = Math.max(bz1, map.route[b + 1]);
    }
    bx0 -= EDGE; bx1 += EDGE; bz0 -= EDGE; bz1 += EDGE;
    var topCam = new T.Vector3(), topLook = new T.Vector3();
    function fitOverhead(w, h) {
      var phone = w <= 760;
      var card = panels[1] && panels[1].getBoundingClientRect();
      var L = phone ? 12 : Math.min(w * 0.55, (card ? card.right : 0) + 24);
      var R = w - 12, Tp = 64, B = phone ? h * 0.46 : h - 16;
      var tanH = Math.tan(camera.fov * Math.PI / 360);
      var k = Math.min((R - L) / (bx1 - bx0), (B - Tp) / (bz1 - bz0)) * 0.96;   // px per metre
      var height = h / (2 * k * tanH);
      var lx = (bx0 + bx1) / 2 - ((L + R) / 2 - w / 2) / k;
      var lz = (bz0 + bz1) / 2 - ((Tp + B) / 2 - h / 2) / k;
      topLook.set(lx, 0, lz);
      topCam.set(lx, height, lz + height * 0.12);
    }

    var W = 1, H = 1, panelR = 0;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      var pr = panels[1] && panels[1].getBoundingClientRect();
      panelR = W > 760 && pr ? pr.right : 0;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      fitOverhead(W, H);
    }
    resize();
    window.addEventListener('resize', resize);

    var pos = new T.Vector3(), tan = new T.Vector3(), right = new T.Vector3();
    var camA = new T.Vector3(), camB = new T.Vector3(), lookA = new T.Vector3(), lookB = new T.Vector3();
    var camGoal = new T.Vector3(), lookGoal = new T.Vector3(), look = new T.Vector3(), proj = new T.Vector3();
    var camReady = false;
    var mmState = { u: 0, x: 0, z: 0, hx: 0, hz: -1, hits: hits, hitCount: 0, active: -1, next: -1, time: 0 };
    var lastPose = '', lastU = 0;

    /* where scene s wants the camera and its aim, given the robot now.
       Offsets are in world directions, so the view never rotates. */
    function framing(s, outCam, outLook) {
      if (s.overhead) { outCam.copy(topCam); outLook.copy(topLook); return; }
      outCam.set(pos.x + s.cam[0], s.cam[1], pos.z + s.cam[2]);
      outLook.set(pos.x + s.look[0], s.look[1], pos.z + s.look[2]);
    }

    /* which icon (if any) is under screen point (x, y) */
    var pa = new T.Vector3(), pb = new T.Vector3();
    function pick(x, y) {
      var best = -1, bd = 1e9;
      rooms.forEach(function (rm) {
        if (!rm.group.visible) return;
        var s = rm.group.scale.x;
        pa.set(rm.r.x, 1.2 * s, rm.r.z).project(camera);
        if (pa.z > 1) return;
        pb.set(rm.r.x + 1.8 * s, 1.2 * s, rm.r.z).project(camera);
        var px = (pa.x + 1) / 2 * W, py = (1 - pa.y) / 2 * H;
        var rad = Math.max(22, Math.hypot((pb.x - pa.x) / 2 * W, (pb.y - pa.y) / 2 * H));
        var d = Math.hypot(px - x, py - y);
        if (d < rad && d < bd) { bd = d; best = rm.r.k; }
      });
      return best;
    }

    function render(p, loc, time) {
      var u = loc.u;
      curve.getPoint(u, pos);
      curve.getTangent(u, tan);
      tan.y = 0; tan.normalize();
      right.set(-tan.z, 0, tan.x);

      /* camera: this stop's framing blended into the next one's, then eased
         so it glides rather than jerks */
      var a = SCENES[loc.i], b = SCENES[Math.min(loc.i + 1, N - 1)], d = loc.drive;
      framing(a, camA, lookA); framing(b, camB, lookB);
      camGoal.copy(camA).lerp(camB, d);
      lookGoal.copy(lookA).lerp(lookB, d);
      if (!camReady || reduce) { camera.position.copy(camGoal); look.copy(lookGoal); camReady = true; }
      else { camera.position.lerp(camGoal, 0.09); look.lerp(lookGoal, 0.09); }
      camera.lookAt(look);
      camera.updateMatrixWorld();   // so the photos project with this frame's camera
      var camDist = camera.position.distanceTo(look);

      /* robot: drives along the route, turns round to face you when parked */
      bot.group.position.copy(pos);
      var pathYaw = Math.atan2(-tan.x, -tan.z);
      var faceYaw = Math.atan2(-(camera.position.x - pos.x), -(camera.position.z - pos.z));
      bot.group.rotation.y = pathYaw + wrapAngle(faceYaw - pathYaw) * loc.park;
      var moving = clamp(Math.abs(u - lastU) * 600, 0, 1);
      lastU = u;
      bot.update(time, moving, reduce);

      /* what has been mapped by now */
      walls.geo.setDrawRange(0, map.countSeen(wallSeen, u) * WALL_PTS);
      floor.geo.setDrawRange(0, map.countSeen(floorSeen, u));
      faceC.geo.setDrawRange(0, map.countSeen(faceSeen, u));
      trailGeo.setDrawRange(0, Math.max(2, Math.round(u * SAMPLES) + 1));

      /* live scan from where the robot is now */
      var n = map.scan(pos.x, pos.z, RAYS, hits);
      for (var h = 0; h < n; h++) {
        scanPos[h * 3] = hits[h * 2]; scanPos[h * 3 + 1] = 0.75; scanPos[h * 3 + 2] = hits[h * 2 + 1];
      }
      scanGeo.attributes.position.needsUpdate = true;
      scanGeo.setDrawRange(0, n);

      /* point size follows the camera: fine up close (the opening shot),
         big enough to see from overhead; no fog on the map from far away */
      scene.fog.near = camDist + 30; scene.fog.far = camDist + 150;
      var grow = Math.max(0.35, camDist / 21);
      [walls.mat, floor.mat, faceC.mat, gridMat].forEach(function (m) { m.size = m.userData.base * grow; });
      scanMat.size = 0.16 * Math.min(1, grow);

      /* rooms: an icon fills in as it comes into range; the next one ahead
         shows faintly. Photos float above; from overhead the icons grow so
         you can see (and click) them all. */
      var nextK = -1;
      for (var q = 0; q < N; q++) if (SCENES[q].side && U[q] > u + 0.002) { nextK = q; break; }
      var near = 1 - smooth((camDist - 40) / 30);
      var lift = clamp(camDist / 45, 1, 3.4);
      rooms.forEach(function (rm) {
        var k = rm.r.k;
        var reached = smooth((u - (rm.r.u - 0.012)) / 0.01);
        var isNext = k === nextK, focus = loc.panel === k;
        var vis = Math.max(reached, isNext ? 0.3 : 0);
        rm.group.visible = vis > 0.001;
        if (!rm.group.visible) { if (rm.photo && rm.photo.style.opacity !== '0') rm.photo.style.opacity = '0'; return; }
        rm.group.scale.setScalar(lift);
        if (rm.icon) {
          rm.icon.material.opacity = vis;
          rm.icon.rotation.y = reduce ? 0 : time * 0.35;
          rm.icon.position.y = reduce ? 0 : Math.sin(time * 1.4 + k) * 0.08;
        }
        var pulse = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(time * 3 + k);
        rm.ring.material.opacity = (focus ? 1 : pulse) * vis * lerp(0.6, 1, near);
        rm.ring.scale.setScalar(focus ? 1.08 : 1);

        if (rm.photo) {
          var dist = camera.position.distanceTo(rm.anchor);
          var want = focus ? 1 : isNext ? 0.32 : reached;
          var op = want * near * (1 - smooth((dist - (focus ? 36 : 28)) / 14));
          proj.copy(rm.anchor).project(camera);
          if (op < 0.02 || proj.z > 1 || Math.abs(proj.x) > 1.6 || Math.abs(proj.y) > 1.6) { if (rm.photo.style.opacity !== '0') rm.photo.style.opacity = '0'; return; }
          var faint = op < 0.6;
          if (faint !== rm.faint) { rm.photo.classList.toggle('is-faint', faint); rm.faint = faint; }
          var bob = reduce ? 0 : Math.sin(time * 1.2 + k) * 6;
          var s = clamp(17 / dist, 0.4, 1);
          // keep the whole set on screen, clear of the words panel and the nav
          if (!rm.size) {
            var c0 = rm.photo.firstChild, im = c0.querySelector('img');
            // a fan's cards have a fixed size; a lone photo's width waits for its image
            if (c0.offsetWidth && (rm.photo.children.length > 1 || !im || im.complete)) rm.size = [c0.offsetWidth, c0.offsetHeight];
          }
          var px = (proj.x + 1) / 2 * W, py = (1 - proj.y) / 2 * H + bob;
          if (rm.size) {
            var half = rm.size[0] * (1 + (rm.photo.children.length - 1) * SPREAD) / 2 * s + 8;
            var lo = panelR + 16 + half, hi = W - 16 - half;
            px = lo > hi ? (lo + hi) / 2 : clamp(px, lo, hi);
            py = clamp(py, 76 + (rm.size[1] + 24) * s, H - 24);
          }
          rm.photo.style.opacity = op.toFixed(3);
          rm.photo.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        }
      });

      renderer.render(scene, camera);

      if (minimap) {
        mmState.u = u; mmState.x = pos.x; mmState.z = pos.z; mmState.hx = tan.x; mmState.hz = tan.z;
        mmState.hitCount = n;
        mmState.active = loc.panel;
        mmState.next = nextK;
        mmState.time = time;
        minimap.draw(mmState);
        if (rvizPose) {
          var pose = 'x ' + pos.x.toFixed(1) + '  y ' + (-pos.z).toFixed(1);
          if (pose !== lastPose) { rvizPose.textContent = pose; lastPose = pose; }
        }
      }
    }

    return { render: render, pick: pick };
  }

  /* ---------- click a point-cloud icon to drive there ---------- */
  var tip = document.getElementById('tip');
  var UI = 'a, button, .stop__card, .float, .rviz, .detail, .nav';
  function overUI(e) { return e.target.closest && e.target.closest(UI); }
  if (three) {
    document.addEventListener('click', function (e) {
      if (overUI(e)) return;
      var k = three.pick(e.clientX, e.clientY);
      if (k >= 0) goTo(k);
    });
    document.addEventListener('mousemove', function (e) {
      var k = overUI(e) ? -1 : three.pick(e.clientX, e.clientY);
      root.classList.toggle('over-icon', k >= 0);
      if (!tip) return;
      if (k < 0) { tip.classList.remove('is-on'); return; }
      tip.textContent = SCENES[k].name + ' →';
      tip.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 12) + 'px)';
      tip.classList.add('is-on');
    });
  }

  /* ---------- loop ---------- */
  var p = readScroll(), target = p;
  window.addEventListener('scroll', function () { target = readScroll(); }, { passive: true });
  window.addEventListener('resize', function () { target = readScroll(); });

  var start = performance.now();
  function frame(now) {
    p = reduce ? target : p + (target - p) * 0.12;
    if (Math.abs(target - p) < 1e-5) p = target;
    var loc = locate(p);
    updatePage(p, loc);
    if (three) three.render(p, loc, (now - start) / 1000);
    requestAnimationFrame(frame);
  }

  /* arriving with #racing etc. (also from travel.html) */
  function jumpToHash() {
    var k = sceneIndex(location.hash);
    if (k > 0) { scrollToScene(k, true); p = target = readScroll(); }
  }
  jumpToHash();
  // the browser may scroll to a same-named element after load; land on the stop again
  window.addEventListener('load', jumpToHash);
  window.addEventListener('hashchange', function () {
    var k = sceneIndex(location.hash);
    if (k >= 0) scrollToScene(k);
  });

  requestAnimationFrame(frame);
})();
