import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertising & Ethical Sponsorship Policy | MooEarth.Live',
  description: 'Ethical advertising, sponsored educational campaigns, and revenue transparency policy for MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/advertising'
  }
};

export default function AdvertisingDisclosure() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Advertising & Ethical Sponsorship Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: October 2026 (Phase 9 Monetization Foundation)</p>

      <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Funding Planetary Intelligence Sustainably</h2>
          <p>
            MooEarth.Live is dedicated to providing free, sovereign-respecting access to living 3D planetary intelligence, open scientific telemetry, meteorological maps, and geography education. To maintain cloud rendering infrastructure, AI translation clusters, and geophysical telemetry pipelines without degrading exploration, we maintain an optional, privacy-respecting advertising and educational sponsorship framework.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Core Principles & User Experience Invariants</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Zero Intrusive Ads:</strong> We strictly prohibit pop-ups, interstitial blockers, audio autoplay, and layout shifts (CLS). Advertisements will never obstruct 3D globe camera controls, map layers, or interactive game cards.</li>
            <li><strong>Editorial Independence:</strong> Advertisements and sponsors never alter AI event syntheses, algorithmic ranking, country prominence, or climate feeds.</li>
            <li><strong>Clear Labeling:</strong> Any advertising unit is distinctly bordered and labeled with an unambiguous &quot;ADVERTISEMENT&quot; badge. Sponsored partnerships are labeled &quot;SPONSORED PARTNER&quot;.</li>
            <li><strong>Publisher Protection:</strong> Ads are never injected into external story or briefing text in any manner that implies endorsement. All external attributions and original scientific links are strictly preserved.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Privacy, Consent & Tracking Boundaries</h2>
          <p>
            In compliance with GDPR, ePrivacy, and CCPA/CPRA regulations:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>No non-essential advertising cookies or trackers are loaded before explicit user consent.</li>
            <li>We <strong>never</strong> transmit personal profile details, authentication tokens, bookmarks, or precise location history to ad networks.</li>
            <li>If you decline advertising consent, display advertising remains completely disabled or non-personalized with zero third-party profiling.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. MooEarth Plus & Ad-Free Exploration</h2>
          <p>
            We are actively researching a community-supported subscription tier (MooEarth Plus). Once implemented, Plus supporters receive 100% ad-free reading across all planetary briefings, 3D atlas views, and geography challenges, alongside extended bookmark collections. Core globe navigation and free exploration will remain freely accessible to everyone.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Managing Your Preferences</h2>
          <p>
            You can modify your consent settings at any time via your Profile Dashboard (Privacy tab) or our Cookie Preferences banner. We honor universal browser Global Privacy Control (GPC) signals.
          </p>
        </section>
      </div>
    </>
  );
}
