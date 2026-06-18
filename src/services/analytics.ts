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
}

let currentSession: SessionAnalytics | null = null;
let lastSyncTime = 0;
let syncIntervalId: any = null;

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
    }
  };

  // Perform initial GA4 PageView
  trackPageView(window.location.pathname);

  // Sync to database
  flushSessionToFirestore();

  // Setup periodic sync (every 10 seconds)
  if (!syncIntervalId) {
    syncIntervalId = setInterval(() => {
      if (currentSession) {
        currentSession.lastActiveAt = Date.now();
        flushSessionToFirestore();
      }
    }, 10000);
  }
}

export async function flushSessionToFirestore() {
  if (!currentSession || typeof window === 'undefined') return;

  const sessionDocRef = doc(db, 'sessions', currentSession.sessionId);
  try {
    await setDoc(sessionDocRef, { ...currentSession }, { merge: true });
    lastSyncTime = Date.now();
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
  }
}
