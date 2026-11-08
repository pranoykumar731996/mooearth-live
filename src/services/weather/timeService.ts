// ============================================================
// MooEarth Live — Location Solar & Local Time Service
// ============================================================
// Computes real-time local clock, ticking seconds, astronomical
// solar altitude, daytime/nighttime status, and IANA / nautical
// timezone offsets for any coordinate on Earth.

export interface SolarPosition {
  elevation: number;
  period: 'day' | 'night' | 'sunrise' | 'sunset';
  icon: string;
  label: string;
  solarTime: number;
}

export interface LocationTimeResult {
  time12: string;
  time24: string;
  timeSeconds12: string;
  timeSeconds24: string;
  tzCode: string;
  tzOffset: string;
  tzFullLabel: string;
  isDay: boolean;
  solar: SolarPosition;
}

const COMMON_TIMEZONE_ALIASES: Record<string, string> = {
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'Asia/Tokyo': 'JST',
  'Asia/Shanghai': 'CST',
  'Asia/Hong_Kong': 'HKT',
  'Asia/Singapore': 'SGT',
  'Asia/Seoul': 'KST',
  'Asia/Dubai': 'GST',
  'Asia/Bangkok': 'ICT',
  'Asia/Jakarta': 'WIB',
  'Australia/Sydney': 'AEST',
  'Australia/Melbourne': 'AEST',
  'Australia/Brisbane': 'AEST',
  'Australia/Perth': 'AWST',
  'Australia/Adelaide': 'ACST',
  'Pacific/Auckland': 'NZST',
  'Europe/London': 'GMT',
  'Europe/Paris': 'CET',
  'Europe/Berlin': 'CET',
  'America/New_York': 'EST',
  'America/Chicago': 'CST',
  'America/Denver': 'MST',
  'America/Los_Angeles': 'PST',
  'America/Sao_Paulo': 'BRT',
};

/**
 * Astronomical Solar Position Calculation
 * Calculates solar elevation angle and twilight stages without external APIs.
 */
export function getSolarPosition(lat: number, lng: number, date = new Date()): SolarPosition {
  const rad = Math.PI / 180;
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  
  // Solar declination approximation (Spencer / Cooper formula)
  const declination = 23.44 * Math.sin((360 / 365) * (dayOfYear - 81) * rad);
  
  // Fractional UTC hours
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  // Local solar time (15° per hour)
  const solarTime = (utcHours + lng / 15 + 24) % 24;
  const hourAngle = (solarTime - 12) * 15;
  
  // Solar elevation angle
  const sinElevation =
    Math.sin(lat * rad) * Math.sin(declination * rad) +
    Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation))) / rad;

  let period: SolarPosition['period'] = 'day';
  let icon = '☀️';
  let label = 'Day';

  if (elevation > 4) {
    period = 'day';
    icon = '☀️';
    label = 'Day';
  } else if (elevation >= -6) {
    if (hourAngle < 0) {
      period = 'sunrise';
      icon = '🌅';
      label = 'Sunrise';
    } else {
      period = 'sunset';
      icon = '🌇';
      label = 'Sunset';
    }
  } else {
    period = 'night';
    icon = '🌙';
    label = 'Night';
  }

  return { elevation, period, icon, label, solarTime };
}

/**
 * Compute local time and timezone details for a location.
 * Gracefully handles named IANA timezones and nautical solar time fallbacks.
 */
