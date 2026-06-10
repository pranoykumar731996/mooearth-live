// ============================================================
// EarthPulse AI — Landing Page
// ============================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useEventFilter } from '@/hooks/useEventFilter';
import { EventCategory, WorldEvent } from '@/types';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import LiveFeed from '@/components/Layout/LiveFeed';
import StarField from '@/components/UI/StarField';

// Dynamic import for heavy Globe component
const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
});

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const { events: liveEvents, isLoading: isEventsLoading } = useLiveEvents();

  // Filtered events
  const filteredEvents = useEventFilter({
    events: liveEvents,
    searchQuery,
    activeCategory,
  });

  // Handle event selection
  const handleSelectEvent = useCallback((event: WorldEvent | null) => {
    setSelectedEvent(event);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: EventCategory | null) => {
    setActiveCategory(category);
    setSelectedEvent(null);
  }, []);

  const handleEventNavigate = useCallback((event: WorldEvent) => {
    setSelectedEvent(event);
    setSearchQuery('');
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030308]" id="main">
      {/* Splash Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#030308] flex items-center justify-center flex-col"
          >
            <div className="w-24 h-24 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-[spin_3s_linear_infinite]" />
            <div className="w-16 h-16 absolute rounded-full border border-purple-500/20 border-b-purple-400 animate-[spin_2s_linear_infinite_reverse]" />
            <div className="absolute font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-xl tracking-tighter">
              EP
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-sm text-cyan-400/60 uppercase tracking-[0.2em] font-medium"
            >
              Connecting to the world...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star field background */}
      <StarField />

      {/* Radial gradient overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-50"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,1) 100%)',
          zIndex: 1,
        }}
      />

      {/* Navigation */}
      <div className="relative z-40">
        <Navbar
          events={liveEvents}
          onSearch={handleSearch}
          onSelectEvent={handleEventNavigate}
        />
      </div>

      {/* Sidebar */}
      <div className="relative z-30">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Massive Cinematic Globe */}
      <div
        className="absolute z-[2] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: '110vw', height: '110vh' }}
      >
        <div className="w-full h-full pointer-events-auto">
          {!isLoading && (
            <GlobeScene
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={handleSelectEvent}
            />
          )}
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none gradient-bottom"
        style={{ zIndex: 10 }}
      />

      {/* Live Feed */}
      <div className="relative z-30">
        <LiveFeed
          events={filteredEvents}
          onSelectEvent={handleEventNavigate}
        />
      </div>

      {/* UI Overlays (Mini Globe, Timeline, AI Button) */}
      <div className="fixed bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none">
        
        {/* Left: Mini Globe (Placeholder) */}
        <div className="hidden lg:flex w-24 h-24 rounded-full glass items-center justify-center pointer-events-auto cursor-pointer hover:border-cyan-500/50 transition-colors shadow-[0_0_30px_rgba(0,229,255,0.1)] group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-900/40 to-black border border-white/5 relative overflow-hidden">
            {/* Fake continents */}
            <div className="absolute top-4 left-4 w-6 h-4 bg-green-500/20 rounded-full blur-[2px] group-hover:bg-cyan-500/30 transition-colors" />
            <div className="absolute bottom-6 right-4 w-8 h-6 bg-green-500/20 rounded-full blur-[2px] group-hover:bg-cyan-500/30 transition-colors" />
            {/* Fake crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Center: Timeline Slider */}
        <div className="hidden md:flex flex-col items-center gap-2 pointer-events-auto mb-2">
          <div className="text-xs text-white/40 uppercase tracking-widest font-medium">Timeline</div>
          <div className="glass px-6 py-3 rounded-full flex items-center gap-4 w-[400px]">
            <span className="text-xs text-white/30">Past</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full relative overflow-hidden cursor-pointer">
              <div className="absolute top-0 left-0 h-full w-[85%] bg-gradient-to-r from-blue-600/50 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              <div className="absolute top-1/2 left-[85%] w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-xs text-cyan-400 font-semibold">Live</span>
          </div>
        </div>

        {/* Right: Floating AI Button */}
        <div className="pointer-events-auto mb-2 mr-[340px] lg:mr-0"> {/* Margin to avoid live feed on desktop */}
          <button className="relative group w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300/50 shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(0,229,255,0.6)] transition-all duration-300 hover:scale-110">
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[marker-ring_2s_linear_infinite]" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 7.49-2 14-2 14" />
              <path d="M20 18v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1" />
              <path d="M16 12v-2a4 4 0 0 0-8 0v2" />
            </svg>
            {/* Tooltip */}
            <div className="absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <div className="glass px-4 py-2 rounded-xl text-sm font-medium text-white shadow-xl">
                EarthPulse AI Assistant
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
