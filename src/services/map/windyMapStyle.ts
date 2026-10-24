// ============================================================
// MooEarth Live — Windy Satellite Basemap Style Specification
// ============================================================
// Authentic Windy.com cartographic aesthetic for 2D satellite view:
// - Land: Rich olive green (#486028)
// - Oceans & Water: Deep marine navy (#162d4e)
// - Sovereign Borders: Crisp dark border lines (#16240d)
// - Relief: Subtle Natural Earth shaded relief (ne2sr) at 28% opacity
// - Reference Labels: High-contrast white glyphs with dark halo (#121e0b)
// - Fully open-source: OpenFreeMap / OpenMapTiles / Natural Earth (ODbL / Public Domain)

export const WINDY_MAP_STYLE: any = {
  version: 8,
  name: 'Windy Satellite Base',
  sources: {
    ne2_shaded: {
      type: 'raster',
      tiles: ['https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 6,
      attribution: 'Shaded Relief &copy; Natural Earth',
    },
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://openfreemap.org">OpenFreeMap</a>',
    },
  },
  sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    // 1. Olive Green Land Background
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#486028',
      },
    },
    // 2. Deep Navy Water & Oceans
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#162d4e',
      },
    },
    // 3. Natural Earth Topographic Shaded Relief
    {
      id: 'ne2_shaded',
      type: 'raster',
      source: 'ne2_shaded',
      maxzoom: 7,
      paint: {
        'raster-opacity': 0.28,
        'raster-contrast': 0.15,
      },
    },
    // 4. Country Sovereign Boundaries
    {
      id: 'boundary_country_z0-4',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      maxzoom: 5,
      filter: ['all', ['==', 'admin_level', 2], ['!has', 'claimed_by']],
      paint: {
        'line-color': '#16240d',
        'line-width': 1.1,
        'line-opacity': 0.95,
      },
    },
    {
      id: 'boundary_country_z5-',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      minzoom: 5,
      filter: ['all', ['==', 'admin_level', 2]],
      paint: {
        'line-color': '#16240d',
        'line-width': 1.4,
        'line-opacity': 0.95,
      },
    },
    // 5. Waterway Lines (Rivers & Lakes)
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      minzoom: 6,
      paint: {
        'line-color': '#162d4e',
        'line-width': 1.0,
      },
    },
    // 6. Marine Ocean Labels (e.g. INDIAN OCEAN, PACIFIC OCEAN)
    {
      id: 'water_name_marine',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      filter: ['==', 'class', 'ocean'],
      layout: {
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 4, 14],
        'text-letter-spacing': 0.25,
        'text-transform': 'uppercase',
        'text-max-width': 9,
      },
      paint: {
        'text-color': '#7ea5d9',
        'text-halo-color': '#101e33',
        'text-halo-width': 1.5,
        'text-opacity': 0.85,
      },
    },
    // 7. Sovereign Country Labels
    {
      id: 'place_country_major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'country'], ['<=', 'rank', 2]],
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 1, 9, 4, 13],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.12,
        'text-max-width': 6.25,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#121e0b',
        'text-halo-width': 1.8,
        'text-halo-blur': 0.5,
      },
    },
    {
      id: 'place_country_minor',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'country'], ['>', 'rank', 2]],
      minzoom: 3,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13],
        'text-max-width': 6.25,
      },
      paint: {
        'text-color': '#f0f4e8',
        'text-halo-color': '#121e0b',
        'text-halo-width': 1.5,
      },
    },
    // 8. Major Capital & Metropolitan City Labels
    {
      id: 'place_city_major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'city'], ['<=', 'rank', 3]],
      minzoom: 4,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 14],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#121e0b',
        'text-halo-width': 1.5,
      },
    },
  ],
};
