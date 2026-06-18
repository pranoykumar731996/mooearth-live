'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';

interface ArticleViewerProps {
  event: WorldEvent | null;
  allEvents: WorldEvent[];
  onClose: () => void;
}

interface ArticleDetails {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  country: string;
  category: string;
  aiSummary: string;
  fullContent: string;
  keyFacts: string[];
}

// Module-level cache to persist loaded articles across mounts/unmounts in the session
const localArticleCache: Record<string, ArticleDetails> = {};

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFlagEmoji(country: string): string {
  // On Windows, return a globe emoji to avoid broken/missing flag emojis in UI text rendering
  if (typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('windows')) {
    return '🌍';
  }
  const flags: Record<string, string> = {
    'Spain': '🇪🇸', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
    'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Uruguay': '🇺🇾',
    'Colombia': '🇨🇴', 'Mexico': '🇲🇽', 'United States': '🇺🇸', 'Japan': '🇯🇵',
    'South Korea': '🇰🇷', 'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Canada': '🇨🇦',
    'Australia': '🇦🇺', 'China': '🇨🇳', 'India': '🇮🇳', 'Cuba': '🇨🇺', 'Libya': '🇱🇾',
    'Cambodia': '🇰🇭'
  };
  return flags[country] || '🌍';
}

/**
 * Extracts publisher and clean title from headline format "Title - Publisher Name"
 */
function parsePublisher(title: string, sourceUrl: string): { title: string; publisher: string } {
  // Try to parse from title suffix
  const parts = title.split(' - ');
  if (parts.length > 1) {
    const publisher = parts.pop()?.trim() || '';
    const mainTitle = parts.join(' - ').trim();
    return { title: mainTitle, publisher };
  }

  // Fallback: extract domain name from sourceUrl
  try {
    const url = new URL(sourceUrl);
    let host = url.hostname.replace('www.', '');
    if (host.includes('google.com')) {
      return { title, publisher: 'Google News' };
    }
    const dotIdx = host.indexOf('.');
    if (dotIdx !== -1) {
      host = host.substring(0, dotIdx);
    }
    return { title, publisher: host.toUpperCase() };
  } catch (e) {
    return { title, publisher: 'Associated Press' };
  }
}

