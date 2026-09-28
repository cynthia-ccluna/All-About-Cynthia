# All About Cynthia

Personal site for Chen Ting-Ju (Cynthia). Plain HTML/CSS/JS — no build step, no
dependencies. Double-click `index.html` and it runs.

Live at **https://cynthia-ccluna.github.io/All-About-Cynthia/**

```
index.html          hero → credo → Under the Hood → Off the Clock → travel → contact
travel.html         the world map
css/base.css        tokens, nav, buttons, scroll animation, footer
css/home.css        the split hero and the two bands
css/parts.css       deck · event cards · drag-the-car · the score · tabs · galleries
css/travel.css      the atlas page
js/events-data.js   ← every event card lives here (DeepSpeed + Hearing Hypertension)
js/travel-data.js   ← every travel pin lives here.
js/site.js          nav, animation, event cards, the car, galleries, tabs, the score
js/hero.js          the hero split interaction
assets/             photos and the résumé PDF
```

---

## What the sections are called

The two halves are **UNDER THE HOOD** and **OFF THE CLOCK**. If you want different
words, they appear in the hero card, the band heading and the nav of `index.html`,
and in the nav of `travel.html`.

The browser tab icon is a terracotta **C**, drawn as an inline SVG in the `<link
rel="icon">` of both pages.

---

## Event cards

Both timelines are built from **`js/events-data.js`**. There are no separate event
pages — everything is on the card: photo, date, place, name, result.

- `RACE_EVENTS` → the NTU DeepSpeed rail: IFAC 2026, Sim Racing League (ICRA + IFAC
  2026, one results card), ICRA 2026, ICCAS 2025, Singapore Grand Prix, ROS2 Basics
  Workshop.
- `HH_EVENTS` → Hearing Hypertension: TISF, FAST, Science Talk, NEHS Honor Roll.

To add an event, copy an entry and change it. Give it two or more `images` and the
photo becomes a click-through. The sim racing card uses `results` instead of
`images` to draw a results sheet.

---

## The interactive bits

| Where | What it does |
|---|---|
| Hero | Hover either side: that panel widens and returns to colour, the other eases back |
| **Overview deck** | Four fanned cards at the top of Under the Hood. Hover straightens and lifts one; click jumps to that block |
| **Drag the car** | Under the DeepSpeed rail. Drag the car along the track to scroll the events; click the track to drive there; arrow keys work when it is focused. Trackpad scrolling moves the car too, and the wheels turn |
| **Open the score** | The sheet music opens as it scrolls into view and the three instruments come out of it. Click the sheet to close and reopen |
| **Galleries** | Any picture with more than one shot gets dots and a next arrow — click anywhere on it to advance |
| **Tabs** | Photography switches between China and Thailand |

Everything honours `prefers-reduced-motion`.

---

## The credo

"Driven by curiosity to *start the impossible*, powered by action to *see it
through*" — set in two voices in the `.credo` section: the setup lines in the italic
serif, the payoff lines at poster size in the condensed display face.

## Media

**Every empty slot draws itself as a dashed box with its file path inside.**

Still to add: `assets/docs/Resume-Chen-Ting-Ju.pdf`, and `assets/img/og-cover.jpg`
/ `og-travel.jpg` (1200×630 link-share thumbnails).

### Two things worth knowing about the photos

- **The coding photo was a HEIC**, which no browser can display. It is converted to
  `assets/img/hero/machine.jpg` and the original stays in `assets/img/hero/coding.HEIC`
  (gitignored). If you swap it, convert to JPEG first — HEIC will silently fail.
- **The green-dress photo is only 850×566.** It is a WeChat export, so the hero
  panel is working from a 221×566 slice and is a little soft. A higher-resolution
  original would look noticeably sharper at the same crop.

### Originals

The full-resolution originals — `photography/`, `art/`, `high school/`,
`travel/<country>/`, `projects/Roboracer/`, `projects/CNN/`, `projects/URECA/` and the rest, about **290 MB** — are in
`.gitignore`. They stay on your disk for re-cropping; what ships is 15 MB of
web-sized copies in `assets/img/gallery/`, `events/`, `hero/` and `story/`.

---

## Travel

Pins live in `js/travel-data.js`. The panel no longer claims a country total, since
you have been to more than are pinned — it just says how many are on the map so far.

Two things I corrected from the team site: the Nov 2025 Korea trip was **Incheon**
(ICCAS 2025), not Seoul, and the Vienna trip was **ICRA 2026 at TU Wien**.

The Mar 2026 elephant photo is still filed as **Chiang Mai** as a guess — marked
`TODO` in the file.

---

## Publishing

```bash
git add -A
git commit -m "Personal site"
git push -u origin main
```

GitHub Pages serves `main` / root at
`https://cynthia-ccluna.github.io/All-About-Cynthia/`. Every push updates it within a
minute or two.

---

## Notes

- **Palette.** Sampling every photo on the site gave 51% red/orange, so the accent
  is terracotta on warm bone white. Change `--accent` in `css/base.css` and the
  whole site follows.
- **Basemap.** Esri Light Gray Canvas, no API key. Swap the two tile URLs near the
  top of `js/travel.js` to change provider.
- **Fonts** come from Google Fonts and **Leaflet** from unpkg, so the map and the
  typography need a connection. Everything else works offline.
