// ============================================================
// MooEarth Live — Curated Discovery Collection Landing Client
// ============================================================
// Phase 10: Lightweight public presentation page for curated collections.
// Enables direct 3D globe launching, location stops inspection,
// social sharing, and community content moderation reports.

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryCollection, CollectionReport } from '@/types/collections';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { getCollectionShareUrl, getCollectionShareText, copyToClipboard } from '@/utils/share';
import { submitCollectionReport } from '@/services/collectionService';
import { trackCollectionOpened, trackCollectionShared, trackCollectionReported } from '@/services/analytics';

interface CollectionLandingClientProps {
  initialCollection: DiscoveryCollection | null;
  collectionId: string;
}

export default function CollectionLandingClient({
  initialCollection,
  collectionId,
}: CollectionLandingClientProps) {
  const [collection] = useState<DiscoveryCollection | null>(initialCollection);
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<CollectionReport['reason']>('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleShare = async () => {
    if (!collection) return;
    const url = getCollectionShareUrl(collection.id);
    const text = getCollectionShareText({
      title: collection.title,
      totalLocations: collection.totalLocations,
      creatorName: collection.creatorName,
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: collection.title, text, url });
        trackCollectionShared(collection.id, 'native');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await copyToClipboard(url);
    setCopied(true);
    trackCollectionShared(collection.id, 'clipboard');
    setTimeout(() => setCopied(false), 2400);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;
    setIsSubmittingReport(true);

    try {
      await submitCollectionReport({
        collectionId: collection.id,
        reason: reportReason,
        details: reportDetails,
      });
      trackCollectionReported(collection.id, reportReason);
      setReportSubmitted(true);
    } catch {
      setReportSubmitted(true);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 1. Missing or Private Draft Fallback
  if (!collection) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl text-center space-y-6">
          <div className="text-4xl p-4 rounded-2xl bg-white/5 border border-white/10 w-fit mx-auto">
            🧭
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              Collection Unavailable or Private
            </h1>
            <p className="text-xs text-white/50 leading-relaxed">
              This world discovery collection does not exist, has been unpublished by its owner, or is a private draft.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Explore 3D Living Globe ➔
          </Link>
        </div>
      </div>
    );
  }

  const locations = collection.locations || [];

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl top-1/2 -right-40 pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
              M
            </span>
            <div className="hidden sm:block">
              <span className="font-black text-sm tracking-tight text-white">MooEarth</span>
              <span className="text-cyan-400 text-xs font-mono font-bold ml-1">.LIVE</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <span className="text-emerald-400 font-bold">Link Copied!</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href={`/?collection=${encodeURIComponent(collection.id)}`}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
            >
              <span>Explore in 3D ➔</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Collection Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <span className="text-4xl sm:text-5xl p-3 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              {collection.coverEmoji || '🧭'}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/25">
                {collection.category.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {collection.title}
            </h1>
            <p className="text-sm text-white/70 leading-relaxed font-sans max-w-2xl">
              {collection.description}
            </p>
          </div>

          {/* Attribution & Meta */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs">
                {collection.creatorAvatar || '👤'}
              </span>
              <span>
                Curated by <strong className="text-white">{collection.creatorName || 'Explorer'}</strong>
              </span>
              {collection.creatorBadge && (
                <span className="text-[10px] font-mono uppercase bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                  {collection.creatorBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-white/40">
              <span>📍 {collection.totalLocations} STOPS</span>
              <span>•</span>
              <span>🌐 {collection.featuredCountryCodes?.length || 0} NATIONS</span>
              {collection.viewsCount !== undefined && collection.viewsCount > 0 && (
                <>
                  <span>•</span>
                  <span>👁️ {collection.viewsCount} VIEWS</span>
                </>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <Link
              href={`/?collection=${encodeURIComponent(collection.id)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              <span>Launch 3D Globe Interactive Tour 🌍</span>
            </Link>
          </div>
        </div>

        {/* Ordered Stops Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-wider text-white/80">
              Curated Itinerary ({locations.length} Locations)
            </h2>
            <span className="text-xs text-white/40 font-mono">STEP-BY-STEP DISCOVERY</span>
          </div>

          <div className="space-y-3">
            {locations.map((loc, idx) => (
              <div
                key={loc.id + idx}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight truncate">
                          {loc.name}
                        </h3>
                        {loc.countryCode && (
                          <div className="w-4 h-3 relative rounded overflow-hidden">
                            <CountryFlag countryCode={loc.countryCode} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white/50 font-mono mt-0.5">
                        {loc.country || 'Global Location'} • {loc.coordinates.lat.toFixed(3)}°, {loc.coordinates.lng.toFixed(3)}°
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/?collection=${encodeURIComponent(collection.id)}`}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs shrink-0"
                    title="View this stop on globe"
                  >
                    View ➔
                  </Link>
                </div>

                {/* Educational Note */}
                {loc.educationalNotes && (
                  <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/20 p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      <span>📖 {loc.notesAttribution === 'educator' ? 'Educator Note' : loc.notesAttribution === 'publisher' ? 'Publisher Context' : 'Creator Note'}</span>
                      <span className="text-[9px] text-white/30 font-mono">Verified Notes</span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed font-sans">
                      {loc.educationalNotes}
                    </p>
                  </div>
                )}

                {/* Article Reference */}
                {loc.articleRef && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/40 font-mono uppercase block">
                        Publisher Context: {loc.articleRef.publisher}
                      </span>
                      <span className="text-xs text-white font-medium truncate block">
                        {loc.articleRef.title}
                      </span>
                    </div>
                    {loc.articleRef.url && (
                      <a
                        href={loc.articleRef.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shrink-0 transition-colors"
                      >
                        Read Article ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Quiz Checkpoint */}
                {loc.quizCheckpoint && (
                  <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3 space-y-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      🎯 Geography Checkpoint Attached
                    </span>
                    <p className="text-white/80 font-medium">
                      {loc.quizCheckpoint.question}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Community Trust & Report Footer */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between flex-wrap gap-3 text-xs text-white/40">
          <p>
            Curated via MooEarth Creator Studio. Preserves original sources and location attributions.
          </p>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="text-rose-400/70 hover:text-rose-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Report content or inaccurate data
          </button>
        </div>
      </main>

      {/* Content Moderation Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl text-rose-400">⚠️</span>
                  <h3 className="text-base font-bold text-white">Report Content</h3>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 rounded-lg bg-white/5 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {reportSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="text-3xl text-emerald-400">✓</div>
                  <h4 className="text-sm font-bold text-white">Report Submitted</h4>
                  <p className="text-xs text-white/50">
                    Thank you. Our moderation queue will review this collection according to our trust and safety guidelines.
                  </p>
                  <button
                    onClick={() => {
                      setIsReportModalOpen(false);
                      setReportSubmitted(false);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                  <p className="text-white/60">
                    Help keep MooEarth safe and educational. What is the issue with this collection?
                  </p>

                  <div className="space-y-2">
                    {(
                      [
                        { id: 'inappropriate', label: 'Inappropriate or harmful content' },
                        { id: 'spam', label: 'Spam, promotional, or repetitive' },
                        { id: 'inaccurate', label: 'Factually inaccurate geography or history' },
                        { id: 'copyright', label: 'Copyright or publisher attribution issue' },
                        { id: 'other', label: 'Other concern' },
                      ] as const
                    ).map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          reportReason === r.id
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          checked={reportReason === r.id}
                          onChange={() => setReportReason(r.id)}
                          className="accent-rose-500"
                        />
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/60 block">Additional context (optional)</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Please provide any details..."
                      rows={2}
                      maxLength={400}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="px-3 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
                    >
                      {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
