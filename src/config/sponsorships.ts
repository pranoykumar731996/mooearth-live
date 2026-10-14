// ============================================================
// MooEarth.Live — Sponsorship Framework & Declarative Registry
// ============================================================
// Principles:
// 1. Full Transparency: Every sponsored placement is clearly labeled with sponsor name and badge.
// 2. Editorial Separation: Sponsors cannot alter news ranking, AI takeaways, or news summaries.
// 3. Publisher Protection: Original publisher attributions and source URLs remain 100% intact.
// 4. Scheduling & Lifecycle Controls: Declarative status, start/end dates, and regional targeting.

import { FEATURES } from './features';

export type SponsorshipStatus = 'active' | 'scheduled' | 'paused' | 'archived';
export type SponsorshipType = 'challenge' | 'location_collection' | 'banner';
export type SponsorshipPlacementId = 'challenge_partner' | 'location_collection' | 'news_banner';

export interface SponsoredCampaign {
  id: string;
  sponsorName: string;
  sponsorLogo?: string;
  badgeLabel: string; // e.g. "Educational Partner", "Planetary Conservation Partner"
  type: SponsorshipType;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  status: SponsorshipStatus;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  targetRegions?: string[]; // Empty means global
  impressionCap?: number;
  editorialSeparation: boolean;
}

/**
 * Registry of approved brand and institutional sponsorships.
 * Any campaign can be reviewed, scheduled, paused, or retired here with zero code refactoring.
 */
export const SPONSORED_CAMPAIGNS: SponsoredCampaign[] = [
  {
    id: 'sp_earth_observatory_2026',
    sponsorName: 'Global Earth Observation Alliance',
    badgeLabel: 'Educational Partner',
    type: 'location_collection',
    headline: 'Explore Planet Earth’s Most Remote Rainforest Canopy Observatories',
    description: 'Learn how satellite sensors and local conservationists track biodiversity corridors in real-time across the Amazon and Congo basins.',
    ctaText: 'Explore Canopy Telemetry',
    ctaUrl: 'https://www.mooearth.live/continents/south-america',
    status: 'active',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2027-12-31T23:59:59Z',
    editorialSeparation: true,
  },
  {
    id: 'sp_dark_sky_challenge_2026',
    sponsorName: 'Global Geo Literacy Project',
    badgeLabel: 'Sponsored Educational Challenge',
    type: 'challenge',
    headline: 'Certified Dark Sky Reserves & Astronomical Heritage Challenge',
    description: 'Test your knowledge on the world’s purest astronomical viewing spots from the Atacama Desert to the Namib Rand.',
    ctaText: 'Learn About Dark Sky Sites',
    ctaUrl: 'https://www.mooearth.live/daily',
    status: 'active',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2027-12-31T23:59:59Z',
    editorialSeparation: true,
  },
];

export const SPONSORSHIP_CAMPAIGNS: Record<string, SponsoredCampaign> = {
  challenge_partner: SPONSORED_CAMPAIGNS[1],
  location_collection: SPONSORED_CAMPAIGNS[0],
};

/** Retrieve an active campaign for a given placement type and region */
export function getActiveSponsorship(
  type: SponsorshipType,
  region?: string
): SponsoredCampaign | null {
  if (!FEATURES.enableSponsorships) return null;
  const now = new Date().toISOString();

  const eligible = SPONSORED_CAMPAIGNS.filter((campaign) => {
    if (campaign.type !== type) return false;
    if (campaign.status !== 'active') return false;
    if (campaign.startDate && campaign.startDate > now) return false;
    if (campaign.endDate && campaign.endDate < now) return false;

    if (region && campaign.targetRegions && campaign.targetRegions.length > 0) {
      const match = campaign.targetRegions.some(
        (r) => r.toLowerCase() === region.toLowerCase()
      );
      if (!match) return false;
    }

    return true;
  });

  return eligible.length > 0 ? eligible[0] : null;
}

/** Retrieve an active campaign for a given placement ID */
export function getSponsorshipPlacement(
  placementId: SponsorshipPlacementId,
  region?: string
): SponsoredCampaign | null {
  if (!FEATURES.enableSponsorships) return null;

  if (placementId === 'challenge_partner') {
    return getActiveSponsorship('challenge', region);
  }
  if (placementId === 'location_collection') {
    return getActiveSponsorship('location_collection', region);
  }
  return null;
}
