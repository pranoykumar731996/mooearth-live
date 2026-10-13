// ============================================================
// MooEarth Live — Map Styles & Tile Provider Registry
// ============================================================
// Appropriately licensed tile providers and style configurations:
// - OpenFreeMap (Vector): 100% Free & Open Source under MIT/ODbL. Zero API keys.
// - CARTO (Raster): Free tier for open web apps under CC BY 4.0 / Carto Free attribution.
// - Full attribution to OpenStreetMap contributors and respective data providers.

export type MapStyleKey = 'liberty' | 'bright' | 'voyager' | 'dark';

export interface MapStyleOption {
  key: MapStyleKey;
  label: string;
  badge: string;
  style: any; // URL string or MapLibre StyleSpecification object
  type: 'vector' | 'raster';
  attribution: string;
}

export const MAP_STYLES: Record<MapStyleKey, MapStyleOption> = {
  liberty: {
    key: 'liberty',
    label: 'Liberty Vector',
    badge: 'Vector',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    type: 'vector',
    attribution: '© OpenMapTiles © OpenStreetMap contributors © OpenFreeMap',
  },
  bright: {
    key: 'bright',
    label: 'Bright Vector',
    badge: 'Vector',
    style: 'https://tiles.openfreemap.org/styles/bright',
    type: 'vector',
    attribution: '© OpenMapTiles © OpenStreetMap contributors © OpenFreeMap',
  },
  voyager: {
    key: 'voyager',
    label: 'Voyager Color',
    badge: 'Raster',
    style: {
      version: 8,
      sources: {
        'carto-voyager': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
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
  },
  dark: {
    key: 'dark',
    label: 'Dark Matter',
    badge: 'Night',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
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
  },
};

export const DEFAULT_CITY_ZOOM = 12.8;
export const MIN_CITY_ZOOM = 10;
export const MAX_CITY_ZOOM = 18;

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
 * Select fallback map style when vector tile loading fails
 */
export function getFailoverStyle(currentKey: MapStyleKey, hasError: boolean): MapStyleKey {
  if (!hasError) return currentKey;
  if (currentKey === 'liberty' || currentKey === 'bright') {
    return 'voyager';
  }
  return currentKey;
}
