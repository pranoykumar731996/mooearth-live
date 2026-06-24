'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { WorldEvent, EventCategory, ReactionEvent, PlayEarthMode } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import TrendingHashtags from '../Reactions/TrendingHashtags';
import ReactionFeed from '../Reactions/ReactionFeed';
import PlayEarthOverlay from '../Globe/PlayEarthOverlay';
import ArticleViewer from '../Reactions/ArticleViewer';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { matchCountry } from '@/data/questions';
import { isCountryWhitelisted } from '@/config/publishers';
import { CountryFlag } from './CountryFlag';
import dynamic from 'next/dynamic';
import { getRealFifaRank, getRealWinRatio, getRealGoalsScored } from '@/data/fifaRankings';

const PerspectiveLensModal = dynamic(() => import('@/components/UI/PerspectiveLensModal'), { ssr: false });

// Categories mapping helper
const MOBILE_CATEGORIES: { id: string; label: string; emoji: string; categoryValue: EventCategory | 'play_earth' | 'discovery' }[] = [
  { id: 'discovery', label: 'Discovery', emoji: '🌍', categoryValue: 'discovery' },
  { id: 'news', label: 'News', emoji: '📰', categoryValue: 'breaking' },
  { id: 'sports', label: 'Sports', emoji: '⚽', categoryValue: 'sports' },
  { id: 'worldcup', label: 'FIFA World Cup', emoji: '🏆', categoryValue: 'football' },
  { id: 'tech', label: 'Technology', emoji: '💻', categoryValue: 'technology' },
  { id: 'weather', label: 'Weather', emoji: '🌦', categoryValue: 'weather' },
  { id: 'business', label: 'Business', emoji: '💼', categoryValue: 'business' },
  { id: 'ent', label: 'Entertainment', emoji: '🎬', categoryValue: 'entertainment' },
  { id: 'play', label: 'Play Earth', emoji: '🎮', categoryValue: 'play_earth' },
];

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
    const fifaRank = getRealFifaRank(country);
    const winRatio = getRealWinRatio(fifaRank);
    const goalsScored = getRealGoalsScored(fifaRank);
    return { fifaRank, winRatio, goalsScored };
  }
  // breaking / home / news
  const pressFreedom = getVal(55, 92, 1);
  const newsVolume = getVal(150, 2500, 2);
  return { pressFreedom, newsVolume };
}

