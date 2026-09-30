// ============================================================
// MooEarth Live — Reusable Shareable Scorecard Component
// ============================================================
// Renders a high-fidelity visual scorecard with MooEarth branding,
// game statistics, challenge identity, and multi-platform sharing.

'use client';

import { useState } from 'react';
import { BRANDING } from '@/config/branding';
import {
  getChallengeShareUrl,
  getShareText,
  getSocialShareUrls,
  shareNative,
  copyToClipboard,
  isWebShareSupported,
} from '@/utils/share';
import { trackShareClick, trackShareComplete } from '@/services/analytics';

export interface ScorecardProps {
  mode: 'daily' | 'survival' | 'clock' | 'flag' | 'capital' | 'explorer';
  score: number;
  correct: number;
  total: number;
  streak?: number;
  xp?: number;
  challengeId?: string;
  onPlayAgain?: () => void;
  onClose?: () => void;
}

const MODE_META: Record<string, { label: string; emoji: string; color: string; gradient: string }> = {
  daily: {
    label: 'Daily Earth Challenge',
    emoji: '📅',
    color: '#ec4899',
    gradient: 'from-pink-500 to-amber-500',
  },
  survival: {
    label: 'Survival Mode',
    emoji: '💀',
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
  },
  clock: {
    label: 'Beat the Clock',
    emoji: '⏱️',
    color: '#10b981',
    gradient: 'from-emerald-400 to-teal-600',
  },
  flag: {
    label: 'Flag Challenge',
    emoji: '🏁',
    color: '#f59e0b',
    gradient: 'from-amber-400 to-orange-500',
  },
  capital: {
    label: 'Capital Challenge',
    emoji: '🏛️',
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-indigo-600',
  },
  explorer: {
    label: 'Country Explorer',
    emoji: '🌍',
    color: '#00e5ff',
    gradient: 'from-cyan-400 to-blue-600',
  },
};

export default function Scorecard({
  mode,
  score,
  correct,
  total,
  streak,
  xp,
  challengeId,
  onPlayAgain,
  onClose,
}: ScorecardProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const meta = MODE_META[mode] || MODE_META.daily;

  // Resolve challenge identifier and URL
  const todayStr = new Date().toISOString().split('T')[0];
  const resolvedChallengeId = challengeId || (mode === 'daily' ? `daily-${todayStr.replace(/-/g, '')}` : `${mode}-${Date.now().toString(36)}`);
  const challengeUrl = getChallengeShareUrl(mode, mode === 'daily' ? todayStr : undefined);

  const shareText = getShareText({
    mode,
    score,
    correct,
    total,
    streak,
    xp,
  });

  const shareData = {
    title: `${meta.label} — ${BRANDING.name}`,
    text: shareText,
    url: challengeUrl,
  };

  const socialUrls = getSocialShareUrls(shareData);

  const handleNativeOrCopyShare = async () => {
    trackShareClick(isWebShareSupported() ? 'native' : 'copy', 'scorecard');
    if (isWebShareSupported()) {
      const success = await shareNative(shareData);
      if (success) {
        trackShareComplete('native', 'scorecard');
        return;
      }
    }

    const fullShareText = `${shareText}\n${challengeUrl}`;
    const copied = await copyToClipboard(fullShareText);
    if (copied) {
      trackShareComplete('copy', 'scorecard');
      setCopyFeedback('Link & Score Copied!');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleSocialClick = (platform: string) => {
    trackShareClick(platform, 'scorecard');
    trackShareComplete(platform, 'scorecard');
  };

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-label="Challenge Scorecard"
      className="relative w-full max-w-md mx-auto p-6 rounded-3xl bg-[#080d1a]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white text-center font-sans overflow-hidden"
    >
      {/* Background glow effect */}
      <div
        className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />

      {/* Close button if provided */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close scorecard"
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Header & Branding */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xl">🌍</span>
        <span className="text-xs font-bold tracking-widest uppercase text-white/60">
          {BRANDING.name}
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium mb-4">
        <span>{meta.emoji}</span>
        <span style={{ color: meta.color }}>{meta.label}</span>
      </div>

      {/* Score and stats display */}
      <div className="my-4 py-4 px-6 rounded-2xl bg-white/[0.03] border border-white/5">
        {xp !== undefined && xp > 0 ? (
          <div className="mb-2">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              {xp.toLocaleString()} XP
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Earned XP</div>
          </div>
        ) : (
          <div className="mb-2">
            <div className="text-3xl sm:text-4xl font-black text-cyan-400">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total Score</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5 text-sm">
          <div>
            <div className="font-bold text-lg text-emerald-400">
              {correct} / {total}
            </div>
            <div className="text-[11px] text-white/50">Accuracy ({percentage}%)</div>
          </div>

          <div>
            <div className="font-bold text-lg text-amber-400">
              {streak && streak > 1 ? `🔥 ${streak}d` : '⚡ Active'}
            </div>
            <div className="text-[11px] text-white/50">Streak Status</div>
          </div>
        </div>
      </div>

      {/* Challenge ID pill */}
      <div className="text-[10px] font-mono text-white/40 mb-5">
        Challenge Ref: <span className="text-white/60 font-semibold">{resolvedChallengeId}</span>
      </div>

      {/* Share Buttons */}
      <div className="space-y-3">
        {/* Main Share Button */}
        <button
          onClick={handleNativeOrCopyShare}
          id="scorecard-main-share-btn"
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>{copyFeedback || 'Share Challenge & Score'}</span>
        </button>

        {/* Social Share Grid */}
        <div className="flex items-center justify-center gap-2">
          {/* X / Twitter */}
          <a
            href={socialUrls.x}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleSocialClick('x')}
            aria-label="Share score on X"
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <span>𝕏</span>
            <span className="hidden sm:inline">Post</span>
          </a>

          {/* WhatsApp */}
          <a
            href={socialUrls.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleSocialClick('whatsapp')}
            aria-label="Share score on WhatsApp"
            className="flex-1 py-2 px-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-95 transition-all border border-[#25D366]/30 text-[#25D366] text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <span>💬</span>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={socialUrls.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleSocialClick('telegram')}
            aria-label="Share score on Telegram"
            className="flex-1 py-2 px-3 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/20 active:scale-95 transition-all border border-[#229ED9]/30 text-[#229ED9] text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <span>✈️</span>
            <span className="hidden sm:inline">Telegram</span>
          </a>
        </div>
      </div>

      {/* Play Again or Return CTA */}
      {onPlayAgain && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={onPlayAgain}
            className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-4"
          >
            Play Another Round
          </button>
        </div>
      )}

      {/* Footnote */}
      <div className="mt-4 text-[10px] text-white/30">
        mooearth.live • Explore the Living Earth
      </div>
    </div>
  );
}
