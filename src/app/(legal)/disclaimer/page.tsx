import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer | MooEarth.Live',
  description: 'Legal disclaimer regarding sports data, news aggregation, and service availability on MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/disclaimer'
  }
};

export default function Disclaimer() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Disclaimer</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. General Information Purpose Only</h2>
          <p>
            The information provided by MooEarth.Live on this website is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Sports Data and APIs</h2>
          <p>
            MooEarth.Live relies on third-party Application Programming Interfaces (APIs) to provide live football scores, fixtures, standings, and match statistics. Please be aware of the following:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Data Accuracy:</strong> Sports schedules, rankings, and scores may change without prior notice. We do not guarantee that the data presented on our 3D globe or scoreboards is perfectly synchronized with real-time events.</li>
            <li><strong>Service Interruptions:</strong> Third-party APIs may occasionally experience downtime, delays, or rate-limiting. MooEarth.Live cannot guarantee uninterrupted access to live data.</li>
            <li><strong>No Betting or Financial Advice:</strong> The sports data provided is strictly for entertainment and informational purposes. It should not be used as the basis for sports betting, financial wagers, or any other critical decision-making.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. External Links and News Aggregation</h2>
          <p>
            The site may contain links to other websites or content belonging to or originating from third parties. MooEarth.Live features a news aggregator that links to external sports publishers.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through our platform.</li>
            <li>News articles, opinions, and analyses belong solely to their original authors and publishers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. AI-Generated Summaries</h2>
          <p>
            Some content on MooEarth.Live, including match recaps and news summaries, may be generated or assisted by Artificial Intelligence (AI). While we strive to configure these models for accuracy, AI can occasionally produce incorrect, misleading, or hallucinated information. Users are encouraged to verify critical facts directly with official sports federations or original news sources. Please read our <Link href="/ai-transparency">AI Transparency Policy</Link> for more details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Professional Advice Disclaimer</h2>
          <p>
            MooEarth.Live does not offer professional sports analytics, legal, or financial advice. The use or reliance of any information contained on this site is solely at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided on the site. Your use of the site and your reliance on any information on the site is solely at your own risk.
          </p>
        </section>
      </div>
    </>
  );
}
