'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getSponsorshipPlacement, SponsorshipPlacementId } from '@/config/sponsorships';
import { trackSponsorshipImpression, trackSponsorshipClick } from '@/services/analytics';

interface SponsoredPlacementProps {
  placementId: SponsorshipPlacementId;
  className?: string;
}

/**
 * Transparent, clearly attributed Sponsored Partner Placement Component.
 * - Adheres strictly to editorial separation: clearly marked as "SPONSORED PARTNER".
 * - Never influences news ranking or AI summaries.
 * - Preserves full publisher attribution.
 */
export const SponsoredPlacement: React.FC<SponsoredPlacementProps> = ({
  placementId,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  const campaign = getSponsorshipPlacement(placementId);

  useEffect(() => {
    if (!campaign || hasTrackedImpression || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            trackSponsorshipImpression(campaign.id, campaign.sponsorName);
            setHasTrackedImpression(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [campaign, hasTrackedImpression]);

  if (!campaign) return null;

  const handleClick = () => {
    trackSponsorshipClick(campaign.id, campaign.sponsorName);
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/40 p-4 backdrop-blur-md transition-all shadow-lg ${className}`}
    >
      {/* Header Attribution */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
        <span className="flex items-center gap-1.5">
          <span>🎖️</span>
          {campaign.badgeLabel}
        </span>
        <span className="text-slate-400 normal-case font-normal text-[11px]">
          Presented by <strong className="text-amber-200">{campaign.sponsorName}</strong>
        </span>
      </div>

      {/* Content */}
      <div className="mt-2">
        <h3 className="text-sm font-bold text-white tracking-tight">{campaign.headline}</h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{campaign.description}</p>
      </div>

      {/* Footer Link / CTA */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-500 italic">
          Educational partnership • Editorial content unaffected
        </span>
        <a
          href={campaign.ctaUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium text-xs transition-colors"
        >
          <span>{campaign.ctaText}</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  );
};
