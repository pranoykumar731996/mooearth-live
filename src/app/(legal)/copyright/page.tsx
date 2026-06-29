import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Copyright Policy | MooEarth.Live',
  description: 'MooEarth.Live Copyright Policy outlining intellectual property rights and user responsibilities.',
  alternates: {
    canonical: 'https://www.mooearth.live/copyright'
  }
};

export default function CopyrightPolicy() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Copyright Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Intellectual Property Rights</h2>
          <p>
            All content, features, and functionality on MooEarth.Live, including but not limited to the interactive 3D globe visualization code, custom graphics, platform design, user interface, and proprietary software, are owned by MooEarth.Live and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Third-Party Trademarks and Content</h2>
          <p>
            MooEarth.Live is an informational platform covering international football, including the FIFA World Cup 2026. 
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>"FIFA", "World Cup", national team names, and team logos are registered trademarks of their respective owners and federations.</li>
            <li>News articles, images within aggregated news feeds, and specific match data are the property of their original publishers or data providers.</li>
            <li>Our use of these trademarks and data is purely nominative and descriptive, intended solely to inform users about sporting events. MooEarth.Live claims no affiliation with, nor endorsement by, FIFA or any specific football federation unless explicitly stated.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Responsibilities</h2>
          <p>When using MooEarth.Live, you agree to respect our intellectual property and the intellectual property of third parties. You may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the proprietary code or 3D models on our site.</li>
            <li>Scrape, mine, or extract data from our APIs for commercial use without written permission.</li>
            <li>Delete or alter any copyright, trademark, or other proprietary rights notices from copies of materials from this site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Copyright Infringement Reporting</h2>
          <p>
            If you are a copyright owner or an agent thereof and believe that any content on MooEarth.Live infringes upon your copyrights, you may submit a notification pursuant to the Digital Millennium Copyright Act ("DMCA") or applicable international law.
          </p>
          <p className="mt-4">
            For detailed instructions on how to submit a formal takedown request, the required information, and our counter-notice procedures, please read our full <Link href="/dmca">DMCA / Copyright Complaint Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Procedure for Removing Infringing Material</h2>
          <p>
            Upon receipt of a valid, complete takedown notice, MooEarth.Live will take swift action to remove or disable access to the allegedly infringing material. We also maintain a policy that provides for the termination in appropriate circumstances of users who are repeat infringers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Information</h2>
          <p>
            For general copyright inquiries (not formal takedown notices), you may contact us at <a href="mailto:legal@mooearth.live" className="text-emerald-400 hover:underline">legal@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
