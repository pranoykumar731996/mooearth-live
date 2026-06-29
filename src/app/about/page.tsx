import { Metadata } from 'next';
import GlobalFooter from '@/components/Layout/GlobalFooter';

export const metadata: Metadata = {
  title: 'About MooEarth.Live',
  description: 'Our mission to bring the world together through live football coverage.',
  alternates: {
    canonical: 'https://www.mooearth.live/about'
  }
};

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            About MooEarth.Live
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Our mission is to build the ultimate, globally-connected digital stadium for football fans. We aim to break down geographical barriers by combining real-time sports data, cutting-edge 3D visualization, and localized news into a single, seamless Progressive Web App.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Why We Exist</h2>
              <p>
                Following international football, particularly massive tournaments like the FIFA World Cup, can often feel disjointed. Fans have to check one app for scores, another for standings, a different site for news, and rarely get a sense of the global scale of the tournament.
              </p>
              <p>
                MooEarth.Live exists to unify that experience. By utilizing an interactive 3D globe as our central interface, we don't just show you that a team won—we show you exactly where the fans are celebrating.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Core Features</h2>
              <ul className="list-disc pl-6 space-y-4">
                <li><strong>The 3D Globe:</strong> A WebGL-powered interactive globe that visualizes participating countries, matches, and stadium locations in real-time.</li>
                <li><strong>Live Match Center:</strong> Instant updates on fixtures, live scores, and comprehensive match statistics.</li>
                <li><strong>Country-Specific Feeds:</strong> A localized experience that surfaces the news, standing, and squad data that matters most to your selected nation.</li>
                <li><strong>AI-Assisted Insights:</strong> Leveraging modern language models to provide quick match recaps and news summaries so you never miss a beat.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
              <p>
                We envision a platform where technology enhances the passion of the beautiful game. As we approach the 2026 World Cup and beyond, MooEarth.Live will continue to evolve, bringing more interactive features, deeper analytics, and a stronger community focus to fans worldwide.
              </p>
            </section>
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
