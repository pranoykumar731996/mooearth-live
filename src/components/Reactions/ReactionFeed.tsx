'use client';

import { WorldEvent } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionFeedProps {
  headlines: WorldEvent[];
  posts: { id: string; user: string; text: string; time: string; likes: number }[];
}

export default function ReactionFeed({ headlines, posts }: ReactionFeedProps) {
  // Interleave posts and headlines for a dynamic feed look
  const combined: any[] = [];
  const maxLen = Math.max(headlines.length, posts.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (posts[i]) combined.push({ type: 'post', data: posts[i], id: `post-${posts[i].id}` });
    if (headlines[i]) combined.push({ type: 'headline', data: headlines[i], id: `news-${headlines[i].id}` });
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Reactions</h3>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {combined.map((item, index) => {
            if (item.type === 'post') {
              const post = item.data;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-2xl bg-black/20 border border-white/5 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-400">{post.user}</span>
                    <span className="text-[10px] text-white/30 font-medium">{post.time}</span>
                  </div>
                  <p className="text-sm text-white/90 leading-snug mb-3">{post.text}</p>
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    <span>{post.likes}</span>
                  </div>
                </motion.div>
              );
            } else {
              const news = item.data as WorldEvent;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">News</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight mb-1">{news.title}</h4>
                  <p className="text-xs text-white/50 line-clamp-2">{news.summary}</p>
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
