import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertising & Affiliate Disclosure | MooEarth.Live',
  description: 'Information on advertising, sponsorships, and affiliate links on MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/advertising'
  }
};

export default function AdvertisingDisclosure() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Advertising & Affiliate Disclosure</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Funding MooEarth.Live</h2>
          <p>
            MooEarth.Live is a free-to-use platform dedicated to providing global football coverage, 3D interactive visualizations, and real-time scores. To maintain our servers, data API licenses, and ongoing development, we may rely on advertising and affiliate partnerships as sources of revenue.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Advertisements</h2>
          <p>
            You may see display advertisements (such as banners or video ads) while using MooEarth.Live. These advertisements may be delivered by third-party advertising networks (e.g., Google AdSense). 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>These networks may use cookies to serve ads based on your prior visits to our website or other websites.</li>
            <li>We do not have direct control over the specific ads that are displayed, but we strive to block categories of ads that are inappropriate or malicious.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Affiliate Links</h2>
          <p>
            Some links on MooEarth.Live, particularly those pointing to sports merchandise, ticketing platforms, or streaming services, may be "affiliate links."
          </p>
          <p className="mt-2">
            This means if you click on the link and purchase an item, MooEarth.Live may receive a small affiliate commission at <strong>no extra cost to you</strong>. This is a common practice that helps support the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Sponsored Content</h2>
          <p>
            From time to time, we may partner with brands to create sponsored content (such as a featured article about a football tournament). We are committed to transparency, and any content that is sponsored or paid for will be clearly identified as "Sponsored," "Promoted," or "Partner Content."
          </p>
          <p className="mt-2">
            Our editorial integrity is paramount. We will never alter match statistics or skew news aggregation to favor a sponsor.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Choices</h2>
          <p>
            You can manage how ads are served to you by adjusting your cookie preferences or using browser-based ad-blocking tools. However, we ask that you consider whitelisting MooEarth.Live so we can continue providing free sports data to fans worldwide.
          </p>
        </section>
      </div>
    </>
  );
}
