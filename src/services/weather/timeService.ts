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

  if (timezone && timezone !== 'auto' && timezone.trim() !== '') {
    try {
      const dtf12 = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dtf24 = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dtfSec12 = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dtfSec24 = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
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
        timeZone: timezone,
        timeZoneName: 'short',
      }).formatToParts(date);
      const tzPart = dtfParts.find((p) => p.type === 'timeZoneName')?.value || '';

      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      const offsetMin = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
      const sign = offsetMin >= 0 ? '+' : '-';
      const absMin = Math.abs(offsetMin);
      const h = Math.floor(absMin / 60);
      const m = absMin % 60;
      tzOffset = `UTC${sign}${h}${m > 0 ? `:${m.toString().padStart(2, '0')}` : ''}`;

      const alias = COMMON_TIMEZONE_ALIASES[timezone];
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
