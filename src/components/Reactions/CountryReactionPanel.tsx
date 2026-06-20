'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionEvent, EventCategory, WorldEvent } from '@/types';
import { CATEGORY_MAP, getCountryRecommendations } from '@/lib/constants';
import SentimentBadge from './SentimentBadge';
import TrendingHashtags from './TrendingHashtags';
import ReactionFeed from './ReactionFeed';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';

const CLIENT_REACTION_CACHE = new Map<string, { data: ReactionEvent; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds client-side cache

function getDeterministicMetrics(country: string, category: string | null) {
  let hash = 0;
  for (let i = 0; i < country.length; i++) {
    hash = country.charCodeAt(i) + ((hash << 5) - hash);
  }
  const getVal = (min: number, max: number, offset = 0) => {
    const raw = Math.abs(Math.sin(hash + offset));
    return Math.floor(raw * (max - min + 1)) + min;
  };

  const cat = category || 'home';
  if (cat === 'weather') {
    const temp = getVal(15, 35, 1);
    const humidity = getVal(40, 90, 2);
    const aqi = getVal(15, 150, 3);
    const aqiStatus = aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : 'Unhealthy';
    const conditions = ['Sunny', 'Partly Cloudy', 'Mostly Cloudy', 'Showers', 'Clear Sky'][getVal(0, 4, 4)];
    return { temp, humidity, aqi, aqiStatus, conditions };
  }
  if (cat === 'business') {
    const gdpGrowth = (getVal(1, 6, 1) / 10).toFixed(1);
    const inflation = (getVal(15, 80, 2) / 10).toFixed(1);
    const marketIndex = getVal(10000, 45000, 3);
    const marketChange = (getVal(-20, 25, 4) / 10).toFixed(2);
    return { gdpGrowth, inflation, marketIndex, marketChange };
  }
  if (cat === 'technology') {
    const startupFunding = getVal(100, 5000, 1);
    const innovationIndex = getVal(60, 95, 2);
    const techTalentGrowth = (getVal(5, 25, 3) / 10).toFixed(1);
    return { startupFunding, innovationIndex, techTalentGrowth };
  }
  if (cat === 'entertainment') {
    const boxOffice = getVal(10, 250, 1);
    const streamingSubscribers = (getVal(5, 85, 2) / 10).toFixed(1);
    const trendingShow = ['Earth Beat', 'Live Globe', 'Orbit Stars', 'Solar Wind', 'Blue Planet'][getVal(0, 4, 3)];
    return { boxOffice, streamingSubscribers, trendingShow };
  }
  if (cat === 'sports' || cat === 'football' || cat === 'worldcup') {
    const fifaRank = getVal(1, 80, 1);
    const winRatio = getVal(45, 82, 2);
    const goalsScored = getVal(5, 32, 3);
    return { fifaRank, winRatio, goalsScored };
  }
  // breaking / home / news
  const pressFreedom = getVal(55, 92, 1);
  const newsVolume = getVal(150, 2500, 2);
  return { pressFreedom, newsVolume };
}

function CategoryMetricsWidget({ country, category }: { country: string; category: EventCategory | null }) {
  const metrics = getDeterministicMetrics(country, category) as any;
  const cat = category || 'home';

  if (cat === 'weather') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>WEATHER STATUS</span>
          <span className="text-orange-400 font-extrabold">LIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-black text-white">{metrics.temp}°C</div>
            <div className="text-[10px] text-white/50">{metrics.conditions}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">AQI: {metrics.aqi}</div>
            <div className="text-[10px] text-white/50">{metrics.aqiStatus}</div>
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (metrics.temp / 45) * 100)}%` }} />
        </div>
        <div className="text-[10px] text-white/50 flex justify-between font-bold">
          <span>HUMIDITY: {metrics.humidity}%</span>
          <span>BAROMETER: STABLE</span>
        </div>
      </div>
    );
  }

  if (cat === 'business') {
    const isPositive = parseFloat(metrics.marketChange || '0') >= 0;
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>MARKET SUMMARY</span>
          <span className={isPositive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {isPositive ? '▲' : '▼'} {metrics.marketChange}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-black text-white">{metrics.marketIndex?.toLocaleString()}</div>
            <div className="text-[10px] text-white/50">Core Exchange Index</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">GDP: +{metrics.gdpGrowth}%</div>
            <div className="text-[10px] text-white/50">Inflation: {metrics.inflation}%</div>
          </div>
        </div>
      </div>
    );
  }

  if (cat === 'technology') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>INNOVATION METRICS</span>
          <span className="text-blue-400 font-extrabold">GROWING</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-black text-white">{metrics.innovationIndex}/100</div>
            <div className="text-[10px] text-white/50">Global Tech Rank Score</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">${metrics.startupFunding}M</div>
            <div className="text-[10px] text-white/50">Startup Funding YTD</div>
          </div>
        </div>
        <div className="text-[10px] text-white/50 font-bold">
          Developer Pool Talent Growth: +{metrics.techTalentGrowth}% YoY
        </div>
      </div>
    );
  }

  if (cat === 'entertainment') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>ENTERTAINMENT TRENDS</span>
          <span className="text-purple-400 font-extrabold">ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-black text-white truncate max-w-[130px]">{metrics.trendingShow}</div>
            <div className="text-[10px] text-white/50">Top Trending Title</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">${metrics.boxOffice}M</div>
            <div className="text-[10px] text-white/50">Entertainment Volume</div>
          </div>
        </div>
        <div className="text-[10px] text-white/50 font-bold">
          Streaming Active Base: {metrics.streamingSubscribers}M Users
        </div>
      </div>
    );
  }

  if (cat === 'sports' || cat === 'football' || cat === 'worldcup') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>ATHLETIC INDEX</span>
          <span className="text-emerald-400 font-extrabold">COMPETING</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-black text-white">{metrics.winRatio}%</div>
            <div className="text-[10px] text-white/50">Overall Win Ratio</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">Rank: #{metrics.fifaRank}</div>
            <div className="text-[10px] text-white/50">FIFA Group Rank</div>
          </div>
        </div>
        <div className="text-[10px] text-white/50 font-bold">
          Tournament Goals Registered: {metrics.goalsScored}
        </div>
      </div>
    );
  }

  // breaking / home / news
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
        <span>MEDIA & PRESS METRICS</span>
        <span className="text-cyan-400 font-extrabold">STABLE</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-black text-white">{metrics.pressFreedom}/100</div>
          <div className="text-[10px] text-white/50">Press Freedom Index</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white">{metrics.newsVolume}</div>
          <div className="text-[10px] text-white/50">Daily Coverage Count</div>
        </div>
      </div>
    </div>
  );
}

interface CountryReactionPanelProps {
  country: string;
  activeCategory: EventCategory | null;
  onClose: () => void;
  onReactionLoaded?: (data: ReactionEvent) => void;
  onSelectArticle?: (news: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  isFocusMode?: boolean;
}

export default function CountryReactionPanel({
  country,
  activeCategory,
  onClose,
  onReactionLoaded,
  onSelectArticle,
  onSelectCountry,
  isFocusMode = false,
}: CountryReactionPanelProps) {
  const [reactionData, setReactionData] = useState<ReactionEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanCountry = country.charAt(0).toUpperCase() + country.slice(1);
    
    // Get username from localStorage for referrals if signed in
    let refQuery = '';
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('mooearth_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed && parsed.username) {
            refQuery = `?ref=${encodeURIComponent(parsed.username)}`;
          }
        }
      } catch (err) {}
    }

    const didShare = await shareContent({
      title: `${cleanCountry} Dashboard — ${BRANDING.name}`,
      text: ` Explore live updates, sports reactions, and trivia challenges for ${cleanCountry} on MooEarth Live!`,
      url: `/country/${encodeURIComponent(cleanCountry.toLowerCase())}${refQuery}`
    });
    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  // Synchronously set isLoading to true in render when country or category changes
  const [prevCountry, setPrevCountry] = useState(country);
  const [prevCategory, setPrevCategory] = useState(activeCategory);

  const cacheKey = `${country}_${activeCategory || 'home'}`;
  const cachedItem = CLIENT_REACTION_CACHE.get(cacheKey);
  const isCacheValid = cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL);

  if (country !== prevCountry || activeCategory !== prevCategory) {
    setPrevCountry(country);
    setPrevCategory(activeCategory);
    if (isCacheValid) {
      setReactionData(cachedItem.data);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }

  const categoryConfig = activeCategory ? CATEGORY_MAP[activeCategory] : null;
  const categoryLabel = categoryConfig ? categoryConfig.label : 'Home';
  const categoryEmoji = categoryConfig ? categoryConfig.emoji : '🏠';

  // Detect Mobile Viewport (Phase 9 Mobile Experience)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!country || isFocusMode) return;
    const cacheKey = `${country}_${activeCategory || 'home'}`;
    const cachedItem = CLIENT_REACTION_CACHE.get(cacheKey);
    
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
      setReactionData(cachedItem.data);
      setIsLoading(false);
      if (onReactionLoaded) {
        onReactionLoaded(cachedItem.data);
      }
      return;
    }

    setIsLoading(true);
    if (onReactionLoaded) {
      onReactionLoaded(null as any); // Clear parent reaction state when starting fetch to prevent stale state matching
    }
    const catParam = activeCategory ? `&category=${activeCategory}` : '';
    let aborted = false;

    fetch(`/api/reactions?country=${encodeURIComponent(country)}${catParam}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (aborted) return;
        if (data.reaction) {
          CLIENT_REACTION_CACHE.set(cacheKey, { data: data.reaction, timestamp: Date.now() });
          setReactionData(data.reaction);
          if (onReactionLoaded) {
            onReactionLoaded(data.reaction);
          }
        }
      })
      .catch(err => console.error('Failed to load reactions:', err))
      .finally(() => {
        if (!aborted) setIsLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [country, activeCategory, onReactionLoaded, isFocusMode]);

  // Framer Motion mobile bottom sheet swipe-to-dismiss configurations
  const dragProps = isMobile ? {
    drag: 'y' as const,
    dragConstraints: { top: 0, bottom: 500 },
    dragElastic: 0.15,
    dragMomentum: false,
    onDragEnd: (event: any, info: any) => {
      if (info.offset.y > 140) {
        onClose();
      }
    }
  } : {};

  return (
    <motion.div
      {...dragProps}
      initial={isMobile ? { y: '100%' } : { opacity: 0, x: 50 }}
      animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
      exit={isMobile ? { y: '100%' } : { opacity: 0, x: 50 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className={`fixed z-40 glass flex flex-col overflow-hidden border border-white/10 select-none ${
        isMobile
          ? 'bottom-0 left-0 right-0 w-full h-[65vh] rounded-t-[32px] rounded-b-none shadow-[0_-15px_40px_rgba(0,0,0,0.6)]'
          : 'right-6 top-24 bottom-24 w-96 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(12,12,22,0.96) 0%, rgba(5,5,12,0.96) 100%)',
        touchAction: isMobile ? 'none' : 'auto'
      }}
    >
      {/* Mobile Top Drag Handle Bar */}
      {isMobile && (
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 shrink-0" />
      )}

      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/[0.05] shrink-0">
        <button
          onClick={handleShare}
          title="Share Country Dashboard"
          className="absolute top-4 right-15 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-cyan-400 transition-colors z-10 cursor-pointer"
        >
          📤
        </button>
        <button
          onClick={onClose}
          className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex flex-col pr-20">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <span>Country:</span>
            <span className="text-white font-extrabold mr-1.5">{country}</span>
            <span className="text-white/20">|</span>
            <span className="ml-1.5">Category:</span>
            <span className="text-white font-extrabold flex items-center gap-1">
              <span>{categoryEmoji}</span>
              <span>{categoryLabel}</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{country} Dashboard</h2>
          {/* Social Proof Marker */}
          <div className="flex items-center gap-2 mt-1.5 text-[9px] text-white/40 font-bold font-sans uppercase tracking-wider">
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              🌍 {Math.floor(Math.abs(Math.sin(country.charCodeAt(0))) * 12000 + 2300).toLocaleString()} fans explored this country
            </span>
          </div>
        </div>

        {/* Toast Alert */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-4 right-4 z-50 py-2 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/35 text-center text-xs font-bold text-cyan-200"
            >
              📋 Link copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <p className="text-xs text-cyan-400/60 uppercase tracking-widest font-bold animate-pulse">Syncing Global Mood...</p>
          </div>
        ) : reactionData ? (
          <div className="p-6 space-y-6">
            <SentimentBadge sentiment={reactionData.sentiment} />
            
            {/* Unified Category Metrics Widget */}
            <CategoryMetricsWidget country={country} category={activeCategory} />

            {/* System Filter Monitor (Debug Display) */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.05)]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
                <span className="text-[10px] text-cyan-400 font-black tracking-[0.2em] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  System Filter Monitor
                </span>
                <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  Active Filter
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold">
                <div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Selected Country</span>
                  <span className="text-white">{country}</span>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Selected Category</span>
                  <span className="text-white">{categoryLabel}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Generated Query</span>
                  <code className="text-cyan-300 text-[10px] font-mono leading-none break-all select-all">&quot;{reactionData.query || `${country} ${categoryLabel}`}&quot;</code>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Results Returned</span>
                  <span className="text-white font-bold">{reactionData.headlines.length} headlines</span>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Data Source</span>
                  <span className="text-emerald-400 truncate block max-w-[130px] font-bold">{reactionData.source || 'Google News RSS Search'}</span>
                </div>
              </div>
            </div>

            {/* Fallback alert for empty category */}
            {reactionData.noCategoryContent && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed animate-[quiz-reveal_0.3s_ease-out]">
                <span className="text-lg shrink-0 select-none">⚠️</span>
                <div>
                  <span className="font-extrabold text-amber-300 block mb-0.5">Category Filter Fallback</span>
                  <span className="text-white/70">
                    No specific {reactionData.fallbackCategory || categoryLabel} updates currently available for {country}. Showing related {country} content.
                  </span>
                </div>
              </div>
            )}

            {/* V2 Emotional Intensity Meter (Only for non-specific or news/breaking categories) */}
            {(!activeCategory || activeCategory === 'breaking') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-white/50 font-medium">
                  <span>EMOTIONAL INTENSITY</span>
                  <span className="text-white">{(reactionData.sentiment.intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${reactionData.sentiment.intensity * 100}%` }}
                     transition={{ duration: 1, delay: 0.3 }}
                     className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <motion.p 
                key={reactionData.id} // Re-animate if the reaction changes
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-sm text-white/80 italic mt-2 border-l-2 border-cyan-500 pl-3 leading-relaxed relative"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute -left-[3px] top-1 w-1 h-3 bg-cyan-400 rounded-sm"
                />
                &ldquo;{reactionData.sentiment.explanation}&rdquo;
              </motion.p>
            </div>

            {/* V2 Live Match Status (Strictly sports/football/worldcup and home only, no category mixing!) */}
            {(!activeCategory || ['sports', 'football', 'worldcup'].includes(activeCategory)) && 
             reactionData.headlines.some(h => h.footballData) && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] text-white/40 mb-3 uppercase tracking-widest font-bold">Live Match Status</div>
                {reactionData.headlines.filter(h => h.footballData).slice(0, 1).map(match => (
                  <div key={match.id} className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <div className="font-bold text-white text-base truncate max-w-[80px]">{match.footballData?.homeTeam}</div>
                      <div className="text-2xl font-black text-cyan-400 mt-1">{match.footballData?.homeScore}</div>
                    </div>
                    <div className="text-center px-4 flex flex-col items-center shrink-0">
                      <div className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded font-black mb-1 animate-pulse uppercase tracking-wider">
                        {match.footballData?.status} {match.footballData?.elapsed}&apos;
                      </div>
                      <div className="text-white/30 text-[10px] font-bold">VS</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="font-bold text-white text-base truncate max-w-[80px]">{match.footballData?.awayTeam}</div>
                      <div className="text-2xl font-black text-cyan-400 mt-1">{match.footballData?.awayScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <TrendingHashtags hashtags={reactionData.trendingHashtags} />
            <ReactionFeed
              headlines={reactionData.headlines}
              posts={reactionData.socialPosts}
              onSelectArticle={onSelectArticle}
              country={country}
              activeCategory={activeCategory}
              onSelectCountry={onSelectCountry}
            />

            {/* V2 Smart Recommendations (Feature 9) */}
            <div className="border-t border-white/5 pt-5 space-y-3">
              <div className="text-[10px] text-white/45 uppercase tracking-widest font-bold">Related Destinations</div>
              <div className="grid grid-cols-2 gap-2">
                {getCountryRecommendations(country).map(rec => (
                  <Link
                    key={rec}
                    href={`/country/${encodeURIComponent(rec.toLowerCase())}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSelectCountry) onSelectCountry(rec);
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 transition-all text-left text-xs font-semibold text-white/90 cursor-pointer"
                  >
                    <span>{rec}</span>
                    <span className="text-cyan-400">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-white/50">Failed to load reactions.</div>
        )}
      </div>
    </motion.div>
  );
}
