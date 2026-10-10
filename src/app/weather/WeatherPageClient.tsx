// ============================================================
// MooEarth Live — Weather Page Client Wrapper
// ============================================================
// Client component that dynamically imports the WeatherDashboard
// (which requires WebGL/window).

'use client';

import dynamic from 'next/dynamic';

const WeatherDashboard = dynamic(
  () => import('@/components/Weather/WeatherDashboard'),
  { ssr: false, loading: () => (
    <div className="min-h-screen bg-[#020208] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🌍</div>
        <p className="text-sm text-white/40 font-mono">Loading Weather Intelligence...</p>
      </div>
    </div>
  )}
);

export default function WeatherPageClient() {
  return <WeatherDashboard />;
}
