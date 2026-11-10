// ============================================================
// MooEarth Live — Photorealistic Satellite Basemap Specification
// ============================================================
// Professional meteorological satellite cartographic aesthetic for 2D satellite view:
// - Photorealistic 4K Earth Surface: High-resolution Esri World Imagery (250m to sub-meter)
// - Realistic Deserts, Forests, Mountains & Ocean Bathymetry
// - Reference Boundaries: Crisp, subtle sovereign border lines (#e2e8f0 at 35-40% opacity)
// - Reference Labels: High-contrast white glyphs with deep-space halo (#050814) for crystal readability
// - Fully licensed & compliant: Esri World Imagery, OpenMapTiles, Natural Earth (Public Domain / ODbL)

export const ATMOSPHERIC_SATELLITE_MAP_STYLE: any = {
  version: 8,
  name: 'Atmospheric Satellite Base',
  sources: {
    esri_satellite_imagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    },
    esri_hillshade: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Hillshade &copy; Esri',
    },
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://openfreemap.org">OpenFreeMap</a>',
    },
  },
  sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    // 1. Deep Space Black Base
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#030712',
      },
    },
    // 2. Photorealistic 4K Global Satellite Photography (ESRI World Imagery)
    {
      id: 'esri_satellite_imagery_layer',
      type: 'raster',
      source: 'esri_satellite_imagery',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 1.0,
        'raster-resampling': 'linear',
      },
    },
    // 3. Subtle 3D Topographic Hillshade Relief (subtle depth enhancement)
    {
      id: 'esri_hillshade_layer',
      type: 'raster',
      source: 'esri_hillshade',
      maxzoom: 16,
      paint: {
        'raster-opacity': 0.18,
        'raster-contrast': 0.20,
        'raster-resampling': 'linear',
      },
    },
    // 4. Country Sovereign Boundaries (Subtle & Crisp over Satellite Ground)
    {
      id: 'boundary_country_z0-4',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      maxzoom: 5,
      filter: ['all', ['==', 'admin_level', 2], ['!has', 'claimed_by']],
      paint: {
        'line-color': '#f8fafc',
        'line-width': 1.0,
        'line-opacity': 0.38,
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
        'line-color': '#f8fafc',
        'line-width': 1.3,
        'line-opacity': 0.42,
      },
    },
    // 5. Marine Ocean Labels (e.g. INDIAN OCEAN, PACIFIC OCEAN)
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
        'text-color': '#93c5fd',
        'text-halo-color': '#030712',
        'text-halo-width': 1.8,
        'text-opacity': 0.85,
      },
    },
    // 6. Sovereign Country Labels
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
        'text-halo-color': '#050814',
        'text-halo-width': 2.0,
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
        'text-color': '#f8fafc',
        'text-halo-color': '#050814',
        'text-halo-width': 1.8,
      },
    },
    // 7. Major Capital & Metropolitan City Labels
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
        'text-halo-color': '#050814',
        'text-halo-width': 1.8,
      },
    },
  ],
};

export const WINDY_MAP_STYLE = ATMOSPHERIC_SATELLITE_MAP_STYLE;

// ============================================================
// MooEarth Live — Wind Mode Dark Basemap (Windy & Zoom Earth Parity)
// ============================================================
// A dedicated dark basemap for the Wind layer that keeps continent shapes
// clearly visible against a deep navy ocean. Uses low-opacity satellite
// imagery so land masses are distinguishable, with bright country labels
// and borders for geographic reference.
export const WIND_DARK_MAP_STYLE: any = {
  version: 8,
  name: 'Wind Dark Basemap',
  sources: {
    esri_satellite_imagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
    esri_hillshade: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Hillshade &copy; Esri',
    },
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    // 1. Deep Space Black/Navy Base
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#050a16',
      },
    },
    // 2. High-Definition Earth Satellite Surface (Esri World Imagery) - Rich, clearly visible continents
    {
      id: 'esri_satellite_imagery_layer',
      type: 'raster',
      source: 'esri_satellite_imagery',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.78,
        'raster-brightness-max': 0.90,
        'raster-contrast': 0.20,
        'raster-saturation': -0.15,
        'raster-resampling': 'linear',
      },
    },
    // 3. 3D Topographic Hillshade Relief
    {
      id: 'esri_hillshade_layer',
      type: 'raster',
      source: 'esri_hillshade',
      maxzoom: 16,
      paint: {
        'raster-opacity': 0.18,
        'raster-contrast': 0.20,
        'raster-resampling': 'linear',
      },
    },
    // 4. Country Sovereign Boundaries — crisp, razor-sharp white lines
    {
      id: 'boundary_country_z0-4',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      maxzoom: 5,
      filter: ['all', ['==', 'admin_level', 2], ['!has', 'claimed_by']],
      paint: {
        'line-color': '#ffffff',
        'line-width': 1.1,
        'line-opacity': 0.52,
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
        'line-color': '#ffffff',
        'line-width': 1.3,
        'line-opacity': 0.58,
      },
    },
    // 5. Marine Ocean Labels
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
        'text-color': '#93c5fd',
        'text-halo-color': '#050a16',
        'text-halo-width': 1.8,
        'text-opacity': 0.85,
      },
    },
    // 6. Sovereign Country Labels
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
        'text-halo-color': '#050814',
        'text-halo-width': 2.0,
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
        'text-color': '#f8fafc',
        'text-halo-color': '#050814',
        'text-halo-width': 1.8,
      },
    },
    // 7. Major Cities
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
        'text-halo-color': '#050814',
        'text-halo-width': 1.8,
      },
    },
  ],
};
