import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accessibility Statement | MooEarth.Live',
  description: 'MooEarth.Live is committed to digital accessibility for all users.',
  alternates: {
    canonical: 'https://www.mooearth.live/accessibility'
  }
};

export default function AccessibilityStatement() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Accessibility Statement</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 29, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Our Commitment</h2>
          <p>
            MooEarth.Live is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards (such as WCAG 2.1 AA) to our Progressive Web App. We believe that global football coverage should be accessible to all fans.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Accessibility Features</h2>
          <p>We have implemented several features to ensure our site is as accessible as possible:</p>
          <ul className="list-disc pl-6 space-y-4 mt-4">
            <li>
              <strong>Keyboard Navigation:</strong> Core features, including news feeds and standard menus, can be navigated using a keyboard. We have implemented focus rings to indicate the current active element.
            </li>
            <li>
              <strong>Screen Reader Compatibility:</strong> We use semantic HTML5 elements, ARIA (Accessible Rich Internet Applications) labels on interactive buttons (such as search and modals), and proper heading structures to assist screen readers.
            </li>
            <li>
              <strong>Mobile Accessibility:</strong> As a Progressive Web App (PWA), our interface scales and adapts to various screen sizes, ensuring touch targets are appropriately sized for mobile devices.
            </li>
            <li>
              <strong>Color Contrast & Text:</strong> We strive to maintain sufficient color contrast between text and backgrounds, especially within our dark mode interface.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Known Limitations</h2>
          <p>
            While we strive for comprehensive accessibility, some areas of the site present unique challenges:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>3D Interactive Globe:</strong> The primary 3D globe visualization relies on WebGL canvas elements, which are inherently difficult to make fully accessible to screen readers. We provide alternative text-based views (such as the standard list-based Match Center and Standings tables) so users can access the same data without needing to interact with the 3D canvas.</li>
            <li><strong>Third-Party Content:</strong> Embedded videos or specific iframes from third-party publishers may not fully comply with our accessibility standards.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Feedback and Reporting Issues</h2>
          <p>
            We welcome your feedback on the accessibility of MooEarth.Live. If you encounter accessibility barriers, please let us know so we can address them:
          </p>
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p>Email: <a href="mailto:support@mooearth.live" className="text-emerald-300 hover:underline">support@mooearth.live</a></p>
            <p className="mt-2 text-sm text-gray-400">Please provide a description of the issue, the URL where you encountered it, and the assistive technology you were using (if applicable).</p>
          </div>
        </section>
      </div>
    </>
  );
}
