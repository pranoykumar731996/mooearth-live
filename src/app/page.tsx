// ============================================================
// MooEarth Live — Landing Page
// ============================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useEventFilter } from '@/hooks/useEventFilter';
import { useGoalCelebration } from '@/hooks/useGoalCelebration';
import { useSoundDesign } from '@/hooks/useSoundDesign';
import { useEarthCast } from '@/hooks/useEarthCast';
import { EventCategory, WorldEvent } from '@/types';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import LiveFeed from '@/components/Layout/LiveFeed';
import StarField from '@/components/UI/StarField';
import CountryReactionPanel from '@/components/Reactions/CountryReactionPanel';
import ArticleViewer from '@/components/Reactions/ArticleViewer';
import GoalOverlay from '@/components/Globe/GoalOverlay';
import EventPopup from '@/components/Globe/EventPopup';
import EarthCastOverlay from '@/components/EarthCast/EarthCastOverlay';
import EarthCastToggle from '@/components/EarthCast/EarthCastToggle';
import NarrationHistory from '@/components/EarthCast/NarrationHistory';
import AIOptimizationDashboard from '@/components/EarthCast/AIOptimizationDashboard';
import AIAssistantDrawer from '@/components/EarthCast/AIAssistantDrawer';
import { useEmotionMap } from '@/hooks/useEmotionMap';
import TimelineSlider from '@/components/Timeline/TimelineSlider';
import AuthModal from '@/components/Layout/AuthModal';
import UploadModal from '@/components/Celebrations/UploadModal';
import MediaViewer from '@/components/Celebrations/MediaViewer';
import PlayEarthOverlay from '@/components/Globe/PlayEarthOverlay';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const TEAM_FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Czechia': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Haiti': '🇭🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Australia': '🇦🇺',
  'Türkiye': '🇹🇷',
  'Turkey': '🇹🇷',
  'Germany': '🇩🇪',
  'Croatia': '🇭🇷',
  'Argentina': '🇦🇷',
  'Japan': '🇯🇵',
  'France': '🇫🇷',
};

function getTeamFlag(team: string): string {
  return TEAM_FLAGS[team] || '🏳️';
}

