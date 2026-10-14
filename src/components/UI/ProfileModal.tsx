// ============================================================
// MooEarth.Live — Personalization & Profile Dashboard
// ============================================================
// Supports:
// - Authenticated profiles & Guest Explorer mode
// - Saved places (bookmarks) with 1-click globe flyTo & city explore
// - Personalized news & discovery preferences (topics & countries)
// - Bounded discovery history with 1-click clear
// - Real game progression stats (no fake/fabricated data)
// - Account privacy controls, sign out, and data deletion

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { PlayerGameState, GameBadge } from '@/types';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';
import {
  SavedPlace,
  UserPreferences,
  DiscoveryHistoryItem,
  getGuestSavedPlaces,
  removeGuestPlace,
  getGuestPreferences,
  saveGuestPreferences,
  getGuestDiscoveryHistory,
  clearDiscoveryHistory,
  fetchUserProfile,
  updateUserProfile,
  deleteUserData,
} from '@/services/personalizationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALES_META, SupportedLocale } from '@/lib/i18n';
import { MooEarthPlusModal } from '@/components/Monetization/MooEarthPlusModal';
import { DiscoveryCollection } from '@/types/collections';
import {
  getUserCollections,
  deleteCollection,
  publishCollection,
  unpublishCollection,
} from '@/services/collectionService';
import CollectionBuilderModal from '@/components/Collections/CollectionBuilderModal';
import { getCollectionShareUrl, copyToClipboard } from '@/utils/share';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; avatar: string; country: string; uid?: string } | null;
  onSignOut?: () => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectLocation?: (location: any) => void;
  onFocusCoordinates?: (coords: { lat: number; lng: number }) => void;
  onOpenAuth?: () => void;
  onStartCollectionTour?: (collection: DiscoveryCollection) => void;
}

type ProfileTab = 'overview' | 'saved' | 'preferences' | 'collections' | 'history' | 'account';

const AVAILABLE_TOPICS = [
  { id: 'breaking', label: 'World News', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'business', label: 'Business & Finance', emoji: '📈' },
  { id: 'science', label: 'Science & Environment', emoji: '🔬' },
  { id: 'entertainment', label: 'Culture & Entertainment', emoji: '🎬' },
  { id: 'sports', label: 'Sports & Athletics', emoji: '⚽' },
];

