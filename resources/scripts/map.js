/**
 * map.js — Panel 3: Leaflet map + RainViewer precipitation radar.
 *
 * - OSM base tiles (no key)
 * - RainViewer animated radar: up to 15 historical frames, smooth cross-fade,
 *   refreshes every 5 minutes, pre-loads all tiles before animating.
 */

// Default zoom level
const DEFAULT_ZOOM = 7;

// Radar settings
const RADAR_MAX_FRAMES     = 15;   // max historical frames to keep
const RADAR_REFRESH_MS     = 5 * 60 * 1000;  // 5 minutes
const RADAR_FRAME_DWELL_MS = 1000;  // ms each frame is shown
const RADAR_FADE_MS        = 400;  // cross-fade duration (CSS transition)

let _map             = null;
let _homeLatLng      = null;
let _radarLayers     = [];   // Leaflet tile layers, one per frame
let _radarTimestamps = [];   // unix timestamps matching each layer
let _radarFrameIdx   = 0;
let _radarAnimTimer  = null;
let _radarRefreshTimer = null;

// ---- Zoom calculation ---------------------------------------------------

function calcZoomForRadius(lat, radiusMiles, panelWidthPx) {
  const lonDegPerMile = 1 / (Math.cos(lat * Math.PI / 180) * 69.172);
  const diameterDeg   = 2 * radiusMiles * lonDegPerMile;
  const zoom = Math.log2((360 * panelWidthPx) / (256 * diameterDeg));
  return Math.max(4, Math.min(12, Math.floor(zoom)));
}

// ---- RainViewer ---------------------------------------------------------

async function fetchRadarFrames() {
  const url = 'https://api.rainviewer.com/public/weather-maps.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RainViewer metadata HTTP ${res.status}`);
  const data = await res.json();
  const host   = data.host || 'https://tilecache.rainviewer.com';
  const frames = data.radar?.past || [];
  // Take up to RADAR_MAX_FRAMES most recent frames
  return frames.slice(-RADAR_MAX_FRAMES).map(f => ({
    time:    f.time,
    tileUrl: `${host}${f.path}/512/{z}/{x}/{y}/2/1_1.png`,
  }));
}

function radarTimestampLabel(ts) {
  const d = new Date(ts * 1000);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  if (AppConfig.timeFormat === '12h') {
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `Radar ${h % 12 || 12}:${m} ${ampm}`;
  }
  return `Radar ${String(h).padStart(2,'0')}:${m}`;
}

/**
 * Wait until all tiles for a layer are loaded (or timeout after 8s).
 * Resolves immediately if the layer has no pending tiles.
 */
function waitForLayerLoad(layer) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };

    // If Leaflet reports the layer is already idle, resolve right away
    if (layer._loading === false || !layer._loading) {
      // Give a short tick for tiles to start requesting
      setTimeout(() => {
        if (!done) {
          layer.once('load', finish);
          // Safety timeout
          setTimeout(finish, 8000);
        }
      }, 50);
    } else {
      layer.once('load', finish);
      setTimeout(finish, 8000);
    }
  });
}

// ---- Animation ----------------------------------------------------------

function stopRadarAnimation() {
  if (_radarAnimTimer) {
    clearTimeout(_radarAnimTimer);
    _radarAnimTimer = null;
  }
}

/**
 * Show a layer by bringing it to the top of the stack at full opacity.
 * Hide a layer by pushing it behind and setting display:none on its container.
 * No opacity animation — eliminates all flash caused by opacity dips.
 */
function showLayer(layer) {
  const el = layer._container;
  if (el) {
    el.style.display = '';
    el.style.zIndex  = 250;
  }
  layer.setOpacity(AppConfig.radarOpacity || 0.6);
}

function hideLayer(layer) {
  const el = layer._container;
  if (el) {
    el.style.zIndex  = 200;
    el.style.display = 'none';
  }
  layer.options.opacity = 0;
}

function scheduleNextFrame() {
  // Most recent frame dwells twice as long before the loop restarts
  const isLast  = _radarFrameIdx === _radarLayers.length - 1;
  const delay   = isLast ? RADAR_FRAME_DWELL_MS * 2 : RADAR_FRAME_DWELL_MS;

  _radarAnimTimer = setTimeout(() => {
    const current = _radarLayers[_radarFrameIdx];

    // Advance index
    _radarFrameIdx = (_radarFrameIdx + 1) % _radarLayers.length;
    const next = _radarLayers[_radarFrameIdx];

    // Bring next frame on top first, then hide the current one
    showLayer(next);
    hideLayer(current);

    document.getElementById('radar-timestamp').textContent =
      radarTimestampLabel(_radarTimestamps[_radarFrameIdx]);

    scheduleNextFrame();
  }, delay);
}

