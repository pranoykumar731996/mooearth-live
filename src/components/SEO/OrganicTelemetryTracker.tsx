'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function OrganicTelemetryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || trackedRef.current) return;

    try {
      const referrer = document.referrer || '';
      const refLower = referrer.toLowerCase();

      // Check for organic search engine referrer
      const isGoogle = refLower.includes('google.');
      const isBing = refLower.includes('bing.');
      const isYahoo = refLower.includes('yahoo.');
      const isDuckDuckGo = refLower.includes('duckduckgo.');
      const isBaidu = refLower.includes('baidu.');
      const isYandex = refLower.includes('yandex.');
      const isOrganic = isGoogle || isBing || isYahoo || isDuckDuckGo || isBaidu || isYandex;

      if (!isOrganic) return;

      trackedRef.current = true;

      let searchEngine: 'google' | 'bing' | 'yahoo' | 'duckduckgo' | 'baidu' | 'yandex' | 'other' = 'other';
      if (isGoogle) searchEngine = 'google';
      else if (isBing) searchEngine = 'bing';
      else if (isYahoo) searchEngine = 'yahoo';
      else if (isDuckDuckGo) searchEngine = 'duckduckgo';
      else if (isBaidu) searchEngine = 'baidu';
      else if (isYandex) searchEngine = 'yandex';

      // Determine page type
      let pageType: 'home' | 'country' | 'city' | 'continent' | 'game' | 'news' | 'weather' | 'embed' | 'other' = 'other';
      if (pathname === '/') pageType = 'home';
      else if (pathname.startsWith('/countries/') || pathname.includes('/country/')) pageType = 'country';
      else if (pathname.startsWith('/cities/')) pageType = 'city';
      else if (pathname.startsWith('/continents/')) pageType = 'continent';
      else if (pathname.startsWith('/games') || pathname.includes('quiz') || pathname.startsWith('/daily') || pathname.startsWith('/play-earth')) pageType = 'game';
      else if (pathname.startsWith('/news') || pathname.startsWith('/world-news') || pathname.startsWith('/article/')) pageType = 'news';
      else if (pathname.startsWith('/weather') || pathname.startsWith('/world-weather')) pageType = 'weather';
      else if (pathname.startsWith('/embed')) pageType = 'embed';

      // Detect device
      const width = window.innerWidth;
      const device: 'desktop' | 'mobile' | 'tablet' = width < 768 ? 'mobile' : (width < 1024 ? 'tablet' : 'desktop');

      // Check return user status
      const returnKey = 'mooearth_visited_before';
      const isReturnUser = Boolean(localStorage.getItem(returnKey));
      localStorage.setItem(returnKey, 'true');

      // Detect country from timezone or language
      const language = navigator.language || 'en';
      let country = 'Global';
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone) {
          const parts = timeZone.split('/');
          if (parts.length > 1) country = parts[1].replace(/_/g, ' ');
        }
      } catch {
        // Fallback
      }

      // Check for query parameter
      const query = searchParams.get('q') || searchParams.get('query') || undefined;

      const telemetryPayload = {
        landingPage: pathname,
        referrer,
        searchEngine,
        query,
        country,
        language,
        device,
        pageType,
        playedGame: false,
        sharedContent: false,
        isReturnUser,
        timestamp: Date.now(),
      };

      // Send telemetry asynchronously
      fetch('/api/admin/seo-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryPayload),
        keepalive: true,
      }).catch(() => {
        // Silently handle if offline
      });

      // Listen for game plays or shares during this organic session
      const handleGamePlay = () => {
        telemetryPayload.playedGame = true;
        fetch('/api/admin/seo-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetryPayload),
          keepalive: true,
        }).catch(() => {});
      };

      const handleShare = () => {
        telemetryPayload.sharedContent = true;
        fetch('/api/admin/seo-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetryPayload),
          keepalive: true,
        }).catch(() => {});
      };

      window.addEventListener('mooearth:game-complete', handleGamePlay, { once: true });
      window.addEventListener('mooearth:share-clicked', handleShare, { once: true });
    } catch {
      // Telemetry should never block UI
    }
  }, [pathname, searchParams]);

  return null;
}
