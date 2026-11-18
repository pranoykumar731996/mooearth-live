// ============================================================
// MooEarth Live — Photorealistic Satellite Basemap Specification
// ============================================================
// Professional meteorological satellite cartographic aesthetic for 2D satellite view:
// - Photorealistic 4K Earth Surface: High-resolution Esri World Imagery (250m to sub-meter)
// - Realistic Deserts, Forests, Mountains & Ocean Bathymetry
// - Reference Boundaries: Crisp, subtle sovereign border lines (#000000 at 95% opacity)
// - 8-Tier Progressive Labels: High-contrast white glyphs with deep-space halo (#050814) for crystal readability
// - Fully licensed & compliant: Esri World Imagery, OpenMapTiles, Natural Earth (Public Domain / ODbL)

/**
 * 8-Tier Progressive Cartographic Reference Layers (OpenMapTiles / OpenFreeMap)
 * Progressive disclosure across all zoom levels:
 * - Zoom 0 to 5: Sovereign Country Borders (Crisp Black #000000)
 * - Zoom 4 to 18: Vector Country & State/Provincial Boundaries
 * - Zoom 0 to 5: Sovereign Country Names
 * - Zoom 3.5 to 9: State/Province Boundaries & Names
 * - Zoom 3.5 to 8: World Megacities & National Capitals (rank <= 3)
 * - Zoom 5.5 to 11: Major Regional & Secondary Cities (rank 4 to 8, e.g. Bhubaneswar, Austin, Lyon)
 * - Zoom 7.5 to 13: Minor Cities & Large Towns (rank > 8, class == 'town')
 * - Zoom 10.5 to 16: Suburbs, Villages, Municipalities & Neighborhoods
 * - Zoom 13 to 18: Points of Interest, Monuments, Airports & Landmarks
 */
export function createCartographicReferenceLayers(haloColor: string = '#050814', marineColor: string = '#93c5fd'): any[] {
  return [
    // 1. Country Sovereign Boundaries — Macro to Regional
    {
      id: 'boundary_country_z0-4',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      maxzoom: 5,
      filter: ['all', ['==', 'admin_level', 2]],
      paint: {
        'line-color': '#000000',
        'line-width': 1.5,
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
        'line-color': '#000000',
        'line-width': 1.8,
        'line-opacity': 0.95,
      },
    },
    // 2. State & Provincial Boundaries (e.g. US States, Canadian Provinces, Indian States)
    {
      id: 'boundary_state_z4-',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      minzoom: 4,
      filter: ['all', ['==', 'admin_level', 4]],
      paint: {
        'line-color': '#475569',
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 8, 1.4],
        'line-dasharray': [3, 2],
        'line-opacity': 0.70,
      },
    },
    // 3. Marine Ocean & Sea Labels
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
        'text-color': marineColor,
        'text-halo-color': haloColor,
        'text-halo-width': 1.8,
        'text-opacity': 0.85,
      },
    },
    // 4. Sovereign Country Labels (Tier 1 & Tier 2)
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
        'text-halo-color': haloColor,
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
        'text-halo-color': haloColor,
        'text-halo-width': 1.8,
      },
    },
    // 5. State / Province Names (Progressive Zoom 3.5 to 9)
    {
      id: 'place_state',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['in', 'class', 'state', 'province']],
      minzoom: 3.5,
      maxzoom: 9,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 9, 8, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': haloColor,
        'text-halo-width': 1.6,
      },
    },
    // 6. Major Capitals & Metropolitan Cities (rank <= 3)
    {
      id: 'place_city_major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'city'], ['<=', 'rank', 3]],
      minzoom: 3.5,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 15],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': haloColor,
        'text-halo-width': 2.0,
      },
    },
    // 7. Regional & Secondary Cities (rank 4 to 8: e.g. Bhubaneswar, Cuttack, Austin, Lyon, Manchester)
    {
      id: 'place_city_medium',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'city'], ['>', 'rank', 3], ['<=', 'rank', 8]],
      minzoom: 5.5,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 10, 14],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#f8fafc',
        'text-halo-color': haloColor,
        'text-halo-width': 1.8,
      },
    },
    // 8. Minor Cities (rank > 8)
    {
      id: 'place_city_minor',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'city'], ['>', 'rank', 8]],
      minzoom: 7.5,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 12, 13],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': haloColor,
        'text-halo-width': 1.6,
      },
    },
    // 9. Towns and Municipalities (e.g. Puri, Konark, Khordha, Sub-districts)
    {
      id: 'place_town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'town'],
      minzoom: 8.0,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9.5, 12, 12.5],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#cbd5e1',
        'text-halo-color': haloColor,
        'text-halo-width': 1.5,
      },
    },
    // 10. Suburbs, Villages, Districts & Neighborhoods
    {
      id: 'place_suburb_village',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'suburb', 'village', 'neighbourhood', 'quarter'],
      minzoom: 10.5,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 14, 11],
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': haloColor,
        'text-halo-width': 1.4,
      },
    },
    // 11. Landmarks, Monuments & Transport Hubs (Zoom >= 13)
    {
      id: 'poi_landmark',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      filter: ['in', 'class', 'monument', 'attraction', 'aerodrome', 'railway'],
      minzoom: 13.0,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#38bdf8',
        'text-halo-color': haloColor,
        'text-halo-width': 1.5,
      },
    },
  ];
}

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
      maxzoom: 17,
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
      maxzoom: 22,
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
    // 4. 8-Tier Progressive Cartographic Layers (Boundaries, Cities, Towns, POIs)
    ...createCartographicReferenceLayers('#050814', '#93c5fd'),
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
      maxzoom: 17,
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
      maxzoom: 22,
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
    // 4. 8-Tier Progressive Cartographic Layers (Boundaries, Cities, Towns, POIs)
    ...createCartographicReferenceLayers('#050a16', '#7dd3fc'),
  ],
};

// ============================================================
// Windy High-Contrast Relief Basemap (Windy.com Parity)
// ============================================================
// Stylized dark olive-green terrain (#2e3b1f) + deep marine ocean navy (#142036)
// Provides maximum visual pop and contrast for white satellite cloud textures.
export const WINDY_RELIEF_MAP_STYLE: any = {
  version: 8,
  name: 'Windy High-Contrast Relief',
  sources: {
    esri_satellite_imagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 17,
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
    // 1. Windy Deep Marine Ocean Royal Blue Base (#2b4c8a)
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#2b4c8a',
      },
    },
    // 2. High-Contrast Stylized Olive-Relief Continents (#3e5425 tone)
    {
      id: 'esri_satellite_imagery_layer',
      type: 'raster',
      source: 'esri_satellite_imagery',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.88,
        'raster-brightness-max': 0.76,
        'raster-brightness-min': 0.08,
        'raster-contrast': 0.35,
        'raster-saturation': -0.36,
        'raster-hue-rotate': 32,
        'raster-resampling': 'linear',
      },
    },
    // 3. 3D Topographic Shaded Relief Elevation (Mountains & Valleys)
    {
      id: 'esri_hillshade_layer',
      type: 'raster',
      source: 'esri_hillshade',
      maxzoom: 16,
      paint: {
        'raster-opacity': 0.45,
        'raster-contrast': 0.45,
        'raster-resampling': 'linear',
      },
    },
    // 4. 8-Tier Progressive Cartographic Layers (Boundaries, Cities, Towns, POIs)
    ...createCartographicReferenceLayers('#0f1810', '#7dd3fc'),
  ],
};
