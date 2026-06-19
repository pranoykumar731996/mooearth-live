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
import { useStreaks } from '@/hooks/useStreaks';
import { useMobileSheet } from '@/hooks/useMobileSheet';
import { requestNotificationPermission, sendLocalNotification } from '@/utils/notifications';
import { EventCategory, WorldEvent } from '@/types';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import LiveFeed from '@/components/Layout/LiveFeed';
import StarField from '@/components/UI/StarField';
import CountryReactionPanel from '@/components/Reactions/CountryReactionPanel';
import ArticleViewer from '@/components/Reactions/ArticleViewer';
import MobileCountrySheet from '@/components/UI/MobileCountrySheet';
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
import LeaderboardModal from '@/components/UI/LeaderboardModal';
import ProfileModal from '@/components/UI/ProfileModal';
import UploadModal from '@/components/Celebrations/UploadModal';
import MediaViewer from '@/components/Celebrations/MediaViewer';
import PlayEarthOverlay from '@/components/Globe/PlayEarthOverlay';
import { findCountryMeta, getMetadataCountries } from '@/data/questions/countryMetadata';
import { initAnalyticsSession, trackEvent, updateAnalyticsUser } from '@/services/analytics';
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

interface HomePageProps {
  initialCountry?: string;
  initialCategory?: EventCategory;
  initialArticleId?: string;
  initialPlayEarthActive?: boolean;
}

