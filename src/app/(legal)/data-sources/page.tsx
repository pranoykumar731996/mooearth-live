import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Sources & Attribution | MooEarth.Live',
  description: 'Information regarding the sources of sports data and news on MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/data-sources'
  }
};

export default function DataSources() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Data Sources & Attribution</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Sports Data</h2>
          <p>
            The live football scores, match fixtures, team standings, and historical statistics presented on MooEarth.Live are obtained from licensed or authorized third-party sports data providers via API integrations. 
          </p>
          <p className="mt-2">
            While we process and visualize this data on our interactive 3D globe and scoreboards, the raw data itself is the product of our data partners. We make every effort to ensure real-time synchronization, but we do not claim ownership over the raw statistical data of the matches.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. News Aggregation</h2>
          <p>
            MooEarth.Live features a country-specific news aggregation system designed to keep fans updated on their favorite teams. 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Publisher Rights:</strong> All news articles, headlines, featured images, and journalism belong entirely to their original publishers and authors.</li>
            <li><strong>Fair Use & Linking:</strong> We display snippets and headlines under fair use principles to direct traffic to the original sources. Users are strongly encouraged to visit the original publishers' websites to read the full articles and support sports journalism.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Trademarks and Logos</h2>
          <p>
            All team logos, national flags, competition names (such as "FIFA World Cup"), and specific tournament branding are the trademarks and registered properties of their respective owners (e.g., FIFA, national football associations, or regional federations).
          </p>
          <p className="mt-2">
            MooEarth.Live is an independent informational platform. We use these trademarks solely for descriptive, nominative purposes to identify the teams and competitions we are providing data for. We are not officially affiliated with, endorsed by, or sponsored by FIFA or any official football federation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Open Source and Visualizations</h2>
          <p>
            Our interactive 3D globe utilizes powerful open-source web technologies. We extend our gratitude to the maintainers of libraries such as Three.js, React Three Fiber, and react-globe.gl, which make the spatial visualization of global sports data possible.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Questions About Our Data?</h2>
          <p>
            If you represent a publisher or data provider and have questions regarding how your content is aggregated or displayed, please reach out to us at <a href="mailto:legal@mooearth.live" className="text-emerald-400 hover:underline">legal@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
