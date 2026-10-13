'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DailyChallengeRetentionCard() {
  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const now = new Date();
      const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      
      const savedResult = localStorage.getItem(`mooearth_daily_${today}`);
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        setCompleted(true);
        setScore(parsed.score ?? 5);
      }

      const storedStreak = parseInt(localStorage.getItem('mooearth_daily_streak') || '0', 10);
      setStreak(storedStreak);

      const dismissedToday = localStorage.getItem(`mooearth_daily_dismissed_${today}`);
      if (dismissedToday === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const now = new Date();
      const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      localStorage.setItem(`mooearth_daily_dismissed_${today}`, 'true');
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    const text = `🌍 MooEarth Daily Challenge\n🏆 Score: ${score ?? 5}/5\n🔥 Streak: ${streak} Days\nPlay today at https://mooearth.live/daily`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MooEarth Daily Challenge', text, url: 'https://mooearth.live/daily' });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!mounted || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 sm:left-6 z-30 pointer-events-auto max-w-xs sm:max-w-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          className="rounded-2xl border border-amber-500/30 bg-slate-950/90 backdrop-blur-md p-3.5 shadow-2xl shadow-amber-500/10 text-white"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{completed ? '✅' : '📅'}</span>
              <span className="text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                DAILY EARTH CHALLENGE
              </span>
            </div>

            <div className="flex items-center gap-1">
              {streak > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔥 {streak}
                </span>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white rounded-full hover:bg-white/10 text-xs transition-colors cursor-pointer"
                title="Dismiss for today"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Status Content */}
          <div className="text-xs text-white/70 mb-3 leading-snug">
            {completed ? (
              <p>
                You crushed today&apos;s 5 questions! Score: <span className="font-bold text-emerald-400">{score ?? 5} pts</span>. Next challenge resets at midnight UTC.
              </p>
            ) : (
              <p>
                Today&apos;s 5 planetary questions are ready. Test your sovereign flags, capitals &amp; geography!
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <Link
              href="/daily"
              className={`flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-black tracking-wide transition-all shadow-md cursor-pointer ${
                completed
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.02]'
              }`}
            >
              {completed ? 'Review Challenge ↗' : 'Start Today\'s Challenge (5 Qs)'}
            </Link>

            {completed && (
              <button
                type="button"
                onClick={handleShare}
                className="py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>{copied ? '✓ Copied' : '📤 Share'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
