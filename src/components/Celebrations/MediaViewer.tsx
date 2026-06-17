'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Celebration {
  id: string;
  username: string;
  avatar: string;
  country: string;
  match: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  comment: string;
  timestamp: number;
  reports: number;
}

interface MediaViewerProps {
  celebration: Celebration | null;
  onClose: () => void;
  onReportSuccess?: (id: string) => void;
}

export default function MediaViewer({ celebration, onClose, onReportSuccess }: MediaViewerProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);

  if (!celebration) return null;

  const { id, username, avatar, country, match, type, url, comment, timestamp } = celebration;

  const handleReport = async () => {
    setIsReporting(true);
    try {
      // Direct Firestore update for reports
      const docRef = doc(db, 'celebrations', id);
      await updateDoc(docRef, {
        reports: increment(1)
      });
      setReported(true);
      if (onReportSuccess) {
        setTimeout(() => {
          onReportSuccess(id);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to report content in Firestore, trying API fallback:', error);
      try {
        const res = await fetch('/api/celebrations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'report' }),
        });
        if (res.ok) {
          setReported(true);
          if (onReportSuccess) {
            setTimeout(() => {
              onReportSuccess(id);
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Failed to report content via legacy API:', err);
      }
    } finally {
      setIsReporting(false);
    }
  };

  const formattedDate = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[92vw] max-w-[500px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(12,12,22,0.96) 0%, rgba(5,5,12,0.96) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 229, 255, 0.15)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Profile/Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-2xl shadow-inner">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">{username}</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-semibold border border-cyan-400/20">
                {country}
              </span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
              Uploaded at {formattedDate} • {match}
            </p>
          </div>
        </div>

        {/* Media Container */}
        <div className="w-full aspect-video bg-black/60 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative mb-5">
          {type === 'video' && (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}

          {type === 'image' && (
            <img
              src={url}
              alt="Fan celebration post"
              className="w-full h-full object-contain"
            />
          )}

          {type === 'audio' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4 bg-gradient-to-b from-blue-950/20 to-black/40">
              <span className="text-4xl animate-bounce">🎤</span>
              {/* Dynamic Sound Wave indicator */}
              <div className="flex items-center justify-center gap-1.5 h-10 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 30, 8] }}
                    transition={{
                      duration: 0.5 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: i * 0.04,
                    }}
                    className="w-1 bg-cyan-400 rounded-full"
                  />
                ))}
              </div>
              <audio
                src={url}
                controls
                autoPlay
                className="w-full max-w-[320px] h-10 filter invert rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Comment/Caption */}
        <div className="px-1 mb-5">
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
            {comment}
          </p>
        </div>

        {/* Footer Actions (Moderation/Report) */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            MooEarth Live Moderated
          </span>

          {reported ? (
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
              ⚠️ Flagged & Reported
            </span>
          ) : (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="text-xs text-white/40 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              {isReporting ? 'Reporting...' : 'Report Content'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
