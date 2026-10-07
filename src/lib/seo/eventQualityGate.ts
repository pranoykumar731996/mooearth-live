// ============================================================
// MooEarth Live — Event Quality Gate (Indexing Protection)
// ============================================================
// Enforces that event pages are never indexed if events are empty,
// missing essential attributes, or unverified.

import { WorldMajorEvent } from '@/services/worldEventsService';

export interface EventQualityGateResult {
  shouldIndex: boolean;
  reason: string;
  robotsDirective: {
    index: boolean;
    follow: boolean;
  };
}

/**
 * Validates that an events dataset has genuine, non-empty, and well-attributed
 * major world events before permitting search engine indexing.
 */
export function shouldIndexEventPage(
  events: WorldMajorEvent[] | undefined | null
): EventQualityGateResult {
  if (!events || events.length === 0) {
    return {
      shouldIndex: false,
      reason: 'Empty event data: No verified events found. Empty event pages must not be indexed.',
      robotsDirective: { index: false, follow: false },
    };
  }

  // Minimum threshold: at least 3 genuine events with full attribution
  const validEvents = events.filter(e => {
    return (
      e.id &&
      e.title &&
      e.title.trim().length > 10 &&
      e.source &&
      e.source.trim().length > 1 &&
      e.sourceUrl &&
      e.location &&
      typeof e.location.lat === 'number' &&
      typeof e.location.lng === 'number' &&
      e.dateTime &&
      !isNaN(new Date(e.dateTime).getTime())
    );
  });

  if (validEvents.length === 0) {
    return {
      shouldIndex: false,
      reason: 'No events met structural verification requirements (title, source, location, timestamp).',
      robotsDirective: { index: false, follow: false },
    };
  }

  return {
    shouldIndex: true,
    reason: `Verified ${validEvents.length} genuine international events with complete source attribution.`,
    robotsDirective: { index: true, follow: true },
  };
}
