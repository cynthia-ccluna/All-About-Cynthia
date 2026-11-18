/* ============================================================
   robot.js — the little moose robot, after Cynthia's drawing:
   a big round face, round eyes looking in toward the nose, a round
   nose, a lopsided smile, "m" cheeks, three-pronged antlers and
   hatched cuffs. The LiDAR puck spins between the antlers.

   Built from simple meshes with toon shading and a dark back-face
   outline, so it reads like a pencil drawing come to life.
   Faces −z. About 2.4 units tall.
   ============================================================ */
(function () {
  'use strict';

  var ORANGE = 0xFF7A3D, CREAM = 0xFBF1E4, ANTLER = 0xC9733D, LINE = 0x3B2A20;
  var DARK = 0x2A2F35, NOSE = 0xE8603A, BLUSH = 0xF4A3A0, CYAN = 0x5CE1E6;

  function build(T) {
    var mats = {};
    function toon(c) { return mats[c] || (mats[c] = new T.MeshToonMaterial({ color: c })); }
    function flat(c) { return mats['f' + c] || (mats['f' + c] = new T.MeshBasicMaterial({ color: c })); }
    var lineMat = new T.MeshBasicMaterial({ color: LINE, side: T.BackSide });

    var sphere = new T.SphereGeometry(1, 28, 20);

    /* a sphere scaled to (sx, sy, sz) with a pencil outline around it */
    function blob(parent, color, x, y, z, sx, sy, sz, outline) {
      var m = new T.Mesh(sphere, toon(color));
      m.position.set(x, y, z); m.scale.set(sx, sy, sz);
      parent.add(m);
      if (outline !== false) {
        var o = new T.Mesh(sphere, lineMat);
        var w = outline || 0.035;
        o.scale.set(1 + w / sx, 1 + w / sy, 1 + w / sz);   // relative to the scaled parent
        m.add(o);
      }
      return m;
    }

    /* a rounded stick from a to b (antler pieces) */
    var UPV = new T.Vector3(0, 1, 0);
    function limb(parent, color, a, b, r) {
      var A = new T.Vector3().fromArray(a), B = new T.Vector3().fromArray(b);
      var len = A.distanceTo(B);
      var g = new T.CylinderGeometry(r, r, len, 10);
      var m = new T.Mesh(g, toon(color));
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UPV, B.clone().sub(A).normalize());
      parent.add(m);
      var o = new T.Mesh(g, lineMat); o.scale.set(1.35, 1.02, 1.35); m.add(o);
      blob(parent, color, b[0], b[1], b[2], r, r, r, 0.02);
      return m;
    }

    var root = new T.Group();
    var body = new T.Group();
    root.add(body);

    /* body, wheels, arms with hatched cuffs */
    blob(body, ORANGE, 0, 0.52, 0, 0.48, 0.42, 0.5);
    var wheels = [];
    [-0.42, 0.42].forEach(function (x) {
      var w = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.12, 18), toon(DARK));
      w.rotation.z = Math.PI / 2; w.position.set(x, 0.19, 0.05);
      body.add(w); wheels.push(w);
      var hub = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.13, 10), flat(0x8A9097));
      w.add(hub);
    });
    [-1, 1].forEach(function (s) {
      var arm = blob(body, ORANGE, s * 0.47, 0.6, -0.12, 0.14, 0.22, 0.14);
      arm.rotation.z = s * 0.55;
      var cuff = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.1, 14), toon(LINE));
      cuff.position.set(s * 0.56, 0.44, -0.12); cuff.rotation.z = s * 0.55;
      body.add(cuff);
      for (var h = 0; h < 4; h++) {    // the hatching on the cuff
        var st = new T.Mesh(new T.BoxGeometry(0.02, 0.11, 0.02), flat(CREAM));
        var a = -0.9 + h * 0.6;
        st.position.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15);
        st.rotation.y = -a;
        cuff.add(st);
      }
    });

    /* head */
    var head = new T.Group();
    head.position.set(0, 1.28, -0.05);
    body.add(head);
    blob(head, CREAM, 0, 0, 0, 0.66, 0.6, 0.6, 0.045);

    // ears
    [-1, 1].forEach(function (s) {
      var ear = blob(head, ORANGE, s * 0.68, 0.2, 0.05, 0.2, 0.09, 0.12);
      ear.rotation.z = -s * 0.45;
    });

    // eyes, looking in toward the nose, with a highlight each
    [[-0.22, 0.06], [0.22, 0.09]].forEach(function (e, n) {
      blob(head, 0x1B1410, e[0], e[1], -0.5, 0.1, 0.13, 0.08, false);
      var pupilShift = n ? -0.03 : 0.03;
      var hl = new T.Mesh(sphere, flat(0xffffff));
      hl.scale.setScalar(0.03); hl.position.set(e[0] + pupilShift, e[1] + 0.05, -0.575);
      head.add(hl);
    });

    // nose
    blob(head, NOSE, 0, -0.12, -0.59, 0.11, 0.085, 0.07, 0.02);

    // smile: a lopsided arc, rising to the right like the drawing
    var smile = new T.Mesh(new T.TorusGeometry(0.15, 0.018, 8, 24, Math.PI * 0.75), flat(LINE));
    smile.rotation.z = Math.PI * 1.12;
    smile.position.set(0.04, -0.2, -0.555);
    head.add(smile);

    // blush and the little "m" on each cheek
    [-1, 1].forEach(function (s) {
      var cheek = new T.Group();
      cheek.position.set(s * 0.42, -0.12, -0.465);
      cheek.rotation.y = Math.atan2(s * 0.62, -0.78) + Math.PI;
      head.add(cheek);
      var blush = new T.Mesh(new T.CircleGeometry(0.08, 18), flat(BLUSH));
      blush.position.z = -0.01; blush.rotation.y = Math.PI;
      cheek.add(blush);
      [-0.035, 0.035].forEach(function (x) {
        var m = new T.Mesh(new T.TorusGeometry(0.035, 0.009, 6, 12, Math.PI), flat(LINE));
        m.position.set(x, 0, -0.02); m.rotation.y = Math.PI;
        cheek.add(m);
      });
    });

    // antlers: main beam and three prongs each
    [-1, 1].forEach(function (s) {
      var x = function (v) { return v * s; };
      limb(head, ANTLER, [x(0.28), 0.42, 0], [x(0.44), 0.95, 0.02], 0.05);
      limb(head, ANTLER, [x(0.36), 0.68, 0.01], [x(0.66), 0.84, 0.03], 0.04);
      limb(head, ANTLER, [x(0.42), 0.86, 0.02], [x(0.64), 1.08, 0.04], 0.035);
      limb(head, ANTLER, [x(0.44), 0.95, 0.02], [x(0.4), 1.2, 0.02], 0.035);
    });

    // LiDAR puck between the antlers
    var puck = new T.Group();
    puck.position.set(0, 0.68, 0.02);
    head.add(puck);
    var can = new T.Mesh(new T.CylinderGeometry(0.15, 0.17, 0.16, 20), toon(DARK));
    puck.add(can);
    var band = new T.Mesh(new T.TorusGeometry(0.162, 0.018, 6, 24), flat(CYAN));
    band.rotation.x = Math.PI / 2;
    puck.add(band);
    var beam = new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.32), flat(0xffffff));
    beam.position.z = -0.26;
    puck.add(beam);

    function update(time, moving, still) {
      puck.rotation.y = still ? 0 : time * 7;
      wheels.forEach(function (w) { w.rotation.x = -time * 12 * moving; });
      body.position.y = still ? 0 : Math.abs(Math.sin(time * 9)) * 0.05 * moving;
      head.rotation.z = still ? 0 : Math.sin(time * 1.6) * 0.04 * (1 - moving);
    }

    return { group: root, head: head, update: update };
  }

  /* lights for the robot only — everything else uses unlit materials */
  function lights(T, scene) {
    scene.add(new T.HemisphereLight(0xffffff, 0x8a7a70, 0.75));
    var sun = new T.DirectionalLight(0xffffff, 0.65);
    sun.position.set(-3, 6, 4);
    scene.add(sun);
  }

  window.LidarRobot = { build: build, lights: lights };
})();
