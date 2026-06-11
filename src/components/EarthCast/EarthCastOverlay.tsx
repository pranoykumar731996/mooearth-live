// ============================================================
// MooEarth Live — EarthCast Cinematic Narration Overlay
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrationEntry, NarrationState } from '@/hooks/useEarthCast';
import { EarthCastEventType } from '@/services/earthcast-ai';

interface EarthCastOverlayProps {
  currentNarration: NarrationEntry | null;
  narrationState: NarrationState;
  audioLevel: number;
  isEarthCastActive: boolean;
}

const EVENT_ICONS: Record<EarthCastEventType, string> = {
  goal: '⚽',
  red_card: '🟥',
  penalty: '🥅',
  match_end: '🏁',
  upset: '😱',
  tension: '⚡',
  atmosphere_check: '🌍',
};

const EVENT_LABELS: Record<EarthCastEventType, string> = {
  goal: 'GOAL EVENT',
  red_card: 'RED CARD',
  penalty: 'PENALTY',
  match_end: 'FULL TIME',
  upset: 'MAJOR UPSET',
  tension: 'HIGH TENSION',
  atmosphere_check: 'ATMOSPHERE',
};

export default function EarthCastOverlay({
  currentNarration,
  narrationState,
  audioLevel,
  isEarthCastActive,
}: EarthCastOverlayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypewriterDone, setIsTypewriterDone] = useState(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    if (!currentNarration) {
      setDisplayedText('');
      setIsTypewriterDone(false);
      return;
    }

    const fullText = currentNarration.text;
    let index = 0;
    setDisplayedText('');
    setIsTypewriterDone(false);

    typewriterRef.current = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        setIsTypewriterDone(true);
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 30); // 30ms per character for dramatic pacing

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [currentNarration]);

  const showOverlay = narrationState === 'speaking' && currentNarration;
  const showLoading = narrationState === 'loading';

  return (
    <AnimatePresence>
      {/* Loading indicator */}
      {isEarthCastActive && showLoading && (
        <motion.div
          key="earthcast-loading"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[85] pointer-events-none"
        >
          <div className="glass px-6 py-3 rounded-full border border-cyan-500/30 flex items-center gap-3"
            style={{ boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)' }}
          >
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span className="text-[10px] text-cyan-400 uppercase tracking-[0.3em] font-black">
              EARTHCAST GENERATING
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-1 bg-cyan-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main narration overlay */}
      {showOverlay && currentNarration && (
        <motion.div
          key="earthcast-narration"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[85] pointer-events-none w-[90vw] max-w-2xl"
        >
          <div
            className="relative rounded-3xl border border-white/10 backdrop-blur-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(5,5,18,0.94) 0%, rgba(10,10,30,0.96) 100%)',
              boxShadow: `0 0 80px ${currentNarration.emotionColor}25, 0 0 200px ${currentNarration.emotionColor}10, 0 25px 50px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Animated top accent bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-0 left-0 right-0 h-[2px] origin-left"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentNarration.emotionColor}, transparent)`,
              }}
            />

            {/* Pulsing border glow synced to audio */}
            <motion.div
              animate={{
                opacity: 0.2 + audioLevel * 0.6,
                boxShadow: `inset 0 0 ${30 + audioLevel * 50}px ${currentNarration.emotionColor}15`,
              }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                border: `1px solid ${currentNarration.emotionColor}30`,
              }}
            />

            <div className="px-6 sm:px-8 py-5 sm:py-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                {/* EarthCast badge */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-red-400 uppercase tracking-[0.25em] font-black">
                      MOOEARTH LIVE — EARTHCAST
                    </span>
                  </div>
                  <span className="text-base">🎙️</span>
                </div>

                {/* Event type badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm">{EVENT_ICONS[currentNarration.eventType]}</span>
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] font-black px-2.5 py-1 rounded-full"
                    style={{
                      color: currentNarration.emotionColor,
                      backgroundColor: `${currentNarration.emotionColor}15`,
                      border: `1px solid ${currentNarration.emotionColor}30`,
                    }}
                  >
                    {EVENT_LABELS[currentNarration.eventType]}
                  </span>
                </div>
              </div>

              {/* Waveform visualization */}
              <div className="flex items-end justify-center gap-[3px] h-6 mb-4">
                {Array.from({ length: 24 }).map((_, i) => {
                  // Create a frequency-like distribution
                  const centerDist = Math.abs(i - 12) / 12;
                  const baseHeight = (1 - centerDist * 0.6) * audioLevel;
                  const jitter = Math.sin(i * 1.7 + Date.now() * 0.003) * 0.15;
                  const height = Math.max(0.08, Math.min(1, baseHeight + jitter));

                  return (
                    <motion.div
                      key={i}
                      animate={{ scaleY: height }}
                      transition={{ duration: 0.08 }}
                      className="w-[3px] rounded-full origin-bottom"
                      style={{
                        height: '100%',
                        background: `linear-gradient(to top, ${currentNarration.emotionColor}80, ${currentNarration.emotionColor}30)`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Narration text with typewriter */}
              <div className="min-h-[3.5rem]">
                <p className="text-white text-sm sm:text-base leading-relaxed font-medium tracking-wide">
                  &ldquo;{displayedText}
                  {!isTypewriterDone && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-[2px] h-4 ml-0.5 align-middle"
                      style={{ backgroundColor: currentNarration.emotionColor }}
                    />
                  )}
                  {isTypewriterDone && <>&rdquo;</>}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">
                  {currentNarration.country}
                </span>
                <span className="text-[9px] text-white/20 uppercase tracking-wider font-medium">
                  {new Date(currentNarration.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
