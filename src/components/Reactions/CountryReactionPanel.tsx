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
  onReactionLoaded?: (data: ReactionEvent) => void;
}

export default function CountryReactionPanel({ country, onClose, onReactionLoaded }: CountryReactionPanelProps) {
  const [reactionData, setReactionData] = useState<ReactionEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Mobile Viewport (Phase 9 Mobile Experience)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/reactions?country=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        if (data.reaction) {
          setReactionData(data.reaction);
          if (onReactionLoaded) {
            onReactionLoaded(data.reaction);
          }
        }
      })
      .catch(err => console.error('Failed to load reactions:', err))
      .finally(() => setIsLoading(false));
  }, [country, onReactionLoaded]);

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
          onClick={onClose}
          className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white mb-0.5 tracking-tight">{country}</h2>
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Live Reaction Dashboard</p>
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
            
            {/* V2 Emotional Intensity Meter */}
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

            {/* V2 Live Match Status */}
            {reactionData.headlines.some(h => h.footballData) && (
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
            <ReactionFeed headlines={reactionData.headlines} posts={reactionData.socialPosts} />
          </div>
        ) : (
          <div className="p-6 text-center text-white/50">Failed to load reactions.</div>
        )}
      </div>
    </motion.div>
  );
}
