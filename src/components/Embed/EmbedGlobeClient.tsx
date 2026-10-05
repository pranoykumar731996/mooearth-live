'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { WorldEvent, EventCategory } from '@/types';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';

const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#030308',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00e5ff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      letterSpacing: '1px',
    }}>
      Loading 3D Globe...
    </div>
  ),
});

export default function EmbedGlobeClient() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Parse embed parameters
  const countryParam = searchParams.get('country') || null;
  const categoryParam = (searchParams.get('category') as EventCategory) || null;
  const viewParam = (searchParams.get('view') as any) || 'standard';

  const [events, setEvents] = useState<WorldEvent[]>(fallbackEvents);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(countryParam);

  useEffect(() => {
    setMounted(true);

    // Fetch live events if available, otherwise fallbackEvents are already primed
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        // Fallback primed
      });
  }, []);

  if (!mounted) return null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#020205',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* 3D Interactive Globe Scene */}
      <GlobeScene
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        activeCategory={categoryParam}
        globeView={viewParam}
      />

      {/* Top Overlay Tag */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(3, 3, 8, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '6px 14px',
        borderRadius: '9999px',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 700,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}>
        <span style={{ color: '#00e5ff' }}>●</span>
        <span>{selectedCountry ? `Focus: ${selectedCountry}` : 'Live Earth Broadcast'}</span>
        {categoryParam && <span style={{ color: '#94a3b8' }}>· {categoryParam}</span>}
      </div>

      {/* Powered by MooEarth Live Watermark Attribution Badge */}
      <a
        href={`https://www.mooearth.live?utm_source=embed&utm_medium=globe_widget${selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        id="mooearth-embed-badge"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(10, 10, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          padding: '8px 16px',
          borderRadius: '9999px',
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 229, 255, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = '#00e5ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.35)';
        }}
      >
        <span style={{ fontSize: '16px' }}>🌍</span>
        <span>Powered by <strong style={{ color: '#00e5ff' }}>MooEarth Live</strong></span>
        <span style={{ color: '#00e5ff', fontSize: '11px' }}>↗</span>
      </a>
    </div>
  );
}