function CategoryMetricsWidget({ country, category }: { country: string; category: string | null }) {
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
    const hasRank = typeof metrics.fifaRank === 'number' && metrics.fifaRank > 0;
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex justify-between">
          <span>ATHLETIC INDEX</span>
          <span className="text-emerald-400 font-extrabold">COMPETING</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-black text-white">{hasRank ? `${metrics.winRatio}%` : 'N/A'}</div>
            <div className="text-[10px] text-white/50">Overall Win Ratio</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">
              {hasRank ? `Rank: #${metrics.fifaRank}` : 'Ranking unavailable'}
            </div>
            <div className="text-[10px] text-white/50">FIFA Group Rank</div>
          </div>
        </div>
        <div className="text-[10px] text-white/50 font-bold">
          Tournament Goals Registered: {hasRank ? metrics.goalsScored : 'N/A'}
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

interface MobileCountrySheetProps {
  country: string;
  onClose: () => void;
  activeCategory: EventCategory | null;
  onCategoryChange: (category: EventCategory | null) => void;
  activeArticle: WorldEvent | null;
  onSelectArticle: (article: WorldEvent | null) => void;
  isPlayEarthActive: boolean;
  onTogglePlayEarth: (active: boolean) => void;
  allEvents: WorldEvent[];
  username: string;
  onPlaySound: () => void;
  onCorrectSound: () => void;
  onWrongSound: () => void;
  onTimerTick: (urgency: number) => void;
  onLevelUp: () => void;
  onReactionLoaded?: (reaction: ReactionEvent | null) => void;
  isFocusMode?: boolean;
  onUploadClick?: () => void;
}

type SheetHeightState = 'collapsed' | 'half' | 'full';

export default function MobileCountrySheet({
  country,
  onClose,
  activeCategory,
  onCategoryChange,
  activeArticle,
  onSelectArticle,
  isPlayEarthActive,
  onTogglePlayEarth,
  allEvents,
  username,
  onPlaySound,
  onCorrectSound,
  onWrongSound,
  onTimerTick,
  onLevelUp,
  onReactionLoaded,
  isFocusMode = false,
  onUploadClick,
}: MobileCountrySheetProps) {
  const [sheetState, setSheetState] = useState<SheetHeightState>('half');
  const [reactionData, setReactionData] = useState<ReactionEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dragControls = useDragControls();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [launchMode, setLaunchMode] = useState<PlayEarthMode | null>(null);
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);
  const [showDebugMonitor, setShowDebugMonitor] = useState(true);
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

  const handleLaunchMode = (mode: PlayEarthMode) => {
    onPlaySound();
    setLaunchMode(mode);
    onTogglePlayEarth(true);
  };

  const countryMeta = findCountryMeta(country);

  useEffect(() => {
    if (!country) return;
    const cat = isPlayEarthActive ? 'sports' : (activeCategory || 'breaking');
    const catParam = `&category=${cat}`;
    setIsLoading(true);
    if (onReactionLoaded) {
      onReactionLoaded(null);
    }

    let aborted = false;
    fetch(`/api/reactions?country=${encodeURIComponent(country)}${catParam}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (aborted) return;
        if (data.reaction) {
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
  }, [country, activeCategory, isPlayEarthActive, onReactionLoaded]);

  // Adjust sheetState if article opens or game starts
  useEffect(() => {
    if (activeArticle || isPlayEarthActive) {
      setSheetState('full');
    }
  }, [activeArticle, isPlayEarthActive]);

  // Map sheetState to translateY value
  // Using fixed percentage heights: collapsed=20vh, half=50vh, full=80vh
  // Sheet container is 80vh tall, positioned at bottom.
  // translateY moves it down to show only the desired portion.
  const getTranslateY = () => {
    if (sheetState === 'collapsed') return 'calc(80vh - 20vh)'; // shows 20vh
    if (sheetState === 'half') return 'calc(80vh - 50vh)';       // shows 50vh
    return '0px';                                                 // shows 80vh
  };

  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    const threshold = 60;

    if (sheetState === 'collapsed') {
      if (offset < -threshold || velocity < -500) {
        setSheetState('half');
      } else if (offset > threshold || velocity > 500) {
        onClose();
      }
    } else if (sheetState === 'half') {
      if (offset < -threshold || velocity < -500) {
        setSheetState('full');
      } else if (offset > threshold || velocity > 500) {
        setSheetState('collapsed');
      }
    } else if (sheetState === 'full') {
      if (offset > threshold || velocity > 500) {
        setSheetState('half');
      }
    }
  };

  const handleTabClick = (tabVal: EventCategory | 'play_earth' | 'discovery') => {
    onPlaySound();
    if (tabVal === 'play_earth') {
      setLaunchMode(null);
      onTogglePlayEarth(true);
    } else if (tabVal === 'discovery') {
      onTogglePlayEarth(false);
      onCategoryChange(null);
    } else {
      onTogglePlayEarth(false);
      onCategoryChange(tabVal);
    }
    if (sheetState === 'collapsed') {
      setSheetState('half');
    }
  };

  // Quick summary render for collapsed state
  const renderQuickSummary = () => {
    if (!countryMeta) return null;
    return (
      <div className="space-y-2 mt-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-wider">
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white">
            🏛️ {countryMeta.capital}
          </span>
          <span>•</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white">
            🌍 {countryMeta.continent}
          </span>
          <span>•</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white">
            👥 {countryMeta.population}
          </span>
        </div>
        <p className="text-[10px] text-cyan-400/80 leading-snug italic font-medium">
          💡 {countryMeta.funFact}
        </p>
      </div>
    );
  };

  // Render Earth Discovery dashboard (V7)
  const renderDiscoveryDashboard = () => {
    const weatherMetrics = getDeterministicMetrics(country, 'weather') as any;
    const sportsMetrics = getDeterministicMetrics(country, 'sports') as any;
    
    // Find headlines for this country
    const countryEvents = allEvents.filter(e => matchCountry(e.country, country));
    const topHeadline = countryEvents[0];

    return (
      <div className="space-y-6 animate-[quiz-reveal_0.3s_ease-out]">
        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">🏛️ Capital</span>
            <div className="text-sm font-black text-white">{countryMeta?.capital || 'N/A'}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">👥 Population</span>
            <div className="text-sm font-black text-white">{countryMeta?.population || 'N/A'}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">🗣️ Language</span>
            <div className="text-sm font-black text-white truncate">{countryMeta?.language || 'N/A'}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">💰 Currency</span>
            <div className="text-sm font-black text-white truncate">{countryMeta?.currency || 'N/A'}</div>
          </div>
        </div>

        {/* Dynamic Context Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Weather Widget snippet */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">🌦️ Local Weather</span>
              <span className="text-[8px] bg-cyan-400/20 text-cyan-200 px-1.5 py-0.5 rounded font-black">STABLE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{weatherMetrics.temp}°C</span>
              <span className="text-[10px] text-white/50">{weatherMetrics.conditions}</span>
            </div>
            <p className="text-[9px] text-white/40 font-bold uppercase">AQI: {weatherMetrics.aqi} ({weatherMetrics.aqiStatus})</p>
          </div>

          {/* Sports Widget snippet */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">⚽ Sports & Athletics</span>
              <span className="text-[8px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded font-black">{countryMeta?.sport || 'Football'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">#{sportsMetrics.fifaRank}</span>
              <span className="text-[10px] text-white/50">FIFA Ranking</span>
            </div>
            <p className="text-[9px] text-white/40 font-bold uppercase">Win Ratio: {sportsMetrics.winRatio}% • Goals: {sportsMetrics.goalsScored}</p>
          </div>
        </div>

        {/* Fun Fact Banner */}
        {countryMeta?.funFact && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
            <span className="text-2xl select-none">💡</span>
            <div>
              <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Did you know?</h4>
              <p className="text-xs text-white/80 leading-relaxed font-medium mt-0.5">{countryMeta.funFact}</p>
            </div>
          </div>
        )}

        {/* Top Headline News snippet */}
        {topHeadline ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">📰 Top Headline</span>
            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{topHeadline.title}</h4>
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-[9px] text-white/40">{topHeadline.source}</span>
              <button 
                onClick={() => onSelectArticle(topHeadline)}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-0.5"
              >
                Read Article →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center text-[10px] text-white/30 font-bold uppercase py-6">
            No active headlines in this region.
          </div>
        )}

        {/* PLAY EARTH GAME CHALLENGES */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Play Earth Challenges</h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Country Explorer */}
            <button
              onClick={() => handleLaunchMode('explorer')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🌍</span>
              <span className="text-xs font-black text-white">Country Explorer</span>
              <span className="text-[8px] text-white/40 leading-snug">Answer trivia about {country}.</span>
            </button>

            {/* Capital Challenge */}
            <button
              onClick={() => handleLaunchMode('capital')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🏙️</span>
              <span className="text-xs font-black text-white">Capitals Test</span>
              <span className="text-[8px] text-white/40 leading-snug">Match sovereign capital cities.</span>
            </button>

            {/* Flag Challenge */}
            <button
              onClick={() => handleLaunchMode('flag')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🚩</span>
              <span className="text-xs font-black text-white">Flag Blitz</span>
              <span className="text-[8px] text-white/40 leading-snug">Test your national flag knowledge.</span>
            </button>

            {/* Survival Mode */}
            <button
              onClick={() => handleLaunchMode('survival')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🔥</span>
              <span className="text-xs font-black text-white">Survival Mode</span>
              <span className="text-[8px] text-white/40 leading-snug">Answer wrong & game over!</span>
            </button>

            {/* Beat the clock */}
            <button
              onClick={() => handleLaunchMode('clock')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">⏱️</span>
              <span className="text-xs font-black text-white">Beat The Clock</span>
              <span className="text-[8px] text-white/40 leading-snug">Fast-paced countdown blitz.</span>
            </button>

            {/* World Cup */}
            <button
              onClick={() => handleLaunchMode('worldcup')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
              <span className="text-xs font-black text-white">World Cup</span>
              <span className="text-[8px] text-white/40 leading-snug">FIFA tournament history trivia.</span>
            </button>
          </div>

          {/* Daily Global Challenge */}
          <button
            onClick={() => handleLaunchMode('daily')}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:from-amber-500/30 hover:to-orange-500/30 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.1)]"
          >
            📆 PLAY DAILY EARTH CHALLENGE
          </button>
        </div>
      </div>
    );
  };

  const currentActiveTabValue = isPlayEarthActive 
    ? 'play_earth' 
    : (activeCategory === null ? 'discovery' : activeCategory);

  return (
    <motion.div
      initial={{ y: '80vh' }}
      animate={{ y: getTranslateY() }}
      exit={{ y: '80vh' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight * 0.80 : 600 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className="fixed bottom-0 left-0 right-0 w-full h-[80vh] z-40 glass rounded-t-[32px] rounded-b-none border-t border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden pointer-events-auto select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(12,12,22,0.97) 0%, rgba(5,5,12,0.97) 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Drag handle & Header bar */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="shrink-0 cursor-grab active:cursor-grabbing hover:bg-white/[0.01] transition-colors py-2"
      >
        {/* Top visual handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />
        
        {/* Title elements */}
        <div className="px-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CountryFlag flag={countryMeta?.flag} className="w-8 h-6 object-cover rounded-[3px] shadow-sm shrink-0" />
            <div>
              <h3 className="text-base font-black text-white leading-tight flex items-center gap-2">
                <span>{country}</span>
              </h3>
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">
                {countryMeta?.continent} • Capital: {countryMeta?.capital}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/40 text-white font-bold text-[9px] tracking-wider active:scale-95 transition-all cursor-pointer shadow-[0_0_10px_rgba(230,64,251,0.2)]"
                title="Upload Reaction"
              >
                📣 REACT
              </button>
            )}
            <button
              onClick={() => {
                onPlaySound();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/55 hover:bg-white/10 cursor-pointer"
              title="Close bottom sheet"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs (sticky at top, scrollable horizontally) */}
      <div 
        className="sticky top-0 bg-black/60 backdrop-blur-md border-b border-white/[0.05] py-2 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 shrink-0 z-20"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {MOBILE_CATEGORIES.map((tab) => {
          const isActiveTab = currentActiveTabValue === tab.categoryValue;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.categoryValue)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActiveTab
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main content scroll container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin space-y-5"
      >
        {/* State 1: Collapsed Summary */}
        {sheetState === 'collapsed' && (
          <div className="animate-[quiz-reveal_0.3s_ease-out]">
            {renderQuickSummary()}
          </div>
        )}

        {/* State 2 & 3 Content */}
        {sheetState !== 'collapsed' && (
          <div className="space-y-5">
            {isPlayEarthActive ? (
              /* Play Earth quiz mode content */
              <PlayEarthOverlay
                isActive={isPlayEarthActive}
                selectedCountry={country}
                onClose={onClose}
                onPlaySound={onPlaySound}
                onCorrectSound={onCorrectSound}
                onWrongSound={onWrongSound}
                onTimerTick={onTimerTick}
                onLevelUp={onLevelUp}
                username={username}
                isInline={true}
                initialMode={launchMode}
              />
            ) : activeArticle ? (
              /* Inline Article Reader inside bottom sheet */
              <ArticleViewer
                event={activeArticle}
                allEvents={allEvents}
                onClose={() => onSelectArticle(null)}
                isInline={true}
                onBack={() => onSelectArticle(null)}
              />
            ) : currentActiveTabValue === 'discovery' ? (
              /* Earth Discovery Mode Dashboard (V7) */
              renderDiscoveryDashboard()
            ) : (
              /* Standard News/Reaction Category Feed */
              <div className="space-y-5 animate-[quiz-reveal_0.3s_ease-out]">
                {/* Metrics specific to selected category */}
                <CategoryMetricsWidget country={country} category={activeCategory} />

                {/* Perspective Lens Promo Card */}
                {isCountryWhitelisted(country) && (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 shadow-lg relative overflow-hidden space-y-3">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase flex items-center gap-1">
                        <span>🧠</span>
                        <span>Perspective Lens</span>
                      </span>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        Compare Framing
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      Compare how domestic media in {country} and global publishers cover major stories.
                    </p>
                    <button
                      onClick={() => setIsPerspectiveOpen(true)}
                      className="w-full py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs transition-all cursor-pointer border border-indigo-500/30 hover:border-indigo-500/50"
                    >
                      🧠 Compare Local vs Global News
                    </button>
                  </div>
                )}
                
                {/* System Filter Monitor (Debug Display) */}
                {showDebugMonitor && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.05)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
                      <span className="text-[10px] text-cyan-400 font-black tracking-[0.2em] uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        System Filter Monitor
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                          Active Filter
                        </span>
                        <button
                          onClick={() => setIsDebugCollapsed(!isDebugCollapsed)}
                          className="text-cyan-400 hover:text-white transition-colors p-0.5 hover:bg-cyan-500/10 rounded text-[9px] font-bold leading-none cursor-pointer"
                          title={isDebugCollapsed ? "Expand" : "Collapse"}
                        >
                          {isDebugCollapsed ? '➕' : '➖'}
                        </button>
                        <button
                          onClick={() => setShowDebugMonitor(false)}
                          className="text-cyan-400 hover:text-red-400 transition-colors p-0.5 hover:bg-cyan-500/10 rounded text-[9px] font-bold leading-none cursor-pointer"
                          title="Close Monitor"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {!isDebugCollapsed && (
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold">
                        <div>
                          <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Selected Country</span>
                          <span className="text-white">{country}</span>
                        </div>
                        <div>
                          <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Selected Category</span>
                          <span className="text-white">{MOBILE_CATEGORIES.find(c => c.categoryValue === activeCategory)?.label || 'Home'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Generated Query</span>
                          <code className="text-cyan-300 text-[10px] font-mono leading-none break-all select-all">&quot;{reactionData?.query || `${country} News`}&quot;</code>
                        </div>
                        <div>
                          <span className="text-white/40 text-[9px] uppercase tracking-wider block font-bold">Results Returned</span>
                          <span className="text-white font-bold">{reactionData?.headlines.length || 0} headlines</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {reactionData?.noCategoryContent && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed animate-[quiz-reveal_0.3s_ease-out]">
                    <span className="text-lg shrink-0 select-none">⚠️</span>
                    <div>
                      <span className="font-extrabold text-amber-300 block mb-0.5">Category Filter Fallback</span>
                      <span className="text-white/70">
                        No specific {reactionData.fallbackCategory || MOBILE_CATEGORIES.find(c => c.categoryValue === activeCategory)?.label || 'News'} updates currently available for {country}. Showing related {country} content.
                      </span>
                    </div>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest font-bold animate-pulse">Syncing feed...</p>
                  </div>
                ) : reactionData ? (
                  <div className="space-y-5">
                    {/* Render Full expanded elements only in State 3 */}
                    {sheetState === 'full' && (
                      <>
                        {/* <SentimentBadge sentiment={reactionData.sentiment} /> */}
                        
                        {/* Emotional intensity progress bar */}
                        {/* <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-white/50 font-medium">
                            <span>EMOTIONAL INTENSITY</span>
                            <span className="text-white">{(reactionData.sentiment.intensity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" 
                              style={{ width: `${reactionData.sentiment.intensity * 100}%` }}
                            />
                          </div>
                        </div> */}

                        <TrendingHashtags hashtags={reactionData.trendingHashtags} />
                      </>
                    )}

                    {/* Headline and social feeds */}
                    <ReactionFeed
                      headlines={reactionData.headlines}
                      posts={reactionData.socialPosts}
                      onSelectArticle={onSelectArticle}
                      country={country}
                      activeCategory={activeCategory}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-white/30">Failed to load content.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isPerspectiveOpen && (
        <PerspectiveLensModal
          isOpen={isPerspectiveOpen}
          onClose={() => setIsPerspectiveOpen(false)}
          country={country}
          topic={
            reactionData?.headlines[0]?.title
              ? (reactionData.headlines[0].title.split(' - ')[0] || reactionData.headlines[0].title)
              : `${country} developments`
          }
          category={activeCategory || 'news'}
        />
      )}
    </motion.div>
  );
}
