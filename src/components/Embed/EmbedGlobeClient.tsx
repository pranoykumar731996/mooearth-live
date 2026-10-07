'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { WorldEvent, EventCategory } from '@/types';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';

const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      background: '#030308',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#00e5ff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      letterSpacing: '1px',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid rgba(0, 229, 255, 0.2)',
        borderTopColor: '#00e5ff',
        animation: 'spin 1s linear infinite',
      }} />
      <span>INITIALIZING 3D PLANETARY SPHERE...</span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function EmbedGlobeClient() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Parse embed query parameters
  const countryParam = searchParams.get('country') || null;
  const categoryParam = (searchParams.get('category') as EventCategory) || null;
  const viewParam = (searchParams.get('view') as any) || 'standard';
  const initialThemeParam = (searchParams.get('theme') as 'dark' | 'light') || 'dark';

  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(
    initialThemeParam === 'light' ? 'light' : 'dark'
  );
  const [webGlSupported, setWebGlSupported] = useState<boolean | null>(null);

  const [events, setEvents] = useState<WorldEvent[]>(fallbackEvents);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(countryParam);

  useEffect(() => {
    setMounted(true);

    // Verify WebGL support for graceful fallback
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGlSupported(Boolean(gl));
    } catch {
      setWebGlSupported(false);
    }

    // Fetch live verified telemetry if available
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        // Fallback events primed cleanly
      });
  }, []);

  // Sync theme changes if query parameter updates
  useEffect(() => {
    if (initialThemeParam === 'light' || initialThemeParam === 'dark') {
      setCurrentTheme(initialThemeParam);
    }
  }, [initialThemeParam]);

  const utmUrl = useMemo(() => {
    const base = 'https://www.mooearth.live';
    const params = new URLSearchParams({
      utm_source: 'embed',
      utm_medium: 'globe_widget',
      utm_campaign: 'organic_embed',
    });
    if (selectedCountry) {
      params.append('country', selectedCountry);
    }
    return `${base}?${params.toString()}`;
  }, [selectedCountry]);

  if (!mounted) {
    return (
      <div
        data-testid="embed-globe-ssr-placeholder"
        style={{
          width: '100%',
          height: '100vh',
          background: currentTheme === 'light' ? '#f8fafc' : '#020205',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: currentTheme === 'light' ? '#0f172a' : '#00e5ff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Connecting to MooEarth Live...
      </div>
    );
  }

  const isLight = currentTheme === 'light';

  return (
    <div
      data-testid="embed-globe-container"
      data-theme={currentTheme}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: isLight ? '#f1f5f9' : '#020205',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'background 0.3s ease',
      }}
    >
      {/* WebGL Unsupported Fallback */}
      {webGlSupported === false ? (
        <div
          data-testid="embed-webgl-fallback"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            background: isLight ? '#ffffff' : '#0a0a14',
            color: isLight ? '#0f172a' : '#ffffff',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
            MooEarth Live 3D Globe
          </h2>
          <p style={{
            fontSize: '14px',
            color: isLight ? '#475569' : '#94a3b8',
            maxWidth: '400px',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}>
            WebGL hardware acceleration is required to render the interactive 3D globe.
            You can explore the full world map directly on MooEarth Live.
          </p>
          <a
            href={utmUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: '#00e5ff',
              color: '#000000',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Launch MooEarth Live ↗
          </a>
        </div>
      ) : (
        /* 3D Interactive Globe Scene */
        <GlobeScene
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          activeCategory={categoryParam}
          globeView={viewParam}
        />
      )}

      {/* Top Header Overlay */}
      <header
        aria-label="Globe Embed Controls"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Broadcast Status Pill */}
        <div
          data-testid="embed-status-badge"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(3, 3, 8, 0.8)',
            backdropFilter: 'blur(12px)',
            border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '6px 12px',
            borderRadius: '9999px',
            color: isLight ? '#0f172a' : '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: isLight
              ? '0 4px 15px rgba(0, 0, 0, 0.06)'
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
            maxWidth: 'calc(100% - 90px)',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
            flexShrink: 0,
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCountry ? `Focus: ${selectedCountry}` : 'Live 3D Earth'}
          </span>
          {categoryParam && (
            <span style={{
              color: isLight ? '#64748b' : '#94a3b8',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              · {categoryParam}
            </span>
          )}
        </div>

        {/* Right: Quick Embed Actions (Theme & Fullscreen) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'auto',
        }}>
          {/* Theme Switcher Toggle */}
          <button
            type="button"
            data-testid="embed-theme-toggle"
            aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            onClick={() => setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 10, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: isLight ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0f172a' : '#ffffff',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'transform 0.15s ease',
            }}
          >
            {isLight ? '🌙' : '☀️'}
          </button>

          {/* Direct Launch Button */}
          <a
            href={utmUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="embed-fullscreen-btn"
            title="Open Fullscreen on MooEarth Live"
            aria-label="Open Fullscreen on MooEarth Live"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 10, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: isLight ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0284c7' : '#00e5ff',
              fontSize: '12px',
              textDecoration: 'none',
              fontWeight: 800,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            ⤢
          </a>
        </div>
      </header>

      {/* Powered by MooEarth Live Organic Attribution Badge */}
      <footer style={{
        position: 'absolute',
        bottom: '14px',
        right: '14px',
        zIndex: 50,
      }}>
        <a
          href={utmUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="mooearth-embed-badge"
          data-testid="mooearth-embed-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 20, 0.88)',
            backdropFilter: 'blur(14px)',
            border: isLight
              ? '1px solid rgba(2, 132, 199, 0.35)'
              : '1px solid rgba(0, 229, 255, 0.35)',
            padding: '7px 14px',
            borderRadius: '9999px',
            color: isLight ? '#0f172a' : '#ffffff',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: isLight
              ? '0 6px 20px rgba(0, 0, 0, 0.1), 0 0 12px rgba(2, 132, 199, 0.15)'
              : '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 229, 255, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '15px' }}>🌍</span>
          <span>
            Powered by{' '}
            <strong style={{ color: isLight ? '#0284c7' : '#00e5ff' }}>
              MooEarth Live
            </strong>
          </span>
          <span style={{ color: isLight ? '#0284c7' : '#00e5ff', fontSize: '11px' }}>↗</span>
        </a>
      </footer>

      {/* Semantic Fallback for NoScript / SEO Bots */}
      <noscript>
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '8px 12px',
          background: '#000000',
          color: '#ffffff',
          fontSize: '11px',
          zIndex: 60,
        }}>
          Interactive 3D Earth Globe. Powered by <a href="https://www.mooearth.live" style={{ color: '#00e5ff' }}>MooEarth Live</a>.
        </div>
      </noscript>
    </div>
  );
}
