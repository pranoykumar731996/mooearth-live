// ============================================================
// MooEarth Live — Interactive Globe Collection Tour HUD
// ============================================================
// Phase 10: Non-intrusive floating HUD for curated world discovery collections.
// Enables stepping through ordered locations with camera fly-to,
// educational notes, publisher article citations, and quiz checkpoints.

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryCollection, CollectionLocationItem } from '@/types/collections';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { getCollectionShareUrl, getCollectionShareText, copyToClipboard } from '@/utils/share';
import { trackCollectionOpened, trackCollectionShared } from '@/services/analytics';
import { recordCollectionOpen, recordCollectionShare } from '@/services/collectionService';

interface GlobeCollectionTourProps {
  collection: DiscoveryCollection;
  onClose: () => void;
  onFlyTo: (coords: { lat: number; lng: number; altitude?: number }, duration?: number) => void;
  onSelectCountry?: (countryName: string) => void;
}

export default function GlobeCollectionTour({
  collection: initialCollection,
  onClose,
  onFlyTo,
  onSelectCountry,
}: GlobeCollectionTourProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const locations = initialCollection.locations || [];
  const currentLocation: CollectionLocationItem | undefined = locations[currentIdx];

  // Track initial open and fly to first stop
  useEffect(() => {
    trackCollectionOpened(initialCollection.id, initialCollection.title);
    recordCollectionOpen(initialCollection.id);

    if (locations.length > 0) {
      const first = locations[0];
      onFlyTo({ lat: first.coordinates.lat, lng: first.coordinates.lng, altitude: 1.4 }, 1400);
      if (first.country && onSelectCountry) {
        onSelectCountry(first.country);
      }
    }
  }, [initialCollection.id]);

  // Handle step navigation
  const navigateToStep = (index: number) => {
    if (index < 0 || index >= locations.length) return;
    setCurrentIdx(index);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setIsListExpanded(false);

    const target = locations[index];
    onFlyTo({ lat: target.coordinates.lat, lng: target.coordinates.lng, altitude: 1.35 }, 1200);
    if (target.country && onSelectCountry) {
      onSelectCountry(target.country);
    }
  };

  const handleNext = () => {
    if (currentIdx < locations.length - 1) {
      navigateToStep(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      navigateToStep(currentIdx - 1);
    }
  };

  const handleShare = async () => {
    const url = getCollectionShareUrl(initialCollection.id);
    const text = getCollectionShareText({
      title: initialCollection.title,
      totalLocations: initialCollection.totalLocations,
      creatorName: initialCollection.creatorName,
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: initialCollection.title, text, url });
        trackCollectionShared(initialCollection.id, 'native');
        recordCollectionShare(initialCollection.id);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await copyToClipboard(url);
    setCopied(true);
    trackCollectionShared(initialCollection.id, 'clipboard');
    recordCollectionShare(initialCollection.id);
    setTimeout(() => setCopied(false), 2400);
  };

  if (!currentLocation) return null;

  return (
    <div className="absolute top-20 left-4 sm:left-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-32px)] sm:w-[400px] pointer-events-auto font-sans">
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-white overflow-hidden flex flex-col"
      >
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0 p-1 rounded-lg bg-white/5 border border-white/10">
              {initialCollection.coverEmoji || '🧭'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {initialCollection.category || 'Tour'}
                </span>
                <span className="text-[11px] text-white/50 truncate">
                  by {initialCollection.creatorName || 'Explorer'}
                </span>
              </div>
              <h2 className="text-sm font-black text-white truncate tracking-tight">
                {initialCollection.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              title="Share Collection Link"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all text-xs cursor-pointer flex items-center gap-1"
            >
              {copied ? (
                <span className="text-emerald-400 font-bold text-[10px]">Copied!</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Exit Tour"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white/70 hover:text-rose-300 transition-all text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-white/5 h-1">
          <div
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / locations.length) * 100}%` }}
          />
        </div>

        {/* Current Stop Body */}
        <div className="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Stop Counter & Quick Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40 font-mono text-[11px] font-semibold">
              STOP {currentIdx + 1} OF {locations.length}
            </span>

            <button
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline-offset-2 hover:underline cursor-pointer flex items-center gap-1"
            >
              {isListExpanded ? 'Hide All Stops ▲' : 'View All Stops ▼'}
            </button>
          </div>

          {/* Expanded Step List */}
          <AnimatePresence>
            {isListExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-white/5 border border-white/10 p-2 space-y-1 text-xs"
              >
                {locations.map((loc, idx) => (
                  <button
                    key={loc.id + idx}
                    onClick={() => navigateToStep(idx)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      idx === currentIdx
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {loc.name} {loc.country ? `(${loc.country})` : ''}
                    </span>
                    {idx === currentIdx && <span className="text-[10px] text-cyan-400">Viewing</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Place Title & Country Badge */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                {currentLocation.name}
              </h3>
              {currentLocation.countryCode && (
                <div className="w-5 h-3.5 relative overflow-hidden rounded shadow-sm">
                  <CountryFlag countryCode={currentLocation.countryCode} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
              <span>{currentLocation.country || 'World Location'}</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-white/40">
                {currentLocation.coordinates.lat.toFixed(3)}°, {currentLocation.coordinates.lng.toFixed(3)}°
              </span>
            </div>
          </div>

          {/* Creator/Educator Notes */}
          {currentLocation.educationalNotes && (
            <div className="rounded-xl bg-gradient-to-br from-cyan-950/30 to-blue-950/20 border border-cyan-500/20 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <span>📖</span>
                  {currentLocation.notesAttribution === 'publisher'
                    ? 'Publisher Curated Context'
                    : currentLocation.notesAttribution === 'educator'
                    ? 'Educator Notes'
                    : 'Creator Note'}
                </span>
                <span className="text-[9px] text-white/30 font-mono">Verified Context</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {currentLocation.educationalNotes}
              </p>
            </div>
          )}

          {/* Publisher Article Citation & Safe External Link */}
          {currentLocation.articleRef && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 font-mono uppercase">
                  Curated Source: {currentLocation.articleRef.publisher}
                </div>
                <div className="text-xs text-white font-medium truncate">
                  {currentLocation.articleRef.title}
                </div>
              </div>
              {currentLocation.articleRef.url && (
                <a
                  href={currentLocation.articleRef.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  Read ↗
                </a>
              )}
            </div>
          )}

          {/* Quiz Checkpoint (if attached) */}
          {currentLocation.quizCheckpoint && (
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/25 p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span>🎯 Geography Checkpoint</span>
                <span>Test Knowledge</span>
              </div>

              <p className="text-xs font-semibold text-white">
                {currentLocation.quizCheckpoint.question}
              </p>

              <div className="space-y-1.5 pt-1">
                {currentLocation.quizCheckpoint.options.map((opt, oIdx) => {
                  const isSelected = selectedQuizOption === oIdx;
                  const isCorrect = oIdx === currentLocation.quizCheckpoint?.correctIndex;
                  let btnStyle = 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 line-through';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={quizSubmitted}
                      onClick={() => {
                        setSelectedQuizOption(oIdx);
                        setQuizSubmitted(true);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-mono text-white/40 mr-1.5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && currentLocation.quizCheckpoint.explanation && (
                <p className="text-[11px] text-emerald-300/90 pt-1 leading-snug">
                  💡 {currentLocation.quizCheckpoint.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
          >
            ← Previous
          </button>

          <button
            onClick={() => {
              onFlyTo({
                lat: currentLocation.coordinates.lat,
                lng: currentLocation.coordinates.lng,
                altitude: 1.35,
              }, 1000);
            }}
            title="Re-center 3D Globe camera on this place"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            🎯 Re-center
          </button>

          <button
            onClick={handleNext}
            disabled={currentIdx === locations.length - 1}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-30 disabled:hover:from-cyan-500 disabled:hover:to-emerald-500 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1"
          >
            {currentIdx === locations.length - 1 ? 'Tour Finished ✓' : 'Next Stop →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
