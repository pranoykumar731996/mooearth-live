'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { CATEGORY_IMAGES, ArticleDetails } from '@/services/article';

interface ArticleViewerProps {
  event: WorldEvent | null;
  allEvents: WorldEvent[];
  onClose: () => void;
}

// Module-level cache to persist loaded articles across mounts/unmounts in the session
const localArticleCache: Record<string, ArticleDetails> = {};

const COUNTRY_INFO_MAP: Record<string, { capital: string; population: string; activityBase: number }> = {
  'Spain': { capital: 'Madrid', population: '47.4M', activityBase: 78 },
  'Brazil': { capital: 'Brasília', population: '203.1M', activityBase: 92 },
  'Argentina': { capital: 'Buenos Aires', population: '46.2M', activityBase: 85 },
  'United Kingdom': { capital: 'London', population: '67.0M', activityBase: 80 },
  'Germany': { capital: 'Berlin', population: '84.3M', activityBase: 75 },
  'France': { capital: 'Paris', population: '68.0M', activityBase: 82 },
  'Italy': { capital: 'Rome', population: '58.9M', activityBase: 74 },
  'Portugal': { capital: 'Lisbon', population: '10.3M', activityBase: 70 },
  'Netherlands': { capital: 'Amsterdam', population: '17.7M', activityBase: 72 },
  'Belgium': { capital: 'Brussels', population: '11.6M', activityBase: 68 },
  'Croatia': { capital: 'Zagreb', population: '3.9M', activityBase: 86 },
  'Uruguay': { capital: 'Montevideo', population: '3.4M', activityBase: 81 },
  'Colombia': { capital: 'Bogotá', population: '51.5M', activityBase: 79 },
  'Mexico': { capital: 'Mexico City', population: '127.5M', activityBase: 83 },
  'United States': { capital: 'Washington D.C.', population: '333.3M', activityBase: 88 },
  'Japan': { capital: 'Tokyo', population: '125.1M', activityBase: 87 },
  'South Korea': { capital: 'Seoul', population: '51.7M', activityBase: 84 },
  'Morocco': { capital: 'Rabat', population: '37.5M', activityBase: 89 },
  'Senegal': { capital: 'Dakar', population: '17.3M', activityBase: 77 },
  'Canada': { capital: 'Ottawa', population: '38.9M', activityBase: 73 },
  'Australia': { capital: 'Canberra', population: '25.6M', activityBase: 71 },
  'China': { capital: 'Beijing', population: '1.41B', activityBase: 86 },
  'India': { capital: 'New Delhi', population: '1.43B', activityBase: 90 },
  'Libya': { capital: 'Tripoli', population: '6.9M', activityBase: 65 },
  'Bosnia and Herzegovina': { capital: 'Sarajevo', population: '3.2M', activityBase: 60 },
  'Democratic Republic of the Congo': { capital: 'Kinshasa', population: '99M', activityBase: 64 },
  'Ivory Coast': { capital: 'Yamoussoukro', population: '28M', activityBase: 72 }
};

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
    'Cambodia': '🇰🇭', 'Bosnia and Herzegovina': '🇧🇦', 'Democratic Republic of the Congo': '🇨🇩',
    'Ivory Coast': '🇨🇮'
  };
  return flags[country] || '🌍';
}

function parsePublisher(title: string, sourceUrl: string): { title: string; publisher: string } {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    const publisher = parts.pop()?.trim() || '';
    const mainTitle = parts.join(' - ').trim();
    return { title: mainTitle, publisher };
  }

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

function getCountryInfo(country: string, allEvents: WorldEvent[]) {
  const info = COUNTRY_INFO_MAP[country] || { capital: 'Capital City', population: 'N/A', activityBase: 50 };
  const eventCount = allEvents.filter(e => e.country === country).length;
  const activityScore = Math.min(99, Math.max(30, info.activityBase + eventCount * 5));
  return {
    capital: info.capital,
    population: info.population,
    activityScore
  };
}

