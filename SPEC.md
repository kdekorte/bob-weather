# Weather Dashboard — Neutralino Application Specification

## Overview

A fullscreen kiosk-style weather dashboard built with [Neutralino.js](https://neutralino.js.org/), designed to run on an **800×480** embedded or touchscreen display. The application presents three primary panels: a clock/date display, current weather and multi-day forecast, and an interactive map with precipitation radar overlay.

---

## Target Environment

| Property | Value |
|---|---|
| Framework | Neutralino.js (latest stable) |
| Display resolution | 800 × 480 px |
| Window mode | Fullscreen (no title bar, no resize) |
| Input | Touch and/or mouse |
| Network | Required (weather API + map tiles) |
| Refresh rate | Configurable (default 5 minutes) |

---

## Layout

The 800×480 canvas is divided into three regions arranged horizontally:

```
┌────────────────┬──────────────────────┬──────────────────────┐
│                │                      │                      │
│   Clock/Date   │  Current Weather +   │   Map + Radar        │
│                │  5-Day Forecast      │                      │
│   ~200 × 480   │   ~260 × 480         │   ~340 × 480         │
│                │                      │                      │
└────────────────┴──────────────────────┴──────────────────────┘
```

All three panels are full-height. No scrolling. All content must fit within the panel bounds at all times.

---

## Panel 1 — Clock & Date (200 × 480)

### Display Elements

- **Current time** — large, high-contrast digital or sans-serif font; 12hr or 24hr configurable
- **AM/PM indicator** — shown when 12hr mode is active; smaller than the hour/minute digits
- **Day of week** — full name (e.g. "Wednesday"), medium size
- **Full date** — formatted as `Month DD, YYYY` (e.g. "July 9, 2025")
- **Separator** — thin horizontal rule between clock and date sections

### Behaviour

- Updates every second via `setInterval`
- No network dependency; uses the system clock via `Date`
- Font size must remain readable at 800×480 without magnification

---

## Panel 2 — Weather (260 × 480)

### Sub-sections

#### 2a — Current Conditions (upper ~200 px)

- **Location name** — city/region resolved from geolocation or configured coordinates
- **Weather condition icon** — clear, clouds, rain, snow, thunderstorm, etc. (SVG or PNG sprite, minimum 64×64 px)
- **Current temperature** — large display; unit toggle (°F / °C) persisted to local storage
- **Feels-like temperature** — smaller, below the main temperature
- **Short condition label** — e.g. "Partly Cloudy", "Heavy Rain"
- **Wind speed & direction** — compass bearing abbreviation (N, NE, E…) and speed in mph/kph
- **Humidity** — percentage
- **Sunrise / Sunset times**

#### 2b — 5-Day Forecast (lower ~280 px)

- One row per day, 5 rows total
- Each row contains:
  - **Day abbreviation** — Mon, Tue, Wed…
  - **Condition icon** — small (32×32 px)
  - **High / Low temperatures**
  - **Precipitation probability** — shown as a percentage

### Data Source

- **Primary**: [Open-Meteo](https://open-meteo.com/) (free, no API key required)
  - Current weather endpoint: `https://api.open-meteo.com/v1/forecast`
  - Parameters: `current_weather`, `hourly`, `daily`
- **Fallback / enrichment**: [OpenWeatherMap](https://openweathermap.org/api) One Call API (requires free API key stored in environment variable `OWM_API_KEY`)
- Coordinates sourced from the Geolocation panel (see Panel 3) or from `neutralino.config.json` under `weatherConfig.latitude` / `weatherConfig.longitude`

### Refresh

- Weather data fetched on startup, then every **5 minutes**
- A subtle loading indicator (spinner or pulse animation on the panel border) is shown during fetch
- Stale data (>15 min old) is visually flagged with a muted overlay and a "Last updated HH:MM" label

---

## Panel 3 — Map & Radar (340 × 480)

### Map

- Rendered using **[Leaflet.js](https://leafletjs.com/)** (latest stable) inside a Neutralino WebView
- Base tile layer: [OpenStreetMap](https://www.openstreetmap.org/) (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Initial view centred on the device's current coordinates
- Zoom level defaults to 7; adjustable via map controls
- Map tiles are loaded from OSM; no API key required

### Precipitation Radar Overlay

- Source: [RainViewer API](https://www.rainviewer.com/api.html) (free, no key required)
  - Timestamped radar tile endpoint: `https://tilecache.rainviewer.com/v2/radar/{timestamp}/{size}/{z}/{x}/{y}/2/1_1.png`
  - Metadata endpoint: `https://api.rainviewer.com/public/weather-maps.json`
- Fetch the latest available radar timestamp from the metadata endpoint on load and every **5 minutes**
- Add as a Leaflet tile layer on top of the OSM base layer with **opacity 0.6**
- Animate through the last **2 available radar frames** at a 1-second interval to give a motion sense (loop continuously)
- A small timestamp label in the bottom-right corner of the map panel shows the radar frame time (HH:MM local)

### Interaction

- Touch/click drag to pan; pinch or scroll to zoom (standard Leaflet defaults)
- Double-tap resets to the default 100-mile view centred on home coordinates
- No search bar or address input required

---

## Configuration (`neutralino.config.json` extensions)

```json
"weatherConfig": {
  "latitude": null,
  "longitude": null,
  "useGeolocation": true,
  "units": "imperial",
  "timeFormat": "12h",
  "refreshIntervalSeconds": 300,
  "radarOpacity": 0.6,
  "radarFrameCount": 2
}
```

- If `useGeolocation` is `true` and coordinates are `null`, the app calls `navigator.geolocation.getCurrentPosition` on startup
- If geolocation fails or is unavailable, it falls back to `latitude` / `longitude` from config; if those are also absent, it falls back to a hardcoded default (e.g. Kansas City, MO: `38.2527, -85.7585`)
- `units`: `"imperial"` (°F, mph, miles) or `"metric"` (°C, kph, km)
- All config values are read once at startup; a full app reload is required to apply changes

---

## Technology Stack

| Component | Technology |
|---|---|
| App shell | Neutralino.js (latest stable) |
| UI rendering | HTML5 + CSS3 + vanilla JS (ES2022) |
| Map | Leaflet.js (latest stable) |
| Weather data | Open-Meteo API (primary) |
| Radar data | RainViewer API |
| Map tiles | OpenStreetMap |
| Icons | SVG icon set (weather-icons or equivalent open-source set) |
| Fonts | System font stack; no external font CDN |

No frontend build tool (Webpack, Vite, etc.) is required. All assets are bundled statically in the `resources/` directory.

---

## File Structure

```
weather-dashboard/
├── neutralino.config.json
├── SPEC.md
├── resources/
│   ├── index.html          # Root HTML; defines the 3-panel layout
│   ├── styles/
│   │   └── main.css        # Layout grid, panel styles, typography
│   ├── scripts/
│   │   ├── clock.js        # Panel 1: clock/date logic
│   │   ├── weather.js      # Panel 2: weather fetch + render
│   │   ├── map.js          # Panel 3: Leaflet init + radar overlay
│   │   └── config.js       # Reads neutralino.config.json weatherConfig
│   ├── icons/
│   │   └── *.svg           # Weather condition icons
│   └── vendor/
│       ├── leaflet/        # Leaflet JS + CSS (local copy)
│       └── neutralino.js   # Neutralino client library
└── .gitignore
```

---

## Security Considerations

- **No API keys in source code.** Any optional API keys (e.g. `OWM_API_KEY`) are read from OS environment variables via `Neutralino.os.getEnv()` and never committed to version control
- **`.gitignore`** must exclude any `.env` files and local config overrides
- All external HTTP requests use **HTTPS** exclusively
- Leaflet tile attribution is displayed as required by OSM tile usage policy
- No user input is passed to any API without sanitisation (location coordinates are numeric only)
- Content Security Policy header set in `neutralino.config.json` to restrict sources to known origins

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Cold startup time | < 3 seconds to first paint |
| Weather data age on display | ≤ 5 minutes |
| Radar data age on display | ≤ 5 minutes |
| Memory footprint | < 150 MB RSS |
| CPU usage (idle) | < 5% average |
| Network failure behaviour | Show last known data with staleness indicator; no crash |
| Offline startup | Show last cached data if available; degrade gracefully |

---

## Out of Scope

- User authentication or accounts
- Push notifications
- Multiple location support (single home location only)
- Historical weather data
- Severe weather alerts (may be added in a future iteration)
- App auto-update mechanism
