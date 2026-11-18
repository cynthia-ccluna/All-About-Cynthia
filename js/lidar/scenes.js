/* ============================================================
   scenes.js — the route and its stops.

   THE ROUTE is the outline of the moose's head, driven clockwise from
   the chin (home, Taiwan): up the left cheek, round the left antler,
   across the top, round the right antler, down the right cheek and
   back to the chin. When the loop closes the face appears on the map.

   LIDAR_ROUTE — the outline, as [x, y] with y pointing up the head.
                 (In 3D, y becomes −z, so "up the head" is forward.)

   LIDAR_SCENES — one entry per stop:
   id    — the <section id> in index.html that holds this stop's words
   at    — scroll progress (0 → 1) where the robot arrives at this stop
   pt    — which LIDAR_ROUTE point the stop sits on (the last stop uses
           LIDAR_ROUTE.length, i.e. back at the start: the loop closes)
   cam   — camera position relative to the robot, in world directions:
           [east, up, south]. The camera never turns with the robot —
           it keeps north up, like RViz, so tight corners don't spin it.
   look  — where the camera aims, relative to the robot, [east, up, south].
           A negative east pushes the robot right of the words panel.
   side  — 1 = this stop has an icon on the robot's right (inside the
           head), -1 = on its left (outside); 0 = none
   name  — short name: the "next" readout and the icon tooltips
   icon  — which point-cloud icon stands in the room (see icons.js)
   photo — a picture floating above the icon (optional)
   events — instead of photo: the name of a list in js/events-data.js;
           every event floats above the icon as a fanned-out polaroid
   label — what the status readout calls this stop

   Tune `at` first: the gap between two stops is how much scrolling it
   takes to drive between them. Longer drives get bigger gaps.
   ============================================================ */

var LIDAR_ROUTE = [
  [  0,   0],   //  0 chin — home
  [-24,   5],   //  1
  [-44,  20],   //  2 left cheek
  [-51,  40],   //  3
  [-46,  60],   //  4
  [-36,  76],   //  5 left antler, outer base
  [-44,  94],   //  6
  [-62, 112],   //  7 outer tine
  [-48, 114],   //  8
  [-54, 136],   //  9 middle tine
  [-40, 130],   // 10
  [-34, 156],   // 11 top tine
  [-26, 128],   // 12
  [-20, 100],   // 13
  [-16,  84],   // 14 left antler, inner base
  [  0,  87],   // 15 top of the head
  [ 16,  84],   // 16 right antler, inner base
  [ 20, 100],   // 17
  [ 26, 128],   // 18
  [ 34, 156],   // 19 top tine
  [ 40, 130],   // 20
  [ 54, 136],   // 21 middle tine
  [ 48, 114],   // 22
  [ 62, 112],   // 23 outer tine
  [ 44,  94],   // 24
  [ 36,  76],   // 25 right antler, outer base
  [ 46,  60],   // 26
  [ 51,  40],   // 27
  [ 44,  20],   // 28 right cheek
  [ 24,   5],   // 29
  [  9,   1]    // 30
];

/* Two halves: the left cheek and left antler are the work; the top of
   the head is the chapter break; the right antler is off the clock.
   `part: 'off'` switches the accent colour for that half.

   overhead — instead of cam/look: the camera rises until the whole head
              fits the screen beside the words panel (worked out in main.js) */

