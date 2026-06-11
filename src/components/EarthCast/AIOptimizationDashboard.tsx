// ============================================================
// MooEarth Live — AI Optimization & Analytics Dashboard
// Premium, glassmorphic HUD panel to monitor server-side cache
// hit rates, OpenAI completion/TTS calls, and API cost savings.
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ServerStats } from '@/services/ai-event-engine';

interface AIOptimizationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ServerStats | null;
}

export default function AIOptimizationDashboard({
  isOpen,
  onClose,
  stats,
}: AIOptimizationDashboardProps) {
  if (!stats) return null;

  const total = stats.totalRequests || 0;
  const hitRate = total > 0 ? Math.round((stats.cacheHits / total) * 100) : 0;
  
  // Calculate percentage of requests that bypassed OpenAI Completions/TTS via templates/cache
  const apiBypassRate = total > 0 
    ? Math.round(((total - stats.aiCalls) / total) * 100)
    : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="fixed bottom-24 right-4 z-40 w-96 rounded-3xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-white pointer-events-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-950/20 to-transparent">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI SCALING MATRIX
                </h3>
              </div>
              <p className="text-[10px] text-white/50 tracking-wider font-mono">EARTHCAST COST SAVINGS CONSOLE</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-xl cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Stats Grid */}
          <div className="p-6 space-y-6">
            {/* Core Matrix: Circular / High Impact Stat */}
            <div className="grid grid-cols-2 gap-4">
              {/* Radial Hit Rate */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />
                <span className="text-3xl font-black text-cyan-400 font-mono tracking-tighter">
                  {hitRate}%
                </span>
                <span className="text-[10px] text-white/60 font-semibold uppercase mt-1 tracking-wider">
                  CACHE HIT RATE
                </span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${hitRate}%` }}
                    className="bg-cyan-400 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Cost Saved */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">
                  ${stats.estimatedDollarsSaved.toFixed(2)}
                </span>
                <span className="text-[10px] text-white/60 font-semibold uppercase mt-1 tracking-wider">
                  EST. BILLING SAVED
                </span>
                <span className="text-[9px] text-emerald-500/70 font-mono mt-2 font-bold">
                  ⚡ {apiBypassRate}% API BYPASS
                </span>
              </div>
            </div>

            {/* Metrics Checklist */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Total Global Requests</span>
                <span className="font-bold text-white">{total}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Server Cache Hits</span>
                <span className="font-bold text-cyan-400">{stats.cacheHits}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">Server Cache Misses</span>
                <span className="font-bold text-white/90">{stats.cacheMisses}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">OpenAI LLM API Calls</span>
                <span className="font-bold text-red-400">{stats.aiCalls}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-white/60">OpenAI TTS API Calls</span>
                <span className="font-bold text-orange-400">{stats.voiceGenerations}</span>
              </div>
            </div>

            {/* Savings Breakdown */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">RESOURCE SAVINGS INDEX</h4>
              
              <div className="space-y-3">
                {/* Tokens Saved */}
                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1">
                    <span>LLM Tokens Cached</span>
                    <span className="font-mono font-bold text-cyan-400">+{stats.estimatedTokensSaved} tkn</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stats.totalRequests > 0 ? `${Math.min(100, (stats.estimatedTokensSaved / (stats.totalRequests * 195 || 1)) * 100)}%` : '0%' }}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* TTS Characters Saved */}
                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1">
                    <span>TTS Characters Saved</span>
                    <span className="font-mono font-bold text-orange-400">+{stats.estimatedCharactersSaved} char</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stats.totalRequests > 0 ? `${Math.min(100, (stats.estimatedCharactersSaved / (stats.estimatedCharactersSaved + stats.voiceGenerations * 120 || 1)) * 100)}%` : '0%' }}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Caching Mode Banner */}
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl flex items-center gap-3">
              <span className="text-xl">💾</span>
              <div>
                <h5 className="text-[10px] font-black tracking-wider uppercase text-cyan-400">
                  Global In-Memory Cache
                </h5>
                <p className="text-[9px] text-white/50 leading-normal">
                  Events are shared and deduplicated globally. {stats.activeCacheCount} active narrations cached.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
