import { Metadata } from 'next';
import Link from 'next/link';
import EmbedGenerator from '@/components/Embed/EmbedGenerator';
import { getAllContinents } from '@/data/continents';

export const metadata: Metadata = {
  title: '3D Globe Embed Generator & Integration Guide | MooEarth Live',
  description: 'Embed responsive, live 3D Earth visualizations, breaking international news, and meteorological telemetry in schools, publications, blogs, and newsletters. Free educational & editorial distribution.',
  keywords: [
    'MooEarth Live embed',
    'embed 3D globe',
    'interactive world map iframe',
    'educational globe widget',
    'geography classroom embed',
    'journalism interactive map',
    'responsive globe iframe',
    'MooEarth widget generator',
  ],
  alternates: {
    canonical: 'https://www.mooearth.live/embed',
  },
  openGraph: {
    title: '3D Globe Embed Generator & Integration Guide | MooEarth Live',
    description: 'Embed responsive, live 3D Earth visualizations, breaking international news, and meteorological telemetry in schools, publications, blogs, and newsletters.',
    url: 'https://www.mooearth.live/embed',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live 3D Globe Embed Generator',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Globe Embed Generator & Integration Guide | MooEarth Live',
    description: 'Embed responsive, live 3D Earth visualizations, breaking international news, and meteorological telemetry in schools, publications, blogs, and newsletters.',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function EmbedDocumentationPage() {
  const continents = getAllContinents();

  // Structured Data (Schema.org WebApplication + HowTo + BreadcrumbList)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.mooearth.live/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '3D Globe Embed Generator & Documentation',
            item: 'https://www.mooearth.live/embed',
          },
        ],
      },
      {
        '@type': 'WebApplication',
        name: 'MooEarth Live 3D Globe Embed Widget',
        url: 'https://www.mooearth.live/embed',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All modern web browsers with WebGL',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description: 'Interactive 3D Earth Globe widget embeddable via standard responsive iframe for classrooms, journalists, bloggers, and newsletter curators.',
      },
      {
        '@type': 'HowTo',
        name: 'How to Embed the MooEarth Live 3D Globe into Your Website or Classroom',
        description: 'Step-by-step instructions for embedding the interactive 3D Earth Globe widget into WordPress, Ghost, Google Classroom, Canvas LMS, and modern web pages.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Configure Embed Parameters',
            text: 'Choose visual theme (dark/light), layer mode (standard, night, weather, satellite), and initial country target using the MooEarth Embed Generator.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Copy Responsive Iframe Code',
            text: 'Click the "Copy Embed Code" button to copy the responsive HTML iframe snippet with clean UTM tracking and fallback markup.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Paste into Your CMS or LMS',
            text: 'Paste the snippet into a Custom HTML block in WordPress, Ghost, Canvas LMS, Google Classroom, or your HTML template.',
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header & Breadcrumbs */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 pb-6 border-b border-white/10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white/80 font-medium">Embed Engine &amp; Documentation</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              GLOBAL EMBED &amp; ORGANIC DISTRIBUTION ENGINE
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
              Embed the Living Planet: 3D Globe Generator &amp; Documentation
            </h1>
            <p className="text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">
              Equip your digital classroom, publication, blog, or newsletter with an interactive 3D globe.
              Featuring real-time world events, sovereign borders, live meteorological observations, and responsive touch controls.
              Completely free, ad-free, and privacy-respecting for educational and editorial use.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="#embed-generator"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs tracking-wider shadow-lg shadow-cyan-500/25 transition-all"
            >
              Configure Widget ↓
            </a>
            <a
              href="#use-cases"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all"
            >
              Audience Guides ↓
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 space-y-16 flex-1">
        {/* Anti-Spam & Ethical Distribution Charter */}
        <section aria-label="Organic Distribution Policy" className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-black to-cyan-950/20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
                🛡️
              </div>
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Legitimate Organic Authority &amp; Anti-Spam Policy
                </h2>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-3xl">
                  MooEarth Live strictly rejects automated link schemes, private blog networks, and artificial link injection.
                  Our embed engine exists solely to provide genuine educational and journalistic value to real human audiences.
                  Every embed includes an unobtrusive attribution badge with standard Google Analytics UTM tags (<code>utm_source=embed</code>).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-300 shrink-0">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">✓ 0 Tracking Cookies</span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">✓ COPPA / FERPA Safe</span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">✓ Free Editorial Use</span>
            </div>
          </div>
        </section>

        {/* 1. Interactive Embed Generator Component */}
        <EmbedGenerator />

        {/* 2. Detailed Audience Documentation Guides */}
        <section id="use-cases" aria-label="Use Case Guides" className="space-y-10">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              IMPLEMENTATION BLUEPRINTS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How Different Audiences Can Use the 3D Globe Embed
            </h2>
            <p className="text-sm text-white/60 mt-1 max-w-2xl">
              Tailored blueprints and best practices for educators, independent writers, digital publishers, and newsletter curators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide 1: Schools & Educators */}
            <article className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
                  🎓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    1. How Schools, Colleges &amp; Educators Can Use It
                  </h3>
                  <p className="text-xs font-mono text-cyan-400 mt-0.5">
                    Spatial Literacy • STEM / Earth Science • Google Classroom &amp; Canvas LMS
                  </p>
                </div>
                <div className="text-xs text-white/70 space-y-2.5 leading-relaxed">
                  <p>
                    <strong>Interactive Spatial Cartography:</strong> Replace static paper atlases with an interactive WebGL sphere that students can spin, zoom, and inspect on smartboards, iPads, and Chromebooks.
                  </p>
                  <p>
                    <strong>LMS Integration:</strong> Embed directly into Google Classroom assignments, Canvas LMS modules, Blackboard, and Moodle without installing any external desktop software or plugins.
                  </p>
                  <p>
                    <strong>Hands-on Geodesic Activities:</strong> Assign students to track real-time meteorological observations, identify capital cities across all 195 sovereign nations, and calculate Haversine geodesic distances between metropolitan centers.
                  </p>
                  <p>
                    <strong>Student-Safe by Design:</strong> Zero advertisements, zero third-party commercial tracking cookies, and 100% verified educational geography datasets.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400 font-mono">
                <span>Recommended: <code>view=discovery</code> • Height: 600px</span>
                <span>LMS Ready →</span>
              </div>
            </article>

            {/* Guide 2: Bloggers & Creators */}
            <article className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
                  ✍️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    2. How Bloggers, Essayists &amp; Creators Can Use It
                  </h3>
                  <p className="text-xs font-mono text-purple-400 mt-0.5">
                    Travel Writing • Geopolitical Commentary • WordPress &amp; Ghost CMS
                  </p>
                </div>
                <div className="text-xs text-white/70 space-y-2.5 leading-relaxed">
                  <p>
                    <strong>Enrich Travel &amp; Culture Posts:</strong> When writing about Tokyo, Paris, or Patagonia, embed a localized globe with <code>?country=japan</code> to anchor your narrative in tactile 3D space.
                  </p>
                  <p>
                    <strong>Boost Reader Dwell Time:</strong> Readers naturally spend 45–90 seconds exploring the globe, increasing on-page engagement time—a positive organic ranking factor for search engines.
                  </p>
                  <p>
                    <strong>One-Click CMS Embedding:</strong> Paste the HTML snippet into WordPress Gutenberg (Custom HTML block), Ghost (HTML card), Notion, Medium, Squarespace, or Webflow.
                  </p>
                  <p>
                    <strong>Zero Performance Penalty:</strong> With <code>loading="lazy"</code>, the WebGL container loads only when scrolled into view, keeping your PageSpeed Insights score at 95+.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-mono">
                <span>Recommended: <code>theme=dark</code> • Height: 500px</span>
                <span>Blog Ready →</span>
              </div>
            </article>

            {/* Guide 3: Digital Publishers & Newsrooms */}
            <article className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  📰
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    3. How Publishers &amp; Newsrooms Can Use It
                  </h3>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">
                    Breaking News Anchors • International Desks • Live Wire Telemetry
                  </p>
                </div>
                <div className="text-xs text-white/70 space-y-2.5 leading-relaxed">
                  <p>
                    <strong>Live Event Cartography:</strong> Pinpoint active international news, geopolitical summits, and humanitarian updates directly onto physical planetary geography.
                  </p>
                  <p>
                    <strong>Weather &amp; Disaster Tracking:</strong> When reporting on cyclones, heatwaves, or atmospheric rivers, embed with <code>?view=weather</code> for instant visual telemetry.
                  </p>
                  <p>
                    <strong>Sandboxed &amp; High-Availability:</strong> Hosted on distributed CDN edge servers, the widget runs in an isolated iframe sandbox that cannot crash the parent publisher page.
                  </p>
                  <p>
                    <strong>Broadsheet &amp; Mobile Responsive:</strong> Automatically adapts from 1200px desktop editorial layouts to 375px mobile article frames with touch pinch-and-drag support.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Recommended: <code>view=weather</code> • Height: 650px</span>
                <span>Newsroom Ready →</span>
              </div>
            </article>

            {/* Guide 4: Newsletters & Curators */}
            <article className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                  ✉️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    4. How Newsletters &amp; Curated Digests Can Use It
                  </h3>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">
                    Substack &amp; Beehiiv Web Editions • Weekly World Briefings • Email Fallbacks
                  </p>
                </div>
                <div className="text-xs text-white/70 space-y-2.5 leading-relaxed">
                  <p>
                    <strong>Web Edition Interactivity:</strong> Modern email newsletters published on Substack, Beehiiv, or Ghost render full interactive iframes for subscribers viewing in their browser.
                  </p>
                  <p>
                    <strong>Email Client Fallback Card:</strong> For desktop email apps (Gmail, Apple Mail) that strip iframes, our embed code provides a semantic fallback link and high-res preview snapshot pointing to the live globe via UTM tags.
                  </p>
                  <p>
                    <strong>Curated Regional Deep-Dives:</strong> Anchor weekly geopolitical briefings or international environmental updates with a dedicated regional focus widget.
                  </p>
                  <p>
                    <strong>Audience Attribution:</strong> Clean transparent attribution parameters allow newsletter authors to track outbound engagement in their analytics.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>Recommended: <code>theme=light</code> • Height: 450px</span>
                <span>Digest Ready →</span>
              </div>
            </article>
          </div>
        </section>

        {/* 3. Platform Integration Guide */}
        <section aria-label="CMS Integration Steps" className="space-y-6">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              CMS COMPATIBILITY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              One-Minute Setup in Popular Publishing Platforms
            </h2>
            <p className="text-sm text-white/60 mt-1 max-w-2xl">
              Copy the embed snippet and paste directly into your publishing tool of choice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-cyan-400 font-bold block">WORDPRESS</span>
              <h3 className="text-sm font-bold text-white">Gutenberg Editor</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Add a <strong>Custom HTML</strong> block to any post or page, paste the snippet, and click <em>Preview</em>.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-purple-400 font-bold block">GHOST CMS</span>
              <h3 className="text-sm font-bold text-white">Card Inserter</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Type <code>/html</code> in the Ghost editor, paste the snippet into the HTML card, and publish.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-emerald-400 font-bold block">CANVAS / LMS</span>
              <h3 className="text-sm font-bold text-white">Rich Content Editor</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Click <em>Insert &gt; Embed</em> in Canvas or Blackboard, paste the iframe code, and save the assignment.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono text-amber-400 font-bold block">WEBFLOW &amp; NOTION</span>
              <h3 className="text-sm font-bold text-white">Embed Component</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Drop an <strong>Embed</strong> element into your layout in Webflow, or type <code>/embed</code> in Notion and enter the widget URL.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Query Parameters Reference Table */}
        <section aria-label="API Query Parameter Reference" className="space-y-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              DEVELOPER SPECIFICATIONS
            </span>
            <h2 className="text-2xl font-bold text-white">
              URL Query Parameters Reference
            </h2>
            <p className="text-xs text-white/60">
              Customize the iframe URL directly via standard URL query parameters on <code>https://www.mooearth.live/embed/globe</code>.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-white/70 font-mono">
                  <th className="p-3.5">Parameter</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Allowed Values</th>
                  <th className="p-3.5">Default</th>
                  <th className="p-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                <tr>
                  <td className="p-3.5 font-mono text-cyan-300">theme</td>
                  <td className="p-3.5 text-white/60 font-mono">string</td>
                  <td className="p-3.5 text-white/80 font-mono">dark | light</td>
                  <td className="p-3.5 font-mono text-white/40">dark</td>
                  <td className="p-3.5 text-white/70">Visual color scheme for container background and overlay controls.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-cyan-300">view</td>
                  <td className="p-3.5 text-white/60 font-mono">string</td>
                  <td className="p-3.5 text-white/80 font-mono">standard | night | weather | satellite | discovery</td>
                  <td className="p-3.5 font-mono text-white/40">standard</td>
                  <td className="p-3.5 text-white/70">Atmospheric rendering layer and planet surface texture map.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-cyan-300">country</td>
                  <td className="p-3.5 text-white/60 font-mono">string</td>
                  <td className="p-3.5 text-white/80 font-mono">Country slug (e.g., japan, india, brazil)</td>
                  <td className="p-3.5 font-mono text-white/40">none (global)</td>
                  <td className="p-3.5 text-white/70">Rotates and zooms camera onto sovereign nation coordinates upon initialization.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-cyan-300">category</td>
                  <td className="p-3.5 text-white/60 font-mono">string</td>
                  <td className="p-3.5 text-white/80 font-mono">breaking | weather | sports | technology | business</td>
                  <td className="p-3.5 font-mono text-white/40">all</td>
                  <td className="p-3.5 text-white/70">Filters 3D world event markers to specific journalistic telemetry categories.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Frequently Asked Questions */}
        <section aria-label="Embed FAQs" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>❓</span> Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <h3 className="text-sm font-bold text-white">Is embedding the 3D globe free?</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Yes. MooEarth Live provides free embed access for all verified educational, journalistic, editorial, and non-commercial creators. Commercial newsrooms can also embed standard widgets freely with attribution intact.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <h3 className="text-sm font-bold text-white">Does it slow down my website load speed?</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                No. The embed uses <code>loading="lazy"</code>, so the WebGL scene and 3D textures are only requested when a reader scrolls the frame into their viewport. Parent page Core Web Vitals remain completely unaffected.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <h3 className="text-sm font-bold text-white">What happens if a student’s browser has WebGL disabled?</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Our widget includes automated WebGL capability detection. If hardware acceleration is missing, it displays an accessible 2D planetary telemetry card with direct links to MooEarth Live.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
              <h3 className="text-sm font-bold text-white">Can I remove the attribution badge?</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                The unobtrusive attribution badge ("Powered by MooEarth Live ↗") is required under our free distribution license to provide readers with accurate data provenance and maintain organic authority.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Continents & World Directory Knowledge Graph Hubs */}
        <section aria-label="Knowledge Graph Portals" className="pt-8 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🌐</span> Continental &amp; Planetary Navigation Hubs
              </h2>
              <p className="text-xs text-white/60">
                Explore dedicated knowledge graph atlases and interactive simulators across the globe.
              </p>
            </div>
            <Link href="/world-map" className="text-xs text-cyan-400 hover:underline">
              View World Map →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/continents"
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-xs text-white transition-all font-semibold"
            >
              🌍 7 Continents Directory
            </Link>
            {continents.map(c => (
              <Link
                key={c.slug}
                href={`/continents/${c.slug}`}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all"
              >
                {c.name} Atlas
              </Link>
            ))}
            <Link
              href="/globe"
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-xs text-cyan-300 transition-all font-semibold"
            >
              🌐 3D Interactive Globe
            </Link>
            <Link
              href="/countries"
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all"
            >
              🏛️ 195 Sovereign Countries
            </Link>
            <Link
              href="/weather"
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all"
            >
              🌤️ Global Weather Telemetry
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60 py-8 px-4 sm:px-6 text-center text-xs text-white/40">
        <p>© 2026 MooEarth Live. Legitimate Educational &amp; Journalistic Spatial Distribution Engine.</p>
        <p className="mt-1">
          Standard attribution: "Powered by MooEarth Live" with Google Analytics UTM parameter tracking.
        </p>
      </footer>
    </div>
  );
}
