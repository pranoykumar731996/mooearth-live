import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface SessionAnalytics {
  sessionId: string;
  userId: string | null;
  deviceType: string;
  trafficSource: string;
  referrer: string;
  createdAt: number;
  lastActiveAt: number;
  isNew: boolean;
  countryClicks: Record<string, number>;
  categoryClicks: Record<string, number>;
  playEarth: {
    correct: number;
    wrong: number;
    answered: number;
    completions: number;
    categories: string[];
    countries: string[];
  };
  search: {
    queries: string[];
    successCount: number;
    failCount: number;
    countrySearches: string[];
    categorySearches: string[];
  };
  article: {
    clicks: number;
    opens: number;
    sourceClicks: number;
    relatedClicks: number;
    completedCount: number;
    readArticleIds: string[];
  };
  globe: {
    rotations: number;
    zooms: number;
    taps: number;
    hovers: number;
    directoryUsage: number;
  };
  uploads: {
    photos: number;
    videos: number;
    voice: number;
    failures: number;
  };
  earthcast: {
    started: number;
    completed: number;
    duration: number; // in seconds
  };
  translation?: {
    opens: number;
    languages: Record<string, number>;
    successCount: number;
    failCount: number;
    translatedArticleIds: string[];
    translatedCountries: Record<string, number>;
  };
  monetization?: {
    adImpressions: number;
    adClicks: number;
    plusModalOpens: number;
    plusWaitlistSubmissions: number;
    sponsorshipViews: number;
    sponsorshipClicks: number;
    consentGiven: boolean | null;
  };
}

let currentSession: SessionAnalytics | null = null;
let syncIntervalId: any = null;
let isSessionDirty = false;

export function initAnalyticsSession(userId: string | null = null) {
  if (typeof window === 'undefined') return;

  // 1. Generate or retrieve anonymous user ID
  let userIdLocal = localStorage.getItem('mooearth_user_id');
  let isNew = false;
  if (!userIdLocal) {
    userIdLocal = 'usr_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mooearth_user_id', userIdLocal);
    isNew = true;
  }

  // 2. Generate or retrieve session ID
  let sessionId = sessionStorage.getItem('mooearth_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('mooearth_session_id', sessionId);
  }

  // 3. Detect traffic source
  const referrer = document.referrer || 'direct';
  let trafficSource = 'direct';
  if (referrer !== 'direct') {
    const refLower = referrer.toLowerCase();
    if (refLower.includes('google.com')) trafficSource = 'google';
    else if (refLower.includes('bing.com')) trafficSource = 'bing';
    else if (refLower.includes('t.co') || refLower.includes('twitter.com') || refLower.includes('x.com')) trafficSource = 'x';
    else if (refLower.includes('facebook.com')) trafficSource = 'facebook';
    else if (refLower.includes('instagram.com')) trafficSource = 'instagram';
    else if (refLower.includes('reddit.com')) trafficSource = 'reddit';
    else if (refLower.includes('whatsapp.com')) trafficSource = 'whatsapp';
    else if (refLower.includes('chatgpt.com') || refLower.includes('openai.com')) trafficSource = 'chatgpt';
    else if (refLower.includes('perplexity.ai')) trafficSource = 'perplexity';
    else if (refLower.includes('gemini.google.com')) trafficSource = 'gemini';
    else if (refLower.includes('copilot.microsoft.com')) trafficSource = 'copilot';
    else {
      try {
        const url = new URL(referrer);
        trafficSource = url.hostname;
      } catch {
        trafficSource = 'referrer';
      }
    }
  }

  // UTM override
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      trafficSource = utmSource;
    }
  }

  // 4. Detect device type
  let deviceType = 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|ip(hone|od)|iemobile|blackberry|kindle|silk-accelerated|(hpw|web)os|opera m(obi|ini)/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 5. Initialize currentSession
  currentSession = {
    sessionId,
    userId: userId || userIdLocal,
    deviceType,
    trafficSource,
    referrer,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    isNew,
    countryClicks: {},
    categoryClicks: {},
    playEarth: {
      correct: 0,
      wrong: 0,
      answered: 0,
      completions: 0,
      categories: [],
      countries: []
    },
    search: {
      queries: [],
      successCount: 0,
      failCount: 0,
      countrySearches: [],
      categorySearches: []
    },
    article: {
      clicks: 0,
      opens: 0,
      sourceClicks: 0,
      relatedClicks: 0,
      completedCount: 0,
      readArticleIds: []
    },
    globe: {
      rotations: 0,
      zooms: 0,
      taps: 0,
      hovers: 0,
      directoryUsage: 0
    },
    uploads: {
      photos: 0,
      videos: 0,
      voice: 0,
      failures: 0
    },
    earthcast: {
      started: 0,
      completed: 0,
      duration: 0
    },
    translation: {
      opens: 0,
      languages: {},
      successCount: 0,
      failCount: 0,
      translatedArticleIds: [],
      translatedCountries: {}
    },
    monetization: {
      adImpressions: 0,
      adClicks: 0,
      plusModalOpens: 0,
      plusWaitlistSubmissions: 0,
      sponsorshipViews: 0,
      sponsorshipClicks: 0,
      consentGiven: null
    }
  };

  // Perform initial GA4 PageView
  trackPageView(window.location.pathname);

  // Track funnel & retention: visitor / returning session
  if (!isNew) {
    trackGrowthFunnel('return');
  } else {
    trackGrowthFunnel('visitor');
  }

  // Sync to database
  isSessionDirty = true;
  flushSessionToFirestore();

  // Setup periodic sync (throttled to 30 seconds to minimize Firestore writes)
  if (!syncIntervalId) {
    syncIntervalId = setInterval(() => {
      if (currentSession && isSessionDirty) {
        currentSession.lastActiveAt = Date.now();
        flushSessionToFirestore();
      }
    }, 30000);

    // Background tab / unload flush
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && currentSession && isSessionDirty) {
        flushSessionToFirestore();
      }
    });
  }
}

