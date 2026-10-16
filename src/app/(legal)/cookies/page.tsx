import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie & Consent Policy | MooEarth.Live',
  description: 'Understand how MooEarth.Live uses cookies, storage, and privacy consent controls.',
  alternates: {
    canonical: 'https://www.mooearth.live/cookies'
  }
};

export default function CookiePolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Cookie & Consent Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: October 2026 (Phase 9 Consent Update)</p>

      <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. What Are Cookies and Local Storage?</h2>
          <p>
            MooEarth.Live uses cookies and client-side storage technologies (such as localStorage and IndexedDB) to ensure high-performance 3D rendering, preserve your saved places, and maintain your preferred language and map layer configuration.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Categories of Cookies We Use</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <h3 className="font-bold text-white text-base">A. Strictly Necessary (Always Active)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Required for core website functionality, security tokens, session state, and remembering your consent preferences. Disabling these via browser flags will prevent the 3D globe and interactive event viewers from operating normally.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <h3 className="font-bold text-white text-base">B. Aggregated Telemetry & Analytics (Optional)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Used to compile anonymous metrics regarding active visitors, page navigation frequency, and client-side error boundaries. We do not track personal identifying information, IP addresses, or continuous geolocation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <h3 className="font-bold text-white text-base">C. Advertising & Partner Intelligence (Optional)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Used to deliver non-intrusive, privacy-compliant advertisements to fund our planetary intelligence infrastructure. Advertising tracking scripts remain blocked until you grant explicit consent.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Managing Your Choices</h2>
          <p>
            You can modify or withdraw your consent at any time:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Open the <strong>Privacy tab</strong> in your Profile Dashboard.</li>
            <li>Click &quot;Customize Preferences&quot; on the persistent cookie banner.</li>
            <li>Enable Global Privacy Control (GPC) in your web browser.</li>
          </ul>
          <p className="mt-3">
            For further information on data sovereignty and storage handling, read our{' '}
            <Link href="/privacy" className="text-cyan-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
