'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AD_PLACEMENTS, canRenderAd, getAdvertisingConfig, AdPlacementId } from '@/config/advertising';
import { trackAdImpression, trackAdClick } from '@/services/analytics';

interface AdUnitProps {
  placementId: AdPlacementId;
  className?: string;
  isPlusSubscriber?: boolean;
}

/**
 * Privacy-conscious, CLS-safe Advertising Component.
 * - Off by default; checks user consent and environment configuration.
 * - Enforces zero layout shift with reserved bounding boxes.
 * - Gracefully collapses with 0 height if disabled, blocked, or unavailable.
 * - Clearly distinguished with unambiguous "ADVERTISEMENT" badge.
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  placementId,
  className = '',
  isPlusSubscriber = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [adBlocked, setAdBlocked] = useState(false);

  const config = getAdvertisingConfig();
  const placement = AD_PLACEMENTS[placementId];

  // Re-check consent and active state
  useEffect(() => {
    const checkState = () => {
      const allowed = canRenderAd(placementId, isPlusSubscriber);
      setShouldRender(allowed);
    };

    checkState();

    if (typeof window !== 'undefined') {
      window.addEventListener('mooearth_consent_changed', checkState);
      return () => window.removeEventListener('mooearth_consent_changed', checkState);
    }
  }, [placementId, isPlusSubscriber]);

  // Viewability / Impression Tracking (deduplicated via IntersectionObserver)
  useEffect(() => {
    if (!shouldRender || hasTrackedImpression || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            trackAdImpression(placementId, placement?.format);
            setHasTrackedImpression(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldRender, hasTrackedImpression, placementId, placement?.format]);

  // If advertising is turned off, consent refused, or user is plus subscriber:
  // Render absolutely nothing to avoid layout disruption.
  if (!shouldRender || !placement) {
    return null;
  }

  // Determine container dimensions to guarantee zero Cumulative Layout Shift (CLS)
  const isBanner = placement.format === 'banner' || placement.format === 'horizontal';
  const minHeightClass = isBanner ? 'min-h-[90px]' : 'min-h-[250px]';

  const handleAdClick = () => {
    trackAdClick(placementId);
  };

  return (
    <div
      ref={containerRef}
      id={`ad-slot-${placementId}`}
      aria-label={`Advertisement: ${placement.label}`}
      className={`relative w-full my-4 rounded-xl border border-white/10 bg-slate-900/60 p-3 transition-all duration-300 ${minHeightClass} ${className}`}
      onClick={handleAdClick}
    >
      {/* Editorial Distinction Label */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400 font-medium select-none">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-cyan-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Advertisement
        </span>
        <span className="text-slate-400 text-[9px] hover:text-slate-300 transition-colors">
          Why am I seeing this?
        </span>
      </div>

      {/* Ad Content Container */}
      <div className="flex items-center justify-center w-full min-h-[70px] overflow-hidden text-center">
        {config.provider === 'adsense' && config.client && placement.slot ? (
          // Live Google AdSense Container
          <ins
            className="adsbygoogle block w-full"
            style={{ display: 'block' }}
            data-ad-client={config.client}
            data-ad-slot={placement.slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          // Clean, compliant non-production simulation preview
          <div className="flex flex-col items-center justify-center p-4 text-slate-400 space-y-1">
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              Reserved Ad Slot: {placement.label}
            </span>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Optional ad container. Live network disabled until provider approval and production deployment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
