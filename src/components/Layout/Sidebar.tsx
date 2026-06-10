// ============================================================
// EarthPulse AI — Left Sidebar Component
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { SIDEBAR_ITEMS } from '@/lib/constants';
import { EventCategory } from '@/types';

interface SidebarProps {
  activeCategory: EventCategory | null;
  onCategoryChange: (category: EventCategory | null) => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  return (
    <aside
      id="sidebar"
      className="fixed left-4 top-1/2 -translate-y-1/2 z-30
                 hidden md:flex flex-col gap-1 p-2
                 rounded-2xl backdrop-blur-xl border border-white/[0.06]"
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,20,0.8) 0%, rgba(10,10,20,0.6) 100%)',
      }}
    >
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = item.category ? activeCategory === item.category : !activeCategory && item.id === 'home';

        return (
          <motion.button
            key={item.id}
            id={`sidebar-${item.id}`}
            whileHover={{ scale: 1.15, x: 4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (item.id === 'home') {
                onCategoryChange(null);
              } else if (item.category) {
                onCategoryChange(activeCategory === item.category ? null : item.category);
              }
            }}
            className={`group relative w-11 h-11 rounded-xl flex items-center justify-center
                       text-lg transition-all duration-300 cursor-pointer
                       ${
                         isActive
                           ? 'bg-cyan-500/15 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                           : 'hover:bg-white/[0.06]'
                       }`}
            title={item.label}
          >
            <span className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : ''}>
              {item.icon}
            </span>

            {/* Tooltip */}
            <span
              className="absolute left-full ml-3 px-3 py-1.5 rounded-lg
                         text-xs font-medium text-white whitespace-nowrap
                         opacity-0 invisible group-hover:opacity-100 group-hover:visible
                         transition-all duration-200 pointer-events-none"
              style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {item.label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute -left-2 w-1 h-5 rounded-full bg-cyan-400"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
          </motion.button>
        );
      })}
    </aside>
  );
}