export default function ArticleViewer({ event, allEvents, onClose }: ArticleViewerProps) {
  const [activeEvent, setActiveEvent] = useState<WorldEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [articleDetails, setArticleDetails] = useState<ArticleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Synchronise activeEvent with the prop event synchronously in render
  const [prevEvent, setPrevEvent] = useState<WorldEvent | null>(null);
  if (event !== prevEvent) {
    setPrevEvent(event);
    setActiveEvent(event);
  }

  // Reset articleDetails and error synchronously in render when activeEvent changes (checking cache)
  const [prevActiveEvent, setPrevActiveEvent] = useState<WorldEvent | null>(null);
  if (activeEvent !== prevActiveEvent) {
    setPrevActiveEvent(activeEvent);
    if (activeEvent) {
      const cacheKey = activeEvent.id || activeEvent.source || activeEvent.title;
      if (localArticleCache[cacheKey]) {
        setArticleDetails(localArticleCache[cacheKey]);
        setError(null);
        setLoading(false);
      } else {
        setArticleDetails(null);
        setError(null);
        setLoading(true);
      }
    } else {
      setArticleDetails(null);
      setError(null);
      setLoading(false);
    }
  }

  // Load article details (with local caching check)
  useEffect(() => {
    if (!activeEvent) {
      return;
    }

    const cacheKey = activeEvent.id || activeEvent.source || activeEvent.title;
    
    // Reuse locally cached article if available
    if (localArticleCache[cacheKey]) {
      // Already populated synchronously in render phase. Scroll back to top.
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    const queryParams = new URLSearchParams({
      id: activeEvent.id || '',
      url: activeEvent.source || '',
      title: activeEvent.title || '',
      summary: activeEvent.summary || '',
      country: activeEvent.country || 'Global',
      category: activeEvent.category || 'breaking',
      publishedAt: activeEvent.publishedAt || new Date().toISOString(),
    });

    fetch(`/api/article?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load article details (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.article) {
          // Save in local cache
          localArticleCache[cacheKey] = data.article;
          setArticleDetails(data.article);
          // Scroll back to top on story transition
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } else {
          throw new Error('No article data returned');
        }
      })
      .catch((err) => {
        console.error('Error fetching article details:', err);
        setError(err.message || 'An error occurred while loading the article.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeEvent]);

  if (!event || !activeEvent) return null;

  // Category and Metadata Configuration
  const categoryConfig = CATEGORY_MAP[activeEvent.category as EventCategory] || CATEGORY_MAP.breaking;
  const { title: cleanTitle, publisher } = parsePublisher(activeEvent.title, activeEvent.source);

  // Find related stories from same country
  const relatedStories = allEvents
    .filter((e) => e.country === activeEvent.country && e.id !== activeEvent.id && e.category !== 'football')
    .sort((a, b) => {
      // Prioritize same category first
      if (a.category === activeEvent.category && b.category !== activeEvent.category) return -1;
      if (b.category === activeEvent.category && a.category !== activeEvent.category) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);

  // Multi-level fallback rendering content selection
  const getRenderContent = () => {
    if (!articleDetails) return '';
    if (articleDetails.fullContent) return articleDetails.fullContent;
    // Fallbacks
    if (activeEvent.summary) return activeEvent.summary;
    return activeEvent.title;
  };

  const articleBody = getRenderContent();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-6 select-none overflow-hidden">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[90] cursor-pointer"
        />

        {/* Modal Sheet container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative w-full h-full lg:max-w-3xl lg:h-auto lg:max-h-[85vh] rounded-none lg:rounded-3xl glass border border-white/10 flex flex-col overflow-hidden z-[100] pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(12,12,22,0.98) 0%, rgba(5,5,12,0.98) 100%)',
            boxShadow: `0 0 80px ${categoryConfig.glowColor}, 0 25px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Close button - Sticky at top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer z-50 border border-white/5"
            aria-label="Close article reader"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Sticky Header info bar */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex flex-col gap-1.5 shrink-0 pr-16 bg-black/20">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white">
                <span>{getFlagEmoji(activeEvent.country)}</span>
                <span>{activeEvent.country}</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded font-extrabold"
                style={{ color: categoryConfig.color, backgroundColor: categoryConfig.bgColor }}
              >
                <span>{categoryConfig.emoji}</span>
                <span>{categoryConfig.label}</span>
              </span>
              {articleDetails && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-white/50">{publisher}</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-white/40 font-medium mt-0.5" suppressHydrationWarning>
              Published {formatRelativeTime(activeEvent.publishedAt)}
            </span>
          </div>

          {/* Scrollable Article Content */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin select-text"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <p className="text-xs text-cyan-400/70 uppercase tracking-widest font-bold animate-pulse">Running AI Summarizer...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-sm space-y-4">
                <p>{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors"
                >
                  Close Reader
                </button>
              </div>
            ) : articleDetails ? (
              <>
                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                  {cleanTitle}
                </h1>

                {/* AI Summary Section */}
                <div className="rounded-2xl p-5 border border-white/5 relative overflow-hidden bg-cyan-500/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      AI Summary Insight
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                  <div className="text-sm text-white/90 leading-relaxed font-semibold space-y-3">
                    {articleDetails.aiSummary.split('\n\n').map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* Key Facts Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Key Facts & Developments</h3>
                  <ul className="space-y-2.5">
                    {articleDetails.keyFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-white/80 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-400" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full Content Body */}
                <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Detailed Report</h3>
                  <div className="text-sm text-white/70 leading-relaxed space-y-4 font-normal">
                    {articleBody.split('\n\n').map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* Actions / Read Source */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/[0.05]">
                  <a
                    href={articleDetails.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider
                               bg-gradient-to-r from-cyan-500 to-blue-600
                               text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_45px_rgba(6,182,212,0.45)] hover:scale-[1.02]
                               transition-all duration-300 group cursor-pointer"
                  >
                    <span>Read Full Source on {publisher}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1.5 transition-transform">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>

                {/* Related Stories Section */}
                {relatedStories.length > 0 && (
                  <div className="pt-8 space-y-4 border-t border-white/[0.05] pb-4">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">
                      Related Stories from {activeEvent.country}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {relatedStories.map((story) => {
                        const storyConfig = CATEGORY_MAP[story.category as EventCategory] || CATEGORY_MAP.breaking;
                        const { title: cleanStoryTitle, publisher: storyPublisher } = parsePublisher(story.title, story.source);
                        
                        return (
                          <div
                            key={story.id}
                            onClick={() => {
                              setActiveEvent(story);
                            }}
                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col justify-between gap-3 text-left group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 text-[8px] font-bold uppercase tracking-wider">
                                <span style={{ color: storyConfig.color }}>
                                  {storyConfig.label}
                                </span>
                                <span className="text-white/30 truncate max-w-[60px]">
                                  {storyPublisher}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 line-clamp-3 leading-snug transition-colors">
                                {cleanStoryTitle}
                              </h4>
                            </div>
                            <span className="text-[9px] text-white/30 font-medium">
                              {formatRelativeTime(story.publishedAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
