/* ============================================================
   travel.js — builds the map, the list, the filters and the
   counters from TRAVEL_PLACES in js/travel-data.js
   ============================================================ */
(function () {
  'use strict';

  var places = (typeof TRAVEL_PLACES !== 'undefined' && TRAVEL_PLACES) || [];
  var kinds  = (typeof TRAVEL_KINDS  !== 'undefined' && TRAVEL_KINDS)  || {};

  var listEl    = document.getElementById('placeList');
  var filtersEl = document.getElementById('filters');
  var mapEl     = document.getElementById('map');
  if (!listEl || !mapEl) return;

  var hasLeaflet = typeof L !== 'undefined';
  var markers = {};
  var map = null;
  var activeIndex = null;

  function colorOf(p) {
    return (kinds[p.kind] && kinds[p.kind].color) || '#F2F0EA';
  }
  function labelOf(p) {
    return (kinds[p.kind] && kinds[p.kind].label) || p.kind || '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- counters ----------------
     Continents are derived from the country, so adding a pin keeps the
     number honest. Add a line here if you visit somewhere new. */
  var CONTINENT = {
    'Taiwan': 'Asia', 'Singapore': 'Asia', 'Japan': 'Asia', 'China': 'Asia',
    'South Korea': 'Asia', 'Malaysia': 'Asia', 'Thailand': 'Asia',
    'Turkey': 'Asia', 'Vietnam': 'Asia', 'Indonesia': 'Asia', 'India': 'Asia',
    'Italy': 'Europe', 'United Kingdom': 'Europe', 'Austria': 'Europe',
    'France': 'Europe', 'Germany': 'Europe', 'Spain': 'Europe',
    'Switzerland': 'Europe', 'Netherlands': 'Europe', 'Czechia': 'Europe',
    'United States': 'North America', 'Canada': 'North America',
    'Mexico': 'North America',
    'Australia': 'Oceania', 'New Zealand': 'Oceania',
    'Brazil': 'South America', 'Argentina': 'South America', 'Peru': 'South America',
    'Egypt': 'Africa', 'Morocco': 'Africa', 'South Africa': 'Africa', 'Kenya': 'Africa'
  };

  (function stats() {
    var countries = {};
    var continents = {};
    places.forEach(function (p) {
      countries[p.country] = true;
      var c = CONTINENT[p.country];
      if (c) continents[c] = true;
    });
    var set = function (id, n) {
      var el = document.getElementById(id);
      if (el) el.textContent = n < 10 ? '0' + n : String(n);
    };
    set('statCountries', Object.keys(countries).length);
    set('statPlaces', places.length);
    set('statContinents', Object.keys(continents).length);
  })();

  /* ---------------- map ---------------- */
  if (hasLeaflet) {
    map = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 12,
      attributionControl: true
    });

    // Esri's Light Gray Canvas: pale by default and needs no API key.
    // To swap providers, replace these two URLs — nothing else depends on them.
    var ESRI = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/';

    L.tileLayer(ESRI + 'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 12
    }).addTo(map);

    L.tileLayer(ESRI + 'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 12,
      opacity: 0.75
    }).addTo(map);

    map.zoomControl.setPosition('bottomright');
  }

  function popupHtml(p) {
    var c = colorOf(p);
    var img = p.photo
      ? '<img class="pop__img" src="' + esc(p.photo) + '" alt="' + esc(p.name) +
        '" onerror="this.classList.add(\'is-empty\')">'
      : '';
    var vlog = (p.vlog && p.vlog.url)
      ? '<a class="pop__vlog" href="' + esc(p.vlog.url) + '" target="_blank" rel="noopener">' +
        esc(p.vlog.label || 'Watch the vlog') + ' &#8599;</a>'
      : '';
    return '<div style="--c:' + c + '">' + img +
      '<div class="pop__body">' +
        '<span class="pop__kind">' + esc(labelOf(p)) + '</span>' +
        '<h2 class="pop__name">' + esc(p.name) + '</h2>' +
        '<p class="pop__meta">' + esc(p.country) + ' &middot; ' + esc(p.year) + '</p>' +
        '<p class="pop__blurb">' + esc(p.blurb) + '</p>' +
        vlog +
      '</div></div>';
  }

  /* ---------------- build list + markers ---------------- */
  places.forEach(function (p, i) {
    var c = colorOf(p);

    /* --- sidebar row --- */
    var li = document.createElement('li');
    var row = document.createElement('div');
    row.className = 'place';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.dataset.index = String(i);
    row.dataset.kind = p.kind;

    var vlogHtml = (p.vlog && p.vlog.url)
      ? '<a class="place__vlog" href="' + esc(p.vlog.url) + '" target="_blank" rel="noopener">' +
        esc(p.vlog.label || 'Watch the vlog') + ' &#8599;</a>'
      : '';

    row.innerHTML =
      '<div class="place__top">' +
        '<span class="place__pin" style="background:' + c + '"></span>' +
        '<span class="place__name">' + esc(p.name) + '</span>' +
        '<span class="place__country">' + esc(p.country) + '</span>' +
        '<span class="place__year">' + esc(p.year) + '</span>' +
      '</div>' +
      '<p class="place__blurb">' + esc(p.blurb) + '</p>' +
      vlogHtml;

    li.appendChild(row);
    listEl.appendChild(li);

    var go = function (e) {
      if (e.target.closest && e.target.closest('.place__vlog')) return;
      select(i, true);
    };
    row.addEventListener('click', go);
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); }
    });

    /* --- map marker --- */
    if (map) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="pin" style="--c:' + c + '"><span class="pin__ring"></span><span class="pin__dot"></span></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -10]
      });
      var m = L.marker(p.coords, { icon: icon, title: p.name, riseOnHover: true }).addTo(map);
      m.bindPopup(popupHtml(p), { closeButton: true, maxWidth: 264, offset: [0, -4] });
      m.on('click', function () { select(i, false); });
      markers[i] = m;
    }
  });

  /* ---------------- selection ---------------- */
  function select(i, fly) {
    activeIndex = i;
    listEl.querySelectorAll('.place').forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.index === String(i));
    });
    Object.keys(markers).forEach(function (k) {
      var el = markers[k].getElement();
      if (el) {
        var pin = el.querySelector('.pin');
        if (pin) pin.classList.toggle('is-active', k === String(i));
      }
    });

    var m = markers[i];
    if (!m || !map) return;
    if (fly) {
      map.flyTo(places[i].coords, Math.max(map.getZoom(), 5), { duration: 1.1 });
      setTimeout(function () { m.openPopup(); }, 700);
    } else {
      m.openPopup();
    }
  }

  /* ---------------- filters ---------------- */
  if (filtersEl) {
    var used = {};
    places.forEach(function (p) { used[p.kind] = true; });

    Object.keys(kinds).forEach(function (k) {
      if (!used[k]) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fchip';
      b.dataset.kind = k;
      b.innerHTML = '<i style="color:' + kinds[k].color + '"></i>' + esc(kinds[k].label);
      filtersEl.appendChild(b);
    });

    filtersEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var kind = btn.dataset.kind;

      filtersEl.querySelectorAll('.fchip').forEach(function (el) {
        el.classList.toggle('is-on', el === btn);
      });

      listEl.querySelectorAll('.place').forEach(function (el) {
        var show = kind === 'all' || el.dataset.kind === kind;
        el.parentElement.hidden = !show;
      });

      var shown = [];
      places.forEach(function (p, i) {
        var show = kind === 'all' || p.kind === kind;
        var m = markers[i];
        if (!m) return;
        if (show) { m.addTo(map); shown.push(p.coords); }
        else { map.removeLayer(m); }
      });
      if (map && shown.length) {
        map.flyToBounds(L.latLngBounds(shown).pad(0.35), { duration: 1, maxZoom: 6 });
      }
    });
  }

  /* ---------------- initial view ---------------- */
  if (map) {
    if (places.length > 1) {
      map.fitBounds(L.latLngBounds(places.map(function (p) { return p.coords; })).pad(0.32));
    } else if (places.length === 1) {
      map.setView(places[0].coords, 5);
    } else {
      map.setView([20, 100], 3);
    }
  } else {
    mapEl.innerHTML =
      '<p class="atlas__fallback">The map library could not load — check your connection. ' +
      'Every place is still listed in the panel.</p>';
  }
})();
