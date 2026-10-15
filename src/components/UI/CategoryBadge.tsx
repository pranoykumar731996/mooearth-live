// ============================================================
// MooEarth Live — Category Badge Component
// ============================================================

'use client';

import { CATEGORY_MAP } from '@/lib/constants';
import { EventCategory } from '@/types';

interface CategoryBadgeProps {
  category: EventCategory;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const config = CATEGORY_MAP[category] || CATEGORY_MAP.seismic || { label: 'Event', emoji: '🌐', color: '#ef4444', glowColor: 'rgba(239,68,68,0.5)', bgColor: 'rgba(239,68,68,0.15)' };
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
