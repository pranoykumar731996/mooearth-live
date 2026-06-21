'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PerspectiveResult } from '@/types/perspective';

interface PerspectiveLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  topic: string;
  category: string;
}

export default function PerspectiveLensModal({
  isOpen,
  onClose,
  country,
  topic,
  category
}: PerspectiveLensModalProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'global' | 'ai'>('ai');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notWhitelisted, setNotWhitelisted] = useState<boolean>(false);
  const [data, setData] = useState<PerspectiveResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Cycle loading messages for a premium feel
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setLoading(true);
    setError(null);
    setNotWhitelisted(false);
    setData(null);
    setActiveTab('ai');
    setLoadingStep(0);

    const fetchPerspective = async () => {
      try {
        const url = `/api/perspective?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}&category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        
        if (res.status === 403) {
          const body = await res.json();
          if (body.notWhitelisted) {
            setNotWhitelisted(true);
            setLoading(false);
            return;
          }
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to fetch comparison');
        }

        const json: PerspectiveResult = await res.json();
        setData(json);
        
        // If AI returned empty/null data, make sure we default to Local or Global tab so user doesn't see blank screen, or display a warning
        if (!json.commonFacts || json.commonFacts.length === 0) {
          setActiveTab('local');
        }
      } catch (err: any) {
        console.error('[PerspectiveLens] Error fetching data:', err);
        setError(err.message || 'Perspective comparison temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerspective();
  }, [isOpen, country, topic, category]);

  if (!isOpen) return null;

  const loadingMessages = [
    'Scanning global news agencies and local feeds...',
    'Assembling editorial framing data...',
    'Running non-partisan comparative semantic analysis...'
  ];

  const hasAiData = data && data.commonFacts && data.commonFacts.length > 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-[680px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh] text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.97) 0%, rgba(5, 5, 10, 0.97) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 50px rgba(99, 102, 241, 0.15)'
        }}
      >
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-4 pr-8 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase tracking-wider">
                🧠 Perspective Lens
              </span>
              {data && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                  data.similarityScore === 'High' 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                    : data.similarityScore === 'Medium'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                }`}>
                  {data.similarityScore} Narrative Similarity
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1.5 leading-snug">
              {topic}
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Comparing domestic media in <span className="font-bold text-white">{country}</span> vs. international wire reporting.
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Controls (Only shown if data loaded and we're not whitelisting block) */}
        {!loading && !notWhitelisted && !error && (
          <div className="flex border-b border-white/5 mb-4 shrink-0 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('ai')}
              disabled={!hasAiData}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                !hasAiData 
                  ? 'text-white/20 border-transparent cursor-not-allowed'
                  : activeTab === 'ai'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <span>🧠 AI Comparison</span>
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'local'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <span>{country.toLowerCase() === 'india' ? '🇮🇳' : '📍'} Domestic Sources</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                {data?.localArticles?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'global'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <span>🌎 Global Wires</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                {data?.globalArticles?.length || 0}
              </span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-thin">
          {/* 1. Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-lg">🧠</span>
              </div>
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-medium text-indigo-200 text-center max-w-[300px]"
              >
                {loadingMessages[loadingStep]}
              </motion.p>
            </div>
          )}

          {/* 2. Whitelist Warning State */}
          {notWhitelisted && (
            <div className="py-10 text-center px-6">
              <span className="text-4xl mb-4 block">📍</span>
              <h3 className="text-lg font-bold text-white mb-2">Perspective Lens Beta</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-[400px] mx-auto">
                Perspective Lens is currently in Phase B rollout. Currently enabled countries are:
                <span className="font-bold text-indigo-300 block mt-2">India, USA, Japan, Brazil, UK</span>
                Support for other countries is rolling out soon!
              </p>
            </div>
          )}

          {/* 3. Error State */}
          {error && !loading && (
            <div className="py-10 text-center px-6">
              <span className="text-4xl mb-4 block">⚠️</span>
              <h3 className="text-lg font-bold text-rose-300 mb-2">Aggregation Offline</h3>
              <p className="text-sm text-white/50 max-w-[400px] mx-auto leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* 4. Loaded Data State */}
          {!loading && !notWhitelisted && !error && data && (
            <AnimatePresence mode="wait">
              {/* Tab: AI Comparison */}
              {activeTab === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4 font-sans text-left"
                >
                  {/* Warning if OpenAI was unavailable but feeds are visible */}
                  {!hasAiData && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex gap-2">
                      <span>⚠️</span>
                      <p>AI comparison unavailable. Local and global sources remain available.</p>
                    </div>
                  )}

                  {hasAiData && (
                    <>
                      {/* Shared Grounds (Common Facts) */}
                      <div className="p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <span>✅</span> Shared Ground Facts
                        </h4>
                        <ul className="space-y-1.5">
                          {data.commonFacts.map((fact, i) => (
                            <li key={i} className="text-xs text-emerald-100/90 leading-relaxed flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Focus Breakdown Split */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Domestic Emphasis */}
                        <div className="p-4 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/10">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>📍</span> Domestic Emphasis
                          </h4>
                          <ul className="space-y-1.5">
                            {data.localFocus.map((pt, i) => (
                              <li key={i} className="text-xs text-indigo-100/90 leading-relaxed flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Global Focus */}
                        <div className="p-4 rounded-2xl bg-purple-500/[0.02] border border-purple-500/10">
                          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>🌎</span> International Framing
                          </h4>
                          <ul className="space-y-1.5">
                            {data.globalFocus.map((pt, i) => (
                              <li key={i} className="text-xs text-purple-100/90 leading-relaxed flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Missing Context Callout */}
                      {data.missingContext && data.missingContext.length > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>⚠️</span> Omitted Context
                          </h4>
                          <ul className="space-y-1.5">
                            {data.missingContext.map((pt, i) => (
                              <li key={i} className="text-xs text-amber-100/90 leading-relaxed flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Tab: Domestic News */}
              {activeTab === 'local' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2.5 text-left"
                >
                  {data.localArticles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-white/30 rounded-2xl border border-white/5 bg-white/[0.01]">
                      No domestic news articles found for this topic.
                    </div>
                  ) : (
                    data.localArticles.map((art, index) => (
                      <a
                        key={index}
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all group cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                              {art.source}
                            </span>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 mt-1 leading-snug">
                              {art.title}
                            </h4>
                            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed line-clamp-2">
                              {art.snippet}
                            </p>
                          </div>
                          <span className="text-white/30 group-hover:text-indigo-400 transition-colors text-xs shrink-0 self-center">
                            ↗️
                          </span>
                        </div>
                      </a>
                    ))
                  )}
                </motion.div>
              )}

              {/* Tab: Global Wires */}
              {activeTab === 'global' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2.5 text-left"
                >
                  {data.globalArticles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-white/30 rounded-2xl border border-white/5 bg-white/[0.01]">
                      No international news articles found for this topic.
                    </div>
                  ) : (
                    data.globalArticles.map((art, index) => (
                      <a
                        key={index}
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all group cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                              {art.source}
                            </span>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 mt-1 leading-snug">
                              {art.title}
                            </h4>
                            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed line-clamp-2">
                              {art.snippet}
                            </p>
                          </div>
                          <span className="text-white/30 group-hover:text-indigo-400 transition-colors text-xs shrink-0 self-center">
                            ↗️
                          </span>
                        </div>
                      </a>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
