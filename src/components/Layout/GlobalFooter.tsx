import React from 'react';
import Link from 'next/link';
import { SupportedLocale, getLocalizedPath } from '@/lib/i18n';

interface GlobalFooterProps {
  locale?: SupportedLocale;
}

export default function GlobalFooter({ locale = 'en' }: GlobalFooterProps) {
  const currentYear = new Date().getFullYear();
  const getHref = (path: string) => getLocalizedPath(path, locale);

  return (
    <footer className="bg-[var(--background)] border-t border-white/10 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          {/* Brand & About */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
              MooEarth.Live
            </h3>
            <p className="text-gray-400 mb-4">
              The ultimate global pitch. Interactive 3D football coverage, live scores, and localized news.
            </p>
            <div className="flex space-x-4">
              {/* Social icons can go here */}
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={getHref('/')} className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href={getHref('/about')} className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href={getHref('/contact')} className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal 1 */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal & Privacy</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={getHref('/privacy')} className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href={getHref('/terms')} className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link href={getHref('/cookies')} className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
              <li><Link href={getHref('/data-sources')} className="hover:text-emerald-400 transition-colors">Data Sources</Link></li>
              <li><Link href={getHref('/security')} className="hover:text-emerald-400 transition-colors">Security Policy</Link></li>
            </ul>
          </div>

          {/* Legal 2 */}
          <div>
            <h4 className="text-white font-semibold mb-4">Policies</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={getHref('/disclaimer')} className="hover:text-emerald-400 transition-colors">Disclaimer</Link></li>
              <li><Link href={getHref('/copyright')} className="hover:text-emerald-400 transition-colors">Copyright Policy</Link></li>
              <li><Link href={getHref('/dmca')} className="hover:text-emerald-400 transition-colors">DMCA Complaints</Link></li>
              <li><Link href={getHref('/community')} className="hover:text-emerald-400 transition-colors">Community Guidelines</Link></li>
              <li><Link href={getHref('/ai-transparency')} className="hover:text-emerald-400 transition-colors">AI Transparency</Link></li>
              <li><Link href={getHref('/advertising')} className="hover:text-emerald-400 transition-colors">Advertising Disclosure</Link></li>
              <li><Link href={getHref('/accessibility')} className="hover:text-emerald-400 transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-gray-500 text-xs">
          <p>&copy; {currentYear} MooEarth.Live. All rights reserved.</p>
          <p className="mt-2">Independent informational platform. All trademarks, logos, and brand names are the property of their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}