export async function flushSessionToFirestore() {
  if (!currentSession || typeof window === 'undefined' || !isSessionDirty) return;

  const sessionDocRef = doc(db, 'sessions', currentSession.sessionId);
  try {
    isSessionDirty = false;
    await setDoc(sessionDocRef, { ...currentSession }, { merge: true });
  } catch (err) {
    console.warn('[Analytics] Failed to sync session to Firestore:', err);
  }
}

export function updateAnalyticsUser(userId: string) {
  if (currentSession) {
    currentSession.userId = userId;
    flushSessionToFirestore();
  }
}

export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX', {
      page_path: url,
    });
  }
  if (currentSession) {
    currentSession.article.opens++;
  }
}

export function trackEvent(category: string, action: string, label?: string, value?: number, customParams?: any) {
  // 1. Send to GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParams
    });
  }

  // 2. Update local session statistics
  if (!currentSession) return;

  isSessionDirty = true;
  currentSession.lastActiveAt = Date.now();

  switch (category) {
    case 'country':
      if (action === 'click' && label) {
        currentSession.countryClicks[label] = (currentSession.countryClicks[label] || 0) + 1;
      }
      break;

    case 'category':
      if (action === 'click' && label) {
        currentSession.categoryClicks[label] = (currentSession.categoryClicks[label] || 0) + 1;
      }
      break;

    case 'play_earth':
      if (action === 'question_answered') {
        currentSession.playEarth.answered++;
        const isCorrect = customParams?.correct === true;
        if (isCorrect) currentSession.playEarth.correct++;
        else currentSession.playEarth.wrong++;
        
        if (customParams?.category) {
          const cat = customParams.category;
          if (!currentSession.playEarth.categories.includes(cat)) {
            currentSession.playEarth.categories.push(cat);
          }
        }
        if (customParams?.country) {
          const country = customParams.country;
          if (!currentSession.playEarth.countries.includes(country)) {
            currentSession.playEarth.countries.push(country);
          }
        }
      } else if (action === 'round_completed') {
        currentSession.playEarth.completions++;
      }
      break;

    case 'search':
      if (label) {
        const query = label;
        if (!currentSession.search.queries.includes(query)) {
          currentSession.search.queries.push(query);
        }
        const success = customParams?.success === true;
        if (success) {
          currentSession.search.successCount++;
          if (customParams?.countrySearched && !currentSession.search.countrySearches.includes(customParams.countrySearched)) {
            currentSession.search.countrySearches.push(customParams.countrySearched);
          }
        } else {
          currentSession.search.failCount++;
        }
      }
      break;

    case 'article':
      if (action === 'click') {
        currentSession.article.clicks++;
        if (label && !currentSession.article.readArticleIds.includes(label)) {
          currentSession.article.readArticleIds.push(label);
        }
      } else if (action === 'source_click') {
        currentSession.article.sourceClicks++;
      } else if (action === 'related_click') {
        currentSession.article.relatedClicks++;
      } else if (action === 'completed') {
        currentSession.article.completedCount++;
      }
      break;

    case 'globe':
      if (action === 'rotation') {
        currentSession.globe.rotations++;
      } else if (action === 'zoom') {
        currentSession.globe.zooms++;
      } else if (action === 'tap') {
        currentSession.globe.taps++;
      } else if (action === 'hover') {
        currentSession.globe.hovers++;
      } else if (action === 'directory_use') {
        currentSession.globe.directoryUsage++;
      }
      break;

    case 'upload':
      if (action === 'success') {
        const type = label || 'photo';
        if (type === 'photo') currentSession.uploads.photos++;
        else if (type === 'video') currentSession.uploads.videos++;
        else if (type === 'voice') currentSession.uploads.voice++;
      } else if (action === 'failure') {
        currentSession.uploads.failures++;
      }
      break;

    case 'earthcast':
      if (action === 'start') {
        currentSession.earthcast.started++;
      } else if (action === 'complete') {
        currentSession.earthcast.completed++;
      } else if (action === 'duration') {
        currentSession.earthcast.duration += (value || 0);
      }
      break;

    case 'translation':
      if (!currentSession.translation) {
        currentSession.translation = {
          opens: 0,
          languages: {},
          successCount: 0,
          failCount: 0,
          translatedArticleIds: [],
          translatedCountries: {}
        };
      }
      if (action === 'open') {
        currentSession.translation.opens++;
      } else if (action === 'select_language' && label) {
        currentSession.translation.languages[label] = (currentSession.translation.languages[label] || 0) + 1;
      } else if (action === 'success') {
        currentSession.translation.successCount++;
        if (customParams?.articleId && !currentSession.translation.translatedArticleIds.includes(customParams.articleId)) {
          currentSession.translation.translatedArticleIds.push(customParams.articleId);
        }
        if (customParams?.country) {
          const c = customParams.country;
          currentSession.translation.translatedCountries[c] = (currentSession.translation.translatedCountries[c] || 0) + 1;
        }
      } else if (action === 'failure') {
        currentSession.translation.failCount++;
      }
      break;

    case 'monetization':
      if (!currentSession.monetization) {
        currentSession.monetization = {
          adImpressions: 0,
          adClicks: 0,
          plusModalOpens: 0,
          plusWaitlistSubmissions: 0,
          sponsorshipViews: 0,
          sponsorshipClicks: 0,
          consentGiven: null
        };
      }
      if (action === 'ad_impression') {
        currentSession.monetization.adImpressions++;
      } else if (action === 'ad_click') {
        currentSession.monetization.adClicks++;
      } else if (action === 'plus_modal_open') {
        currentSession.monetization.plusModalOpens++;
      } else if (action === 'plus_waitlist_submit') {
        currentSession.monetization.plusWaitlistSubmissions++;
      } else if (action === 'sponsorship_view') {
        currentSession.monetization.sponsorshipViews++;
      } else if (action === 'sponsorship_click') {
        currentSession.monetization.sponsorshipClicks++;
      } else if (action === 'consent_update') {
        currentSession.monetization.consentGiven = customParams?.advertising === true;
      }
      break;

    // Growth funnel events — these are GA4-only, no local session state needed
    case 'share':
    case 'daily_challenge':
    case 'game':
    case 'fifa':
    case 'perspective_lens':
    case 'funnel':
      // Already sent to GA4 above — no additional local tracking needed
      break;
  }
}

