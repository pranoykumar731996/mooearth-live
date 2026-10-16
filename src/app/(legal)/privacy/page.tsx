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
            MooEarth.Live is an interactive platform providing sovereign 3D globe exploration, real-time planetary telemetry, meteorological intelligence, geography challenges, and AI-assisted summaries.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. The Data We Collect About You</h2>
          <p>We believe in strict data minimization. We collect only what is necessary to deliver planetary intelligence:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Identity & Profile Data:</strong> If you voluntarily create an account, we record your chosen username, avatar emoji, and sovereign country preference. Continuous GPS location and real identities are never required.</li>
            <li><strong>Saved Places & Bookmarks:</strong> Curated countries, cities, and planetary events you explicitly save to your personal profile or local storage.</li>
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
            <li>Deliver and maintain our 3D globe, climate layers, and planetary event syntheses.</li>
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
            <li>Advertising systems cannot alter event rankings, AI summaries, or country profiles.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Cookies & Consent Controls</h2>
          <p>
            You have full control over non-essential cookies and telemetry through our Consent Center. For details, see our <Link href="/cookies" className="text-cyan-400 hover:underline">Cookie Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Data Security, Retention & Deletion</h2>
          <p>
            We employ encrypted transit (HTTPS/TLS) and secure Firebase Cloud Firestore rules. You may delete your account, saved places, and discovery history at any time with one click from your Profile Dashboard. Inactive guest telemetry expires automatically within 90 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. AI Providers & Synthetic Data Disclosure</h2>
          <p>
            MooEarth.Live utilizes enterprise AI APIs (such as Google Gemini and OpenAI) strictly to process open, non-personal factual planetary metadata and generate original natural language syntheses.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Zero User Training:</strong> We never transmit your personal profile data, bookmarks, search queries, or private identifiers to third-party AI providers for model training.</li>
            <li><strong>Factual Grounding:</strong> AI prompts receive only verified factual entity records and timestamps, never personal information.</li>
            <li><strong>Human Oversight:</strong> High-impact anomalous telemetry is verified against primary scientific repositories.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Indian Compliance & Grievance Redressal (DPDPA 2023 & IT Rules 2021)</h2>
          <p>
            In accordance with India's <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong> and Rule 3(2) of the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, MooEarth.Live has designated a Grievance Redressal Officer:
          </p>
          <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
            <p className="font-semibold text-white">Grievance Officer: Legal & Standards Desk</p>
            <p>Platform: MooEarth.Live (Operated by Pranoy Kumar)</p>
            <p>Designation: Grievance & Data Protection Officer</p>
            <p>Email: <a href="mailto:grievance@mooearth.live" className="text-cyan-400 hover:underline">grievance@mooearth.live</a></p>
            <p>Acknowledgment: Within 24–36 hours of receipt of complaint</p>
            <p>Disposal/Resolution Timeline: Within 15 business days as stipulated under applicable Indian law</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Contact Us</h2>
          <p>
            If you have questions about this policy or wish to exercise your data sovereignty rights under GDPR, CCPA/CPRA, or DPDPA 2023, please contact our Data Protection Desk at <a href="mailto:privacy@mooearth.live" className="text-cyan-400 hover:underline">privacy@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
