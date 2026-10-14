'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getStoredConsent,
  hasUserResponded,
  acceptAllConsent,
  rejectNonEssentialConsent,
  updateConsentState,
  ConsentPreferences
} from '@/services/consentService';
import { trackConsentUpdate } from '@/services/analytics';

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    advertising: false,
    personalizedAds: false,
    respondedAt: null
  });

  useEffect(() => {
    // Only display if user has not made an explicit choice yet
    if (!hasUserResponded()) {
      setIsVisible(true);
    }
    setPreferences(getStoredConsent());

    // Listen for custom trigger to reopen banner from footer / settings
    const handleReopen = () => {
      setPreferences(getStoredConsent());
      setIsVisible(true);
      setShowDetails(true);
    };

    window.addEventListener('mooearth_open_consent_preferences', handleReopen);
    return () => window.removeEventListener('mooearth_open_consent_preferences', handleReopen);
  }, []);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    const updated = acceptAllConsent();
    trackConsentUpdate(updated);
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    const updated = rejectNonEssentialConsent();
    trackConsentUpdate(updated);
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    const updated = updateConsentState({
      analytics: preferences.analytics,
      advertising: preferences.advertising,
      personalizedAds: preferences.advertising ? preferences.personalizedAds : false
    });
    trackConsentUpdate(updated);
    setIsVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-[9999] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-2xl text-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 mt-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div className="flex-1">
          <h2 id="consent-title" className="text-sm font-semibold text-white tracking-wide flex items-center justify-between">
            Your Privacy & Cookies on MooEarth
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </h2>
          <p id="consent-description" className="text-xs text-slate-300 mt-1 leading-relaxed">
            We use essential cookies to maintain your 3D globe session and preferences. With your consent, we also measure anonymous usage and display relevant partner intelligence to sustain free planetary exploration.
          </p>
        </div>
      </div>

      {/* Customizable Toggles */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5 text-xs">
          {/* Essential Category */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div>
              <span className="font-medium text-white block">Strictly Necessary</span>
              <span className="text-[11px] text-slate-400">Essential navigation, security, and rendering state.</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
              Always Active
            </span>
          </div>

          {/* Analytics Category */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div>
              <span className="font-medium text-white block">Aggregated Telemetry</span>
              <span className="text-[11px] text-slate-400">Anonymous visitor counts and performance health.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Advertising Category */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div>
              <span className="font-medium text-white block">Sustaining Advertisements</span>
              <span className="text-[11px] text-slate-400">Non-intrusive banners on news articles.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.advertising}
                onChange={(e) => setPreferences((p) => ({ ...p, advertising: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>
      )}

      {/* Policy Links */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {showDetails ? 'Hide Options' : 'Customize Preferences'}
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showDetails ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <Link href="/privacy" className="hover:text-white underline underline-offset-2">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/cookies" className="hover:text-white underline underline-offset-2">
            Cookie Policy
          </Link>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2">
        {showDetails ? (
          <button
            onClick={handleSaveCustom}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Save My Preferences
          </button>
        ) : (
          <>
            <button
              onClick={handleEssentialOnly}
              className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-white/10 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
            >
              Accept All
            </button>
          </>
        )}
      </div>
    </div>
  );
};