const POPULAR_COUNTRIES = [
  'Japan', 'France', 'Brazil', 'United States', 'United Kingdom',
  'Germany', 'India', 'Canada', 'Australia', 'Spain', 'Italy',
  'South Korea', 'Mexico', 'Argentina', 'South Africa', 'Egypt'
];

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onSelectCountry,
  onSelectLocation,
  onFocusCoordinates,
  onOpenAuth,
  onStartCollectionTour,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const { locale, setLocale, dict, allLocales, t } = useLanguage();
  
  // Real Game State
  const [gameState, setGameState] = useState<PlayerGameState | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loadingRank, setLoadingRank] = useState(false);

  // Personalization State
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(getGuestPreferences());
  const [discoveryHistory, setDiscoveryHistory] = useState<DiscoveryHistoryItem[]>([]);
  const [bookmarkFilter, setBookmarkFilter] = useState<'all' | 'places' | 'articles'>('all');

  // Curated Discovery Collections State (Phase 10)
  const [collections, setCollections] = useState<DiscoveryCollection[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<DiscoveryCollection | null>(null);
  const [collectionCopiedId, setCollectionCopiedId] = useState<string | null>(null);

  const reloadCollections = useCallback(async () => {
    try {
      const cols = await getUserCollections(currentUser?.uid);
      setCollections(cols);
    } catch (e) {
      console.warn('Failed to load collections:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      reloadCollections();
    }
  }, [isOpen, reloadCollections]);

  const filteredSavedPlaces = useMemo(() => {
    if (bookmarkFilter === 'places') return savedPlaces.filter((p) => p.type !== 'article');
    if (bookmarkFilter === 'articles') return savedPlaces.filter((p) => p.type === 'article');
    return savedPlaces;
  }, [savedPlaces, bookmarkFilter]);
  
  // Edit Profile State
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('🌍');
  const [editCountry, setEditCountry] = useState('Global');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  
  // Confirmations & Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isConfirmingClearHistory, setIsConfirmingClearHistory] = useState(false);
  const [isConfirmingDeleteAccount, setIsConfirmingDeleteAccount] = useState(false);
  const [isPlusModalOpen, setIsPlusModalOpen] = useState(false);

  // 1. Initial State Load
  const loadData = useCallback(async () => {
    if (currentUser?.uid) {
      // Authenticated User
      const profile = await fetchUserProfile(currentUser.uid);
      if (profile) {
        setSavedPlaces(profile.savedPlaces);
        setPreferences(profile.preferences);
        setDiscoveryHistory(profile.discoveryHistory);
        setEditUsername(profile.username);
        setEditAvatar(profile.avatar);
        setEditCountry(profile.country);
      } else {
        setSavedPlaces(getGuestSavedPlaces());
        setPreferences(getGuestPreferences());
        setDiscoveryHistory(getGuestDiscoveryHistory());
        setEditUsername(currentUser.username);
        setEditAvatar(currentUser.avatar);
        setEditCountry(currentUser.country);
      }
    } else {
      // Guest User
      setSavedPlaces(getGuestSavedPlaces());
      setPreferences(getGuestPreferences());
      setDiscoveryHistory(getGuestDiscoveryHistory());
      setEditUsername(currentUser?.username || 'Guest Explorer');
      setEditAvatar(currentUser?.avatar || '🌍');
      setEditCountry(currentUser?.country || 'Planet Earth');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.key === 'saved_places') {
        setSavedPlaces(e.detail.payload);
      } else if (e.detail?.key === 'preferences') {
        setPreferences(e.detail.payload);
      } else if (e.detail?.key === 'history') {
        setDiscoveryHistory(e.detail.payload);
      }
    };
    window.addEventListener('mooearth_personalization_update', handleSync);
    return () => window.removeEventListener('mooearth_personalization_update', handleSync);
  }, []);

  // 2. Load Local Game Progression (Real Data Only)
  useEffect(() => {
    if (!isOpen) return;

    try {
      const usernameKey = currentUser?.username || 'guest';
      const raw = localStorage.getItem(`mooearth_quiz_progress_${usernameKey}`);
      if (raw) {
        setGameState(JSON.parse(raw));
      } else {
        setGameState({
          username: usernameKey,
          xp: 0,
          level: 1,
          streak: 0,
          bestStreak: 0,
          totalCorrect: 0,
          totalAnswered: 0,
          answeredIds: [],
          answeredQuestionIds: [],
          recentQuestions: [],
          recentCountryQuestions: [],
          countriesExplored: [],
          badges: [],
        });
      }
    } catch {
      // Fallback
    }
  }, [isOpen, currentUser]);

  // 3. Fetch Global Rank
  useEffect(() => {
    if (!isOpen || !gameState || gameState.xp === 0 || !currentUser) {
      setRank(null);
      return;
    }

    const fetchRank = async () => {
      setLoadingRank(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('xp', '>', gameState.xp));
        const snap = await getDocs(q);
        setRank(snap.size + 1);
      } catch {
        setRank(null);
      } finally {
        setLoadingRank(false);
      }
    };

    fetchRank();
  }, [isOpen, gameState, currentUser]);

  // Helper Toast Trigger
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Saved Place Handlers
  const handleRemoveSavedPlace = (placeId: string) => {
    const updated = removeGuestPlace(placeId);
    setSavedPlaces(updated);
    if (currentUser?.uid) {
      updateUserProfile(currentUser.uid, { savedPlaces: updated });
    }
    triggerToast('Location removed from saved places');
  };

  const handleOpenSavedPlaceOnGlobe = (place: SavedPlace) => {
    onClose();
    if (place.coordinates && onFocusCoordinates) {
      onFocusCoordinates(place.coordinates);
    }
    if (place.type === 'country' && onSelectCountry) {
      onSelectCountry(place.country || place.name);
    } else if (place.type === 'city' && onSelectLocation) {
      onSelectLocation({
        id: place.id,
        name: place.name,
        country: place.country || '',
        state: place.state || '',
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
        type: 'city',
      });
    } else if (place.type === 'article' && place.country && onSelectCountry) {
      onSelectCountry(place.country);
    }
  };

  const handleSharePlace = async (place: SavedPlace) => {
    const url = typeof window !== 'undefined'
      ? place.type === 'article' && place.url
        ? place.url
        : `${window.location.origin}/?${
            place.type === 'country'
              ? `country=${encodeURIComponent(place.country || place.name)}`
              : `city=${encodeURIComponent(place.name)}&lat=${place.coordinates.lat.toFixed(4)}&lng=${place.coordinates.lng.toFixed(4)}`
          }`
      : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${place.name} — MooEarth Live`,
          text: place.type === 'article' ? `Read "${place.name}" on MooEarth Live!` : `Check out ${place.name} on MooEarth.Live!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        triggerToast('📋 Link copied to clipboard!');
      }
    } catch {
      // Dismissed
    }
  };

  // Preference Handlers
  const handleToggleTopic = (topicId: string) => {
    const current = preferences.favoriteTopics || [];
    const next = current.includes(topicId)
      ? current.filter((t) => t !== topicId)
      : [...current, topicId];
    const updated = saveGuestPreferences({ favoriteTopics: next });
    setPreferences(updated);
    if (currentUser?.uid) {
      updateUserProfile(currentUser.uid, { preferences: updated });
    }
  };

  const handleToggleCountry = (country: string) => {
    const current = preferences.favoriteCountries || [];
    const next = current.includes(country)
      ? current.filter((c) => c !== country)
      : [...current, country];
    const updated = saveGuestPreferences({ favoriteCountries: next });
    setPreferences(updated);
    if (currentUser?.uid) {
      updateUserProfile(currentUser.uid, { preferences: updated });
    }
  };

  const handleTogglePersonalizedFeed = () => {
    const updated = saveGuestPreferences({
      isPersonalizedFeedActive: !preferences.isPersonalizedFeedActive,
    });
    setPreferences(updated);
    if (currentUser?.uid) {
      updateUserProfile(currentUser.uid, { preferences: updated });
    }
    triggerToast(
      updated.isPersonalizedFeedActive
        ? 'Personalized news ranking enabled'
        : 'Global live news feed restored'
    );
  };

  // History Handlers
  const handleClearHistory = () => {
    clearDiscoveryHistory();
    setDiscoveryHistory([]);
    if (currentUser?.uid) {
      updateUserProfile(currentUser.uid, { discoveryHistory: [] });
    }
    setIsConfirmingClearHistory(false);
    triggerToast('Discovery history cleared');
  };

  // Account Profile Update
  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    setIsSavingProfile(true);
    const success = await updateUserProfile(currentUser.uid, {
      username: editUsername,
      avatar: editAvatar,
      country: editCountry,
    });
    setIsSavingProfile(false);
    if (success) {
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    }
  };

  // Delete User Account & Data
  const handleDeleteAccount = async () => {
    if (!currentUser?.uid) return;
    const ok = await deleteUserData(currentUser.uid);
    if (ok) {
      if (onSignOut) onSignOut();
      onClose();
      triggerToast('Account and personal data permanently deleted');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="w-full max-w-[560px] rounded-3xl glass border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 32, 0.98) 0%, rgba(6, 9, 20, 0.98) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(0, 229, 255, 0.12)',
        }}
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-4 right-4 z-[120] py-2.5 px-4 rounded-xl bg-cyan-500/25 border border-cyan-400/40 text-center text-xs font-bold text-cyan-200 shadow-xl backdrop-blur-md"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Neon Backlights */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="p-5 pb-3 border-b border-white/[0.08] relative z-10 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {currentUser?.avatar || '🌍'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {currentUser?.username || 'Guest Explorer'}
                </h2>
                {!currentUser && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    GUEST
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                <span>📍 {currentUser?.country || 'Planet Earth'}</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  {currentUser ? `Level ${gameState?.level || 1}` : 'Local Browser Session'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Profile Dashboard"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Guest Conversion Banner */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-cyan-200/90 font-medium truncate">
              💡 Sign in to sync your saved places and streaks across devices.
            </span>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="px-3 py-1 rounded-lg bg-cyan-500 text-black font-extrabold text-[11px] tracking-wide hover:bg-cyan-400 cursor-pointer transition-all shrink-0"
            >
              SIGN IN
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] bg-black/20 p-1.5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: dict.profile?.tabs?.overview || 'Overview', icon: '🏆' },
            { id: 'saved', label: `${dict.profile?.tabs?.saved || 'Saved'} (${savedPlaces.length})`, icon: '★' },
            { id: 'collections', label: `Collections (${collections.length})`, icon: '🧭' },
            { id: 'preferences', label: dict.profile?.tabs?.preferences || 'Interests', icon: '🎯' },
            { id: 'history', label: `${dict.profile?.tabs?.history || 'History'} (${discoveryHistory.length})`, icon: '⏱️' },
            { id: 'account', label: dict.profile?.tabs?.account || 'Privacy', icon: '🛡️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin relative z-10 min-h-0">
          
          {/* ── TAB 1: OVERVIEW & REAL STATS ───────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4 font-sans">
              {/* Stats 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-1">
                    {dict.profile?.stats?.rank || 'GLOBAL RANK'}
                  </span>
                  <span className="text-xl font-black text-white">
                    {loadingRank ? '...' : rank ? `#${rank}` : currentUser ? 'Unranked' : 'Guest'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-1">
                    {dict.profile?.stats?.level || 'EXPLORER LEVEL'}
                  </span>
                  <span className="text-xl font-black text-cyan-400">
                    Lv.{gameState?.level || 1}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-1">
                    {dict.profile?.stats?.xp || 'EXPERIENCE XP'}
                  </span>
                  <span className="text-lg font-black text-white">
                    {(gameState?.xp || 0).toLocaleString()} XP
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-1">
                    {dict.profile?.stats?.explored || 'COUNTRIES EXPLORED'}
                  </span>
                  <span className="text-lg font-black text-white">
                    {gameState?.countriesExplored?.length || 0}
                  </span>
                </div>
              </div>

              {/* Achievements Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-black text-white/50 uppercase tracking-widest">
                    UNLOCKED ACHIEVEMENTS ({gameState?.badges?.length || 0})
                  </span>
                </div>

                {!gameState?.badges || gameState.badges.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/40 space-y-1">
                    <p className="text-lg mb-1">🎖️</p>
                    <p className="font-semibold text-white/70">No badges unlocked yet</p>
                    <p>Play Earth challenges or explore sovereign nations on the 3D globe to earn achievements.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gameState.badges.map((badge: GameBadge) => (
                      <div
                        key={badge.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{badge.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{badge.label}</p>
                            <p className="text-[10px] text-white/40 leading-snug mt-0.5">{badge.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MooEarth Plus Early Access Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                      Feature Validation
                    </span>
                    <span className="text-xs font-bold text-white">MooEarth Plus</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Shape our community roadmap: vote on ad-free exploration, unlimited pinned places, and advanced weather radar.
                  </p>
                </div>
                <button
                  onClick={() => setIsPlusModalOpen(true)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Explore Plus →
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: SAVED PLACES (BOOKMARKS) ────────────────────────── */}
          {activeTab === 'saved' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>Locations and stories bookmarked across MooEarth</span>
                <span className="font-mono text-[11px] text-cyan-400">{savedPlaces.length}/50</span>
              </div>

              {/* Filter Pills */}
              {savedPlaces.length > 0 && (
                <div className="flex items-center gap-1.5 pb-1">
                  <button
                    onClick={() => setBookmarkFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      bookmarkFilter === 'all'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                        : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                    }`}
                  >
                    All ({savedPlaces.length})
                  </button>
                  <button
                    onClick={() => setBookmarkFilter('places')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      bookmarkFilter === 'places'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                        : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                    }`}
                  >
                    Places ({savedPlaces.filter((p) => p.type !== 'article').length})
                  </button>
                  <button
                    onClick={() => setBookmarkFilter('articles')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      bookmarkFilter === 'articles'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                        : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                    }`}
                  >
                    Stories ({savedPlaces.filter((p) => p.type === 'article').length})
                  </button>
                </div>
              )}

              {savedPlaces.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/40 space-y-2">
                  <p className="text-3xl mb-1">★</p>
                  <p className="font-bold text-white/80">No saved bookmarks yet</p>
                  <p className="max-w-[340px] mx-auto text-white/50 leading-relaxed">
                    Click the star icon (★) in any Country, City, or News Article to save for 1-click planetary access.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 font-bold text-xs hover:bg-cyan-500/30 cursor-pointer transition-all"
                  >
                    Explore 3D Globe
                  </button>
                </div>
              ) : filteredSavedPlaces.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/40 space-y-1">
                  <p className="font-bold text-white/70">No {bookmarkFilter} bookmarked</p>
                  <p className="text-[11px] text-white/40">Switch back to "All" to view your other saved items.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSavedPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl shrink-0">{place.flag || (place.type === 'article' ? '📰' : '📍')}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{place.name}</p>
                          <p className="text-[10px] text-white/40 font-mono truncate flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded font-black uppercase tracking-wider text-[9px] ${
                              place.type === 'article'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {place.type === 'article' ? 'Story' : place.type}
                            </span>
                            <span>•</span>
                            <span>{place.publisher ? `${place.publisher} • ` : ''}{place.country || 'Global'}</span>
                            {place.coordinates && (
                              <span>({place.coordinates.lat.toFixed(1)}°, {place.coordinates.lng.toFixed(1)}°)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Read link for articles */}
                        {place.type === 'article' && place.url && (
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Read source report"
                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span>Read</span>
                            <span>↗</span>
                          </a>
                        )}

                        {/* Fly to Globe */}
                        <button
                          onClick={() => handleOpenSavedPlaceOnGlobe(place)}
                          title="Fly to location on 3D Globe"
                          className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <span>Fly</span>
                          <span>🌐</span>
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleSharePlace(place)}
                          title="Share link"
                          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        >
                          ↗
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveSavedPlace(place.id)}
                          title="Remove bookmark"
                          className="w-7 h-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: COLLECTIONS (Phase 10 Curated Experiences) ──────── */}
          {activeTab === 'collections' && (
            <div className="space-y-4 font-sans">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                    <span>🧭</span>
                    <span>Curated Discovery Collections</span>
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Build interactive world tours with verified locations, educator notes, and quiz checkpoints.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCollection(null);
                    setIsBuilderOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Create Collection</span>
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-3">
                  <div className="text-3xl">🧭</div>
                  <div className="text-sm font-bold text-white">No Discovery Collections Yet</div>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Assemble your favorite geographic spots, world landmarks, or educational journeys and share them with the community.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCollection(null);
                      setIsBuilderOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Start with a Template ➔
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {collections.map((col) => {
                    const isPublished = col.status === 'published';
                    const isCopied = collectionCopiedId === col.id;
                    return (
                      <div
                        key={col.id}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                              {col.coverEmoji || '🧭'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isPublished
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                }`}>
                                  {isPublished ? '● Published' : '○ Private Draft'}
                                </span>
                                <span className="text-[11px] text-white/40">
                                  {col.totalLocations} {col.totalLocations === 1 ? 'stop' : 'stops'}
                                </span>
                                {col.viewsCount !== undefined && col.viewsCount > 0 && (
                                  <span className="text-[10px] text-white/40 font-mono">
                                    👁️ {col.viewsCount}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-white truncate mt-1">
                                {col.title}
                              </h4>
                              {col.description && (
                                <p className="text-xs text-white/60 line-clamp-2 mt-0.5">
                                  {col.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-2">
                            {/* Tour in Globe */}
                            <button
                              onClick={() => {
                                if (onStartCollectionTour) {
                                  onStartCollectionTour(col);
                                  onClose();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>🌍</span>
                              <span>Tour in Globe</span>
                            </button>

                            {/* Share button */}
                            {isPublished && (
                              <button
                                onClick={async () => {
                                  const url = getCollectionShareUrl(col.id);
                                  await copyToClipboard(url);
                                  setCollectionCopiedId(col.id);
                                  setTimeout(() => setCollectionCopiedId(null), 2000);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {isCopied ? <span className="text-emerald-400 font-bold">Copied!</span> : <span>Share ↗</span>}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Toggle Publish/Unpublish */}
                            <button
                              onClick={async () => {
                                if (isPublished) {
                                  await unpublishCollection(col.id, currentUser);
                                } else {
                                  await publishCollection(col.id, currentUser);
                                }
                                reloadCollections();
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer"
                            >
                              {isPublished ? 'Unpublish' : 'Publish'}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingCollection(col);
                                setIsBuilderOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            >
                              Edit ✏️
                            </button>

                            {/* Delete */}
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${col.title}"?`)) {
                                  await deleteCollection(col.id, currentUser);
                                  reloadCollections();
                                }
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            >
                              Delete 🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: PERSONALIZED INTERESTS & PREFERENCES ────────────── */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 font-sans text-xs">
              {/* Language Preference Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-cyan-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      <span>🌐</span>
                      <span>{dict.profile?.preferences?.languageTitle || 'Preferred Language'}</span>
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                      {dict.profile?.preferences?.languageSubtitle || 'Select your preferred language for discovery, AI summaries, and geography games.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shrink-0">
                    {LOCALES_META[locale]?.nativeName || locale.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {allLocales.map((locCode) => {
                    const meta = LOCALES_META[locCode];
                    const isSelected = locale === locCode;
                    return (
                      <button
                        key={locCode}
                        onClick={() => {
                          setLocale(locCode);
                          const updated = saveGuestPreferences({ preferredLanguage: locCode });
                          setPreferences(updated);
                          if (currentUser?.uid) {
                            updateUserProfile(currentUser.uid, { preferences: updated });
                          }
                          triggerToast(`🌐 ${meta.name} (${meta.nativeName})`);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md font-bold'
                            : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="text-base">{meta.flag}</span>
                        <span className="text-[11px] font-bold leading-tight">{meta.nativeName}</span>
                        <span className="text-[9px] text-white/40">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feed Personalization Mode Toggle */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/20 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm">{dict.profile?.preferences?.feedToggleTitle || 'Personalized Feed Ranking'}</p>
                  <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                    {dict.profile?.preferences?.feedToggleSubtitle || 'Prioritize news headlines matching your favorite topics and countries in the live feed.'}
                  </p>
                </div>
                <button
                  onClick={handleTogglePersonalizedFeed}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    preferences.isPersonalizedFeedActive ? 'bg-cyan-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.isPersonalizedFeedActive ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Topics Selection */}
              <div>
                <p className="text-[11px] font-mono font-black text-white/50 uppercase tracking-widest mb-2">
                  FAVORITE TOPICS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TOPICS.map((topic) => {
                    const isSelected = preferences.favoriteTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleToggleTopic(topic.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 shadow-sm'
                            : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <span className="text-xl">{topic.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{topic.label}</p>
                          <p className="text-[9px] text-white/40">{isSelected ? 'Active' : 'Off'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Countries */}
              <div>
                <p className="text-[11px] font-mono font-black text-white/50 uppercase tracking-widest mb-2">
                  FAVORITE COUNTRIES & REGIONS
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                  {POPULAR_COUNTRIES.map((country) => {
                    const isSelected = preferences.favoriteCountries.includes(country);
                    return (
                      <button
                        key={country}
                        onClick={() => handleToggleCountry(country)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: DISCOVERY HISTORY ──────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>Recently explored countries, cities & challenges</span>
                {discoveryHistory.length > 0 && (
                  <button
                    onClick={() => setIsConfirmingClearHistory(true)}
                    className="text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Confirm Clear Modal */}
              {isConfirmingClearHistory && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs space-y-2">
                  <p className="font-bold text-red-200">Clear entire exploration history?</p>
                  <p className="text-white/60 text-[11px]">
                    This will permanently remove your recently viewed places log from this session.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px] hover:bg-red-500 cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setIsConfirmingClearHistory(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-[11px] hover:bg-white/20 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {discoveryHistory.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/40 space-y-1">
                  <p className="text-2xl mb-1">⏱️</p>
                  <p className="font-bold text-white/70">No exploration history yet</p>
                  <p>Locations and challenges you explore will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {discoveryHistory.map((item) => (
                    <div
                      key={`${item.id}-${item.timestamp}`}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{item.flag || '📍'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-white/40 truncate mt-0.5">
                            {item.subtitle || item.type.toUpperCase()} • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {item.coordinates && (
                        <button
                          onClick={() => {
                            onClose();
                            if (onFocusCoordinates) onFocusCoordinates(item.coordinates!);
                            if (item.type === 'country' && onSelectCountry) {
                              onSelectCountry(item.country || item.title);
                            } else if (item.type === 'article' && item.country && onSelectCountry) {
                              onSelectCountry(item.country);
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          View 🌐
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 5: ACCOUNT & PRIVACY CONTROLS ──────────────────────── */}
          {activeTab === 'account' && (
            <div className="space-y-4 font-sans text-xs">
              {/* Profile Editor (Authenticated Only) */}
              {currentUser ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <p className="font-bold text-white text-sm">Edit Profile Information</p>
                  <div>
                    <label className="text-[10px] text-white/40 font-mono uppercase block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      maxLength={40}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 font-mono uppercase block mb-1">Avatar Emoji</label>
                    <div className="flex gap-2">
                      {['🌍', '👑', '⚽', '🚀', '🌟', '🧭', '🦁', '🦊'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setEditAvatar(emoji)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg cursor-pointer ${
                            editAvatar === emoji
                              ? 'bg-cyan-500/20 border-cyan-400'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    {profileSuccessMsg && (
                      <span className="text-emerald-400 text-[11px] font-bold">{profileSuccessMsg}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                  <p className="font-bold text-white text-sm">Guest Session</p>
                  <p className="text-white/50 text-[11px] leading-relaxed">
                    You are exploring anonymously. Create a free profile to secure your display name and sync saved places across devices.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                  >
                    Create Account / Sign In
                  </button>
                </div>
              )}

              {/* Privacy Transparency Statement */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Data Protection & Privacy Safeguards</span>
                </p>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  MooEarth values your digital sovereignty:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-white/40 text-[11px]">
                  <li>We never sell your data or display targeted advertising trackers.</li>
                  <li>Continuous GPS coordinates and camera movements are never logged.</li>
                  <li>Your discovery history and saved bookmarks are strictly private to you.</li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('mooearth_open_consent_preferences'));
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-semibold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>🍪</span>
                    <span>Manage Cookie & Consent Preferences</span>
                  </button>
                </div>
              </div>

              {/* Sign Out & Account Deletion */}
              <div className="space-y-2 pt-2">
                {currentUser && (
                  <button
                    onClick={() => {
                      if (onSignOut) onSignOut();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-wider cursor-pointer transition-colors"
                  >
                    SIGN OUT
                  </button>
                )}

                {currentUser && !isConfirmingDeleteAccount && (
                  <button
                    onClick={() => setIsConfirmingDeleteAccount(true)}
                    className="w-full py-2 rounded-xl text-red-400/80 hover:text-red-300 text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    Delete Account & Stored Data
                  </button>
                )}

                {isConfirmingDeleteAccount && (
                  <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs space-y-2">
                    <p className="font-bold text-red-200">Permanently delete account?</p>
                    <p className="text-white/60 text-[11px]">
                      This will delete your user document, saved bookmarks, and history from our database. This action cannot be undone.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px] hover:bg-red-500 cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setIsConfirmingDeleteAccount(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-[11px] hover:bg-white/20 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] relative z-10 flex items-center justify-between gap-3 shrink-0 bg-black/40">
          <button
            onClick={() => {
              shareContent({
                title: `${BRANDING.name} — Living 3D Globe`,
                text: `Explore Earth live with real-time news, weather, and world intelligence!`,
                url: typeof window !== 'undefined' ? window.location.origin : 'https://mooearth.live',
              });
            }}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Share MooEarth</span>
            <span>↗</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs tracking-wider cursor-pointer transition-all shadow-md"
          >
            RETURN TO GLOBE
          </button>
        </div>
      </motion.div>

      {/* MooEarth Plus Demand Validation Modal */}
      <MooEarthPlusModal
        isOpen={isPlusModalOpen}
        onClose={() => setIsPlusModalOpen(false)}
        source="profile_dashboard"
      />

      {/* Curated Collection Builder Modal (Phase 10) */}
      <CollectionBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingCollection(null);
        }}
        editingCollection={editingCollection}
        currentUser={currentUser}
        onCollectionSaved={() => {
          reloadCollections();
          setIsBuilderOpen(false);
          setEditingCollection(null);
        }}
      />
    </div>
  );
}