// ============================================================
// Growth Funnel Convenience Trackers
// ============================================================

/** Track growth funnel stages */
export function trackGrowthFunnel(stage: 'visitor' | 'globe_interaction' | 'active_session' | 'share' | 'return') {
  trackEvent('funnel', `funnel_${stage}`, stage);
}

/** Track share events */
export function trackShare(method: 'native' | 'clipboard' | 'x' | 'whatsapp' | 'telegram' | 'facebook' | string, contentType: string) {
  trackEvent('share', 'share_clicked', method, undefined, { content_type: contentType });
}
export const trackShareClick = trackShare;

/** Track share completion */
export function trackShareComplete(method: string, contentType: string) {
  trackEvent('share', 'share_completed', method, undefined, { content_type: contentType });
}

/** Track daily challenge events */
export function trackDailyChallenge(action: 'started' | 'completed', score?: number, correct?: number, total?: number) {
  trackEvent('daily_challenge', `daily_challenge_${action}`, undefined, score, { correct, total });
}

/** Track game lifecycle */
export function trackGameEvent(action: 'opened' | 'started' | 'completed', mode: string, score?: number) {
  trackEvent('game', `game_${action}`, mode, score);
}

/** Track city map exploration opens (MapLibre 2D) */
export function trackCityMapOpen(cityName: string, countryName?: string) {
  trackEvent('city_map', 'open', cityName, undefined, { country: countryName });
}

