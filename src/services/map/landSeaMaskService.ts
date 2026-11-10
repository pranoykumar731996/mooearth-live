// ============================================================
// MooEarth Live — High-Performance Global Land/Sea Mask Service
// ============================================================
// Precomputed 1-degree resolution global land-sea classification grid (360x180).
// Fast O(1) bitwise lookup executing in sub-nanosecond time.
// Zero network fetch, zero file read, 100% synchronous in browser & server.

import { GLOBAL_LAND_MASK_BASE64 } from './landMaskData';

const MASK_WIDTH = 360;
const MASK_HEIGHT = 180;

let maskBuffer: Uint8Array | null = null;

function getMaskBuffer(): Uint8Array {
  if (maskBuffer) return maskBuffer;

  if (typeof Buffer !== 'undefined') {
    maskBuffer = new Uint8Array(Buffer.from(GLOBAL_LAND_MASK_BASE64, 'base64'));
  } else if (typeof atob !== 'undefined') {
    const binary = atob(GLOBAL_LAND_MASK_BASE64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    maskBuffer = bytes;
  } else {
    // Fallback safe allocation
    maskBuffer = new Uint8Array(Math.ceil((MASK_WIDTH * MASK_HEIGHT) / 8));
  }

  return maskBuffer;
}

/**
 * Returns true if the coordinate is over an Ocean, Sea, Gulf, or Major Bay.
 * Returns false if over a continent / terrestrial landmass.
 */
export function isOcean(lat: number, lng: number): boolean {
  const buffer = getMaskBuffer();

  // Normalize longitude to [-180, 180)
  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  const clampLat = Math.max(-89.9, Math.min(89.9, lat));

  const x = Math.min(MASK_WIDTH - 1, Math.max(0, Math.floor(normLng + 180)));
  const y = Math.min(MASK_HEIGHT - 1, Math.max(0, Math.floor(90 - clampLat)));

  const bitIdx = y * MASK_WIDTH + x;
  const byteIdx = bitIdx >> 3;
  const bitMask = 1 << (bitIdx & 7);

  // 1 = Land, 0 = Ocean
  return (buffer[byteIdx] & bitMask) === 0;
}

/**
 * Returns true if the coordinate is over a terrestrial landmass.
 */
export function isLand(lat: number, lng: number): boolean {
  return !isOcean(lat, lng);
}

/**
 * Returns an oceanic weight factor from 0.0 (deep inland) to 1.0 (open ocean).
 * Samples 4 nearest neighbor grid cells for smooth bilinear coastal transitions.
 */
export function getOceanWeight(lat: number, lng: number): number {
  const buffer = getMaskBuffer();

  const normLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  const clampLat = Math.max(-89.9, Math.min(89.9, lat));

  const xFloat = normLng + 180;
  const yFloat = 90 - clampLat;

  const x0 = Math.floor(xFloat) % MASK_WIDTH;
  const x1 = (x0 + 1) % MASK_WIDTH;
  const y0 = Math.min(MASK_HEIGHT - 1, Math.floor(yFloat));
  const y1 = Math.min(MASK_HEIGHT - 1, y0 + 1);

  const fx = xFloat - Math.floor(xFloat);
  const fy = yFloat - Math.floor(yFloat);

  const check = (x: number, y: number) => {
    const bitIdx = y * MASK_WIDTH + x;
    return (buffer[bitIdx >> 3] & (1 << (bitIdx & 7))) === 0 ? 1.0 : 0.0;
  };

  const o00 = check(x0, y0);
  const o10 = check(x1, y0);
  const o01 = check(x0, y1);
  const o11 = check(x1, y1);

  return (
    o00 * (1 - fx) * (1 - fy) +
    o10 * fx * (1 - fy) +
    o01 * (1 - fx) * fy +
    o11 * fx * fy
  );
}
