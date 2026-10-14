import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for MooEarth Live. Learn how we collect, use, and protect your information.',
  alternates: {
    canonical: 'https://www.mooearth.live/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | MooEarth Live',
    description: 'Privacy Policy for MooEarth Live. Learn how we collect, use, and protect your information.',
    url: 'https://www.mooearth.live/privacy',
    type: 'website',
    siteName: 'MooEarth Live',
  },
};

export default function PrivacyPolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: October 2026 (Phase 9 Privacy Safeguards)</p>

      <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Introduction</h2>
          <p>
            Welcome to MooEarth.Live. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our Progressive Web App (PWA) and tell you about your privacy rights and how the law protects you.
          </p>
          <p className="mt-2">
            MooEarth.Live is an interactive platform providing sovereign 3D globe exploration, verified real-time world news, meteorological intelligence, geography challenges, and AI-assisted summaries.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. The Data We Collect About You</h2>
          <p>We believe in strict data minimization. We collect only what is necessary to deliver planetary intelligence:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Identity & Profile Data:</strong> If you voluntarily create an account, we record your chosen username, avatar emoji, and sovereign country preference. Continuous GPS location and real identities are never required.</li>
            <li><strong>Saved Places & Bookmarks:</strong> Curated countries, cities, and news stories you explicitly save to your personal profile or local storage.</li>
            <li><strong>Technical & Session Telemetry:</strong> Anonymized session IDs, device type (desktop/mobile/tablet), traffic referrer, and non-sensitive interactions (e.g. globe rotation counts, language chosen). Continuous GPS coordinates and device location history are <strong>never</strong> recorded.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. How Is Your Personal Data Collected?</h2>
          <p>We use different methods to collect data from and about you including through:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Direct interactions:</strong> Bookmarking places, voting on feature waitlists, or customizing your profile preferences.</li>
            <li><strong>Automated technologies:</strong> Aggregated, privacy-respecting performance and crash reporting (Sentry, Google Analytics with Consent Mode v2).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. How We Use Your Personal Data</h2>
          <p>We use your personal data strictly to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Deliver and maintain our 3D globe, climate layers, and world news syntheses.</li>
            <li>Synchronize your private saved bookmarks across your authenticated devices.</li>
            <li>Validate demand for potential community features (MooEarth Plus waitlist).</li>
            <li>Monitor server performance, crash events, and infrastructure health.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Advertising & Data Isolation</h2>
          <p>
            We strictly enforce complete isolation between advertising systems and your private data:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>We <strong>never</strong> sell your personal information or browsing history.</li>
            <li>Private profile details, bookmarks, and discovery history are never shared with ad providers.</li>
            <li>Advertising systems cannot alter news rankings, AI summaries, or country profiles.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Cookies & Consent Controls</h2>
          <p>
            You have full control over non-essential cookies and telemetry through our Consent Center. For details, see our <Link href="/cookies" className="text-cyan-400 hover:underline">Cookie Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Data Security & Retention</h2>
          <p>
            We employ encrypted transit (HTTPS/TLS) and secure Firebase Cloud Firestore rules. You may delete your account, saved places, and discovery history at any time with one click from your Profile Dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Contact Us</h2>
          <p>
            If you have questions about this policy or wish to exercise your data sovereignty rights under GDPR or CCPA/CPRA, please contact us at privacy@mooearth.live.
          </p>
        </section>
      </div>
    </>
  );
}
