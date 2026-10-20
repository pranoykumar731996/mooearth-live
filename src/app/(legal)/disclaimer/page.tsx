import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer | MooEarth.Live',
  description: 'Legal disclaimer regarding sports data, planetary telemetry, and service availability on MooEarth.Live.',
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
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Meteorological & Planetary Telemetry</h2>
          <p>
            MooEarth.Live synthesizes real-time planetary observations from authorized meteorological and geospatial APIs (including Open-Meteo, NOAA, NASA, and USGS). Please be aware of the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Atmospheric Variability:</strong> Meteorological models, radar estimates, and environmental telemetry represent numerical approximations based on available sensor stations and satellite sweeps. Numerical weather forecasts are subject to natural atmospheric dynamics.</li>
            <li><strong>Service Continuity:</strong> Upstream scientific data feeds may occasionally experience maintenance cycles, satellite pass delays, or telemetry recalibration.</li>
            <li><strong>Not for Life-Safety Directives:</strong> MooEarth.Live provides situational and educational planetary awareness. For urgent civil protection, flood evacuations, or severe weather life-safety directives, always follow official instructions from local emergency management authorities and national meteorological offices.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. External Scientific Repositories and Attribution</h2>
          <p>
            The site contains references and outbound links to official scientific repositories (including the USGS, NASA, NOAA, and Open-Meteo). MooEarth.Live provides direct links to primary observational data so users can review authoritative raw measurements.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>We do not warrant or assume legal responsibility for service interruptions or sensor calibration adjustments conducted by primary scientific agencies.</li>
            <li>All agency logos, mission trademarks, and dataset identifiers belong to their respective governmental or institutional organizations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Scientific Briefings and AI Assistance</h2>
          <p>
            Some content on MooEarth.Live, including geophysical and atmospheric event briefings, may be synthesized or assisted by automated algorithms and Artificial Intelligence (AI) models operating strictly on official sensor telemetry. While designed for physical accuracy and objective scientific rigor, these briefings are intended for educational and situational awareness purposes only. For official civil protection directives or emergency warnings, always consult national disaster response agencies (e.g., USGS, NOAA, FEMA). Please read our <Link href="/ai-transparency">AI Transparency Policy</Link> for more details.
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
