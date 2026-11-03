// ============================================================
// MooEarth Live — Atmospheric Satellite Basemap Style Specification
// ============================================================
// Professional meteorological cartographic aesthetic for 2D satellite view:
// - Land: Rich olive green (#3d5218)
// - Oceans & Water: Deep Royal Navy (#203657)
// - Sovereign Borders: Crisp dark border lines (#16240d)
// - Relief: Prominent Natural Earth shaded relief (ne2sr) at 34% opacity for visible mountain ridges
// - Reference Labels: High-contrast white glyphs with dark halo (#121e0b)
// - Fully open-source: OpenFreeMap / OpenMapTiles / Natural Earth (ODbL / Public Domain)

export const ATMOSPHERIC_SATELLITE_MAP_STYLE: any = {
  version: 8,
  name: 'Atmospheric Satellite Base',
  sources: {
    esri_hillshade: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Hillshade &copy; Esri',
    },
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
        'background-color': '#3d5218',
      },
    },
    // 2. High-Resolution 3D Topographic Hillshade Relief (active all the way to zoom 16 like Windy)
    {
      id: 'esri_hillshade_layer',
      type: 'raster',
      source: 'esri_hillshade',
      maxzoom: 18,
      paint: {
        'raster-opacity': 0.38,
        'raster-contrast': 0.32,
        'raster-resampling': 'linear',
      },
    },
    // 2b. Natural Earth Topographic Shaded Relief (macro overview)
    {
      id: 'ne2_shaded',
      type: 'raster',
      source: 'ne2_shaded',
      maxzoom: 6,
      paint: {
        'raster-opacity': 0.20,
        'raster-contrast': 0.28,
        'raster-resampling': 'linear',
      },
    },
    // 3. Deep Royal Navy Water & Oceans (Windy HD Parity #203657)
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#203657',
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
        'line-color': '#182512',
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
        'line-color': '#182512',
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
        'line-color': '#203657',
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

export const WINDY_MAP_STYLE = ATMOSPHERIC_SATELLITE_MAP_STYLE;
