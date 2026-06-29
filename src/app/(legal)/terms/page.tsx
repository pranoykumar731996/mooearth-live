import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | MooEarth.Live',
  description: 'Terms of Service and usage conditions for MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/terms'
  }
};

export default function TermsOfService() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using MooEarth.Live (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p>
            MooEarth.Live provides users with access to a rich collection of resources, including live football scores, standings, fixtures, match statistics, a 3D interactive globe for spatial data visualization, and AI-generated news summaries (the "Service"). You understand and agree that the Service is provided "AS-IS" and that MooEarth.Live assumes no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts & Registration</h2>
          <p>
            Certain features of the Service may require you to register using Google Sign-In. You are responsible for maintaining the confidentiality of your account credentials and are fully responsible for all activities that occur under your account. You agree to immediately notify MooEarth.Live of any unauthorized use of your account or any other breach of security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use Policy</h2>
          <p>You agree to not use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            <li>Attempt to scrape, mass-download, or reverse engineer the sports data, 3D globe models, or AI summaries provided on the platform.</li>
            <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            <li>Violate any applicable local, state, national or international law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Sports Data and News Disclaimer</h2>
          <p>
            The live scores, statistics, and fixtures provided on MooEarth.Live are sourced from third-party APIs. While we strive for real-time accuracy, <strong>data may be subject to delays or inaccuracies</strong>. We are not liable for any decisions, financial or otherwise, made based on the sports data provided on this platform. News articles are aggregated from third-party publishers, and their content remains the responsibility of the original publishers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. AI-Assisted Content</h2>
          <p>
            Certain features, such as match summaries or translated news snippets, may be generated using Artificial Intelligence (AI). AI-generated content is provided for convenience and may contain errors or hallucinations. Users should always refer to official sporting bodies for verified information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p>
            The layout, design, 3D interactive globe integration, and custom code of MooEarth.Live are the property of MooEarth.Live. Third-party team logos, competition names (e.g., FIFA World Cup 2026), and aggregated news content remain the property of their respective copyright and trademark owners. Our use of these marks is purely for informational and descriptive purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
          <p>
            YOU EXPRESSLY UNDERSTAND AND AGREE THAT MOOEARTH.LIVE SHALL NOT BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES RESULTING FROM THE USE OR THE INABILITY TO USE THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Modifications to Service</h2>
          <p>
            MooEarth.Live reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which MooEarth.Live is headquartered, without regard to its conflict of law provisions. Any dispute arising from these terms will be resolved through binding arbitration or in small claims court.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@mooearth.live" className="text-emerald-400 hover:underline">legal@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
