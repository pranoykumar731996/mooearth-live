// ============================================================
// MooEarth Live — Radar Provider Adapter Architecture
// ============================================================
// Decoupled radar provider interface and registry.
// Strictly enforces "Truth in Weather":
// 1. Zero reliance on third-party commercial tile proxies.
// 2. Verified public-domain Doppler radar provider (NOAA MRMS / NEXRAD for North America).
// 3. Documented coverage bounds with honest "Unavailable" empty states outside terrestrial radar.
// 4. Extensible interface allowing future authorized national providers to be registered
//    without rewriting map or timeline components.

export interface RadarFrame {
  timestamp: number; // Unix timestamp in seconds
  isoTime: string; // ISO 8601 string
  formattedUtc: string; // e.g. "14:20 UTC"
  formattedLocal: string; // User local time
  label: string; // e.g. "-30m", "-20m", "-10m", "LIVE"
  tileUrl: string; // Slippy tile template: {z}/{x}/{y}
}

export interface RadarCoverageArea {
  name: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface RadarMetadataResponse {
  providerId: string;
  providerName: string;
  agency: string;
  license: string;
  coverageAreas: RadarCoverageArea[];
  frames: RadarFrame[];
  activeFrameIndex: number;
  attribution: string;
}

export interface IRadarProvider {
  id: string;
  name: string;
  agency: string;
  license: string;
  licenseUrl: string;
  coverageAreas: RadarCoverageArea[];
  attribution: string;
  getFrames(): Promise<RadarFrame[]>;
  getTileUrl(z: number, x: number, y: number, frame: RadarFrame): string;
  isPointCovered(lat: number, lng: number): boolean;
  isBoundsIntersecting(minLng: number, minLat: number, maxLng: number, maxLat: number): boolean;
}

/**
 * NOAA MRMS / NEXRAD Composite Radar Provider for North America.
 * Public Domain (US Government work, 17 U.S.C. § 105).
 * Free for open-source, commercial, and redistribution without API keys.
 */
export class NoaaMrmsRadarProvider implements IRadarProvider {
  public id = 'noaa-mrms';
  public name = 'NOAA NEXRAD / MRMS Composite';
  public agency = 'National Oceanic and Atmospheric Administration (NOAA / NWS)';
  public license = 'Public Domain (US Government work, 17 U.S.C. § 105)';
  public licenseUrl = 'https://www.weather.gov/disclaimer';
  public attribution = 'NOAA National Weather Service / NEXRAD Doppler Network';

  public coverageAreas: RadarCoverageArea[] = [
    {
      name: 'Continental United States (CONUS)',
      bounds: [-128.0, 24.0, -66.0, 50.0],
    },
    {
      name: 'Alaska Corridor',
      bounds: [-170.0, 52.0, -130.0, 72.0],
    },
    {
      name: 'Hawaii Archipelago',
      bounds: [-161.0, 18.0, -154.0, 23.0],
    },
    {
      name: 'Puerto Rico & Virgin Islands',
      bounds: [-68.0, 17.5, -64.0, 19.0],
    },
  ];

  /**
   * Generates chronological radar frames for the past 2 hours in 10-minute intervals.
   * Frame ordering is strictly chronological (oldest to newest / Live).
   */
  public async getFrames(): Promise<RadarFrame[]> {
    const frames: RadarFrame[] = [];
    const nowMs = Date.now();
    // Quantize to nearest 5 or 10 minutes
    const stepMinutes = 10;
    const totalFrames = 12; // 2 hours of 10-minute frames

    const latestQuantizedMs = Math.floor(nowMs / (stepMinutes * 60 * 1000)) * (stepMinutes * 60 * 1000);

    for (let i = totalFrames - 1; i >= 0; i--) {
      const frameMs = latestQuantizedMs - i * (stepMinutes * 60 * 1000);
      const date = new Date(frameMs);
      const timestamp = Math.floor(frameMs / 1000);
      const isoTime = date.toISOString();

      const hoursUtc = String(date.getUTCHours()).padStart(2, '0');
      const minsUtc = String(date.getUTCMinutes()).padStart(2, '0');
      const formattedUtc = `${hoursUtc}:${minsUtc} UTC`;

      let formattedLocal = '';
      try {
        formattedLocal = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        formattedLocal = formattedUtc;
      }

      const offsetMinutes = i * stepMinutes;
      const label = offsetMinutes === 0 ? 'LIVE' : `-${offsetMinutes}m`;

      // Public domain Iowa Environmental Mesonet (IEM) / NOAA MRMS tile cache endpoint
      // Uses the time-based USCOMP-N0Q composite raster tile layer
      // If live, uses the canonical real-time composite endpoint
      const tileUrl =
        offsetMinutes === 0
          ? 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
          : `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::USCOMP-N0Q-${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}${hoursUtc}${minsUtc}/{z}/{x}/{y}.png`;

      frames.push({
        timestamp,
        isoTime,
        formattedUtc,
        formattedLocal,
        label,
        tileUrl,
      });
    }

    return frames;
  }

  public getTileUrl(z: number, x: number, y: number, frame: RadarFrame): string {
    return frame.tileUrl
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));
  }

  public isPointCovered(lat: number, lng: number): boolean {
    // Normalize lng to [-180, 180]
    const normLng = ((((lng % 360) + 540) % 360) - 180);
    return this.coverageAreas.some(({ bounds }) => {
      const [minLng, minLat, maxLng, maxLat] = bounds;
      return normLng >= minLng && normLng <= maxLng && lat >= minLat && lat <= maxLat;
    });
  }

  public isBoundsIntersecting(minLng: number, minLat: number, maxLng: number, maxLat: number): boolean {
    return this.coverageAreas.some(({ bounds }) => {
      const [cMinLng, cMinLat, cMaxLng, cMaxLat] = bounds;
      return !(minLng > cMaxLng || maxLng < cMinLng || minLat > cMaxLat || maxLat < cMinLat);
    });
  }
}

// ── Radar Provider Registry ───────────────────────────────────

class RadarManager {
  private providers: Map<string, IRadarProvider> = new Map();
  private activeProviderId = 'noaa-mrms';

  constructor() {
    this.registerProvider(new NoaaMrmsRadarProvider());
  }

  public registerProvider(provider: IRadarProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): IRadarProvider | undefined {
    return this.providers.get(id);
  }

  public getActiveProvider(): IRadarProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('noaa-mrms')!;
  }

  public setActiveProvider(id: string) {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
    }
  }

  public getAllProviders(): IRadarProvider[] {
    return Array.from(this.providers.values());
  }
}

export const radarManager = new RadarManager();

/**
 * Helper to fetch active radar frames and metadata
 */
export async function getActiveRadarMetadata(): Promise<RadarMetadataResponse> {
  const provider = radarManager.getActiveProvider();
  const frames = await provider.getFrames();

  return {
    providerId: provider.id,
    providerName: provider.name,
    agency: provider.agency,
    license: provider.license,
    coverageAreas: provider.coverageAreas,
    frames,
    activeFrameIndex: frames.length - 1, // Default to live frame
    attribution: provider.attribution,
  };
}

/**
 * Checks whether a location has terrestrial Doppler radar coverage
 */
export function isLocationCoveredByRadar(lat: number, lng: number): boolean {
  return radarManager.getActiveProvider().isPointCovered(lat, lng);
}
