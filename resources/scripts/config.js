/**
 * config.js — reads weatherConfig from neutralino.config.json
 * and exposes a single AppConfig object to all other scripts.
 *
 * Falls back to safe defaults so the app works without
 * Neutralino (e.g. opened directly in a browser for dev).
 */

const DEFAULT_CONFIG = {
  latitude: null,
  longitude: null,
  useGeolocation: true,
  units: 'imperial',
  timeFormat: '12h',
  refreshIntervalSeconds: 300,
  radarOpacity: 0.6,
  radarFrameCount: 2,
};

// Fallback coordinates: Kansas City, MO
const FALLBACK_LAT = 39.0997;
const FALLBACK_LON = -94.5786;

const AppConfig = { ...DEFAULT_CONFIG };

/**
 * Initialise config by reading neutralino.config.json.
 * Must be awaited before any other module starts.
 */
async function initConfig() {
  try {
    if (typeof Neutralino !== 'undefined') {
      const raw = await Neutralino.filesystem.readFile('./neutralino.config.json');
      const json = JSON.parse(raw);
      const wc = json.weatherConfig || {};
      Object.assign(AppConfig, DEFAULT_CONFIG, wc);
    }
  } catch (_) {
    // Not in Neutralino runtime or file unreadable — use defaults
  }

  // Restore persisted unit preference
  const savedUnits = localStorage.getItem('wx_units');
  if (savedUnits === 'imperial' || savedUnits === 'metric') {
    AppConfig.units = savedUnits;
  }

  // Resolve coordinates
  await resolveCoordinates();
}

/**
 * Resolve lat/lon via geolocation -> config -> fallback.
 */
async function resolveCoordinates() {
  if (AppConfig.useGeolocation && (!AppConfig.latitude || !AppConfig.longitude)) {
    try {
      const pos = await getGeolocation();
      AppConfig.latitude = pos.coords.latitude;
      AppConfig.longitude = pos.coords.longitude;
      return;
    } catch (_) {
      // geolocation failed — fall through
    }
  }

  if (AppConfig.latitude && AppConfig.longitude) {
    return; // already set from config
  }

  // Final fallback
  AppConfig.latitude = FALLBACK_LAT;
  AppConfig.longitude = FALLBACK_LON;
}

function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 60000,
    });
  });
}

/**
 * Toggle between imperial / metric and persist the choice.
 */
function toggleUnits() {
  AppConfig.units = AppConfig.units === 'imperial' ? 'metric' : 'imperial';
  localStorage.setItem('wx_units', AppConfig.units);
}
