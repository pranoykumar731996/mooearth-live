'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PlayerGameState, GameBadge } from '@/types';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; avatar: string; country: string } | null;
  onSignOut?: () => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onSignOut }: ProfileModalProps) {
  const [gameState, setGameState] = useState<PlayerGameState | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [loadingRank, setLoadingRank] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    // Load local game state
    try {
      const raw = localStorage.getItem(`mooearth_quiz_progress_${currentUser.username}`);
      if (raw) {
        setGameState(JSON.parse(raw));
      } else {
        // Create initial placeholder if not quizzed yet
        setGameState({
          username: currentUser.username,
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
    } catch (err) {
      console.error('[ProfileModal] Error reading game state:', err);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen || !gameState) return;

    // Fetch user rank from Firestore
    const fetchRank = async () => {
      setLoadingRank(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('xp', '>', gameState.xp));
        const snap = await getDocs(q);
        setRank(snap.size + 1);
      } catch (err) {
        console.error('[ProfileModal] Error fetching rank:', err);
        setRank(null);
      } finally {
        setLoadingRank(false);
      }
    };

    fetchRank();
  }, [isOpen, gameState]);

  const handleShareProfile = async () => {
    if (!currentUser) return;
    
    let refQuery = `?ref=${encodeURIComponent(currentUser.username)}`;
    const shareUrl = `/${refQuery}`; // Link to MooEarth centering or centering profile
    
    const didShare = await shareContent({
      title: `${currentUser.username} Fan Profile — ${BRANDING.name}`,
      text: `🌍 Check out my fan stats on MooEarth Live! Level ${gameState?.level || 1} with ${gameState?.xp || 0} XP and ${gameState?.badges?.length || 0} achievements.`,
      url: shareUrl
    });

    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handleShareBadge = async (badge: GameBadge) => {
    if (!currentUser) return;
    
    let refQuery = `?ref=${encodeURIComponent(currentUser.username)}`;
    const shareUrl = `/play-earth${refQuery}`;
    
    const didShare = await shareContent({
      title: `Achievement Earned — ${BRANDING.name}`,
      text: `🏆 I unlocked the "${badge.emoji} ${badge.label}" badge on MooEarth Live! Can you beat my high score?`,
      url: shareUrl
    });

    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[90vw] max-w-[440px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.1)'
        }}
      >
        {/* Toast Alert */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-4 right-4 z-[110] py-2.5 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/35 text-center text-xs font-bold text-cyan-200 shadow-lg"
            >
              📋 Link copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Fan Profile</h2>
        <p className="text-xs text-white/40 mb-5">Your global stats and unlocked credentials.</p>

        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-5 relative overflow-hidden font-sans">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
            {currentUser.avatar}
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">
              {currentUser.username}
            </h3>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <span>📍 代表</span>
              <span>{currentUser.country}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 font-sans">
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-0.5">Global Rank</span>
            <span className="text-xl font-black text-white">
              {loadingRank ? '...' : rank ? `#${rank}` : 'Unranked'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-0.5">Level</span>
            <span className="text-xl font-black text-cyan-400">
              Lv.{gameState?.level || 1}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-0.5">Total XP</span>
            <span className="text-lg font-black text-white">
              {(gameState?.xp || 0).toLocaleString()} XP
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-0.5">Countries Explored</span>
            <span className="text-lg font-black text-white">
              {gameState?.countriesExplored?.length || 0}
            </span>
          </div>
        </div>

        {/* Badges Section */}
        <div className="flex-1 flex flex-col min-h-0 font-sans">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5">
            Unlocked Achievements ({gameState?.badges?.length || 0})
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {!gameState?.badges || gameState.badges.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/30">
                No badges unlocked yet. Head to the globe and complete country quizzes to earn badges!
              </div>
            ) : (
              gameState.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{badge.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">
                        {badge.label}
                      </p>
                      <p className="text-[9px] text-white/40 leading-snug mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShareBadge(badge)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                    title="Share Badge Achievement"
                  >
                    📤
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Share & Sign Out Buttons */}
        <div className="mt-5 space-y-2 shrink-0">
          <button
            onClick={handleShareProfile}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-cyan-500/35 cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            📤 SHARE PROFILE LINK
          </button>
          <button
            onClick={() => {
              if (onSignOut) onSignOut();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/25 text-red-400 font-bold text-xs tracking-wider cursor-pointer transition-colors"
          >
            SIGN OUT
          </button>
        </div>
      </motion.div>
    </div>
  );
}