/** Track weather intelligence mode and layer toggles */
export function trackWeatherModeUsage(action: 'opened' | 'layer_toggle', layerName?: string) {
  trackEvent('weather_mode', action, layerName);
}

/** Track interactive location selection on the 3D globe or atlas */
export function trackLocationSelected(locationName: string, type: 'country' | 'city' | 'continent') {
  trackEvent('location_select', 'selected', locationName, undefined, { type });
}

/** Track headline / article card open */
export function trackHeadlineOpen(articleId: string, title?: string, category?: string) {
  trackEvent('article', 'headline_open', articleId, undefined, { title, category });
}

/** Track client application errors (non-fatal error boundaries) */
export function trackApplicationError(context: string, message: string) {
  trackEvent('app_error', context, message.slice(0, 150));
}

// ============================================================
// Monetization & Revenue Experiment Trackers
// ============================================================

/** Track verified ad impressions (deduplicated per placement) */
export function trackAdImpression(placementId: string, format?: string) {
  trackEvent('monetization', 'ad_impression', placementId, undefined, { format });
}

/** Track ad clicks */
export function trackAdClick(placementId: string) {
  trackEvent('monetization', 'ad_click', placementId);
}

/** Track when the user views the MooEarth Plus demand validation modal */
export function trackPlusModalOpen(source: string) {
  trackEvent('monetization', 'plus_modal_open', source);
}

/** Track non-binding waitlist / demand signal submissions */
export function trackPlusInterestSubmit(source: string, requestedFeatures: string[]) {
  trackEvent('monetization', 'plus_interest_submit', source, undefined, {
    features_count: requestedFeatures.length,
    features: requestedFeatures.slice(0, 5).join(',')
  });
}

/** Track impression of clearly labeled sponsored content */
export function trackSponsorshipImpression(campaignId: string, sponsorName: string) {
  trackEvent('monetization', 'sponsorship_view', campaignId, undefined, { sponsor: sponsorName });
}

/** Track user interaction with sponsored content */
export function trackSponsorshipClick(campaignId: string, sponsorName: string) {
  trackEvent('monetization', 'sponsorship_click', campaignId, undefined, { sponsor: sponsorName });
}

/** Track privacy and consent preference changes */
export function trackConsentUpdate(consent: { analytics: boolean; advertising: boolean; personalizedAds: boolean }) {
  trackEvent('monetization', 'consent_update', undefined, undefined, {
    analytics: consent.analytics,
    advertising: consent.advertising,
    personalized: consent.personalizedAds
  });
}

// ============================================================
// Phase 10: Curated Discovery Collections & Community Telemetry
// ============================================================

/** Track collection creation */
export function trackCollectionCreated(collectionId: string, category: string, totalLocations: number) {
  trackEvent('collection', 'create', collectionId, totalLocations, { category });
}

/** Track collection publication */
export function trackCollectionPublished(collectionId: string) {
  trackEvent('collection', 'publish', collectionId);
}

/** Track collection opened */
export function trackCollectionOpened(collectionId: string, title?: string) {
  trackEvent('collection', 'open', collectionId, undefined, { title });
}

/** Track collection shared */
export function trackCollectionShared(collectionId: string, method: string) {
  trackEvent('collection', 'share', collectionId, undefined, { method });
}

/** Track collection content report */
export function trackCollectionReported(collectionId: string, reason: string) {
  trackEvent('collection', 'report', collectionId, undefined, { reason });
}


