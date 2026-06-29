import { Metadata } from 'next';
import Link from 'next/link';
import GlobalFooter from '@/components/Layout/GlobalFooter';

export const metadata: Metadata = {
  title: 'Contact Us | MooEarth.Live',
  description: 'Get in touch with the MooEarth.Live team for support, business inquiries, and feedback.',
  alternates: {
    canonical: 'https://www.mooearth.live/contact'
  }
};

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Contact Us
          </h1>
          
          <div className="space-y-8">
            <section className="text-center">
              <p className="text-lg text-gray-300">
                We'd love to hear from you. Whether you have a question about the app, spotted a bug, or want to discuss a partnership, here is how you can reach the MooEarth.Live team.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* User Support */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">General Support & Feedback</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Experiencing an issue with the 3D globe? Have a feature request? Let us know.
                </p>
                <a href="mailto:support@mooearth.live" className="text-emerald-400 font-medium hover:underline">support@mooearth.live</a>
              </div>

              {/* Business & Partnerships */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Business Inquiries</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Interested in sponsoring a team page, advertising, or exploring API integrations?
                </p>
                <a href="mailto:business@mooearth.live" className="text-cyan-400 font-medium hover:underline">business@mooearth.live</a>
              </div>
            </div>

            <section className="mt-12 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Legal & Copyright</h2>
              <p className="text-gray-300">
                For DMCA takedown requests or privacy-related concerns, please review our <Link href="/dmca" className="text-emerald-400 hover:underline">DMCA Policy</Link> and <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link> for specialized contact instructions.
              </p>
            </section>
            
            <section className="mt-12 text-center text-sm text-gray-500">
              <p>Response Expectation: We aim to respond to all general inquiries within 24-48 hours. During major tournaments, response times may be slightly longer.</p>
            </section>
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
