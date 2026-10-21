// ============================================================
// MooEarth Live — Map Styles & Tile Provider Registry
// ============================================================
// Appropriately licensed tile providers and style configurations:
// - MapTiler (Vector): High-performance vector tiles via Anycast CDN. Configured via NEXT_PUBLIC_MAPTILER_API_KEY.
// - Esri World Street (Raster): Reliable, zero-watermark, fast global street raster. High-availability default fallback.
// - OpenFreeMap (Vector): Community open-source vector tiles under MIT/ODbL.
// - OpenStreetMap (Raster): Standard community tile server under ODbL.
// - CARTO Voyager / Dark (Raster): Basemaps under CC BY 4.0 / Carto Free (configurable via NEXT_PUBLIC_CARTO_API_KEY).
// - Full attribution to OpenStreetMap contributors and respective data providers.

export type MapStyleKey =
  | 'satellite'
  | 'esri-street'
  | 'terrain'
  | 'maptiler-streets'
  | 'liberty'
  | 'bright'
  | 'osm'
  | 'voyager'
  | 'dark';

export interface MapStyleOption {
  key: MapStyleKey;
  label: string;
  badge: string;
  style: any; // URL string or MapLibre StyleSpecification object
  type: 'vector' | 'raster';
  attribution: string;
  requiresKey?: boolean;
}

/**
 * Retrieve public MapTiler API key from environment variables
 */
export function getMapTilerKey(): string {
  return process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() || '';
}

/**
 * Retrieve public CARTO API key from environment variables (optional)
 */
export function getCartoKey(): string {
  return process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim() || '';
}

/**
 * Build map styles registry with current credentials
 */
