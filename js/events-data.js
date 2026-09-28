/* ============================================================
   events-data.js — the event cards on the home page.

   RACE_EVENTS  → the NTU DeepSpeed rail (drag the car to scroll)
   HH_EVENTS    → the Hearing Hypertension timeline

   Each entry is one card. Everything shows on the card itself —
   there are no separate event pages.

     name    — the big line on the card
     date    — shown in the small caps above the name
     place   — shown after the date
     result  — the line in terracotta
     note    — optional, one short sentence under the result
     images  — one or more photos; two or more become a click-through
     results — (instead of images) a results sheet, used for sim racing
   ============================================================ */

var RACE_EVENTS = [

  {
    name: 'IFAC 2026',
    title: '29th Roboracer Autonomous Racing Competition',
    date: 'Aug 2026',
    place: 'Busan, South Korea',
    result: '15th of 55 teams · reached the BO32 head-to-head finals',
    images: ['assets/img/events/ifac-2026.jpg', 'assets/img/events/ifac-stage.jpg']
  },

  {
    name: 'Sim Racing League',
    title: 'ICRA 2026 · IFAC 2026',
    date: '2026',
    place: 'Online',
    results: [
      {
        league: '5th RoboRacer Sim Racing League',
        at: 'ICRA 2026',
        rows: [
          ['Qualification', '6th', 'of 78 teams'],
          ['Final stage race', '11th', '']
        ]
      },
      {
        league: '6th RoboRacer Sim Racing League',
        at: 'IFAC 2026',
        rows: [
          ['Qualification', '1st', 'of 55 teams'],
          ['Final stage race', '2nd', '']
        ]
      }
    ]
  },

  {
    name: 'ICRA 2026',
    title: '27th Roboracer Autonomous Racing Competition',
    date: 'Jun 2026',
    place: 'Vienna, Austria',
    result: 'Qualified 8th of 29 teams · P9 in the Classic Cup',
    images: ['assets/img/events/icra-2026.jpg']
  },

  {
    name: 'ICCAS 2025',
    title: '26th Roboracer Autonomous Racing Competition',
    date: 'Nov 2025',
    place: 'Incheon, South Korea',
    result: 'Qualified',
    images: ['assets/img/events/iccas-2025.jpg']
  },

  {
    name: 'Singapore Grand Prix',
    title: 'Formula 1 Singapore Grand Prix',
    date: 'Oct 2025',
    place: 'Marina Bay, Singapore',
    result: 'Exclusive team invitation',
    note: 'Watching the full-size race from the Skyline deck.',
    images: ['assets/img/events/f1-singapore.jpg']
  },

  {
    name: 'ROS2 Basics Workshop',
    title: 'ROS2 Basics Workshop',
    date: '2025',
    place: 'NTU Singapore',
    result: '150+ participants',
    note: 'Teaching the basics of the ROS2 system and running it in simulation.',
    images: ['assets/img/events/ros2.jpg']
  }
];

var HH_EVENTS = [

  {
    name: 'TISF',
    title: 'Taiwan International Science Fair',
    date: 'Feb 2023',
    place: 'Taipei, Taiwan',
    result: '2nd place',
    images: ['assets/img/projects/hh-tisf-1.jpg', 'assets/img/projects/hh-tisf-2.jpg']
  },

  {
    name: 'FAST',
    title: 'I Giovani e le Scienze',
    date: 'Mar 2023',
    place: 'Milan, Italy',
    result: 'Golden Prize',
    images: ['assets/img/projects/fast-award.jpg', 'assets/img/projects/fast-team.jpg']
  },

  {
    name: 'Science Talk',
    title: 'National Taiwan Science Education Center',
    date: 'Nov 2023',
    place: 'Taipei, Taiwan',
    result: 'Presented the research on stage',
    images: ['assets/img/projects/hh-talk-1.jpg', 'assets/img/projects/hh-talk-2.jpg']
  },

  {
    name: 'NEHS Honor Roll',
    title: 'National Experimental High School',
    date: 'Nov 2023',
    place: 'Hsinchu, Taiwan',
    result: 'Name added to the school honour wall',
    images: ['assets/img/projects/hh-honor.jpg']
  }
];