function startRadarAnimation() {
  stopRadarAnimation();
  if (_radarLayers.length < 2) return;
  scheduleNextFrame();
}

// ---- Load / reload radar ------------------------------------------------

async function loadRadar() {
  try {
    const frames = await fetchRadarFrames();
    if (!frames.length) return;

    // Check whether the newest frame is already in our set
    const latestTime = frames[frames.length - 1].time;
    const alreadyCurrent = _radarTimestamps.length > 0 &&
      _radarTimestamps[_radarTimestamps.length - 1] === latestTime;
    if (alreadyCurrent) return;  // nothing new from the API

    // Pause animation while we rebuild
    stopRadarAnimation();

    // Reuse existing layers for timestamps we already have
    const existingMap = new Map();
    _radarTimestamps.forEach((ts, i) => existingMap.set(ts, _radarLayers[i]));

    const newLayers     = [];
    const newTimestamps = [];
    const layersToPreload = [];

    frames.forEach(frame => {
      let layer = existingMap.get(frame.time);
      if (!layer) {
        layer = L.tileLayer(frame.tileUrl, {
          opacity:     0,
          tileSize:    512,
          zoomOffset:  -1,
          attribution: 'Radar © <a href="https://www.rainviewer.com/" target="_blank">RainViewer</a>',
        });
        layer.addTo(_map);
        layersToPreload.push(layer);
        existingMap.delete(frame.time);
      }
      newLayers.push(layer);
      newTimestamps.push(frame.time);
    });

    // Remove layers that aged out of the window
    _radarLayers.forEach(l => {
      if (!newLayers.includes(l)) _map.removeLayer(l);
    });

    _radarLayers     = newLayers;
    _radarTimestamps = newTimestamps;

    // Pre-load only new tile layers before animating
    if (layersToPreload.length > 0) {
      await Promise.all(layersToPreload.map(waitForLayerLoad));
    }

    // Hide every frame, show the oldest to start the sweep
    _radarLayers.forEach(l => hideLayer(l));
    _radarFrameIdx = 0;
    showLayer(_radarLayers[0]);

    document.getElementById('radar-timestamp').textContent =
      radarTimestampLabel(_radarTimestamps[0]);

    startRadarAnimation();
  } catch (err) {
    console.error('Radar load failed:', err);
  }
}

// ---- Map init -----------------------------------------------------------

function initMap() {
  const lat  = AppConfig.latitude;
  const lon  = AppConfig.longitude;
  _homeLatLng = [lat, lon];

  const zoom = DEFAULT_ZOOM;

  _map = L.map('map', {
    center:             _homeLatLng,
    zoom:               zoom,
    zoomControl:        false,
    attributionControl: true,
    doubleClickZoom:    false,
  });

  L.control.zoom({ position: 'topright' }).addTo(_map);

  // Home button — recentres to default view
  const HomeControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-home-btn');
      btn.title = 'Reset to home view';
      btn.innerHTML = `<a role="button" aria-label="Reset to home view" href="#">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 1.5L1 7.5h2V14h4v-4h2v4h4V7.5h2L8 1.5z"/>
        </svg>
      </a>`;
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        _map.setView(_homeLatLng, zoom, { animate: true });
      });
      return btn;
    }
  });
  new HomeControl().addTo(_map);

  // Base tile layer — OSM
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:     19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
  }).addTo(_map);

  // Current location marker
  L.circleMarker(_homeLatLng, {
    radius:      6,
    color:       '#3b82d4',
    fillColor:   '#3b82d4',
    fillOpacity: 1,
    weight:      2,
  }).addTo(_map);

  // Double-click resets view
  _map.on('dblclick', () => {
    _map.setView(_homeLatLng, zoom, { animate: true });
  });

  // Ensure Leaflet picks up the actual rendered size (100vh vs fixed px)
  setTimeout(() => _map.invalidateSize(), 100);

  // Load all historical radar frames immediately on startup
  loadRadar();

  // Refresh radar every 5 minutes independent of weather refresh
  _radarRefreshTimer = setInterval(loadRadar, RADAR_REFRESH_MS);
}
