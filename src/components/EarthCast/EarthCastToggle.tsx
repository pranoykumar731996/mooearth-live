// ============================================================
// MooEarth Live — EarthCast Toggle Button
// Floating control button for the bottom bar. Enables/disables
// EarthCast narration and provides Auto Mode toggle.
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { NarrationState } from '@/hooks/useEarthCast';

interface EarthCastToggleProps {
  isActive: boolean;
  isAutoMode: boolean;
  narrationState: NarrationState;
  onToggle: () => void;
  onToggleAutoMode: () => void;
}

export default function EarthCastToggle({
  isActive,
  isAutoMode,
  narrationState,
  onToggle,
  onToggleAutoMode,
}: EarthCastToggleProps) {
  const isSpeaking = narrationState === 'speaking';
  const isLoading = narrationState === 'loading';

  return (
    <div className="flex items-center gap-2">
      {/* Main EarthCast Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`relative h-14 px-5 rounded-2xl flex items-center gap-2.5 border transition-all duration-500 cursor-pointer ${
          isActive
            ? isSpeaking
              ? 'bg-gradient-to-r from-red-600/30 to-orange-600/30 border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.3)]'
              : 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.2)]'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        }`}
        title={isActive ? 'Disable EarthCast Mode' : 'Enable EarthCast Mode'}
      >
        {/* Animated outer ring when active */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: `1.5px solid ${isSpeaking ? 'rgba(239,68,68,0.4)' : 'rgba(0,229,255,0.3)'}`,
            }}
          />
        )}

        {/* Microphone icon */}
        <div className="relative">
          <span className="text-lg">{isActive ? '🎙️' : '🎙️'}</span>
          {isActive && (
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-red-500' : 'bg-cyan-400'
              }`}
            />
          )}
          {isLoading && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -right-1 w-3 h-3 border border-cyan-400/50 border-t-cyan-400 rounded-full"
            />
          )}
        </div>

        {/* Label */}
        <span
          className={`text-xs font-black tracking-wider ${
            isActive
              ? isSpeaking
                ? 'text-red-400'
                : 'text-cyan-400'
              : 'text-white/60'
          }`}
        >
          EARTHCAST
        </span>
      </motion.button>

      {/* Auto Mode Toggle (only visible when EarthCast is active) */}
      {isActive && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -10 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleAutoMode}
          className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-300 cursor-pointer relative ${
            isAutoMode
              ? 'bg-red-500/15 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
          title={isAutoMode ? 'Stop Auto EarthCast' : 'Start Auto EarthCast — Watch The World React'}
        >
          {isAutoMode && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-[ping_1.5s_infinite]" />
          )}
          <span className="text-sm">{isAutoMode ? '📡' : '🌐'}</span>
        </motion.button>
      )}
    </div>
  );
}