var LIDAR_SCENES = [
  { id: 'top',      at: 0.000, pt: 0,  cam: [10, 2.6, -0.5], look: [0, 2.2, -0.5], side: 0, name: 'Start',                label: '/localizing' },
  { id: 'about',    at: 0.044, pt: 1,  cam: [-3, 9, 13],   look: [-4, 0.5, -1],   side: 0, name: 'About',                label: '/about' },
  { id: 'racing',   at: 0.105, pt: 2,  cam: [-3, 12, 15],  look: [-4, 0.5, -1],   side: 1, name: 'NTU DeepSpeed',        icon: 'car',          events: 'RACE_EVENTS',                          label: '/waypoint_01 · deepspeed' },
  { id: 'robocup',  at: 0.167, pt: 3,  cam: [-3, 12, 15],  look: [-4, 0.5, -1],   side: 1, name: 'Robo@EEE',             icon: 'mug',          photo: 'assets/img/projects/robocup.jpg',       label: '/waypoint_02 · robocup' },
  { id: 'industry', at: 0.228, pt: 4,  cam: [-3, 12, 15],  look: [-4, 0.5, -1],   side: 1, name: 'Delta Electronics',    icon: 'extinguisher', photo: 'assets/img/projects/delta.jpg',         label: '/waypoint_03 · delta_vlm' },
  { id: 'embedded', at: 0.301, pt: 6,  cam: [-3, 12, 15],  look: [-4, 0.5, -2],   side: 1, name: 'URECA · FPGA',         icon: 'chip',         photo: 'assets/img/projects/ureca-fpga.jpg',    label: '/waypoint_04 · fpga_ssd' },
  { id: 'vision',   at: 0.375, pt: 8,  cam: [-3, 12, 15],  look: [-4, 0.5, -2],   side: 1, name: 'Hearing Hypertension', icon: 'heart',        events: 'HH_EVENTS',                            label: '/waypoint_05 · heart_sounds' },
  { id: 'teaching', at: 0.449, pt: 10, cam: [-3, 12, 15],  look: [-5, 0.5, 0],    side: 1, name: 'Teaching',             icon: 'mortarboard',  photo: 'assets/img/projects/ros2-workshop.jpg', label: '/waypoint_06 · teaching' },
  { id: 'offclock', at: 0.559, pt: 15, cam: [0, 34, 24],   look: [0, 0, -20],     side: 0, name: 'Off the Clock',        part: 'off',                                                          label: '/off_the_clock' },
  { id: 'music',    at: 0.632, pt: 17, cam: [-3, 12, 15],  look: [-4, 0.5, -1],   side: 1, name: 'Music',                part: 'off', icon: 'note',  photo: 'assets/img/music/violin.jpg',     label: '/off_the_clock/music' },
  { id: 'japanese', at: 0.718, pt: 20, cam: [-3, 12, 15],  look: [-9, 0.5, -1],   side: 1, name: '日本語',               part: 'off', icon: 'torii', photo: 'assets/img/travel/itoshima.jpg',  label: '/off_the_clock/日本語' },
  { id: 'travel',   at: 0.841, pt: 26, overhead: true, side: 0, name: 'Travel',   part: 'off',                                                                          label: '/travel · mapping' },
  { id: 'contact',  at: 0.951, pt: 31, overhead: true, side: 0, name: 'Contact',                                                                                        label: '/goal_pose · loop closed' }
];

/* The face, drawn on the map when the loop closes. Same [x, y] as the
   route. Each stroke is an outline (ellipse / arc) or a filled dot.   */
var LIDAR_FACE = [
  { type: 'ellipse', at: [-17, 52], r: [6, 8] },            // left eye
  { type: 'dot',     at: [-15, 49], r: 3.2 },               //   pupil
  { type: 'ellipse', at: [ 17, 54], r: [6, 8] },            // right eye
  { type: 'dot',     at: [ 15, 51], r: 3.2 },               //   pupil
  { type: 'ellipse', at: [  0, 36], r: [6.5, 5] },          // nose
  { type: 'arc',     at: [  4, 34], r: 18, from: 200, to: 330 },  // smile
  { type: 'arc',     at: [-35, 31], r: 2.3, from: 0, to: 180 },   // cheek "m"
  { type: 'arc',     at: [-30.4, 31], r: 2.3, from: 0, to: 180 },
  { type: 'arc',     at: [ 31, 35], r: 2.3, from: 0, to: 180 },
  { type: 'arc',     at: [ 35.6, 35], r: 2.3, from: 0, to: 180 }
];

/* Old links (from travel.html and bookmarks) that should land on a stop. */
var LIDAR_ALIASES = {
  intro: 'about',
  engineering: 'racing',
  community: 'japanese',
  social: 'contact'
};