export default function ArticleViewer({ event, allEvents, onClose }: ArticleViewerProps) {
  const [activeEvent, setActiveEvent] = useState<WorldEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [articleDetails, setArticleDetails] = useState<ArticleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
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

  // Load article details (with local caching check and robust fallback)
  useEffect(() => {
    if (!activeEvent) {
      return;
    }

    const cacheKey = activeEvent.id || activeEvent.source || activeEvent.title;
    
    // Reuse locally cached article if available
    if (localArticleCache[cacheKey]) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    const cleanTitleText = parsePublisher(activeEvent.title, activeEvent.source).title;

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
          localArticleCache[cacheKey] = data.article;
          setArticleDetails(data.article);
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } else {
          throw new Error('No article data returned');
        }
      })
      .catch((err) => {
        console.error('Error fetching article details, applying client fallback:', err);
        
        // Build fallback details so the user is never left hanging
        const categoryImg = CATEGORY_IMAGES[activeEvent.category as EventCategory] || CATEGORY_IMAGES.breaking;
        const pubInfo = parsePublisher(activeEvent.title, activeEvent.source);
        const fallback: ArticleDetails = {
          id: activeEvent.id || '',
          title: pubInfo.title,
          source: activeEvent.source || '',
          publishedAt: activeEvent.publishedAt || new Date().toISOString(),
          country: activeEvent.country || 'Global',
          category: activeEvent.category || 'breaking',
          aiSummary: activeEvent.summary || 'Summary is currently unavailable.',
          fullContent: activeEvent.summary || 'No detailed content available at this time. Please check the original source link below.',
          keyFacts: [
            `Main Event: ${pubInfo.title}`,
            `Important Development: Check the full coverage on ${pubInfo.publisher || 'the source website'}.`,
            `Why It Matters: Key development impacting the local region.`,
            `Country Impact: Reinforces local interest and ongoing activity mapping.`
          ],
          author: `${pubInfo.publisher} Editorial`,
          image: categoryImg,
          description: activeEvent.summary
        };

        localArticleCache[cacheKey] = fallback;
        setArticleDetails(fallback);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeEvent]);

  if (!event || !activeEvent) return null;

  // Configuration
  const categoryConfig = CATEGORY_MAP[activeEvent.category as EventCategory] || CATEGORY_MAP.breaking;
  const { title: cleanTitle, publisher } = parsePublisher(activeEvent.title, activeEvent.source);

  // Article navigation indexes
  const currentIndex = allEvents.findIndex((e) => e.id === activeEvent.id);
  const prevStory = currentIndex > 0 ? allEvents[currentIndex - 1] : null;
  const nextStory = currentIndex !== -1 && currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null;

  // Country details
  const countryDetails = getCountryInfo(activeEvent.country, allEvents);

  // Keyword score computation for highly relevant related stories
  const activeKeywords = activeEvent.title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4 && !['about', 'after', 'again', 'could', 'would', 'their', 'there', 'world'].includes(word));

  const getKeywordScore = (title: string) => {
    const t = title.toLowerCase();
    let score = 0;
    activeKeywords.forEach(kw => {
      if (t.includes(kw)) score += 5;
    });
    return score;
  };

  // Find related stories from same country
  const relatedStories = allEvents
    .filter((e) => e.country === activeEvent.country && e.id !== activeEvent.id && e.category !== 'football')
    .map(e => ({
      event: e,
      score: (e.category === activeEvent.category ? 12 : 0) + getKeywordScore(e.title)
    }))
    .sort((a, b) => b.score - a.score || new Date(b.event.publishedAt).getTime() - new Date(a.event.publishedAt).getTime())
    .map(item => item.event)
    .slice(0, 3);

  const displayImage = articleDetails?.image || CATEGORY_IMAGES[activeEvent.category as EventCategory] || CATEGORY_IMAGES.breaking;
  const articleBody = articleDetails?.fullContent || activeEvent.summary || 'No further content is available.';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-6 select-none overflow-hidden">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[90] cursor-pointer"
        />

        {/* Modal Sheet container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative w-full h-full lg:max-w-5xl lg:h-auto lg:max-h-[90vh] rounded-none lg:rounded-3xl glass border border-white/10 flex flex-col overflow-hidden z-[100] pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(12,12,22,0.98) 0%, rgba(5,5,12,0.98) 100%)',
            boxShadow: `0 0 80px ${categoryConfig.glowColor}, 0 25px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Top Navbar */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-black/40 z-20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white">
                <span>{getFlagEmoji(activeEvent.country)}</span>
                <span>{activeEvent.country}</span>
              </span>
              <span className="text-white/20">|</span>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded font-extrabold"
                style={{ color: categoryConfig.color, backgroundColor: categoryConfig.bgColor }}
              >
                <span>{categoryConfig.emoji}</span>
                <span>{categoryConfig.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Reading Mode Button */}
              <button
                onClick={() => setReadingMode(!readingMode)}
                className={`h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer border text-xs font-bold ${
                  readingMode
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Reading Mode (AA)"
              >
                <span>AA</span>
                <span className="opacity-60">{readingMode ? 'Reader On' : 'Standard'}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer border border-white/5"
                aria-label="Close article reader"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin select-text"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <p className="text-xs text-cyan-400/70 uppercase tracking-widest font-black animate-pulse">Running AI News Summarizer...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-sm space-y-4 max-w-md mx-auto my-12">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors border border-white/5"
                >
                  Close Reader
                </button>
              </div>
            ) : (
              <div className={readingMode ? 'max-w-2xl mx-auto py-2 space-y-6 font-serif' : 'lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0 space-y-8'}>
                
                {/* Column 1: Main Article content */}
                <div className={readingMode ? 'space-y-6' : 'lg:col-span-8 space-y-6'}>
                  
                  {/* Article Banner Image */}
                  {displayImage && (
                    <div className="relative w-full h-48 lg:h-64 rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
                      <img
                        src={displayImage}
                        alt={cleanTitle}
                        className="w-full h-full object-cover object-center transform hover:scale-[1.01] transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    </div>
                  )}

                  {/* Headline */}
                  <h1 className={`text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight ${readingMode ? 'font-serif font-extrabold' : 'font-sans'}`}>
                    {cleanTitle}
                  </h1>

                  {/* Byline metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50 border-b border-white/[0.06] pb-4 font-sans font-medium">
                    {articleDetails?.author && (
                      <span className="flex items-center gap-1.5 text-white/80">
                        <span className="text-cyan-400/80">🖋️</span>
                        <span>By {articleDetails.author}</span>
                      </span>
                    )}
                    <span className="text-white/20">•</span>
                    <span suppressHydrationWarning>Published {formatRelativeTime(activeEvent.publishedAt)}</span>
                    <span className="text-white/20">•</span>
                    <span className="italic">{publisher}</span>
                  </div>

                  {/* AI Story Summary - Bullet Points */}
                  {articleDetails?.keyFacts && articleDetails.keyFacts.length > 0 && (
                    <div
                      className="rounded-2xl p-5 border border-cyan-500/10 relative overflow-hidden bg-cyan-500/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] font-sans"
                      style={{ borderLeft: `4px solid ${categoryConfig.color}` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                          AI Key Takeaways
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <ul className="space-y-3.5">
                        {articleDetails.keyFacts.map((fact, idx) => {
                          const separatorIndex = fact.indexOf(':');
                          if (separatorIndex !== -1) {
                            const label = fact.substring(0, separatorIndex + 1);
                            const text = fact.substring(separatorIndex + 1);
                            return (
                              <li key={idx} className="flex items-start gap-3 text-xs lg:text-sm text-white/85 leading-relaxed font-medium">
                                <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-400" />
                                <span>
                                  <strong className="text-cyan-300 font-bold">{label}</strong>
                                  {text}
                                </span>
                              </li>
                            );
                          }
                          return (
                            <li key={idx} className="flex items-start gap-3 text-xs lg:text-sm text-white/80 leading-relaxed">
                              <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-400" />
                              <span>{fact}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* AI Summary Insight Description (Task 2 & 10) */}
                  {articleDetails?.aiSummary && (
                    <div className={`space-y-4 pt-2 ${readingMode ? 'text-lg text-white/90 font-serif leading-relaxed' : 'text-sm text-white/70 leading-relaxed font-sans'}`}>
                      <h3 className="text-xs font-black text-white/40 uppercase tracking-widest font-sans">Summary Overview</h3>
                      <div className="space-y-3">
                        {articleDetails.aiSummary.split('\n\n').map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Content Body */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest font-sans">Detailed Report</h3>
                    <div className={`space-y-4 ${readingMode ? 'text-lg lg:text-xl text-white/95 leading-relaxed font-serif' : 'text-sm text-white/70 leading-relaxed font-sans'}`}>
                      {articleBody.split('\n\n').map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Toolbar (Task 7) */}
                  <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/[0.06] font-sans">
                    <button
                      onClick={() => prevStory && setActiveEvent(prevStory)}
                      disabled={!prevStory}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/5 transition-all select-none ${
                        prevStory
                          ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer hover:border-white/10'
                          : 'opacity-30 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span>Prev Story</span>
                    </button>

                    <a
                      href={articleDetails?.source || activeEvent.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-[2] sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider
                                 bg-gradient-to-r from-cyan-500 to-blue-600
                                 text-white shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:scale-[1.02]
                                 transition-all duration-300 group cursor-pointer"
                    >
                      <span>Read Source on {publisher}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>

                    <button
                      onClick={() => nextStory && setActiveEvent(nextStory)}
                      disabled={!nextStory}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/5 transition-all select-none ${
                        nextStory
                          ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer hover:border-white/10'
                          : 'opacity-30 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <span>Next Story</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Column 2: Sidebar (hidden in Reading Mode) */}
                {!readingMode && (
                  <div className="lg:col-span-4 space-y-6 font-sans">
                    {/* Country Context Card */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-lg relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Country Context
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" role="img" aria-label="Flag">
                          {getFlagEmoji(activeEvent.country)}
                        </span>
                        <div>
                          <h2 className="text-lg font-extrabold text-white leading-tight">
                            {activeEvent.country}
                          </h2>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                            Discovered Nation
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/[0.05] pt-4 text-left">
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">Capital</span>
                          <span className="text-xs font-extrabold text-white">{countryDetails.capital}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">Population</span>
                          <span className="text-xs font-extrabold text-white">{countryDetails.population}</span>
                        </div>
                      </div>

                      {/* Dynamic Country Activity Score */}
                      <div className="space-y-2 border-t border-white/[0.05] pt-4">
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                          <span className="text-white/30">Activity Score</span>
                          <span className="text-cyan-400 font-extrabold">{countryDetails.activityScore}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${countryDetails.activityScore}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Badge Widget */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 relative overflow-hidden">
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Category Context
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoryConfig.emoji}</span>
                        <div>
                          <span className="text-sm font-extrabold block" style={{ color: categoryConfig.color }}>
                            {categoryConfig.label}
                          </span>
                          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                            Active Stream
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                        You are reading news categorised under <strong>{categoryConfig.label}</strong> for <strong>{activeEvent.country}</strong>. Select the icons at the footer or other sidebar updates to swap feeds.
                      </p>
                    </div>

                    {/* Related Stories list */}
                    {relatedStories.length > 0 && (
                      <div className="space-y-4 pt-2 text-left">
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          Related Brazil Stories
                        </div>
                        <div className="space-y-3">
                          {relatedStories.map((story) => {
                            const storyConfig = CATEGORY_MAP[story.category as EventCategory] || CATEGORY_MAP.breaking;
                            const { title: cleanStoryTitle, publisher: storyPublisher } = parsePublisher(story.title, story.source);
                            
                            return (
                              <div
                                key={story.id}
                                onClick={() => setActiveEvent(story)}
                                className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all cursor-pointer flex flex-col justify-between gap-3 text-left group"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1 text-[8px] font-black uppercase tracking-wider">
                                    <span style={{ color: storyConfig.color }}>
                                      {storyConfig.label}
                                    </span>
                                    <span className="text-white/30 truncate max-w-[80px]">
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
                  </div>
                )}

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
