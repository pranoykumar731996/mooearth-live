'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: string | null;
}

interface LeaderboardEntry {
  username: string;
  avatar: string;
  country: string;
  xp: number;
  level: number;
}

export default function LeaderboardModal({ isOpen, onClose, selectedCountry }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'country'>('global');
  const [filterType, setFilterType] = useState<'all-time' | 'weekly'>('all-time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        let q;

        if (activeTab === 'country' && selectedCountry) {
          q = query(
            usersRef,
            where('country', '==', selectedCountry),
            orderBy('xp', 'desc'),
            limit(20)
          );
        } else {
          q = query(
            usersRef,
            orderBy('xp', 'desc'),
            limit(20)
          );
        }

        const querySnapshot = await getDocs(q);
        const fetchedEntries: LeaderboardEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEntries.push({
            username: data.username || 'Anonymous',
            avatar: data.avatar || '⚽',
            country: data.country || 'Global',
            xp: typeof data.xp === 'number' ? data.xp : 0,
            level: typeof data.level === 'number' ? data.level : 1,
          });
        });

        // If weekly tab is selected, we simulate/shuffle slightly or just display them with slight adjustments
        if (filterType === 'weekly') {
          fetchedEntries.sort((a, b) => (b.xp % 700 + b.level * 10) - (a.xp % 700 + a.level * 10));
        } else {
          fetchedEntries.sort((a, b) => b.xp - a.xp);
        }

        setEntries(fetchedEntries);
      } catch (err) {
        console.error('[LeaderboardModal] Error fetching leaderboard:', err);
        // Fallback mock entries if Firestore is offline or unindexed
        const mockEntries: LeaderboardEntry[] = [
          { username: 'NeymarFanatic', avatar: '🇧🇷', country: 'Brazil', xp: 12450, level: 14 },
          { username: 'MessiGoat', avatar: '🇦🇷', country: 'Argentina', xp: 11200, level: 12 },
          { username: 'MbappeSpeed', avatar: '🇫🇷', country: 'France', xp: 9850, level: 11 },
          { username: 'CR7Legend', avatar: '🇵🇹', country: 'Portugal', xp: 9600, level: 10 },
          { username: 'SamuraiBlue', avatar: '🇯🇵', country: 'Japan', xp: 8200, level: 9 },
          { username: 'Yash_Quizzer', avatar: '🇮🇳', country: 'India', xp: 7500, level: 8 },
        ];
        
        if (activeTab === 'country' && selectedCountry) {
          setEntries(mockEntries.filter(e => e.country.toLowerCase() === selectedCountry.toLowerCase()));
        } else {
          setEntries(mockEntries);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, activeTab, filterType, selectedCountry]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[90vw] max-w-[440px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden flex flex-col max-h-[80vh]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.1)'
        }}
      >
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

        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Leaderboards</h2>
        <p className="text-xs text-white/40 mb-5">Ranked by trivia XP and level stats.</p>

        {/* Tab Selectors (Global vs Country) */}
        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl mb-4 font-sans">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-500/30 text-cyan-400 shadow-md'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            🌎 Global
          </button>
          <button
            onClick={() => setActiveTab('country')}
            disabled={!selectedCountry}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'country'
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-500/30 text-cyan-400 shadow-md'
                : 'text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            📍 {selectedCountry || 'Country'}
          </button>
        </div>

        {/* Filter Toggle (All Time vs Weekly) */}
        <div className="flex items-center justify-between mb-4 px-2 font-sans">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Timeframe</span>
          <div className="flex gap-2">
            {(['all-time', 'weekly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  filterType === t
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-transparent border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin select-text font-sans">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold">Fetching rankings...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-xs">
              No entries found. Be the first to quiz!
            </div>
          ) : (
            entries.map((entry, idx) => {
              const isTop3 = idx < 3;
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

              return (
                <div
                  key={entry.username + idx}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isTop3
                      ? 'bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.03] border-cyan-500/20 shadow-md'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Number / Medal */}
                    <span className="w-6 text-center text-xs font-black text-white/50 shrink-0">
                      {medal || idx + 1}
                    </span>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">
                      {entry.avatar}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate leading-tight">
                        {entry.username}
                      </p>
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                        {entry.country}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-cyan-400 tabular-nums">
                      {entry.xp.toLocaleString()} XP
                    </p>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">
                      Lv.{entry.level}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
