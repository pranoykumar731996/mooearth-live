// ============================================================
// MooEarth Live — Weather Layer Selector
// ============================================================
// Mode switcher for the 8 weather layers.
// Fully scrollable horizontally on mobile, tablet, and desktop
// with wheel support, touch gestures, and scroll buttons.

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { WEATHER_LAYERS } from '@/services/weather/types';
import type { WeatherLayerMode } from '@/services/weather/types';

interface WeatherLayerSelectorProps {
  activeLayer: WeatherLayerMode;
  onSelectLayer: (layer: WeatherLayerMode) => void;
}

export default function WeatherLayerSelector({
  activeLayer,
  onSelectLayer,
}: WeatherLayerSelectorProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Convert vertical mouse wheel into horizontal scroll when hovering over the selector
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="relative w-full flex items-center group">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-0 z-20 h-8 w-7 flex items-center justify-center rounded-l-xl bg-gradient-to-r from-[#020208] via-[#020208]/90 to-transparent text-white/70 hover:text-cyan-300 transition-colors pointer-events-auto"
          title="Scroll features left"
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}

      {/* Horizontal Scrollable Ribbon */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 touch-pan-x flex-nowrap w-full scroll-smooth select-none px-1"
      >
        {WEATHER_LAYERS.map(layer => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onSelectLayer(layer.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold 
                         transition-all duration-200 border whitespace-nowrap cursor-pointer
                ${isActive
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.08] hover:text-white/90 hover:border-white/15'
                }`}
              aria-pressed={isActive}
              title={layer.description}
            >
              <span className="text-base">{layer.icon}</span>
              <span>{layer.name}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-0 z-20 h-8 w-7 flex items-center justify-center rounded-r-xl bg-gradient-to-l from-[#020208] via-[#020208]/90 to-transparent text-white/70 hover:text-cyan-300 transition-colors pointer-events-auto"
          title="Scroll features right"
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
}
