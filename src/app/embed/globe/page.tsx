import { Metadata } from 'next';
import { Suspense } from 'react';
import EmbedGlobeClient from '@/components/Embed/EmbedGlobeClient';

export const metadata: Metadata = {
  title: 'Interactive 3D Globe Widget | MooEarth Live',
  description: 'Embed live 3D world events, breaking news, and interactive globe visualizations directly on your website or publication.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function EmbedGlobePage() {
  return (
    <Suspense fallback={
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#030308',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00e5ff',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Loading 3D Globe Widget...
      </div>
    }>
      <EmbedGlobeClient />
    </Suspense>
  );
}
