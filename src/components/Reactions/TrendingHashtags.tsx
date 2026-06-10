'use client';

export default function TrendingHashtags({ hashtags }: { hashtags: string[] }) {
  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
        <span>Trending Now</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </h3>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <div 
            key={tag}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-cyan-300 hover:bg-white/10 hover:border-cyan-400/30 transition-all cursor-default"
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