export function getLocationTime(
  lat: number,
  lng: number,
  timezone?: string,
  date = new Date()
): LocationTimeResult {
  const solar = getSolarPosition(lat, lng, date);
  const isDay = solar.period === 'day' || solar.period === 'sunrise' || solar.period === 'sunset';

  let time12 = '';
  let time24 = '';
  let timeSeconds12 = '';
  let timeSeconds24 = '';
  let tzCode = '';
  let tzOffset = '';
  let tzFullLabel = '';
  let isValidTz = false;

  let effectiveTimezone = timezone && timezone !== 'auto' && timezone.trim() !== '' ? timezone.trim() : undefined;

  // Geographic Bounding Inference for Sovereign Timezones:
  // When timezone is missing or 'auto' prior to API response, resolve exact sovereign timezone
  // to avoid nautical longitude integer errors (e.g. India is IST UTC+5:30 nationwide, not UTC+6 or UTC+5).
  if (!effectiveTimezone) {
    if (lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5) {
      effectiveTimezone = 'Asia/Kolkata'; // Republic of India (IST, UTC+5:30 nationwide)
    } else if (lat >= 5.8 && lat <= 9.9 && lng >= 79.5 && lng <= 82.0) {
      effectiveTimezone = 'Asia/Colombo'; // Sri Lanka (SLST, UTC+5:30)
    } else if (lat >= 26.3 && lat <= 30.5 && lng >= 80.0 && lng <= 88.2) {
      effectiveTimezone = 'Asia/Kathmandu'; // Nepal (NPT, UTC+5:45)
    } else if (lat >= 20.5 && lat <= 26.7 && lng >= 88.5 && lng <= 92.7) {
      effectiveTimezone = 'Asia/Dhaka'; // Bangladesh (BST, UTC+6:00)
    } else if (lat >= 9.5 && lat <= 28.5 && lng >= 92.5 && lng <= 101.2) {
      effectiveTimezone = 'Asia/Yangon'; // Myanmar (MMT, UTC+6:30)
    } else if (lat >= 25.0 && lat <= 39.8 && lng >= 44.0 && lng <= 63.3) {
      effectiveTimezone = 'Asia/Tehran'; // Iran (IRST, UTC+3:30)
    } else if (lat >= 29.3 && lat <= 38.5 && lng >= 60.5 && lng <= 75.0) {
      effectiveTimezone = 'Asia/Kabul'; // Afghanistan (AFT, UTC+4:30)
    }
  }

  if (effectiveTimezone) {
    try {
      const dtf12 = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dtf24 = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dtfSec12 = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dtfSec24 = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      time12 = dtf12.format(date);
      time24 = dtf24.format(date);
      timeSeconds12 = dtfSec12.format(date);
      timeSeconds24 = dtfSec24.format(date);

      // Determine timezone short name and exact offset
      const dtfParts = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        timeZoneName: 'short',
      }).formatToParts(date);
      const tzPart = dtfParts.find((p) => p.type === 'timeZoneName')?.value || '';

      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: effectiveTimezone }));
      const offsetMin = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
      const sign = offsetMin >= 0 ? '+' : '-';
      const absMin = Math.abs(offsetMin);
      const h = Math.floor(absMin / 60);
      const m = absMin % 60;
      tzOffset = `UTC${sign}${h}${m > 0 ? `:${m.toString().padStart(2, '0')}` : ''}`;

      const alias = COMMON_TIMEZONE_ALIASES[effectiveTimezone];
      if (alias) {
        tzCode = alias;
        tzFullLabel = `${alias} (${tzOffset})`;
      } else if (tzPart && !tzPart.startsWith('GMT') && !tzPart.startsWith('UTC')) {
        tzCode = tzPart;
        tzFullLabel = `${tzPart} (${tzOffset})`;
      } else {
        tzCode = tzOffset;
        tzFullLabel = tzOffset;
      }

      isValidTz = true;
    } catch {
      isValidTz = false;
    }
  }

  // Fallback: Nautical Solar Time via Longitude (15° = 1 hour)
  if (!isValidTz) {
    const offsetHours = Math.round(lng / 15);
    const sign = offsetHours >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetHours);
    tzOffset = `UTC${sign}${absOffset}`;
    tzCode = tzOffset;
    tzFullLabel = `${tzOffset} (Solar)`;

    const targetDate = new Date(date.getTime() + offsetHours * 3600000);
    const hours = targetDate.getUTCHours();
    const minutes = targetDate.getUTCMinutes().toString().padStart(2, '0');
    const seconds = targetDate.getUTCSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;

    time12 = `${h12}:${minutes} ${ampm}`;
    time24 = `${hours.toString().padStart(2, '0')}:${minutes}`;
    timeSeconds12 = `${h12}:${minutes}:${seconds} ${ampm}`;
    timeSeconds24 = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
  }

  return {
    time12,
    time24,
    timeSeconds12,
    timeSeconds24,
    tzCode,
    tzOffset,
    tzFullLabel,
    isDay,
    solar,
  };
}

/**
 * Calculates the current ISO hour string (`YYYY-MM-DDTHH`) for a target location.
 * Uses exact IANA timezone or sovereign boundary resolution, falling back to nautical solar time.
 * This guarantees the hourly forecast timeline is anchored strictly to the current moment,
 * completely eliminating past hours regardless of API response timestamp.
 */
export function getTargetLocationCurrentHourIso(
  lat: number,
  lng: number,
  timezone?: string,
  date = new Date()
): string {
  let effectiveTimezone = timezone && timezone !== 'auto' && timezone.trim() !== '' ? timezone.trim() : undefined;

  if (!effectiveTimezone) {
    if (lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5) {
      effectiveTimezone = 'Asia/Kolkata';
    } else if (lat >= 5.8 && lat <= 9.9 && lng >= 79.5 && lng <= 82.0) {
      effectiveTimezone = 'Asia/Colombo';
    } else if (lat >= 26.3 && lat <= 30.5 && lng >= 80.0 && lng <= 88.2) {
      effectiveTimezone = 'Asia/Kathmandu';
    } else if (lat >= 20.5 && lat <= 26.7 && lng >= 88.5 && lng <= 92.7) {
      effectiveTimezone = 'Asia/Dhaka';
    } else if (lat >= 9.5 && lat <= 28.5 && lng >= 92.5 && lng <= 101.2) {
      effectiveTimezone = 'Asia/Yangon';
    } else if (lat >= 25.0 && lat <= 39.8 && lng >= 44.0 && lng <= 63.3) {
      effectiveTimezone = 'Asia/Tehran';
    } else if (lat >= 29.3 && lat <= 38.5 && lng >= 60.5 && lng <= 75.0) {
      effectiveTimezone = 'Asia/Kabul';
    }
  }

  if (effectiveTimezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(date);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      let h = parts.find((p) => p.type === 'hour')?.value || '00';
      if (h === '24') h = '00';
      return `${y}-${m}-${d}T${h}`;
    } catch {
      // Fall through to nautical
    }
  }

  // Nautical solar fallback
  const offsetHours = Math.round(lng / 15);
  const targetDate = new Date(date.getTime() + offsetHours * 3600000);
  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getUTCDate()).padStart(2, '0');
  const h = String(targetDate.getUTCHours()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}`;
}
