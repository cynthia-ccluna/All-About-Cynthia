/* ============================================================
   travel-data.js — every pin on the travel map lives here.

   To add a place, copy the template at the bottom into the list.
   The map, the sidebar list, the filter chips and the counters all
   rebuild themselves from this array. Nothing else to touch.

   FIELDS
     name    – city or place name
     country – drives the "countries" counter, so keep it consistent
     coords  – [latitude, longitude]  (right-click a spot in Google Maps
               and the first line of the menu is exactly this pair)
     year    – a label, so "2024" or "2024 —" both work
     kind    – "home" | "study" | "compete" | "explore"
     blurb   – a sentence or two, shown in the popup and the list
     photo   – path to an image, or "" for none
     vlog    – { label: "...", url: "https://..." } or null
   ============================================================ */

var TRAVEL_PLACES = [

  {
    name: 'Taipei', country: 'Taiwan',
    coords: [25.0330, 121.5654],
    year: 'home', kind: 'home',
    blurb: 'Where I am from, and where the first version of every idea gets tested on my family.',
    photo: 'assets/img/travel/taipei.jpg', vlog: null
  },
  {
    name: 'Singapore', country: 'Singapore',
    coords: [1.3521, 103.8198],
    year: '2024 —', kind: 'study',
    blurb: 'NTU. Four years of Electrical & Electronic Engineering, one autonomous race car, and a lot of very good food at 2am.',
    photo: 'assets/img/travel/singapore.jpg', vlog: null
  },
  {
    name: 'Milan', country: 'Italy',
    coords: [45.4642, 9.1900],
    year: 'Mar 2023', kind: 'explore',
    blurb: 'The Duomo, and a first proper look at a city built in marble.',
    photo: 'assets/img/travel/milan.jpg', vlog: null
  },
  {
    name: 'London', country: 'United Kingdom',
    coords: [51.5074, -0.1278],
    year: 'May 2024', kind: 'explore',
    blurb: 'Tower Bridge, Westminster, and a week of walking further than I meant to.',
    photo: 'assets/img/travel/london.jpg', vlog: null
  },
  {
    name: 'Shanghai', country: 'China',
    coords: [31.2304, 121.4737],
    year: 'Jun 2024', kind: 'explore',
    blurb: 'The Bund after dark, with the whole skyline switched on across the water.',
    photo: 'assets/img/travel/shanghai.jpg', vlog: null
  },
  {
    name: 'Tokyo', country: 'Japan',
    coords: [35.6762, 139.6503],
    year: 'Dec 2024', kind: 'explore',
    blurb: 'Part of the 18-day Global Study Program. The city where years of self-taught Japanese finally had to work in real time.',
    photo: 'assets/img/travel/tokyo.jpg', vlog: null
  },
  {
    name: 'Niigata', country: 'Japan',
    coords: [37.9026, 139.0235],
    year: 'Dec 2024', kind: 'explore',
    blurb: 'Mentoring high school students in self-development and English communication — and getting my own grammar corrected in return.',
    photo: 'assets/img/travel/niigata.jpg', vlog: null
  },
  {
    name: 'Los Angeles', country: 'United States',
    coords: [34.0522, -118.2437],
    year: 'Jul 2025', kind: 'explore',
    blurb: 'The city from above, hazy all the way to the ocean.',
    photo: 'assets/img/travel/losangeles.jpg', vlog: null
  },
  {
    name: 'Penang', country: 'Malaysia',
    coords: [5.4141, 100.3288],
    year: 'Oct 2025', kind: 'explore',
    blurb: 'George Town, where the street art is painted onto walls that were already a century old.',
    photo: 'assets/img/travel/penang.jpg', vlog: null
  },
  {
    name: 'Incheon', country: 'South Korea',
    coords: [37.4563, 126.7052],
    year: 'Nov 2025', kind: 'compete',
    blurb: 'ICCAS 2025 and our first international competition — we shipped the car over, rebuilt it, and qualified. Ginkgo season, too.',
    photo: 'assets/img/travel/seoul.jpg', vlog: null
  },
  {
    name: 'Bangkok', country: 'Thailand',
    coords: [13.7563, 100.5018],
    year: 'Dec 2025', kind: 'explore',
    blurb: 'Wat Pho and Wat Arun, in Thai dress, in about thirty-four degrees.',
    photo: 'assets/img/travel/bangkok.jpg', vlog: null
  },
  {
    // TODO: confirm the city — filed from an elephant-sanctuary photograph.
    name: 'Chiang Mai', country: 'Thailand',
    coords: [18.7883, 98.9853],
    year: 'Mar 2026', kind: 'explore',
    blurb: 'Elephants, hills, and the quietest week of the year.',
    photo: 'assets/img/travel/chiangmai.jpg', vlog: null
  },
  {
    name: 'Istanbul', country: 'Turkey',
    coords: [41.0082, 28.9784],
    year: 'May 2026', kind: 'explore',
    blurb: 'Sultanahmet, standing between two continents and six hundred years of tilework.',
    photo: 'assets/img/travel/istanbul.jpg', vlog: null
  },
  {
    name: 'Page, Arizona', country: 'United States',
    coords: [36.8791, -111.5104],
    year: 'Jun 2026', kind: 'explore',
    blurb: 'Sunrise over Horseshoe Bend. The Colorado has been drawing that curve for six million years and it still looks freshly done.',
    photo: 'assets/img/travel/page.jpg', vlog: null
  },
  {
    name: 'Itoshima', country: 'Japan',
    coords: [33.6489, 130.1897],
    year: 'Jul 2026', kind: 'explore',
    blurb: 'The white torii standing in the sea at Sakurai Futamigaura, with the married rocks roped together just offshore.',
    photo: 'assets/img/travel/itoshima.jpg', vlog: null
  },
  {
    name: 'Vienna', country: 'Austria',
    coords: [48.2085, 16.3721],
    year: 'Jul 2026', kind: 'explore',
    blurb: 'ICRA 2026 at TU Wien — we qualified 8th of 29 and took P9 in the Classic Cup. Also St. Stephen’s, the Musikverein and the Schönbrunn gardens.',
    photo: 'assets/img/travel/vienna.jpg', vlog: null
  },
  {
    name: 'Busan', country: 'South Korea',
    coords: [35.1690, 129.1360],
    year: 'Aug 2026', kind: 'compete',
    blurb: 'IFAC 2026 Roboracer Autonomous Racing Competition at BEXCO. A 1:10 car, an unfamiliar track, and no second chances.',
    photo: 'assets/img/travel/busan.jpg', vlog: null
  }

  /* ---------- TEMPLATE — copy me ----------
  ,{
    name: 'Kyoto', country: 'Japan',
    coords: [35.0116, 135.7681],
    year: '2027', kind: 'explore',
    blurb: 'One sentence about what this place was.',
    photo: 'assets/img/travel/kyoto.jpg',
    vlog: { label: 'Watch the vlog', url: 'https://...' }
  }
  ----------------------------------------- */
];

/* Category labels and colours used by the map, the chips and the legend. */
var TRAVEL_KINDS = {
  home:    { label: 'Home',      color: '#B4512A' },
  study:   { label: 'Studying',  color: '#C98A3C' },
  compete: { label: 'Competing', color: '#5C6268' },
  explore: { label: 'Exploring', color: '#8A7C6E' }
};
