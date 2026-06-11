'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSoundDesign } from '@/hooks/useSoundDesign';

export default function TimelineSlider() {
  const [progress, setProgress] = useState(100); // 100 = Live
  const { playHoverBlip } = useSoundDesign();

  const handleDrag = (e: any, info: any) => {
    // Basic math to convert drag to percentage
    const newProgress = Math.max(0, Math.min(100, progress + (info.delta.x * 0.5)));
    setProgress(newProgress);
    if (Math.abs(info.delta.x) > 2) {
      playHoverBlip();
    }
  };

  const isLive = progress > 95;

  return (
    <div className="hidden md:flex flex-col items-center gap-2 pointer-events-auto mb-4 w-full max-w-[600px] mx-auto z-40">
      <div className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-medium">World Cup Timeline</div>
      <div className="glass px-6 py-4 rounded-3xl flex items-center gap-6 w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl">
        <span className="text-xs text-white/40 uppercase tracking-wider font-bold">Past 24H</span>
        
        <div className="flex-1 h-2 bg-black/40 rounded-full relative cursor-pointer overflow-hidden border border-white/5">
          {/* Progress Bar Fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.6)]" 
            style={{ width: `${progress}%` }}
          />
          
          {/* Draggable Scrubber */}
          <motion.div 
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            onDrag={handleDrag}
            className="absolute top-1/2 w-4 h-4 bg-white rounded-full -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(255,255,255,0.9)] hover:scale-125 transition-transform"
            style={{ left: `calc(${progress}% - 8px)` }}
          />

          {/* Fake Goal Markers on timeline */}
          <div className="absolute top-1/2 left-[30%] w-1.5 h-3 bg-red-500 rounded-full -translate-y-1/2 shadow-[0_0_5px_red]" />
          <div className="absolute top-1/2 left-[60%] w-1.5 h-3 bg-yellow-500 rounded-full -translate-y-1/2 shadow-[0_0_5px_yellow]" />
        </div>
        
        <div className="flex items-center gap-2">
          {isLive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />}
          <span className={`text-xs uppercase tracking-wider font-bold ${isLive ? 'text-cyan-400' : 'text-white/40'}`}>
            {isLive ? 'Live' : 'Replay'}
          </span>
        </div>
      </div>
    </div>
  );
}
