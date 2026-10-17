// ============================================================
// MooEarth Live — Home Page Client Wrapper (Weather Radar)
// ============================================================
// Client component that dynamically imports WeatherDashboard
// (which requires WebGL/window). Wraps in Suspense for useSearchParams.

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const WeatherDashboard = dynamic(
  () => import('@/components/Weather/WeatherDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#020208] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌍</div>
          <p className="text-sm text-cyan-400 font-mono tracking-wider">
            INITIALIZING WEATHER RADAR & 3D GLOBE...
          </p>
        </div>
      </div>
    ),
  }
);

export default function HomePageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020208] flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🌍</div>
            <p className="text-sm text-cyan-400 font-mono tracking-wider">
              INITIALIZING WEATHER RADAR & 3D GLOBE...
            </p>
          </div>
        </div>
      }
    >
      <WeatherDashboard />
    </Suspense>
  );
}
