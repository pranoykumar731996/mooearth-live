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
    <div className="h-screen overflow-y-auto scrollbar-thin bg-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            About MooEarth.Live
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Connecting You to Every Country on Earth</h2>
              <p>MooEarth.Live is an interactive global platform designed to help people discover what&apos;s happening anywhere in the world.</p>
              <p>Our mission is simple:</p>
              <p><strong>Touch any country on the globe or search for any nation, and instantly explore its latest news, important events, sports, technology, business, entertainment, weather, culture, and much more—all in one place.</strong></p>
              <p>We believe the world should be easier to explore.</p>
              <p>Instead of searching across dozens of websites, MooEarth.Live brings global information together through an interactive 3D Earth experience.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
              <p>Our mission is to make every country on Earth instantly accessible through information.</p>
              <p>Whether you want to follow global headlines, explore another nation&apos;s culture, stay informed about breaking events, or discover what&apos;s happening in real time, MooEarth.Live helps you experience the world through a single interactive platform.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Why MooEarth.Live Exists</h2>
              <p>Today, finding information about different countries often means switching between search engines, news websites, sports platforms, weather services, and social media.</p>
              <p>We wanted to build something different.</p>
              <p>A place where the Earth itself becomes your navigation.</p>
              <p>Simply rotate the globe, tap any country, or search for its name, and immediately discover what&apos;s happening there.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">What You Can Explore</h2>
              <ul className="list-none space-y-4">
                <li><strong>🌍 Interactive 3D Globe:</strong> Navigate the world naturally by selecting any country directly on an interactive Earth.</li>
                <li><strong>📰 Global News:</strong> Read the latest news from countries around the world.</li>
                <li><strong>⚽ Sports:</strong> Follow international sporting events, including FIFA World Cup coverage, live scores, standings, fixtures, and match statistics.</li>
                <li><strong>🌦 Weather:</strong> View weather information for countries and regions.</li>
                <li><strong>💼 Business:</strong> Discover business and economic developments from around the world.</li>
                <li><strong>💻 Technology:</strong> Stay updated on innovation, startups, AI, and technology news.</li>
                <li><strong>🎬 Entertainment:</strong> Explore entertainment stories from different countries.</li>
                <li><strong>🔍 Country Discovery:</strong> Learn about nations through their latest developments, headlines, and events.</li>
                <li><strong>🤖 AI-Powered Insights:</strong> Receive quick summaries and organized information to help you understand important stories faster.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
              <p>We envision MooEarth.Live becoming the world&apos;s interactive information globe.</p>
              <p>A platform where anyone can explore any country, understand what&apos;s happening there in real time, and experience global events from a local perspective.</p>
              <p>Whether it&apos;s breaking news, international sports, technology, business, weather, or cultural moments, our goal is to make the entire world easier to discover.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">FIFA World Cup 2026 and Beyond</h2>
              <p>The FIFA World Cup 2026 is one of the major experiences available on MooEarth.Live.</p>
              <p>During the tournament, users can follow matches, standings, fixtures, statistics, and football news alongside broader coverage from participating countries.</p>
              <p>But our vision extends far beyond a single tournament.</p>
              <p>MooEarth.Live is designed to grow into a platform where every country, every story, and every major global event can be explored through one interactive world.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Commitment</h2>
              <p>We are committed to building a fast, reliable, mobile-friendly platform that makes exploring the world simple, engaging, and accessible for everyone.</p>
              <p>Whether you&apos;re following today&apos;s headlines, discovering a new country, tracking a global sporting event, or staying informed about world affairs, MooEarth.Live is your window to the world.</p>
              <p><strong>One Globe. Every Country. Every Story.</strong> it&apos;s what we made this pwa app for.</p>
            </section>
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