export default function HomePage({
  initialCountry,
  initialCategory,
  initialArticleId,
  initialPlayEarthActive
}: HomePageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(initialCategory || null);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry || null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<WorldEvent | null>(null);

  // Live Fan Celebration states
  const [currentUser, setCurrentUser] = useState<{ username: string; avatar: string; country: string } | null>(null);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCelebration, setSelectedCelebration] = useState<any>(null);

  // Streak tracking
  const { streak, showCelebration: showStreakCelebration, dismissCelebration: dismissStreakCelebration } = useStreaks(currentUser?.username || null);

  // Immersion Update States
  const [isMuted, setIsMuted] = useState(true);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const [activeReaction, setActiveReaction] = useState<any>(null);
  const [isFullScreenGlobe, setIsFullScreenGlobe] = useState(false);
  const [isAiDashboardOpen, setIsAiDashboardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'emotional' | 'fixtures' | 'explore' | 'views'>(initialCountry ? 'explore' : 'emotional');
  const [globeView, setGlobeView] = useState<'standard' | 'fifa' | 'night' | 'weather' | 'satellite' | 'discovery'>('standard');
  const [isPlayEarthActive, setIsPlayEarthActive] = useState(initialPlayEarthActive || false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(!!initialCountry);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile draggable bottom sheet (Google Maps style)
  const mobileSheet = useMobileSheet('collapsed');

  // Detect mobile viewport (Phase 9 Mobile Experience)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize analytics session on client mount
  useEffect(() => {
    initAnalyticsSession();
  }, []);

  // Register PWA Service Worker on client mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Capture referral code on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
          sessionStorage.setItem('mooearth_ref', ref);
          console.log('[page.tsx] Captured referral code:', ref);
        }
      } catch (err) {
        console.error('[page.tsx] Failed to parse referral parameter:', err);
      }
    }
  }, []);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermission().then((perm) => {
      console.log('[page.tsx] Browser Notification permission:', perm);
      if (perm === 'granted') {
        sendLocalNotification('Welcome to MooEarth Live! 🌍', {
          body: 'Stay tuned for live World Cup goal alerts and trending country highlights.',
        });
      }
    });
  }, []);

  // First-time user guide check
  useEffect(() => {
    const seen = localStorage.getItem('mooearth_guide_seen');
    if (seen !== 'true') {
      requestAnimationFrame(() => {
        setShowFirstTimeGuide(true);
      });
    }
  }, []);



  // Load session on mount with Firebase Auth
  useEffect(() => {
    console.log('[page.tsx] Diagnostic: Firebase Auth listener attaching...');
    
    // 1. Process redirect result if returning from Google sign-in
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          console.log('[page.tsx] Diagnostic: Google redirect login success. UID:', user.uid);
          let profile = {
            username: user.displayName || user.email?.split('@')[0] || 'Google_Fan',
            avatar: '👑',
            country: 'United States'
          };
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
              const defaultProfile = {
                username: profile.username,
                avatar: profile.avatar,
                country: profile.country,
                email: user.email || '',
                createdAt: Date.now()
              };
              try {
                await setDoc(doc(db, 'users', user.uid), defaultProfile);
              } catch (writeErr) {
                console.warn('[page.tsx] Diagnostic: Failed to write default profile to Firestore:', writeErr);
              }
            } else {
              const data = userDoc.data();
              profile = {
                username: data.username || profile.username,
                avatar: data.avatar || profile.avatar,
                country: data.country || profile.country
              };
            }
          } catch (readErr) {
            console.warn('[page.tsx] Diagnostic: Failed to fetch user profile from Firestore:', readErr);
          }
          setCurrentUser(profile);
          setIsAuthModalOpen(false);
        }
      })
      .catch((error) => {
        console.error('[page.tsx] Diagnostic: Firebase Auth Redirect Result Error:', error);
      });
 
    // 2. Auth State subscription
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[page.tsx] Diagnostic: onAuthStateChanged triggered. User UID:', user ? user.uid : 'null');
      if (user) {
        let profile = {
          username: user.displayName || user.email?.split('@')[0] || 'User',
          avatar: '⚽',
          country: 'Brazil'
        };
        try {
          // Fetch custom profile attributes from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            profile = {
              username: data.username || profile.username,
              avatar: data.avatar || profile.avatar,
              country: data.country || profile.country
            };
          } else {
            // Fallback for new social log-ins or incomplete registrations
            const defaultProfile = {
              username: profile.username,
              avatar: '👑',
              country: 'United States',
              email: user.email || '',
              createdAt: Date.now()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), defaultProfile);
            } catch (writeErr) {
              console.warn('[page.tsx] Diagnostic: Failed to write default profile to Firestore:', writeErr);
            }
            profile = {
              username: defaultProfile.username,
              avatar: defaultProfile.avatar,
              country: defaultProfile.country
            };
          }
        } catch (e) {
          console.warn('[page.tsx] Diagnostic: Failed to fetch user profile from Firestore, using Auth fallback:', e);
        }
        updateAnalyticsUser(user.uid);
        setCurrentUser(profile);
        setIsAuthModalOpen(false);
      } else {
        setCurrentUser(null);
      }
    });
    return () => {
      console.log('[page.tsx] Diagnostic: Firebase Auth listener detaching...');
      unsubscribe();
    };
  }, []);



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

  // Load initial article if provided (SEO URL parameters support)
  useEffect(() => {
    if (initialArticleId && liveEvents.length > 0) {
      const match = liveEvents.find(e => e.id === initialArticleId);
      if (match) {
        setActiveArticle(match);
        if (match.country) {
          setSelectedCountry(match.country);
          setIsDashboardOpen(true);
        }
      }
    }
  }, [initialArticleId, liveEvents]);

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
      console.error("Firestore celebrations subscription error, fetching local fallback:", error);
      fetch('/api/celebrations')
        .then(res => res.json())
        .then(data => {
          if (data.celebrations) {
            setCelebrations(data.celebrations);
          }
        })
        .catch(fetchErr => {
          console.error("Failed to load local celebrations fallback:", fetchErr);
        });
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

  // Render-phase tracking of activeCelebration to select country synchronously
  const [prevCelebrationId, setPrevCelebrationId] = useState<string | null>(null);
  const currentCelebrationId = activeCelebration?.active ? activeCelebration.id || 'active' : null;
  if (currentCelebrationId !== prevCelebrationId) {
    setPrevCelebrationId(currentCelebrationId);
    if (activeCelebration?.active && activeCelebration.country) {
      setSelectedCountry(activeCelebration.country);
      setSelectedEvent(null);
      setIsDashboardOpen(true);
    }
  }

  const dismissCelebration = useCallback(() => {
    if (customCelebration) {
      setCustomCelebration(null);
    } else {
      dismissHookCelebration();
    }
  }, [customCelebration, dismissHookCelebration]);

  // Phase 7: Sound Design (Web Audio API Procedural Synth Engine)
  const { playHoverBlip, playDeepPulse, playUploadSuccess, playGoalCelebration, playNarrationIntro, playTensionDrone, playCorrectSound, playWrongSound, playTimerTick, playLevelUp } = useSoundDesign(isMuted, globalEnergyScore);

  const handleSelectCountry = useCallback((country: string | null) => {
    setSelectedCountry(country);
    setSelectedEvent(null);
    if (!country) {
      setIsDashboardOpen(false);
      setActiveReaction(null);
    } else {
      setIsDashboardOpen(prev => isMobile ? (prev ? true : false) : true);
      trackEvent('country', 'click', country, 1, { category: activeCategory || 'home' });
    }
  }, [isMobile, activeCategory]);

  const handleGlobeSelectCountry = useCallback((country: string | null) => {
    if (country === selectedCountry && country !== null) {
      setIsDashboardOpen(true);
      playDeepPulse();
    } else {
      setSelectedCountry(country);
      setSelectedEvent(null);
      if (country) {
        setIsDashboardOpen(!isMobile);
        trackEvent('country', 'click', country, 1, { category: activeCategory || 'home', trigger: 'globe_tap' });
      } else {
        setIsDashboardOpen(false);
        setActiveReaction(null);
      }
    }
  }, [selectedCountry, isMobile, playDeepPulse, activeCategory]);

  // EarthCast: Fly camera to a country by name
  const handleEarthCastFlyTo = useCallback((country: string) => {
    handleSelectCountry(country);
  }, [handleSelectCountry]);

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

  // EarthCast analytics tracking
  useEffect(() => {
    if (earthCast.isEarthCastActive) {
      trackEvent('earthcast', 'start');
    } else if (earthCast.narrationHistory.length > 0) {
      trackEvent('earthcast', 'complete');
    }
  }, [earthCast.isEarthCastActive, earthCast.narrationHistory.length]);

  useEffect(() => {
    if (earthCast.currentNarration) {
      trackEvent('earthcast', 'narration_play', earthCast.currentNarration.country, 1, {
        text: earthCast.currentNarration.text,
        eventType: earthCast.currentNarration.eventType
      });
    }
  }, [earthCast.currentNarration]);

  // Trigger sound when celebration activates
  useEffect(() => {
    if (activeCelebration?.active) {
      playGoalCelebration();
    }
  }, [activeCelebration?.active, playGoalCelebration]);



  // Phase 3: Cinematic Broadcast cycle (watch the world react)
  useEffect(() => {
    if (!isCinematicMode || trendingCountries.length === 0) return;

    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % trendingCountries.length;
      const target = trendingCountries[index];
      if (target) {
        handleSelectCountry(target.country);
        playDeepPulse();
      }
    }, 12000); // Cycle every 12 seconds

    return () => clearInterval(interval);
  }, [isCinematicMode, trendingCountries, playDeepPulse, handleSelectCountry]);

  const handleLoginSuccess = useCallback((user: { username: string; avatar: string; country: string }) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
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

  // Grouped countries for Explore directory
  const allCountries = getMetadataCountries().sort((a, b) => a.localeCompare(b));
  const filteredDirectory = allCountries.filter(c => {
    const meta = findCountryMeta(c);
    const searchLower = directorySearch.toLowerCase();
    return c.toLowerCase().includes(searchLower) ||
           meta?.capital.toLowerCase().includes(searchLower) ||
           meta?.continent.toLowerCase().includes(searchLower);
  });

  const grouped: Record<string, string[]> = {};
  filteredDirectory.forEach(c => {
    const firstLetter = c.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(c);
  });

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
          onSelectCountry={handleSelectCountry}
          currentUser={currentUser}
          onAuthClick={() => {
            console.log('[page.tsx] Diagnostic: User clicked SIGN IN (opening AuthModal)');
            setIsAuthModalOpen(true);
           }}
           onProfileClick={() => setIsProfileModalOpen(true)}
           onLeaderboardClick={() => setIsLeaderboardModalOpen(true)}
           onSignOut={async () => {
            console.log('[page.tsx] Diagnostic: signOut() flow initiated...');
            try {
              const beforeUser = auth.currentUser;
              console.log('[page.tsx] Diagnostic: User state before signOut():', beforeUser ? beforeUser.uid : 'null');
              await signOut(auth);
              console.log('[page.tsx] Diagnostic: signOut() completed successfully.');
            } catch (e) {
              console.error('[page.tsx] Diagnostic: Failed to sign out from Firebase:', e);
            }
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            setIsMuted(!isMuted);
            playHoverBlip();
          }}
          isCinematicModeActive={isCinematicMode}
          onToggleCinematicMode={() => {
            const nextMode = !isCinematicMode;
            setIsCinematicMode(nextMode);
            if (nextMode && trendingCountries.length > 0) {
              const firstTarget = trendingCountries[0];
              if (firstTarget) {
                handleSelectCountry(firstTarget.country);
                playDeepPulse();
              }
            }
            playHoverBlip();
          }}
          isPlayEarthActive={isPlayEarthActive}
          onTogglePlayEarth={() => {
            const nextActive = !isPlayEarthActive;
            setIsPlayEarthActive(nextActive);
            setGlobeView(nextActive ? 'discovery' : 'standard');
            if (nextActive) {
              handleSelectCountry(null);
            }
            playHoverBlip();
          }}
        />
      </div>

      {/* Living Earth Status Bar */}
      <div 
        className="fixed top-16 left-0 right-0 z-30 h-8 bg-[#090915]/85 border-b border-white/[0.04] backdrop-blur-md flex items-center justify-between px-6 pointer-events-auto text-[10px] font-semibold text-white/50 select-none"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shrink-0" />
            <span className="uppercase tracking-widest font-black text-[9px] hidden sm:inline">Living Earth Network</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1">
            <span className="text-white/30">Users Online:</span>
            <span className="text-white font-bold animate-[pulse_2s_infinite]">1,482</span>
          </div>
          <span className="text-white/10 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-white/30">Tracked Countries:</span>
            <span className="text-white font-bold">{getMetadataCountries().length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-white/30"><span className="hidden sm:inline">Active </span>Stories:</span>
            <span className="text-cyan-400 font-bold">{filteredEvents.length}</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1">
            <span className="text-white/30"><span className="hidden sm:inline">Live </span>Matches:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
              {liveEvents.filter(e => e.category === 'football' && e.footballData?.status === 'LIVE').length}
            </span>
          </div>
          <span className="text-white/10 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-white/30">Global Pulse:</span>
            <span className="text-purple-400 font-bold">{globalEnergyScore}% Intensity</span>
          </div>
        </div>
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
              className={`flex-1 py-3 text-center text-[9px] font-black tracking-wider transition-all cursor-pointer border-b-2 ${
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
              className={`flex-1 py-3 text-center text-[9px] font-black tracking-wider transition-all cursor-pointer border-b-2 ${
                leftPanelTab === 'fixtures'
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              ⚽ FIXTURES
            </button>
            <button
              onClick={() => {
                setLeftPanelTab('explore');
                playHoverBlip();
              }}
              className={`flex-1 py-3 text-center text-[9px] font-black tracking-wider transition-all cursor-pointer border-b-2 ${
                leftPanelTab === 'explore'
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              🌍 EXPLORE
            </button>
            <button
              onClick={() => {
                setLeftPanelTab('views');
                playHoverBlip();
              }}
              className={`flex-1 py-3 text-center text-[9px] font-black tracking-wider transition-all cursor-pointer border-b-2 ${
                leftPanelTab === 'views'
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              🌌 VIEWS
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
                      handleSelectCountry(tc.country);
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
            ) : leftPanelTab === 'fixtures' ? (
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
                        handleSelectCountry(event.country);
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
                            LIVE {fd.elapsed}{"'"}
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
            ) : leftPanelTab === 'explore' ? (
              <>
                <div className="px-1 pb-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Explore Countries</h4>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                  />
                  
                  {/* A-Z Jump Bar */}
                  <div className="flex gap-1 overflow-x-auto py-1 px-0.5 scrollbar-none border-b border-white/[0.04]">
                    {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                      const hasCountries = Object.keys(grouped).includes(letter);
                      return (
                        <button
                          key={letter}
                          disabled={!hasCountries}
                          onClick={() => {
                            const elem = document.getElementById(`explore-letter-${letter}`);
                            if (elem) {
                              elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                            playHoverBlip();
                          }}
                          className={`text-[9px] font-black w-4.5 h-4.5 rounded shrink-0 flex items-center justify-center transition-all ${
                            hasCountries
                              ? 'text-cyan-400 hover:bg-cyan-500/20 cursor-pointer'
                              : 'text-white/10 cursor-not-allowed'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1 scrollbar-thin">
                    {Object.keys(grouped).sort().map(letter => (
                      <div key={letter} id={`explore-letter-${letter}`} className="space-y-1.5 scroll-mt-2">
                        <div className="text-[9px] font-black text-cyan-400/50 uppercase tracking-widest px-1 py-0.5 border-b border-white/5">
                          {letter} ({grouped[letter].length})
                        </div>
                        {grouped[letter].map(c => {
                          const meta = findCountryMeta(c);
                          return (
                            <div
                              key={c}
                              onClick={() => {
                                handleSelectCountry(c);
                                playHoverBlip();
                              }}
                              className={`p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/[0.03] hover:border-white/10 cursor-pointer flex items-center justify-between transition-all ${
                                selectedCountry === c ? 'border-cyan-500/40 bg-cyan-500/10' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm shrink-0">{meta?.flag || '🏳️'}</span>
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold text-white truncate">{c}</div>
                                  <div className="text-[9px] text-white/40 truncate">{meta?.capital} • {meta?.continent}</div>
                                </div>
                              </div>
                              <span className="text-[8px] text-white/30 font-bold tracking-tight shrink-0">FOCUS ↗</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {Object.keys(grouped).length === 0 && (
                      <div className="text-center py-6 text-[10px] text-white/30">
                        No countries match &quot;{directorySearch}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-1 pb-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Globe View Modes</h4>
                </div>
                <div className="space-y-3 pb-4">
                  {[
                    { id: 'standard', name: '🌍 Standard View', desc: 'Default night lights map with active news category glows.' },
                    { id: 'fifa', name: '⚽ FIFA World Cup', desc: 'Tactical pitch-green map, golden borders, live match highlights.' },
                    { id: 'night', name: '🌃 Night Lights', desc: 'Realistic city lights map showing raw night-side electricity.' },
                    { id: 'weather', name: '🌦 Weather Radar', desc: 'Day satellite base, rotating clouds, and temperature heatmaps.' },
                    { id: 'satellite', name: '🛰 Satellite View', desc: 'Pure satellite imagery with ultra-thin border mappings.' },
                    { id: 'discovery', name: '🎮 Earth Discovery', desc: 'Holographic grid blueprint with quiz question counters.' },
                  ].map((v) => (
                    <motion.div
                      key={v.id}
                      onClick={() => {
                        setGlobeView(v.id as any);
                        setIsPlayEarthActive(v.id === 'discovery');
                        if (v.id === 'discovery') {
                          handleSelectCountry(null);
                        }
                        playHoverBlip();
                      }}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all flex flex-col gap-1 ${
                        globeView === v.id ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]' : ''
                      }`}
                    >
                      <span className="font-bold text-white text-xs">{v.name}</span>
                      <span className="text-[9px] text-white/40 leading-relaxed">{v.desc}</span>
                    </motion.div>
                  ))}
                </div>
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
        className="absolute z-[2] pointer-events-none"
        style={isMobile
          ? {
              width: '100vw',
              height: `${mobileSheet.globeAvailableVh}vh`,
              top: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: mobileSheet.isDragging ? 'none' : 'height 0.35s cubic-bezier(0.2, 0, 0, 1)',
            }
          : { width: '110vw', height: '110vh', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
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
            onSelectCountry={handleGlobeSelectCountry}
            celebration={activeCelebration}
            celebrations={celebrations}
            onSelectCelebration={setSelectedCelebration}
            globalEnergyScore={globalEnergyScore}
            isCinematicModeActive={isCinematicMode || isFullScreenGlobe}
            emotionMap={emotionMap}
            earthCastActive={earthCast.isEarthCastActive}
            earthCastAudioLevel={earthCast.audioLevel}
            activeCategory={activeCategory}
            isPlayEarthActive={isPlayEarthActive}
            globeView={globeView}
            isDashboardOpen={isDashboardOpen}
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
      {!isMobile && (
        <ArticleViewer
          event={activeArticle}
          allEvents={filteredEvents}
          onClose={() => setActiveArticle(null)}
        />
      )}

      {/* PLAY EARTH GAME MODE OVERLAY */}
      {(!isMobile || !selectedCountry) && (
        <PlayEarthOverlay
          isActive={isPlayEarthActive}
          selectedCountry={selectedCountry}
          onClose={() => {
            setIsPlayEarthActive(false);
            handleSelectCountry(null);
            playHoverBlip();
          }}
          onPlaySound={playHoverBlip}
          onCorrectSound={playCorrectSound}
          onWrongSound={playWrongSound}
          onTimerTick={playTimerTick}
          onLevelUp={playLevelUp}
          username={currentUser?.username || 'Guest'}
        />
      )}

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

      {/* LEADERBOARD MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        selectedCountry={selectedCountry}
      />

      {/* PROFILE MODAL */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSignOut={async () => {
          console.log('[page.tsx] Diagnostic: signOut() flow initiated...');
          try {
            await signOut(auth);
            console.log('[page.tsx] Diagnostic: signOut() completed successfully.');
          } catch (e) {
            console.error('[page.tsx] Diagnostic: Failed to sign out from Firebase:', e);
          }
        }}
      />

      {/* Streak Celebration Popup */}
      <AnimatePresence>
        {showStreakCelebration && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[90vw] max-w-[360px] rounded-3xl p-6 glass border border-orange-500/30 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(25,12,5,0.98) 0%, rgba(5,5,10,0.98) 100%)',
                boxShadow: '0 0 50px rgba(249,115,22,0.2)'
              }}
            >
              <span className="text-6xl mb-4 block animate-bounce" role="img" aria-label="Fire Emoji">
                🔥
              </span>
              <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.25em] mb-1">
                Visit Streak!
              </h2>
              <h3 className="text-xl font-black text-white mb-2">
                {streak} Day Streak
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-6 px-4">
                You are on fire! Keep exploring the world and viewing live fan reactions daily to keep your streak alive.
              </p>
              <button
                onClick={dismissStreakCelebration}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm tracking-wider cursor-pointer hover:scale-[1.02] transition-all"
              >
                Let's Go!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            {selectedCountry && !isMobile ? (
              <CountryReactionPanel
                key="country-panel"
                country={selectedCountry}
                activeCategory={activeCategory}
                onClose={() => handleSelectCountry(null)}
                onReactionLoaded={setActiveReaction}
                onSelectArticle={setActiveArticle}
                onSelectCountry={handleSelectCountry}
              />
            ) : (
              (!isMobile || !selectedCountry) && (
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
                    onSelectCountry={handleSelectCountry}
                    onPlaySound={playHoverBlip}
                    footballActive={apiStatus?.footballActive}
                    mobileSheetRef={mobileSheet.sheetRef}
                    onSheetPointerDown={mobileSheet.onPointerDown}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mobile Country Bottom Sheet */}
      <AnimatePresence>
        {isMobile && selectedCountry && (
          <MobileCountrySheet
            country={selectedCountry}
            onClose={() => handleSelectCountry(null)}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            activeArticle={activeArticle}
            onSelectArticle={setActiveArticle}
            isPlayEarthActive={isPlayEarthActive}
            onTogglePlayEarth={setIsPlayEarthActive}
            allEvents={filteredEvents}
            username={currentUser?.username || 'Guest'}
            onPlaySound={playHoverBlip}
            onCorrectSound={playCorrectSound}
            onWrongSound={playWrongSound}
            onTimerTick={playTimerTick}
            onLevelUp={playLevelUp}
          />
        )}
      </AnimatePresence>

      {/* Bottom gradient overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none gradient-bottom"
        style={{ zIndex: 10 }}
      />

      {/* UI Overlays (Mini Globe, Timeline, AI Button) */}
      <div 
        className="fixed bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none transition-all duration-300"
        style={isMobile && !isFullScreenGlobe && !isPlayEarthActive ? { bottom: `calc(${mobileSheet.sheetHeightPercent}vh + 16px)` } : undefined}
      >
        
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

        {/* Right: Floating AI & Upload Buttons (Desktop-only) */}
        <div className="hidden lg:flex pointer-events-auto mb-2 mr-0 md:mr-[340px] lg:mr-0 items-center gap-3">
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
            className="h-14 w-14 md:w-auto md:px-5 rounded-2xl flex items-center justify-center md:gap-2 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/40 shadow-[0_0_30px_rgba(230,64,251,0.25)] hover:shadow-[0_0_45px_rgba(230,64,251,0.45)] hover:scale-105 transition-all duration-300 font-bold text-xs tracking-wider text-white cursor-pointer"
            title="Upload Reaction"
          >
            <span>📣</span>
            <span className="hidden md:inline">UPLOAD REACTION</span>
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

      {/* Mobile-Only Floating Action Button Stack (matches user screenshot design) */}
      {isMobile && (
        <div 
          className="fixed right-4 z-40 flex flex-col gap-4.5 items-center pointer-events-auto transition-all duration-300"
          style={{ bottom: isFullScreenGlobe || isPlayEarthActive ? '24px' : `calc(${mobileSheet.sheetHeightPercent}vh + 16px)` }}
        >
          {/* Globe/Fullscreen Toggle */}
          <button
            onClick={() => {
              setIsFullScreenGlobe(!isFullScreenGlobe);
              playHoverBlip();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 border cursor-pointer ${
              !isFullScreenGlobe
                ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
            }`}
            title={isFullScreenGlobe ? "Show Live Events panel" : "Hide Live Events panel"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>

          {/* Microphone/EarthCast Narration Toggle */}
          <button
            onClick={() => {
              earthCast.toggleEarthCast();
              playHoverBlip();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 border cursor-pointer ${
              earthCast.isEarthCastActive
                ? earthCast.narrationState === 'speaking'
                  ? 'bg-red-500/15 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                  : 'bg-cyan-500/15 border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
            }`}
            title={earthCast.isEarthCastActive ? "Mute Narration" : "Unmute Narration"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Megaphone/Speaker Mute/Unmute Toggle */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              playHoverBlip();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 border cursor-pointer ${
              !isMuted
                ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
            }`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Chatbot/Robot (AI Assistant) Toggle */}
          <button
            onClick={() => {
              setIsAssistantOpen(!isAssistantOpen);
              playHoverBlip();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isAssistantOpen
                ? 'bg-cyan-400 text-black border border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.6)] scale-105'
                : 'bg-cyan-500 border border-cyan-400 text-white shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105'
            }`}
            title={isAssistantOpen ? "Close AI Assistant" : "MooEarth AI Assistant"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4M9 16h.01M15 16h.01M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </button>
        </div>
      )}

      {/* First-Time User Guide Overlay */}
      <AnimatePresence>
        {showFirstTimeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] px-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-6 shadow-[0_0_55px_rgba(6,182,212,0.15)] text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(12,12,22,0.96) 0%, rgba(5,5,12,0.96) 100%)',
              }}
            >
              {/* Radial glow */}
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />

              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
                  🌍
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Welcome to MooEarth Live
                  </h2>
                  <p className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
                    Interactive Country Discovery Guide
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-white/70 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex gap-3">
                  <span className="text-lg shrink-0">🔍</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">Dynamic Country Labels</h4>
                    <p className="mt-0.5 leading-relaxed">Zoom the 3D globe to reveal country names and flag emojis. Look for the A-Z directory tab in the sidebar to jump directly to any destination.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-lg shrink-0">🚦</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">Category-Aware Glows</h4>
                    <p className="mt-0.5 leading-relaxed">Observe colored glows around countries indicating active news (blue), sports (green), weather alerts (orange), or tech (purple/cyan).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-lg shrink-0">🏆</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">FIFA World Cup Live Match Tracker</h4>
                    <p className="mt-0.5 leading-relaxed">Countries playing in live World Cup matches will pulse with a gold glow. Check live scores and event cards next to the globe.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-lg shrink-0">🎮</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">Play Earth Quiz Game</h4>
                    <p className="mt-0.5 leading-relaxed">Toggle the game mode in the top navbar. Dynamic question counters will float above countries indicating challenge readiness.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-lg shrink-0">📣</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">Interactive Community Fan Map</h4>
                    <p className="mt-0.5 leading-relaxed">Click any country to open its reaction panel. Upload your own notes, images, or video celebrations to show how your community reacts.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('mooearth_guide_seen', 'true');
                  setShowFirstTimeGuide(false);
                  playHoverBlip();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs tracking-widest text-white uppercase shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                Enter the Living Earth
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
