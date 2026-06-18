/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP, getCountryRecommendations } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionFeedProps {
  headlines: WorldEvent[];
  posts: { id: string; user: string; text: string; time: string; likes: number }[];
  onSelectArticle?: (news: WorldEvent) => void;
  country?: string;
  activeCategory?: EventCategory | null;
  onSelectCountry?: (country: string | null) => void;
}

function getSourceDisplay(source: string): string {
  if (!source) return 'Global Source';
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      const url = new URL(source);
      return url.hostname.replace('www.', '');
    } catch {
      return 'Google News';
    }
  }
  return source;
}

function getRelativeTime(dateStr: string): string {
  try {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (Number.isNaN(ms)) return dateStr || 'Just now';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  } catch {
    return dateStr || 'Just now';
  }
}

export default function ReactionFeed({
  headlines,
  posts,
  onSelectArticle,
  country,
  activeCategory,
  onSelectCountry,
}: ReactionFeedProps) {
  // Interleave posts and headlines for a dynamic feed look
  const combined: any[] = [];
  const maxLen = Math.max(headlines.length, posts.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (posts[i]) combined.push({ type: 'post', data: posts[i], id: `post-${posts[i].id}` });
    if (headlines[i]) combined.push({ type: 'headline', data: headlines[i], id: `news-${headlines[i].id}` });
  }

  const categoryConfig = activeCategory ? CATEGORY_MAP[activeCategory] : null;
  const categoryLabel = categoryConfig ? categoryConfig.label : 'Home';
  const displayCategory = categoryLabel === 'Home' ? '' : ` ${categoryLabel}`;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Reactions</h3>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {combined.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 text-center rounded-2xl bg-black/20 border border-white/5 text-white/80 text-xs space-y-4"
            >
              <div className="font-bold">
                No current{displayCategory} updates for {country || 'this country'}
              </div>
              {country && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-[9px] text-white/40 uppercase tracking-widest font-black">
                    Recommended Destinations
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {getCountryRecommendations(country).map((rec) => (
                      <Link key={rec} href={`/country/${encodeURIComponent(rec.toLowerCase())}`} passHref legacyBehavior>
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            if (onSelectCountry) onSelectCountry(rec);
                          }}
                          className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 transition-all text-[10px] font-bold text-white/90 cursor-pointer"
                        >
                          {rec}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            combined.map((item, index) => {
              if (item.type === 'post') {
                const post = item.data;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl bg-black/20 border border-white/5 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-400">{post.user}</span>
                      <span className="text-[10px] text-white/30 font-medium">{post.time}</span>
                    </div>
                    <p className="text-sm text-white/90 leading-snug mb-3">{post.text}</p>
                    <div className="flex items-center justify-between text-white/40 text-xs">
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-white/30">
                        <span className="bg-white/5 px-1 rounded text-white">{country || 'Global'}</span>
                        <span>•</span>
                        <span className="text-blue-400">Social</span>
                        <span>•</span>
                        <span>MooEarth</span>
                      </div>
                    </div>
                  </motion.div>
                );
              } else {
                const news = item.data as WorldEvent;
                const cConfig = CATEGORY_MAP[news.category as EventCategory] || CATEGORY_MAP.breaking;
                return (
                  <Link key={item.id} href={`/article/${news.id}`} passHref legacyBehavior>
                    <motion.a
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectArticle?.(news);
                      }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all text-left focus:outline-none group flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight mb-1">
                          {news.title}
                        </h4>
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                          {news.summary}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.04] text-[9px] font-bold uppercase tracking-wider text-white/40">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-white font-extrabold">
                          {news.country || country || 'Global'}
                        </span>
                        <span>•</span>
                        <span style={{ color: cConfig.color }}>
                          {cConfig.label}
                        </span>
                        <span>•</span>
                        <span className="text-cyan-400/80">
                          {getSourceDisplay(news.source)}
                        </span>
                        <span>•</span>
                        <span>
                          {getRelativeTime(news.publishedAt)}
                        </span>
                      </div>
                    </motion.a>
                  </Link>
                );
              }
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
