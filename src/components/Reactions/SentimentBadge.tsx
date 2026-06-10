'use client';

import { SentimentData } from '@/types';

function getMoodColors(mood: string) {
  if (mood.includes('🔥') || mood.includes('😄')) return 'from-orange-500 to-amber-400 border-orange-500/30 text-orange-400';
  if (mood.includes('😡')) return 'from-red-600 to-rose-500 border-red-500/30 text-red-400';
  if (mood.includes('😢') || mood.includes('😨')) return 'from-blue-600 to-indigo-500 border-blue-500/30 text-blue-400';
  return 'from-gray-600 to-slate-500 border-gray-500/30 text-gray-400';
}

export default function SentimentBadge({ sentiment }: { sentiment: SentimentData }) {
  const colors = getMoodColors(sentiment.mood);
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">National Mood</h3>
        <div className={`px-3 py-1.5 rounded-full border bg-gradient-to-r ${colors} bg-opacity-10 flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
          <span className="text-sm font-bold">{sentiment.mood}</span>
        </div>
      </div>
      
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
        {/* Glow indicator based on intensity */}
        <div 
          className="absolute top-0 left-0 w-1 h-full opacity-70"
          style={{ backgroundColor: 'currentColor' }}
        />
        <p className="text-sm text-white/80 leading-relaxed font-medium">
          {sentiment.explanation}
        </p>
      </div>
    </div>
  );
}