// Dynamic import for heavy Globe component
const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
});

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<WorldEvent | null>(null);

  // Live Fan Celebration states
  const [currentUser, setCurrentUser] = useState<{ username: string; avatar: string; country: string } | null>(null);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCelebration, setSelectedCelebration] = useState<any>(null);

  // Immersion Update States
  const [isMuted, setIsMuted] = useState(true);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const [activeReaction, setActiveReaction] = useState<any>(null);
  const [isFullScreenGlobe, setIsFullScreenGlobe] = useState(false);
  const [isAiDashboardOpen, setIsAiDashboardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'emotional' | 'fixtures'>('emotional');
  const [isPlayEarthActive, setIsPlayEarthActive] = useState(false);

  // Load session on mount with Firebase Auth
  useEffect(() => {
    // 1. Process redirect result if returning from Google sign-in
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let profile;
          if (!userDoc.exists()) {
            profile = {
              username: user.displayName || user.email?.split('@')[0] || 'Google_Fan',
              avatar: '👑',
              country: 'United States',
              email: user.email || '',
              createdAt: Date.now()
            };
            await setDoc(doc(db, 'users', user.uid), profile);
          } else {
            profile = userDoc.data();
          }
          setCurrentUser({
            username: profile.username || 'Google_Fan',
            avatar: profile.avatar || '👑',
            country: profile.country || 'United States'
          });
        }
      })
      .catch((error) => {
        console.error('Firebase Auth Redirect Result Error:', error);
      });

    // 2. Auth State subscription
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch custom profile attributes from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data();
            setCurrentUser({
              username: profile.username || 'User',
              avatar: profile.avatar || '⚽',
              country: profile.country || 'Brazil'
            });
          } else {
            // Fallback for new social log-ins or incomplete registrations
            const defaultProfile = {
              username: user.displayName || user.email?.split('@')[0] || 'Google_Fan',
              avatar: '👑',
              country: 'United States',
              email: user.email || '',
              createdAt: Date.now()
            };
            await setDoc(doc(db, 'users', user.uid), defaultProfile);
            setCurrentUser({
              username: defaultProfile.username,
              avatar: defaultProfile.avatar,
              country: defaultProfile.country
            });
          }
        } catch (e) {
          console.error('Failed to fetch user profile document:', e);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close auth modal when user is successfully authenticated
  useEffect(() => {
    if (currentUser) {
      setIsAuthModalOpen(false);
    }
  }, [currentUser]);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const { events: liveEvents, isLoading: isEventsLoading, apiStatus } = useLiveEvents();

  // Filtered events
  const filteredEvents = useEventFilter({
    events: liveEvents,
    searchQuery,
    activeCategory,
  });

  // Subscribe to celebrations in Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'celebrations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const celebsList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out flagged posts (reports >= 3)
        if (!data.reports || data.reports < 3) {
          celebsList.push({ id: doc.id, ...data });
        }
      });
      setCelebrations(celebsList);
    }, (error) => {
      console.error("Firestore celebrations subscription error:", error);
    });
    return () => unsubscribe();
  }, []);

  // Phase 10: Emotion Heatmap and Energy Level calculations
  const { emotionMap, trendingCountries, globalEnergyScore } = useEmotionMap(
    liveEvents,
    celebrations,
    selectedCountry,
    activeReaction,
    selectedEvent
  );

  // Goal Celebration System
  const { celebration: hookCelebration, dismiss: dismissHookCelebration } = useGoalCelebration(filteredEvents);
  
  // Custom manual celebration for user's own uploads
  const [customCelebration, setCustomCelebration] = useState<any | null>(null);

  // Combined celebration state
  const activeCelebration = customCelebration || hookCelebration;

  const dismissCelebration = useCallback(() => {
    if (customCelebration) {
      setCustomCelebration(null);
    } else {
      dismissHookCelebration();
    }
  }, [customCelebration, dismissHookCelebration]);

  // Phase 7: Sound Design (Web Audio API Procedural Synth Engine)
  const { playHoverBlip, playDeepPulse, playUploadSuccess, playGoalCelebration, playNarrationIntro, playTensionDrone, playCorrectSound, playWrongSound, playTimerTick, playLevelUp } = useSoundDesign(isMuted, globalEnergyScore);

  // EarthCast: Fly camera to a country by name
  const handleEarthCastFlyTo = useCallback((country: string) => {
    setSelectedCountry(country);
    setSelectedEvent(null);
  }, []);

  // EarthCast Mode: Cinematic AI Narration System
  const earthCast = useEarthCast({
    events: filteredEvents,
    celebrations,
    trendingCountries,
    globalEnergyScore,
    isMuted,
    onFlyToCountry: handleEarthCastFlyTo,
    playNarrationIntro,
    playDeepPulse,
    playTensionDrone,
  });

  // Trigger sound and auto-select country when celebration activates
  useEffect(() => {
    if (activeCelebration?.active) {
      playGoalCelebration();
      if (activeCelebration.country) {
        setSelectedCountry(activeCelebration.country);
        setSelectedEvent(null);
      }
    }
  }, [activeCelebration, playGoalCelebration]);

  // Clean reaction state when country closed
  useEffect(() => {
    if (!selectedCountry) {
      setActiveReaction(null);
    }
  }, [selectedCountry]);

  // Phase 3: Cinematic Broadcast cycle (watch the world react)
  useEffect(() => {
    if (!isCinematicMode || trendingCountries.length === 0) return;

    let index = 0;
    // Highlight the first country immediately
    const firstTarget = trendingCountries[0];
    if (firstTarget) {
      setSelectedCountry(firstTarget.country);
      setSelectedEvent(null);
      playDeepPulse();
    }

    const interval = setInterval(() => {
      index = (index + 1) % trendingCountries.length;
      const target = trendingCountries[index];
      if (target) {
        setSelectedCountry(target.country);
        setSelectedEvent(null);
        playDeepPulse();
      }
    }, 12000); // Cycle every 12 seconds

    return () => clearInterval(interval);
  }, [isCinematicMode, trendingCountries, playDeepPulse]);

  const handleLoginSuccess = useCallback((user: { username: string; avatar: string; country: string }) => {
    setCurrentUser(user);
  }, []);

  const handleUploadSuccess = useCallback((newCeleb: any) => {
    playUploadSuccess();
    
    // Trigger the global visual celebration for the upload
    const manualCeleb = {
      active: true,
      country: newCeleb.country,
      team: `@${newCeleb.username}`,
      player: `Shared a ${newCeleb.type.toUpperCase()} reaction!`,
      goalTime: new Date(newCeleb.timestamp).getMinutes(),
      matchTitle: newCeleb.match,
      homeTeam: `@${newCeleb.username}`,
      awayTeam: 'Fans Network',
      homeScore: 1,
      awayScore: 0,
      colors: newCeleb.type === 'video'
        ? { primary: '#00e5ff', secondary: '#ffffff', glow: 'rgba(0, 229, 255, 0.6)' }
        : newCeleb.type === 'image'
        ? { primary: '#e040fb', secondary: '#ffffff', glow: 'rgba(224, 64, 251, 0.6)' }
        : { primary: '#00e676', secondary: '#ffffff', glow: 'rgba(0, 230, 118, 0.6)' },
      lat: newCeleb.lat,
      lng: newCeleb.lng,
    };
    
    setCustomCelebration(manualCeleb);
    setTimeout(() => {
      setCustomCelebration(null);
    }, 10000);
  }, [playUploadSuccess]);

  const handleReportSuccess = useCallback((id: string) => {
    setCelebrations(prev => prev.filter(c => c.id !== id));
    setSelectedCelebration(null);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: WorldEvent | null) => {
    if (event && event.category !== 'football') {
      setActiveArticle(event);
      setSelectedEvent(null);
    } else {
      setSelectedEvent(event);
      if (event && event.footballData) {
        // Small timeout to let camera flight start first
        setTimeout(() => {
          earthCast.narrateMatch(event);
        }, 500);
      }
    }
  }, [earthCast]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: EventCategory | null) => {
    setActiveCategory(category);
    setSelectedEvent(null);
    setSelectedCountry(null);
  }, []);

  const handleEventNavigate = useCallback((event: WorldEvent) => {
    if (event.category !== 'football') {
      setActiveArticle(event);
    } else {
      setSelectedEvent(event);
    }
    setSearchQuery('');
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030308]" id="main">
      {/* Splash Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#030308] flex items-center justify-center flex-col"
          >
            <div className="w-24 h-24 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-[spin_3s_linear_infinite]" />
            <div className="w-16 h-16 absolute rounded-full border border-purple-500/20 border-b-purple-400 animate-[spin_2s_linear_infinite_reverse]" />
            <div className="absolute font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-xl tracking-tighter">
              ME
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-sm text-cyan-400/60 uppercase tracking-[0.2em] font-medium"
            >
              Connecting to the world...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star field background */}
      <StarField />

      {/* Radial gradient overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-50"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,1) 100%)',
          zIndex: 1,
        }}
      />

      {/* Top Navbar & Search */}
      <div className="relative z-30 pointer-events-none">
        <Navbar
          events={filteredEvents}
          activeCategory={activeCategory}
          apiStatus={apiStatus}
          onSearch={handleSearch}
          onSelectEvent={handleEventNavigate}
          onSelectCountry={setSelectedCountry}
          currentUser={currentUser}
          onAuthClick={() => setIsAuthModalOpen(true)}
          onSignOut={async () => {
            try {
              await signOut(auth);
            } catch (e) {
              console.error('Failed to sign out from Firebase:', e);
            }
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            setIsMuted(!isMuted);
            playHoverBlip();
          }}
          isCinematicModeActive={isCinematicMode}
          onToggleCinematicMode={() => {
            setIsCinematicMode(!isCinematicMode);
            playHoverBlip();
          }}
          isPlayEarthActive={isPlayEarthActive}
          onTogglePlayEarth={() => {
            setIsPlayEarthActive(!isPlayEarthActive);
            if (isPlayEarthActive) {
              setSelectedCountry(null);
              setSelectedEvent(null);
            }
            playHoverBlip();
          }}
        />
      </div>

      {/* Phase 3: Cinematic Broadcast HUD Overlay */}
      <AnimatePresence>
        {isCinematicMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center"
          >
            <div className="glass px-5 py-2.5 rounded-full border border-red-500/30 flex items-center gap-3 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="text-[10px] text-red-500 uppercase tracking-[0.25em] font-black">LIVE BROADCAST FEED</span>
              {selectedCountry && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-xs text-white font-bold tracking-tight">
                    MONITORING: {selectedCountry.toUpperCase()}
                  </span>
                </>
              )}
            </div>
            {/* Corner Bracket HUD Graphics */}
            <div className="absolute top-0 -left-6 w-3 h-3 border-t-2 border-l-2 border-red-500/60 rounded-tl" />
            <div className="absolute top-0 -right-6 w-3 h-3 border-t-2 border-r-2 border-red-500/60 rounded-tr" />
            <div className="absolute bottom-0 -left-6 w-3 h-3 border-b-2 border-l-2 border-red-500/60 rounded-bl" />
            <div className="absolute bottom-0 -right-6 w-3 h-3 border-b-2 border-r-2 border-red-500/60 rounded-br" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - hidden on full screen globe and Play Earth mode */}
      {!isFullScreenGlobe && !isPlayEarthActive && (
        <div className="relative z-30">
          <Sidebar
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Phase 5: Left HUD Sidebar Panel (hidden on full screen globe and Play Earth mode) */}
      {!isFullScreenGlobe && !isPlayEarthActive && (
        <div className="fixed left-24 top-24 bottom-24 w-64 z-20 rounded-3xl glass border border-white/10 flex flex-col overflow-hidden hidden lg:flex shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto">
          {/* Tab Selector */}
          <div className="flex border-b border-white/[0.06] bg-black/40 shrink-0">
            <button
              onClick={() => {
                setLeftPanelTab('emotional');
                playHoverBlip();
              }}
              className={`flex-1 py-3 text-center text-[10px] font-black tracking-widest transition-all cursor-pointer border-b-2 ${
                leftPanelTab === 'emotional'
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              🔥 EMOTIONAL
            </button>
            <button
              onClick={() => {
                setLeftPanelTab('fixtures');
                playHoverBlip();
              }}
              className={`flex-1 py-3 text-center text-[10px] font-black tracking-widest transition-all cursor-pointer border-b-2 ${
                leftPanelTab === 'fixtures'
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              ⚽ FIXTURES
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {leftPanelTab === 'emotional' ? (
              <>
                <div className="px-1 pb-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Global Activity Score</h4>
                </div>
                {trendingCountries.map((tc) => (
                  <motion.div
                    key={tc.country}
                    onClick={() => {
                      setSelectedCountry(tc.country);
                      setSelectedEvent(null);
                      playHoverBlip();
                    }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all flex flex-col gap-1.5 ${
                      selectedCountry === tc.country ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{tc.flag}</span>
                        <span className="font-bold text-white text-xs truncate max-w-[120px]">{tc.country}</span>
                      </div>
                      <span className="text-[10px] font-black text-cyan-400">{tc.score}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/50">
                      <span className="uppercase font-semibold tracking-wider">{tc.mood}</span>
                      <span className="truncate max-w-[140px] text-white/30">{tc.activityText}</span>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                <div className="px-1 pb-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">World Cup Fixtures</h4>
                </div>
                {liveEvents.filter(e => e.category === 'football').map((event) => {
                  if (!event.footballData) return null;
                  const fd = event.footballData;
                  const isLive = fd.status === 'LIVE';
                  const isFT = fd.status === 'FT';
                  
                  return (
                    <motion.div
                      key={event.id}
                      onClick={() => {
                        setSelectedCountry(event.country);
                        setSelectedEvent(event);
                        playHoverBlip();
                      }}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all flex flex-col gap-1.5 ${
                        selectedEvent?.id === event.id ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm shrink-0">{getTeamFlag(fd.homeTeam)}</span>
                          <span className="font-bold text-white text-xs truncate max-w-[120px]">{fd.homeTeam}</span>
                        </div>
                        {fd.status !== 'NS' && (
                          <span className="text-xs font-black text-white px-2 py-0.5 bg-white/10 rounded tabular-nums">{fd.homeScore}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm shrink-0">{getTeamFlag(fd.awayTeam)}</span>
                          <span className="font-bold text-white text-xs truncate max-w-[120px]">{fd.awayTeam}</span>
                        </div>
                        {fd.status !== 'NS' && (
                          <span className="text-xs font-black text-white px-2 py-0.5 bg-white/10 rounded tabular-nums">{fd.awayScore}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[9px] mt-1 border-t border-white/5 pt-2 font-medium">
                        {isLive ? (
                          <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            LIVE {fd.elapsed}'
                          </span>
                        ) : isFT ? (
                          <span className="text-white/35 font-bold uppercase tracking-wider">FT</span>
                        ) : (
                          <span className="text-cyan-400/80 font-bold uppercase tracking-wider">UPCOMING</span>
                        )}
                        <span className="text-white/30 truncate max-w-[100px]">{event.city}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}

            {/* EarthCast Narration History */}
            <NarrationHistory
              history={earthCast.narrationHistory}
              isEarthCastActive={earthCast.isEarthCastActive}
            />
          </div>
        </div>
      )}

      {/* Massive Cinematic Globe */}
      <div
        className="absolute z-[2] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: '110vw', height: '110vh' }}
      >
        <div 
          className="w-full h-full transition-opacity duration-1000"
          style={{ 
            opacity: isLoading ? 0 : 1,
            pointerEvents: isLoading ? 'none' : 'auto'
          }}
        >
          <GlobeScene
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={handleSelectEvent}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            celebration={activeCelebration}
            celebrations={celebrations}
            onSelectCelebration={setSelectedCelebration}
            globalEnergyScore={globalEnergyScore}
            isCinematicModeActive={isCinematicMode || isFullScreenGlobe}
            emotionMap={emotionMap}
            earthCastActive={earthCast.isEarthCastActive}
            earthCastAudioLevel={earthCast.audioLevel}
          />
        </div>
      </div>

      {/* GOAL CELEBRATION OVERLAY */}
      <GoalOverlay celebration={activeCelebration} onDismiss={dismissCelebration} />

      {/* EVENT DETAIL POPUP OVERLAY */}
      {!isPlayEarthActive && (
        <EventPopup event={selectedEvent} onClose={() => handleSelectEvent(null)} />
      )}

      {/* FULL ARTICLE READER SYSTEM */}
      <ArticleViewer
        event={activeArticle}
        allEvents={filteredEvents}
        onClose={() => setActiveArticle(null)}
      />

      {/* PLAY EARTH GAME MODE OVERLAY */}
      <PlayEarthOverlay
        isActive={isPlayEarthActive}
        selectedCountry={selectedCountry}
        onClose={() => {
          setIsPlayEarthActive(false);
          setSelectedCountry(null);
          setSelectedEvent(null);
          playHoverBlip();
        }}
        onPlaySound={playHoverBlip}
        onCorrectSound={playCorrectSound}
        onWrongSound={playWrongSound}
        onTimerTick={playTimerTick}
        onLevelUp={playLevelUp}
        username={currentUser?.username || 'Guest'}
      />

      {/* EARTHCAST NARRATION OVERLAY */}
      <EarthCastOverlay
        currentNarration={earthCast.currentNarration}
        narrationState={earthCast.narrationState}
        audioLevel={earthCast.audioLevel}
        isEarthCastActive={earthCast.isEarthCastActive}
      />

      {/* AI OPTIMIZATION DASHBOARD */}
      <AIOptimizationDashboard
        isOpen={isAiDashboardOpen}
        onClose={() => setIsAiDashboardOpen(false)}
        stats={earthCast.aiStats}
      />

      {/* MOOEARTH AI ASSISTANT DRAWER */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        events={filteredEvents}
        trendingCountries={trendingCountries}
        globalEnergyScore={globalEnergyScore}
      />

      {/* AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* UPLOAD REACTION MODAL */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        matches={liveEvents.filter(e => e.category === 'football')}
        currentUser={currentUser}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* MEDIA VIEWER MODAL */}
      <MediaViewer
        celebration={selectedCelebration}
        onClose={() => setSelectedCelebration(null)}
        onReportSuccess={handleReportSuccess}
      />

      {/* Live Feed or Country Reactions */}
      {!isFullScreenGlobe && !isPlayEarthActive && (
        <div className="relative z-30">
          <AnimatePresence mode="wait">
            {selectedCountry ? (
              <CountryReactionPanel
                key="country-panel"
                country={selectedCountry}
                activeCategory={activeCategory}
                onClose={() => setSelectedCountry(null)}
                onReactionLoaded={setActiveReaction}
                onSelectArticle={setActiveArticle}
              />
            ) : (
              <motion.div
                key="live-feed"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
              >
                {selectedEvent && (
                  <button 
                    onClick={() => {
                      handleSelectEvent(null);
                      playHoverBlip();
                    }}
                    className="fixed right-6 top-[100px] z-[60] bg-black/50 text-white p-2 rounded-full hover:bg-white/20 transition backdrop-blur-md cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
                <LiveFeed
                  events={selectedEvent ? [selectedEvent] : filteredEvents}
                  onSelectEvent={(e) => {
                    handleEventNavigate(e);
                    playHoverBlip();
                  }}
                  activeCategory={activeCategory}
                  onSelectCountry={setSelectedCountry}
                  onPlaySound={playHoverBlip}
                  footballActive={apiStatus?.footballActive}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none gradient-bottom"
        style={{ zIndex: 10 }}
      />

      {/* UI Overlays (Mini Globe, Timeline, AI Button) */}
      <div className="fixed bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none">
        
        {/* Phase 10: Left - Global Pulse Energy Card + Mini Globe */}
        <div className="hidden lg:flex flex-col gap-2.5 pointer-events-auto">
          {/* Energy Score card */}
          <div className="glass px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-[0_0_20px_rgba(0,229,255,0.08)]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-lg relative">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping absolute" />
              💓
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Global Pulse Energy</div>
              <div className="text-lg font-black text-white leading-tight">{globalEnergyScore}%</div>
            </div>
          </div>

          {/* Mini Globe */}
          <div className="w-24 h-24 rounded-full glass items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors shadow-[0_0_30px_rgba(0,229,255,0.1)] group flex">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-900/40 to-black border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-6 h-4 bg-green-500/20 rounded-full blur-[2px] group-hover:bg-cyan-500/30 transition-colors" />
              <div className="absolute bottom-6 right-4 w-8 h-6 bg-green-500/20 rounded-full blur-[2px] group-hover:bg-cyan-500/30 transition-colors" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Timeline Slider */}
        <TimelineSlider />

        {/* Right: Floating AI & Upload Buttons */}
        <div className="pointer-events-auto mb-2 mr-[340px] lg:mr-0 flex items-center gap-3">
          {/* Phase 9 Mobile Full Screen Toggle */}
          <button
            onClick={() => {
              setIsFullScreenGlobe(!isFullScreenGlobe);
              playHoverBlip();
            }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto cursor-pointer"
            title={isFullScreenGlobe ? "Show Dashboard Panels" : "Maximize 3D Globe"}
          >
            {isFullScreenGlobe ? '📺' : '📱'}
          </button>

          {/* EarthCast Toggle */}
          <EarthCastToggle
            isActive={earthCast.isEarthCastActive}
            isAutoMode={earthCast.isAutoMode}
            narrationState={earthCast.narrationState}
            onToggle={() => {
              earthCast.toggleEarthCast();
              playHoverBlip();
            }}
            onToggleAutoMode={() => {
              earthCast.toggleAutoMode();
              playHoverBlip();
            }}
          />

          {/* AI Optimization Dashboard Toggle */}
          {earthCast.isEarthCastActive && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAiDashboardOpen(!isAiDashboardOpen);
                playHoverBlip();
              }}
              className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                isAiDashboardOpen
                  ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_20px_rgba(0,229,255,0.2)] text-cyan-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title={isAiDashboardOpen ? 'Hide AI Optimization Dashboard' : 'Show AI Optimization Dashboard'}
            >
              <span className="text-lg">📊</span>
            </motion.button>
          )}

          <button
            onClick={() => {
              playHoverBlip();
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setIsUploadModalOpen(true);
              }
            }}
            className="h-14 px-5 rounded-2xl flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/40 shadow-[0_0_30px_rgba(230,64,251,0.25)] hover:shadow-[0_0_45px_rgba(230,64,251,0.45)] hover:scale-105 transition-all duration-300 font-bold text-xs tracking-wider text-white cursor-pointer"
          >
            <span>📣</span>
            UPLOAD REACTION
          </button>

          <button
            onClick={() => {
              setIsAssistantOpen(!isAssistantOpen);
              playHoverBlip();
            }}
            className={`relative group w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300/50 transition-all duration-300 hover:scale-110 cursor-pointer ${
              isAssistantOpen
                ? 'shadow-[0_0_50px_rgba(0,229,255,0.6)] border-cyan-400 scale-105'
                : 'shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(0,229,255,0.6)]'
            }`}
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[marker-ring_2s_linear_infinite]" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 7.49-2 14-2 14" />
              <path d="M20 18v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1" />
              <path d="M16 12v-2a4 4 0 0 0-8 0v2" />
            </svg>
            {/* Tooltip */}
            <div className="absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <div className="glass px-4 py-2 rounded-xl text-sm font-medium text-white shadow-xl">
                {isAssistantOpen ? 'Close AI Assistant' : 'MooEarth AI Assistant'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
