// ============================================================
// MooEarth Live — Goal Celebration Overlay
// Cinematic glassmorphic overlay that appears when a goal is scored.
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GoalCelebration } from '@/hooks/useGoalCelebration';
import { useMemo } from 'react';

interface GoalOverlayProps {
  celebration: GoalCelebration | null;
  onDismiss: () => void;
}

const seededRandom = (s: number) => {
  let value = s;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

export default function GoalOverlay({ celebration, onDismiss }: GoalOverlayProps) {
  // Generate randomized particle configurations once per celebration
  const particles = useMemo(() => {
    if (!celebration) return [];
    const seed = (celebration.player || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (celebration.goalTime || 0);
    const rnd = seededRandom(seed);
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: rnd() * 100 - 50, // Percentage offset from center
      y: rnd() * 100 - 50,
      size: rnd() * 6 + 3,
      delay: rnd() * 1.5,
      duration: rnd() * 3 + 2,
      driftX: rnd() * 10 - 5,
    }));
  }, [celebration]);

  if (!celebration) return null;

  const { colors, team, player, goalTime, homeTeam, awayTeam, homeScore, awayScore, country } = celebration;

  return (
    <AnimatePresence>
      {celebration.active && (
        <>
          {/* Full-screen color flash */}
          <motion.div
            key="goal-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.2, 0.35, 0] }}
            transition={{ duration: 3, times: [0, 0.1, 0.3, 0.6, 1] }}
            className="fixed inset-0 z-[90] pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${colors.primary}60 0%, transparent 80%)` }}
          />

          {/* Phase 6: Rotating background light beams */}
          <motion.div
            key="light-beams"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[89] pointer-events-none overflow-hidden flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[200vw] h-[40vh] blur-[80px] origin-center opacity-70"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent, ${colors.secondary || colors.primary}, transparent)`
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[200vw] h-[30vh] blur-[100px] origin-center opacity-60"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.secondary || '#ffffff'}, transparent, ${colors.primary}, transparent)`
              }}
            />
          </motion.div>

          {/* Phase 6: Cinematic Floating Energy Particles */}
          <div className="fixed inset-0 z-[91] pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: '100vh', x: `${50 + p.x}vw` }}
                animate={{
                  opacity: [0, 0.7, 0.7, 0],
                  y: ['80vh', '20vh'],
                  x: [`${50 + p.x}vw`, `${50 + p.x + p.driftX}vw`],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: colors.primary,
                  boxShadow: `0 0 10px ${colors.glow}`,
                }}
              />
            ))}
          </div>

          {/* Expanding ring effect */}
          <motion.div
            key="goal-ring"
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 2.8, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[89] pointer-events-none"
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: `4px solid ${colors.primary}`,
              boxShadow: `0 0 70px ${colors.glow}, inset 0 0 70px ${colors.glow}`,
            }}
          />

          {/* Cinematic goal overlay card */}
          <motion.div
            key="goal-card"
            initial={{ opacity: 0, scale: 0.75, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] pointer-events-auto"
            onClick={onDismiss}
          >
            <div
              className="relative px-12 py-10 rounded-3xl border border-white/10 backdrop-blur-2xl overflow-hidden cursor-pointer select-none"
              style={{
                background: `linear-gradient(135deg, rgba(3,3,10,0.92) 0%, rgba(10,10,25,0.94) 100%)`,
                boxShadow: `0 0 100px ${colors.glow}, 0 0 200px ${colors.glow}30`,
                minWidth: 420,
              }}
            >
              {/* Animated color accent bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                className="absolute top-0 left-0 right-0 h-1.5 origin-left"
                style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})` }}
              />

              {/* GOAL label */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">⚽</span>
                <motion.h2
                  initial={{ letterSpacing: '0.6em', opacity: 0 }}
                  animate={{ letterSpacing: '0.4em', opacity: 1 }}
                  transition={{ duration: 1.1, delay: 0.3 }}
                  className="text-5xl font-black uppercase mt-3"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary || '#ffffff'})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 0 12px ${colors.glow})`,
                    textShadow: 'none',
                  }}
                >
                  GOAL!
                </motion.h2>
              </motion.div>

              {/* Scorer info */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="text-center mb-6"
              >
                <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.3em] mb-1.5">{country}</p>
                <p className="text-white text-2xl font-black tracking-tight">{player}</p>
                <p className="text-white/40 text-xs mt-1 font-medium">{goalTime}&apos; — {team}</p>
              </motion.div>

              {/* Scorecard */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="flex items-center justify-center gap-6 mb-4 bg-white/5 border border-white/5 rounded-2xl py-4 px-6"
              >
                <div className="text-center flex-1">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1 truncate max-w-[100px]">{homeTeam}</p>
                  <p className="text-4xl font-black text-white">{homeScore}</p>
                </div>
                <div className="text-white/20 text-xl font-light">—</div>
                <div className="text-center flex-1">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1 truncate max-w-[100px]">{awayTeam}</p>
                  <p className="text-4xl font-black text-white">{awayScore}</p>
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-center text-cyan-400/60 text-[10px] font-bold uppercase tracking-[0.35em] mt-5"
              >
                THE PLANET ERUPTS IN CELEBRATION
              </motion.p>

              {/* Pulsing border glow */}
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  border: `1.5px solid ${colors.primary}40`,
                  boxShadow: `inset 0 0 50px ${colors.primary}10`,
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
