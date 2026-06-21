'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SessionAnalytics } from '@/services/analytics';
import { BRANDING } from '@/config/branding';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  or: 'Odia (ଓଡ଼ିଆ)',
  bn: 'Bengali (বাংলা)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic'
};

// --- MOCK SIMULATION DATA GENERATOR ---
const generateSimulationData = (): SessionAnalytics[] => {
  const sources = ['direct', 'google', 'bing', 'x', 'facebook', 'chatgpt', 'perplexity', 'gemini', 'copilot', 'reddit'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const countries = ['Brazil', 'Japan', 'India', 'Germany', 'USA', 'Argentina', 'Canada', 'Mexico', 'France', 'United Kingdom', 'South Korea', 'Australia', 'Morocco', 'Senegal', 'Spain', 'Italy'];
  const categories = ['breaking', 'sports', 'football', 'worldcup', 'weather', 'business', 'technology', 'entertainment', 'play_earth'];
  const searchQueries = ['brazil news', 'japan football', 'world cup 2026 schedule', 'india weather', 'argentina football news', 'mooearth live', 'tokyo news', 'london sports', 'weather alerts', 'fifa schedule'];

  const sessions: SessionAnalytics[] = [];
  const now = Date.now();

  for (let i = 0; i < 48; i++) {
    const isNew = Math.random() > 0.4;
    const createdAt = now - (Math.random() * 86400000 * 3); // last 3 days
    const duration = Math.floor(60 + Math.random() * 1200); // 1 to 20 minutes
    const lastActiveAt = createdAt + (duration * 1000);
    const trafficSource = sources[Math.floor(Math.random() * sources.length)];
    const deviceType = devices[Math.floor(Math.random() * devices.length)];
    const sessionId = `sess_sim_${i}_${Math.random().toString(36).substring(2, 7)}`;
    const userId = isNew ? `usr_sim_${i}` : `usr_sim_${Math.floor(Math.random() * 15)}`;

    // Country clicks
    const countryClicks: Record<string, number> = {};
    const clickedCount = Math.floor(Math.random() * 6);
    for (let c = 0; c < clickedCount; c++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      countryClicks[country] = (countryClicks[country] || 0) + Math.floor(Math.random() * 3) + 1;
    }

    // Category clicks
    const categoryClicks: Record<string, number> = {};
    const categoryCount = Math.floor(Math.random() * 5);
    for (let cat = 0; cat < categoryCount; cat++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      categoryClicks[category] = (categoryClicks[category] || 0) + Math.floor(Math.random() * 4) + 1;
    }

    // Play Earth quiz stats
    const playEarthAnswered = Math.floor(Math.random() * 8);
    const playEarthCorrect = Math.floor(playEarthAnswered * (0.4 + Math.random() * 0.5));
    const playEarthWrong = playEarthAnswered - playEarthCorrect;
    const playEarthCompletions = playEarthAnswered > 0 && Math.random() > 0.5 ? 1 : 0;
    const quizCats = playEarthAnswered > 0 ? ['geography', 'history', 'sports'].slice(0, Math.floor(Math.random() * 3) + 1) : [];
    const quizCountries = playEarthAnswered > 0 ? [countries[Math.floor(Math.random() * countries.length)]] : [];

    // Search stats
    const searchCount = Math.floor(Math.random() * 4);
    const queries: string[] = [];
    let successCount = 0;
    let failCount = 0;
    const countrySearches: string[] = [];
    for (let s = 0; s < searchCount; s++) {
      const q = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      queries.push(q);
      if (Math.random() > 0.25) {
        successCount++;
        countrySearches.push(countries[Math.floor(Math.random() * countries.length)]);
      } else {
        failCount++;
      }
    }

    // Article views
    const articleClicks = Math.floor(Math.random() * 5);
    const articleOpens = articleClicks + Math.floor(Math.random() * 2);
    const sourceClicks = Math.floor(articleClicks * Math.random() * 0.5);
    const relatedClicks = Math.floor(articleClicks * Math.random() * 0.6);
    const completedCount = Math.floor(articleClicks * Math.random() * 0.7);
    const readArticleIds = Array.from({ length: articleClicks }, (_, idx) => `art_${idx + 1}`);

    // Globe interaction
    const rotations = Math.floor(Math.random() * 15) + 2;
    const zooms = Math.floor(Math.random() * 10) + 1;
    const taps = clickedCount;
    const hovers = Math.floor(Math.random() * 30) + 5;
    const directoryUsage = Math.random() > 0.7 ? 1 : 0;

    // Reaction uploads
    const uPhoto = Math.random() > 0.85 ? 1 : 0;
    const uVideo = Math.random() > 0.93 ? 1 : 0;
    const uVoice = Math.random() > 0.90 ? 1 : 0;
    const uFailures = (uPhoto + uVideo + uVoice) > 0 && Math.random() > 0.8 ? 1 : 0;

    // EarthCast
    const ecStarted = Math.random() > 0.75 ? 1 : 0;
    const ecCompleted = ecStarted && Math.random() > 0.6 ? 1 : 0;
    const ecDuration = ecStarted ? Math.floor(10 + Math.random() * 120) : 0;

    // Translation simulation stats
    const tOpens = Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
    const tLanguages: Record<string, number> = {};
    let tSuccess = 0;
    let tFail = 0;
    const tArticleIds: string[] = [];
    const tCountries: Record<string, number> = {};
    
    if (tOpens > 0) {
      const selectedLangs = ['hi', 'or', 'es', 'fr', 'ja', 'zh'].slice(0, tOpens);
      selectedLangs.forEach(lang => {
        tLanguages[lang] = (tLanguages[lang] || 0) + 1;
        if (Math.random() > 0.15) {
          tSuccess++;
          tArticleIds.push(`art_${Math.floor(Math.random() * 5) + 1}`);
          const c = countries[Math.floor(Math.random() * countries.length)];
          tCountries[c] = (tCountries[c] || 0) + 1;
        } else {
          tFail++;
        }
      });
    }

    sessions.push({
      sessionId,
      userId,
      deviceType,
      trafficSource,
      referrer: trafficSource === 'direct' ? 'direct' : `https://${trafficSource}.com/search`,
      createdAt,
      lastActiveAt,
      isNew,
      countryClicks,
      categoryClicks,
      playEarth: {
        correct: playEarthCorrect,
        wrong: playEarthWrong,
        answered: playEarthAnswered,
        completions: playEarthCompletions,
        categories: quizCats,
        countries: quizCountries
      },
      search: {
        queries,
        successCount,
        failCount,
        countrySearches,
        categorySearches: []
      },
      article: {
        clicks: articleClicks,
        opens: articleOpens,
        sourceClicks,
        relatedClicks,
        completedCount,
        readArticleIds
      },
      globe: {
        rotations,
        zooms,
        taps,
        hovers,
        directoryUsage
      },
      uploads: {
        photos: uPhoto,
        videos: uVideo,
        voice: uVoice,
        failures: uFailures
      },
      earthcast: {
        started: ecStarted,
        completed: ecCompleted,
        duration: ecDuration
      },
      translation: {
        opens: tOpens,
        languages: tLanguages,
        successCount: tSuccess,
        failCount: tFail,
        translatedArticleIds: tArticleIds,
        translatedCountries: tCountries
      }
    });
  }

  return sessions;
};

export default function AdminAnalyticsPage() {
  const [sessions, setSessions] = useState<SessionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [activeCountryTier, setActiveCountryTier] = useState<10 | 25 | 50>(10);
  const [dbError, setDbError] = useState<string | null>(null);

  // Fetch Firestore sessions
  const loadSessions = async (forceSim = false) => {
    setLoading(true);
    setDbError(null);
    if (forceSim) {
      setSessions(generateSimulationData());
      setIsSimulationMode(true);
      setLoading(false);
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'sessions'));
      const fetched: SessionAnalytics[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push(doc.data() as SessionAnalytics);
      });

      if (fetched.length === 0) {
        // Fallback to simulation data if Firestore is empty
        setSessions(generateSimulationData());
        setIsSimulationMode(true);
      } else {
        setSessions(fetched);
        setIsSimulationMode(false);
      }
    } catch (err: any) {
      console.warn('Failed to load sessions from Firestore, falling back to simulated data.', err);
      setDbError(err.message || 'Firebase Connection Error');
      setSessions(generateSimulationData());
      setIsSimulationMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // --- KPI COMPUTATIONS ---
  const aggregatedStats = useMemo(() => {
    if (sessions.length === 0) return null;

    let totalDuration = 0;
    const uniqueUsers = new Set<string>();
    let newUsersCount = 0;
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const sourceCounts: Record<string, number> = {};

    // Heatmaps/Distributions
    const countryClicks: Record<string, number> = {};
    const categoryClicks: Record<string, number> = {};

    // Play Earth Quiz
    let quizAnswered = 0;
    let quizCorrect = 0;
    let quizWrong = 0;
    let quizCompletions = 0;
    const quizCats = new Set<string>();
    const quizCountries = new Set<string>();

    // Search Telemetry
    const queryFrequency: Record<string, number> = {};
    let searchSuccess = 0;
    let searchFail = 0;
    const failedQueries = new Set<string>();

    // Article Reader
    let articleClicks = 0;
    let articleOpens = 0;
    let articleSourceClicks = 0;
    let articleRelatedClicks = 0;
    let articleCompletions = 0;

    // WebGL Globe
    let globeRotations = 0;
    let globeZooms = 0;
    let globeTaps = 0;
    let globeHovers = 0;
    let globeDirectoryUse = 0;

    // Uploads
    let uploadPhotos = 0;
    let uploadVideos = 0;
    let uploadVoice = 0;
    let uploadFailures = 0;

    // EarthCast
    let ecStarted = 0;
    let ecCompleted = 0;
    let ecDuration = 0;

    // Translation Telemetry
    let translationOpens = 0;
    const translationLanguages: Record<string, number> = {};
    let translationSuccess = 0;
    let translationFail = 0;
    const translationArticleIds = new Set<string>();
    const translationCountries: Record<string, number> = {};

    sessions.forEach(sess => {
      // Basic metrics
      uniqueUsers.add(sess.userId || sess.sessionId);
      if (sess.isNew) newUsersCount++;
      totalDuration += (sess.lastActiveAt - sess.createdAt) / 1000; // in seconds

      // Devices
      const dev = sess.deviceType || 'desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      // Traffic source
      const src = sess.trafficSource || 'direct';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // Country clicks
      if (sess.countryClicks) {
        Object.entries(sess.countryClicks).forEach(([country, clicks]) => {
          countryClicks[country] = (countryClicks[country] || 0) + clicks;
        });
      }

      // Category clicks
      if (sess.categoryClicks) {
        Object.entries(sess.categoryClicks).forEach(([cat, clicks]) => {
          categoryClicks[cat] = (categoryClicks[cat] || 0) + clicks;
        });
      }

      // Play Earth Quiz
      if (sess.playEarth) {
        quizAnswered += sess.playEarth.answered || 0;
        quizCorrect += sess.playEarth.correct || 0;
        quizWrong += sess.playEarth.wrong || 0;
        quizCompletions += sess.playEarth.completions || 0;
        if (sess.playEarth.categories) {
          sess.playEarth.categories.forEach(c => quizCats.add(c));
        }
        if (sess.playEarth.countries) {
          sess.playEarth.countries.forEach(c => quizCountries.add(c));
        }
      }

      // Search Telemetry
      if (sess.search) {
        searchSuccess += sess.search.successCount || 0;
        searchFail += sess.search.failCount || 0;
        if (sess.search.queries) {
          sess.search.queries.forEach(q => {
            const cleanQ = q.toLowerCase().trim();
            queryFrequency[cleanQ] = (queryFrequency[cleanQ] || 0) + 1;
            // If failed search query (no success tags)
            if (sess.search.failCount > 0 && Math.random() > 0.5) {
              failedQueries.add(cleanQ);
            }
          });
        }
      }

      // Article Reader
      if (sess.article) {
        articleClicks += sess.article.clicks || 0;
        articleOpens += sess.article.opens || 0;
        articleSourceClicks += sess.article.sourceClicks || 0;
        articleRelatedClicks += sess.article.relatedClicks || 0;
        articleCompletions += sess.article.completedCount || 0;
      }

      // Globe
      if (sess.globe) {
        globeRotations += sess.globe.rotations || 0;
        globeZooms += sess.globe.zooms || 0;
        globeTaps += sess.globe.taps || 0;
        globeHovers += sess.globe.hovers || 0;
        globeDirectoryUse += sess.globe.directoryUsage || 0;
      }

      // Uploads
      if (sess.uploads) {
        uploadPhotos += sess.uploads.photos || 0;
        uploadVideos += sess.uploads.videos || 0;
        uploadVoice += sess.uploads.voice || 0;
        uploadFailures += sess.uploads.failures || 0;
      }

      // EarthCast
      if (sess.earthcast) {
        ecStarted += sess.earthcast.started || 0;
        ecCompleted += sess.earthcast.completed || 0;
        ecDuration += sess.earthcast.duration || 0;
      }

      // Translation Telemetry
      if (sess.translation) {
        translationOpens += sess.translation.opens || 0;
        translationSuccess += sess.translation.successCount || 0;
        translationFail += sess.translation.failCount || 0;
        
        if (sess.translation.languages) {
          Object.entries(sess.translation.languages).forEach(([lang, count]) => {
            translationLanguages[lang] = (translationLanguages[lang] || 0) + count;
          });
        }
        if (sess.translation.translatedArticleIds) {
          sess.translation.translatedArticleIds.forEach(id => translationArticleIds.add(id));
        }
        if (sess.translation.translatedCountries) {
          Object.entries(sess.translation.translatedCountries).forEach(([country, count]) => {
            translationCountries[country] = (translationCountries[country] || 0) + count;
          });
        }
      }
    });

    const totalSessions = sessions.length;
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const returningRate = uniqueUsers.size > 0 ? Math.round(((uniqueUsers.size - newUsersCount) / uniqueUsers.size) * 100) : 0;

    // Top Countries Clicked List
    const rankedCountries = Object.entries(countryClicks)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Top Categories List
    const rankedCategories = Object.entries(categoryClicks)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Top Search Queries List
    const rankedQueries = Object.entries(queryFrequency)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Funnel Steps
    // Landing -> Country Click -> Article Read -> Quiz Engage -> Media Upload
    const funnelSteps = [
      { name: '1. Landing Page', count: totalSessions, pct: 100 },
      { 
        name: '2. Country Details Select', 
        count: sessions.filter(s => Object.keys(s.countryClicks || {}).length > 0 || (s.globe && s.globe.taps > 0)).length,
        get pct() { return Math.round((this.count / totalSessions) * 100) || 0; }
      },
      { 
        name: '3. Article Read/Open', 
        count: sessions.filter(s => (s.article && s.article.opens > 0) || (s.article && s.article.clicks > 0)).length,
        get pct() { return Math.round((this.count / totalSessions) * 100) || 0; }
      },
      { 
        name: '4. Engage Play Earth Quiz', 
        count: sessions.filter(s => s.playEarth && s.playEarth.answered > 0).length,
        get pct() { return Math.round((this.count / totalSessions) * 100) || 0; }
      },
      { 
        name: '5. Upload Reaction Content', 
        count: sessions.filter(s => s.uploads && (s.uploads.photos > 0 || s.uploads.videos > 0 || s.uploads.voice > 0)).length,
        get pct() { return Math.round((this.count / totalSessions) * 100) || 0; }
      }
    ];

    return {
      totalSessions,
      uniqueUsers: uniqueUsers.size,
      newUsers: newUsersCount,
      avgDuration,
      returningRate,
      deviceCounts,
      sourceCounts,
      rankedCountries,
      rankedCategories,
      rankedQueries,
      failedQueries: Array.from(failedQueries).slice(0, 5),
      quiz: {
        answered: quizAnswered,
        correct: quizCorrect,
        wrong: quizWrong,
        completions: quizCompletions,
        accuracy: quizAnswered > 0 ? Math.round((quizCorrect / quizAnswered) * 100) : 0,
        categoriesCount: quizCats.size,
        countriesCount: quizCountries.size
      },
      search: {
        success: searchSuccess,
        fail: searchFail,
        total: searchSuccess + searchFail,
        successRate: (searchSuccess + searchFail) > 0 ? Math.round((searchSuccess / (searchSuccess + searchFail)) * 100) : 0
      },
      article: {
        clicks: articleClicks,
        opens: articleOpens,
        sourceClicks: articleSourceClicks,
        relatedClicks: articleRelatedClicks,
        completions: articleCompletions,
        completionRate: articleClicks > 0 ? Math.round((articleCompletions / articleClicks) * 100) : 0
      },
      globe: {
        rotations: globeRotations,
        zooms: globeZooms,
        taps: globeTaps,
        hovers: globeHovers,
        directoryUse: globeDirectoryUse
      },
      uploads: {
        photos: uploadPhotos,
        videos: uploadVideos,
        voice: uploadVoice,
        failures: uploadFailures,
        total: uploadPhotos + uploadVideos + uploadVoice,
        successRate: (uploadPhotos + uploadVideos + uploadVoice + uploadFailures) > 0 
          ? Math.round(((uploadPhotos + uploadVideos + uploadVoice) / (uploadPhotos + uploadVideos + uploadVoice + uploadFailures)) * 100) 
          : 100
      },
      earthcast: {
        started: ecStarted,
        completed: ecCompleted,
        avgDuration: ecStarted > 0 ? Math.round(ecDuration / ecStarted) : 0
      },
      translation: {
        opens: translationOpens,
        success: translationSuccess,
        fail: translationFail,
        total: translationSuccess + translationFail,
        successRate: (translationSuccess + translationFail) > 0 
          ? Math.round((translationSuccess / (translationSuccess + translationFail)) * 100) 
          : 100,
        languages: translationLanguages,
        articleIdsCount: translationArticleIds.size,
        countries: translationCountries
      },
      funnelSteps
    };
  }, [sessions]);

  // Export report logic (JSON / CSV)
  const exportReport = (type: 'json' | 'csv') => {
    if (!aggregatedStats) return;

    let content = '';
    let mimeType = 'application/json';
    let fileName = `mooearth_analytics_report_${Date.now()}`;

    if (type === 'json') {
      content = JSON.stringify({
        generatedAt: new Date().toISOString(),
        isSimulationMode,
        databaseSessionsCount: isSimulationMode ? 0 : sessions.length,
        statistics: aggregatedStats,
        rawSessions: sessions
      }, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      // Export country rankings as CSV
      const rows = [
        ['Rank', 'Country', 'Interaction Clicks'],
        ...aggregatedStats.rankedCountries.map((c, i) => [i + 1, c.country, c.count])
      ];
      content = rows.map(r => r.join(',')).join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-screen bg-[#06060c] text-white flex flex-col overflow-hidden font-sans">
      {/* Glow Nebula effects in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#10b981]/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00e5ff] to-[#10b981] flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide flex items-center gap-2">
              {BRANDING.name} <span className="text-white/35 font-normal text-xs font-mono">/ Admin</span>
            </h1>
            <p className="text-[10px] text-white/45 uppercase tracking-widest font-bold">Analytics & Intelligence Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Badge indicator */}
          <div className={`px-3 py-1 rounded-full text-[9px] font-bold border flex items-center gap-1.5 transition-colors uppercase ${
            isSimulationMode 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulationMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{isSimulationMode ? 'Simulation Mode (Demo)' : 'Real Production DB'}</span>
          </div>

          {/* Controls */}
          <button
            onClick={() => loadSessions(false)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            disabled={loading}
          >
            🔄 Sync Data
          </button>
          
          <button
            onClick={() => loadSessions(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/30 border border-amber-500/20 text-amber-200 text-xs font-bold transition-all cursor-pointer"
            disabled={loading}
          >
            ⚡ Simulate
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer"
          >
            🌍 Launch App
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6 select-none z-10">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin" />
            <p className="text-xs text-white/50 tracking-widest uppercase animate-pulse">Aggregating system statistics...</p>
          </div>
        ) : aggregatedStats ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Database Warning Alert */}
            {dbError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 flex items-center justify-between">
                <span>⚠️ Firestore collection connection status: <strong>{dbError}</strong>. Displaying simulated backup telemetry.</span>
                <button onClick={() => setDbError(null)} className="text-red-400 hover:text-white font-bold px-1.5">✕</button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <KpiCard title="Active Sessions" value={aggregatedStats.totalSessions} sub="Traffic session count" icon="📊" />
              <KpiCard title="Unique Visitors" value={aggregatedStats.uniqueUsers} sub="Anonymous user IDs" icon="👥" />
              <KpiCard title="New Visitors" value={aggregatedStats.newUsers} sub="First-time visits logged" icon="✨" />
              <KpiCard title="Returning Rate" value={`${aggregatedStats.returningRate}%`} sub="Cohort loyalty index" icon="🔄" />
              <KpiCard title="Avg Session Duration" value={`${Math.floor(aggregatedStats.avgDuration / 60)}m ${aggregatedStats.avgDuration % 60}s`} sub="Avg session length" icon="⏱️" />
              <KpiCard title="Article Translations" value={aggregatedStats.translation.success} sub={`Success rate: ${aggregatedStats.translation.successRate}%`} icon="🌐" />
              <KpiCard title="WebGL Zoom/Rotate" value={aggregatedStats.globe.rotations + aggregatedStats.globe.zooms} sub="Globe rendering interactions" icon="🌍" />
            </div>

            {/* Middle Section: Funnel and Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Funnel Dropoff Chart */}
              <div className="lg:col-span-2 glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Conversion Funnel Drop-offs</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Trace session progress steps</p>
                </div>
                <div className="space-y-4 py-2">
                  {aggregatedStats.funnelSteps.map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white/80">{step.name}</span>
                        <span className="font-mono text-cyan-400 font-bold">{step.count} ({step.pct}%)</span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${step.pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Sources & Device Share */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Traffic Acquisition & Devices</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Referral and hardware telemetry</p>
                </div>
                <div className="flex-1 flex flex-col justify-between gap-4">
                  {/* Traffic Sources list */}
                  <div className="space-y-2">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-1">Top Referrers</div>
                    {Object.entries(aggregatedStats.sourceCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([source, count]) => {
                        const percent = Math.round((count / aggregatedStats.totalSessions) * 100);
                        return (
                          <div key={source} className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white/70 capitalize">{source}</span>
                            <span className="font-mono text-white/50">{count} ({percent}%)</span>
                          </div>
                        );
                      })}
                  </div>
                  {/* Device share visual */}
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-2">Device Distribution</div>
                    <div className="flex h-4 rounded-lg overflow-hidden border border-white/5">
                      {Object.entries(aggregatedStats.deviceCounts).map(([device, count]) => {
                        const pct = (count / aggregatedStats.totalSessions) * 100;
                        if (pct <= 0) return null;
                        const colors: Record<string, string> = {
                          desktop: 'bg-cyan-500',
                          mobile: 'bg-emerald-500',
                          tablet: 'bg-purple-500'
                        };
                        return (
                          <div 
                            key={device} 
                            style={{ width: `${pct}%` }} 
                            className={`${colors[device]} h-full`}
                            title={`${device}: ${Math.round(pct)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-white/45 mt-1.5 font-bold uppercase tracking-wider">
                      <span className="text-cyan-400">🖥️ Desktop ({Math.round((aggregatedStats.deviceCounts.desktop / aggregatedStats.totalSessions) * 100)}%)</span>
                      <span className="text-emerald-400">📱 Mobile ({Math.round((aggregatedStats.deviceCounts.mobile / aggregatedStats.totalSessions) * 100)}%)</span>
                      <span className="text-purple-400">📟 Tablet ({Math.round((aggregatedStats.deviceCounts.tablet / aggregatedStats.totalSessions) * 100)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: 3 Columns of Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Country Interactions */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm tracking-wide text-white">Interactive Country Clicks</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Top clicked world regions</p>
                  </div>
                  {/* Selector */}
                  <div className="flex rounded-lg bg-white/5 border border-white/5 p-0.5 text-[9px] font-bold uppercase tracking-wider">
                    {[10, 25, 50].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setActiveCountryTier(tier as any)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${activeCountryTier === tier ? 'bg-white/10 text-white' : 'text-white/40'}`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[320px] scrollbar-thin pr-1 space-y-2.5">
                  {aggregatedStats.rankedCountries.length === 0 ? (
                    <div className="text-center py-10 text-xs text-white/30">No clicks recorded yet.</div>
                  ) : (
                    aggregatedStats.rankedCountries.slice(0, activeCountryTier).map((item, index) => {
                      const maxClicks = aggregatedStats.rankedCountries[0]?.count || 1;
                      const pct = Math.round((item.count / maxClicks) * 100);
                      return (
                        <div key={item.country} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-white/80">{index + 1}. {item.country}</span>
                            <span className="font-mono text-cyan-400 font-bold">{item.count} clicks</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              className="h-full bg-cyan-400" 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column 2: Categories & Play Earth */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Categories & Play Earth Quiz</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Category views and gaming stats</p>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Category popularity */}
                  <div className="space-y-2">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-0.5 border-b border-white/5">Category Interactions</div>
                    {aggregatedStats.rankedCategories.slice(0, 4).map((item) => {
                      const maxClicks = aggregatedStats.rankedCategories[0]?.count || 1;
                      const pct = Math.round((item.count / maxClicks) * 100);
                      return (
                        <div key={item.category} className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-white/80 capitalize">{item.category}</span>
                          <span className="font-mono text-cyan-400">{item.count} shifts</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Play Earth Stats */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-0.5 border-b border-white/5">Play Earth Quiz Details</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                        <span className="block text-white/45 text-[9px] font-bold uppercase tracking-widest">Answered</span>
                        <strong className="text-sm font-black text-white">{aggregatedStats.quiz.answered}</strong>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                        <span className="block text-white/45 text-[9px] font-bold uppercase tracking-widest">Accuracy</span>
                        <strong className={`text-sm font-black ${aggregatedStats.quiz.accuracy >= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>{aggregatedStats.quiz.accuracy}%</strong>
                      </div>
                    </div>
                    <div className="text-[11px] space-y-1 text-white/70">
                      <div className="flex justify-between">
                        <span>Quiz Rounds Completed:</span>
                        <strong className="text-white">{aggregatedStats.quiz.completions} rounds</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Countries Explored:</span>
                        <strong className="text-white">{aggregatedStats.quiz.countriesCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Right / Wrong Answers:</span>
                        <strong className="text-white font-mono">{aggregatedStats.quiz.correct} / {aggregatedStats.quiz.wrong}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Reactions, Uploads & Search Telemetry */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Reactions & Search Logs</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Uplink media & search keywords</p>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Upload logs */}
                  <div className="space-y-2">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-0.5 border-b border-white/5">Reaction Content Uploads</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-1.5">
                        <span className="block text-[8px] text-white/45 font-bold uppercase tracking-widest">Photos</span>
                        <strong className="text-white">{aggregatedStats.uploads.photos}</strong>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-1.5">
                        <span className="block text-[8px] text-white/45 font-bold uppercase tracking-widest">Videos</span>
                        <strong className="text-white">{aggregatedStats.uploads.videos}</strong>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-1.5">
                        <span className="block text-[8px] text-white/45 font-bold uppercase tracking-widest">Voice</span>
                        <strong className="text-white">{aggregatedStats.uploads.voice}</strong>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-white/70">
                      <span>Upload Success Rate:</span>
                      <strong className={`font-mono ${aggregatedStats.uploads.successRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{aggregatedStats.uploads.successRate}%</strong>
                    </div>
                  </div>

                  {/* Search telemetry */}
                  <div className="space-y-2">
                    <div className="text-[9px] text-white/40 uppercase font-black tracking-wider pb-0.5 border-b border-white/5">Search Queries</div>
                    <div className="text-[11px] text-white/70 space-y-1">
                      <div className="flex justify-between">
                        <span>Total Queries Logged:</span>
                        <strong className="text-white">{aggregatedStats.search.total}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful Query Match:</span>
                        <strong className="text-emerald-400 font-mono">{aggregatedStats.search.successRate}%</strong>
                      </div>
                    </div>
                    
                    {/* Common queries */}
                    <div className="space-y-1 pt-1.5">
                      <span className="block text-[8px] text-white/45 font-black uppercase tracking-wider">Top Search Terms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aggregatedStats.rankedQueries.length === 0 ? (
                          <span className="text-[9px] text-white/30">No queries logged</span>
                        ) : (
                          aggregatedStats.rankedQueries.map(q => (
                            <span key={q.query} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-medium text-white/75">
                              {q.query} ({q.count})
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Failed Search Terms */}
                    {aggregatedStats.failedQueries.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="block text-[8px] text-red-400/60 font-black uppercase tracking-wider">Failed Queries (No Match)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aggregatedStats.failedQueries.map(q => (
                            <span key={q} className="px-2 py-0.5 rounded bg-red-500/5 border border-red-500/10 text-[9px] text-red-300/80">
                              {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Translation Telemetry Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Language Popularity */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Translation Languages</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Languages chosen by readers</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[220px] scrollbar-thin pr-1 space-y-2.5">
                  {Object.keys(aggregatedStats.translation.languages).length === 0 ? (
                    <div className="text-center py-10 text-xs text-white/30 font-sans">No translations requested yet.</div>
                  ) : (
                    Object.entries(aggregatedStats.translation.languages)
                      .sort((a, b) => b[1] - a[1])
                      .map(([lang, count], idx) => {
                        const maxCount = Math.max(...Object.values(aggregatedStats.translation.languages));
                        const pct = Math.round((count / maxCount) * 100);
                        const langName = LANGUAGE_CODE_TO_NAME[lang] || lang;
                        return (
                          <div key={lang} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold font-sans">
                              <span className="text-white/80">{idx + 1}. {langName}</span>
                              <span className="font-mono text-cyan-400 font-bold">{count} times</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                className="h-full bg-emerald-400" 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Card 2: Translation Metrics & Success Rate */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Translation Success & Health</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">API execution status & reliability</p>
                </div>
                <div className="flex-1 space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <span className="block text-white/45 text-[9px] font-bold uppercase tracking-widest">Total Opens</span>
                      <strong className="text-sm font-black text-white">{aggregatedStats.translation.opens}</strong>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <span className="block text-white/45 text-[9px] font-bold uppercase tracking-widest">Success Rate</span>
                      <strong className={`text-sm font-black ${aggregatedStats.translation.successRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{aggregatedStats.translation.successRate}%</strong>
                    </div>
                  </div>
                  <div className="text-[11px] space-y-1 text-white/70">
                    <div className="flex justify-between">
                      <span>Successful API Calls:</span>
                      <strong className="text-white">{aggregatedStats.translation.success}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed / Fallback Calls:</span>
                      <strong className="text-red-400">{aggregatedStats.translation.fail}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Requests Logged:</span>
                      <strong className="text-white">{aggregatedStats.translation.total}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Top Translated Countries */}
              <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">Top Translated Regions</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Countries where articles get translated</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[220px] scrollbar-thin pr-1 space-y-2.5">
                  {Object.keys(aggregatedStats.translation.countries).length === 0 ? (
                    <div className="text-center py-10 text-xs text-white/30 font-sans">No translations for any region yet.</div>
                  ) : (
                    Object.entries(aggregatedStats.translation.countries)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([country, count], idx) => {
                        const maxCount = Math.max(...Object.values(aggregatedStats.translation.countries));
                        const pct = Math.round((count / maxCount) * 100);
                        return (
                          <div key={country} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold font-sans">
                              <span className="text-white/80">{idx + 1}. {country}</span>
                              <span className="font-mono text-cyan-400 font-bold">{count} translations</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                className="h-full bg-cyan-400" 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Export Action Center */}
            <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm tracking-wide text-white">Export Analytics Data Report</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">On-demand metrics download center</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => exportReport('json')}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  📥 Download JSON Report
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer text-center"
                >
                  📥 Export Country Rankings CSV
                </button>
              </div>
            </div>

          </motion.div>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-white/30 uppercase tracking-widest font-bold">
            No analytics data compiled.
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Cards
function KpiCard({ title, value, sub, icon }: { title: string; value: string | number; sub: string; icon: string }) {
  return (
    <div className="glass rounded-3xl p-4 border border-white/5 flex flex-col justify-between gap-2">
      <div className="flex justify-between items-start">
        <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider leading-normal">{title}</span>
        <span className="text-sm shrink-0 leading-none">{icon}</span>
      </div>
      <div>
        <strong className="text-xl font-black text-white leading-none tracking-tight">{value}</strong>
        <p className="text-[8px] text-white/30 truncate mt-1 leading-normal">{sub}</p>
      </div>
    </div>
  );
}
