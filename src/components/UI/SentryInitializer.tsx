'use client';

import { useEffect } from 'react';
import { initSentryWatchdog } from '@/services/sentryWatchdog';

/** Client component to mount the Sentry error watchdog and auto-healer globally */
export default function SentryInitializer() {
  useEffect(() => {
    initSentryWatchdog();
  }, []);

  return null;
}
