'use client';

import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, scheduleStreakReminder, isNotificationSupported } from '@/utils/notifications';

interface StreakNotificationPromptProps {
  streak?: number;
}

export default function StreakNotificationPrompt({ streak = 1 }: StreakNotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const isAlreadyEnabled = localStorage.getItem('mooearth_notifications_enabled') === 'true';
    const isDismissed = sessionStorage.getItem('mooearth_push_prompt_dismissed') === 'true';

    if (!isAlreadyEnabled && !isDismissed && Notification.permission !== 'denied') {
      // Show prompt after a slight delay
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    } else if (isAlreadyEnabled && Notification.permission === 'granted') {
      setEnabled(true);
      scheduleStreakReminder(streak);
    }
  }, [streak]);

  async function handleEnable() {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setEnabled(true);
      setVisible(false);
      scheduleStreakReminder(streak);
    } else {
      setVisible(false);
    }
  }

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem('mooearth_push_prompt_dismissed', 'true');
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#0c1026]/95 border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-fadeIn text-white flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
            🔥
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Protect Your {streak}-Day Streak!
            </h4>
            <p className="text-xs text-slate-300">
              Get an alert before today&apos;s challenge expires at 00:00 UTC.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white text-xs p-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleEnable}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all text-center"
        >
          🔔 Enable Streak Alerts
        </button>
        <button
          onClick={handleDismiss}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-300 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
