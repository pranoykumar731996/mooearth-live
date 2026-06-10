'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionEvent } from '@/types';
import SentimentBadge from './SentimentBadge';
import TrendingHashtags from './TrendingHashtags';
import ReactionFeed from './ReactionFeed';

interface CountryReactionPanelProps {
  country: string;
  onClose: () => void;
}

export default function CountryReactionPanel({ country, onClose }: CountryReactionPanelProps) {
  const [reactionData, setReactionData] = useState<ReactionEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/reactions?country=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        if (data.reaction) {
          setReactionData(data.reaction);
        }
      })
      .catch(err => console.error('Failed to load reactions:', err))
      .finally(() => setIsLoading(false));
  }, [country]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-6 top-24 bottom-24 w-96 z-40 rounded-3xl glass flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
      style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.95) 100%)' }}
    >
      {/* Header */}
      <div className="relative px-6 py-5 border-b border-white/[0.05]">
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{country}</h2>
        <p className="text-sm text-white/50">Live Reaction Dashboard</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <p className="text-sm text-cyan-400/60 uppercase tracking-widest font-medium animate-pulse">Syncing Global Mood...</p>
          </div>
        ) : reactionData ? (
          <div className="p-6 space-y-6">
            <SentimentBadge sentiment={reactionData.sentiment} />
            <TrendingHashtags hashtags={reactionData.trendingHashtags} />
            <ReactionFeed headlines={reactionData.headlines} posts={reactionData.socialPosts} />
          </div>
        ) : (
          <div className="p-6 text-center text-white/50">Failed to load reactions.</div>
        )}
      </div>
    </motion.div>
  );
}