export function buildMapStyles(): Record<MapStyleKey, MapStyleOption> {
  const maptilerKey = getMapTilerKey();
  const cartoKey = getCartoKey();
  const cartoQuery = cartoKey ? `?api_key=${encodeURIComponent(cartoKey)}` : '';

  return {
    satellite: {
      key: 'satellite',
      label: 'Satellite HD',
      badge: 'Photo',
      style: {
        version: 8,
        sources: {
          'esri-satellite-imagery': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution:
              'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          },
          'esri-satellite-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'esri-satellite-imagery-layer',
            type: 'raster',
            source: 'esri-satellite-imagery',
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'esri-satellite-labels-layer',
            type: 'raster',
            source: 'esri-satellite-labels',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      type: 'raster',
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, USDA, USGS',
    },
    'esri-street': {
      key: 'esri-street',
      label: 'Street Navigation',
      badge: 'Fast',
      style: {
        version: 8,
        sources: {
          'esri-street-source': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution:
              'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, TomTom, USGS, Intermap, iPC, NRCAN, METI, OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'esri-street-layer',
            type: 'raster',
            source: 'esri-street-source',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      type: 'raster',
      attribution: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, TomTom, OpenStreetMap contributors',
    },
    terrain: {
      key: 'terrain',
      label: 'Topography & Relief',
      badge: 'Terrain',
      style: {
        version: 8,
        sources: {
          'esri-topo-source': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution:
              'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, NAVTEQ, OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'esri-topo-layer',
            type: 'raster',
            source: 'esri-topo-source',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      type: 'raster',
      attribution: 'Tiles © Esri — Source: USGS, Esri, OpenStreetMap contributors',
    },
    'maptiler-streets': {
      key: 'maptiler-streets',
      label: 'Vector HD',
      badge: 'Vector',
      style: maptilerKey
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
        : 'https://tiles.openfreemap.org/styles/liberty', // Fallback to liberty vector if no key
      type: 'vector',
      attribution: '© MapTiler © OpenStreetMap contributors',
      requiresKey: true,
    },
    liberty: {
      key: 'liberty',
      label: 'Liberty Clean',
      badge: 'Vector',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      type: 'vector',
      attribution: '© OpenMapTiles © OpenStreetMap contributors © OpenFreeMap',
    },
    bright: {
      key: 'bright',
      label: 'Bright Daytime',
      badge: 'Vector',
      style: 'https://tiles.openfreemap.org/styles/bright',
      type: 'vector',
      attribution: '© OpenMapTiles © OpenStreetMap contributors © OpenFreeMap',
    },
    osm: {
      key: 'osm',
      label: 'Standard Cartography',
      badge: 'Global',
      style: {
        version: 8,
        sources: {
          'osm-source': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-source',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      type: 'raster',
      attribution: '© OpenStreetMap contributors',
    },
    voyager: {
      key: 'voyager',
      label: 'Voyager Detailed',
      badge: 'Raster',
      style: {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: [
              `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png${cartoQuery}`,
              `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png${cartoQuery}`,
              `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png${cartoQuery}`,
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'carto-voyager-layer',
            type: 'raster',
            source: 'carto-voyager',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      type: 'raster',
      attribution: '© OpenStreetMap contributors © CARTO',
      requiresKey: !cartoKey,
    },
    dark: {
      key: 'dark',
      label: 'Night Mode',
      badge: 'Night',
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              `https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png${cartoQuery}`,
              `https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png${cartoQuery}`,
              `https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png${cartoQuery}`,
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      type: 'raster',
      attribution: '© OpenStreetMap contributors © CARTO',
      requiresKey: !cartoKey,
    },
  };
}

export const MAP_STYLES: Record<MapStyleKey, MapStyleOption> = buildMapStyles();

export const DEFAULT_CITY_ZOOM = 12.8;
export const MIN_CITY_ZOOM = 10;
export const MAX_CITY_ZOOM = 18;

/**
 * Determine default style based on environment configuration
 */
export function getDefaultMapStyleKey(): MapStyleKey {
  const maptilerKey = getMapTilerKey();
  if (maptilerKey) {
    return 'maptiler-streets';
  }
  // Fast, zero-watermark, highly available default
  return 'esri-street';
}

/**
 * Validate that latitude and longitude coordinates are finite numbers within physical spherical bounds
 */
export function validateCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * Clamp a zoom value within valid city exploration bounds
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_CITY_ZOOM, Math.min(MAX_CITY_ZOOM, zoom));
}

/**
 * Serialize a shareable city map URL with query parameters
 */
export function serializeCityMapUrl(
  lat: number,
  lng: number,
  city?: string,
  country?: string,
  mode?: 'globe' | 'city-map' | 'city'
): string {
  const params = new URLSearchParams();
  if (mode === 'city-map' || mode === 'city') {
    params.set('view', 'city');
  }
  params.set('lat', lat.toFixed(4));
  params.set('lng', lng.toFixed(4));
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  return `/weather?${params.toString()}`;
}

/**
 * Parse a URL query string to restore city map location & view state
 */
export function parseCityMapUrl(urlOrQuery: string) {
  const query = urlOrQuery.includes('?') ? urlOrQuery.split('?')[1] : urlOrQuery;
  const params = new URLSearchParams(query);
  const lat = parseFloat(params.get('lat') || '');
  const lng = parseFloat(params.get('lng') || '');
  const city = params.get('city') || '';
  const country = params.get('country') || '';
  const view = params.get('view') || 'globe';
  const isValid = validateCoordinate(lat, lng);
  return { lat, lng, city, country, view, isValid };
}

/**
 * Select fallback map style when vector tile loading fails or times out
 */
export function getFailoverStyle(currentKey: MapStyleKey, hasError: boolean): MapStyleKey {
  if (!hasError) return currentKey;
  if (currentKey === 'maptiler-streets' || currentKey === 'liberty' || currentKey === 'bright') {
    return 'esri-street';
  }
  if (currentKey === 'satellite' || currentKey === 'terrain') {
    return 'esri-street';
  }
  if (currentKey === 'esri-street') {
    return 'osm';
  }
  if (currentKey === 'voyager' || currentKey === 'dark') {
    return 'esri-street';
  }
  return 'esri-street';
}
