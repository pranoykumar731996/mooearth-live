'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface CountryOption {
  slug: string;
  name: string;
  flag: string;
}

const POPULAR_COUNTRIES: CountryOption[] = [
  { slug: '', name: 'Global / Whole Planet', flag: '🌍' },
  { slug: 'india', name: 'India', flag: '🇮🇳' },
  { slug: 'japan', name: 'Japan', flag: '🇯🇵' },
  { slug: 'united-states', name: 'United States', flag: '🇺🇸' },
  { slug: 'united-kingdom', name: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'brazil', name: 'Brazil', flag: '🇧🇷' },
  { slug: 'germany', name: 'Germany', flag: '🇩🇪' },
  { slug: 'france', name: 'France', flag: '🇫🇷' },
  { slug: 'australia', name: 'Australia', flag: '🇦🇺' },
  { slug: 'canada', name: 'Canada', flag: '🇨🇦' },
  { slug: 'italy', name: 'Italy', flag: '🇮🇹' },
  { slug: 'south-korea', name: 'South Korea', flag: '🇰🇷' },
  { slug: 'mexico', name: 'Mexico', flag: '🇲🇽' },
  { slug: 'south-africa', name: 'South Africa', flag: '🇿🇦' },
  { slug: 'indonesia', name: 'Indonesia', flag: '🇮🇩' },
];

export default function EmbedGenerator() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'standard' | 'night' | 'weather' | 'satellite' | 'discovery'>('standard');
  const [country, setCountry] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [height, setHeight] = useState<number>(550);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [codeType, setCodeType] = useState<'html' | 'react'>('html');
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Build the widget URL query
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (view !== 'standard') params.set('view', view);
    if (theme !== 'dark') params.set('theme', theme);
    if (country) params.set('country', country);
    if (category) params.set('category', category);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [view, theme, country, category]);

  // Relative preview URL for local sandbox
  const previewUrl = `/embed/globe${queryParams}`;
  // Production absolute URL for generated snippet
  const productionEmbedUrl = `https://www.mooearth.live/embed/globe${queryParams}`;

  // Generated HTML Iframe Snippet
  const htmlSnippet = useMemo(() => {
    return `<iframe
  src="${productionEmbedUrl}"
  width="100%"
  height="${height}"
  style="border: 0; border-radius: 16px; overflow: hidden; width: 100%; max-width: 100%; display: block;"
  title="MooEarth Live — Interactive 3D Globe Widget"
  loading="lazy"
  allow="accelerometer; gyroscope; magnetometer; fullscreen"
>
  <p>Your browser does not support iframes. <a href="https://www.mooearth.live?utm_source=embed&utm_medium=iframe_fallback&utm_campaign=organic_embed" target="_blank" rel="noopener noreferrer">Explore the interactive 3D Globe on MooEarth Live</a>.</p>
</iframe>`;
  }, [productionEmbedUrl, height]);

  // Generated React / Next.js Component Snippet
  const reactSnippet = useMemo(() => {
    return `export default function EarthGlobeEmbed() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '${height}px', borderRadius: '16px', overflow: 'hidden' }}>
      <iframe
        src="${productionEmbedUrl}"
        title="MooEarth Live — Interactive 3D Globe Widget"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allow="accelerometer; gyroscope; magnetometer; fullscreen"
      />
    </div>
  );
}`;
  }, [productionEmbedUrl, height]);

  const activeSnippet = codeType === 'html' ? htmlSnippet : reactSnippet;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      id="embed-generator"
      data-testid="embed-generator-section"
      className="space-y-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl shadow-2xl"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            WIDGET CONFIGURATOR
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Interactive 3D Globe Embed Generator
          </h2>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Customize appearance, starting coordinates, visual layers, and dimensions.
            Preview instantly on desktop and mobile frames, then copy the clean responsive code.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reload sandbox preview"
          >
            <span>🔄</span> Refresh Preview
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Theme Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              1. Visual Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="theme-btn-dark"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  theme === 'dark'
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-xl">🌙</span>
                <div>
                  <div className="text-xs font-bold text-white">Dark Obsidian</div>
                  <div className="text-[10px] text-white/40">Ideal for tech & night sites</div>
                </div>
              </button>

              <button
                type="button"
                data-testid="theme-btn-light"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  theme === 'light'
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-xl">☀️</span>
                <div>
                  <div className="text-xs font-bold text-white">Bright Editorial</div>
                  <div className="text-[10px] text-white/40">Ideal for clean white blogs</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Globe Layer / View Mode */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              2. Globe Layer & Atmosphere
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard', icon: '🌍' },
                { id: 'night', label: 'Night Lights', icon: '🌃' },
                { id: 'weather', label: 'Weather', icon: '🌤️' },
                { id: 'satellite', label: 'Satellite', icon: '🛰️' },
                { id: 'discovery', label: 'Discovery', icon: '🗺️' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`view-opt-${opt.id}`}
                  onClick={() => setView(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    view === opt.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="text-sm">{opt.icon}</div>
                  <div className="text-[11px] mt-0.5">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Starting Geographical Focus */}
          <div className="space-y-2">
            <label htmlFor="country-select" className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              3. Initial Country Target
            </label>
            <select
              id="country-select"
              data-testid="embed-country-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              {POPULAR_COUNTRIES.map(c => (
                <option key={c.slug} value={c.slug} className="bg-[#090915] text-white">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-white/40">
              Rotates the globe directly onto the target coordinates upon initial load.
            </p>
          </div>

          {/* 4. Category Filter */}
          <div className="space-y-2">
            <label htmlFor="category-select" className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              4. Event & Telemetry Stream
            </label>
            <select
              id="category-select"
              data-testid="embed-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="" className="bg-[#090915]">🌍 All Planetary Events</option>
              <option value="breaking" className="bg-[#090915]">🔥 Breaking News & Wire Dispatches</option>
              <option value="weather" className="bg-[#090915]">🌤️ Atmospheric & Weather Phenomena</option>
              <option value="sports" className="bg-[#090915]">⚽ International Sports & Stadiums</option>
              <option value="technology" className="bg-[#090915]">💻 Innovation & Technology Hubs</option>
              <option value="business" className="bg-[#090915]">📈 Global Markets & Trade</option>
            </select>
          </div>

          {/* 5. Frame Height */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                5. Frame Height: <strong className="text-white">{height}px</strong>
              </span>
              <div className="flex gap-1.5 text-[10px]">
                {[450, 550, 700].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHeight(h)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      height === h
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    {h}px
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="350"
              max="900"
              step="25"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Preview Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Live Interactive Sandbox
              </span>
            </div>

            {/* Viewport Width Switcher */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                data-testid="viewport-desktop-btn"
                onClick={() => setViewport('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewport === 'desktop'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span>💻</span> Desktop
              </button>
              <button
                type="button"
                data-testid="viewport-mobile-btn"
                onClick={() => setViewport('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewport === 'mobile'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span>📱</span> Mobile (375px)
              </button>
            </div>
          </div>

          {/* Visual Device Frame */}
          <div
            data-testid="embed-preview-wrapper"
            className="flex justify-center rounded-2xl p-2 sm:p-4 border border-white/10 bg-black/80 shadow-2xl transition-all"
          >
            <div
              style={{
                width: viewport === 'mobile' ? '375px' : '100%',
                height: `${height}px`,
                maxWidth: '100%',
                transition: 'width 0.3s ease',
              }}
              className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-[#020205]"
            >
              <iframe
                key={`${refreshKey}-${theme}-${view}-${country}-${category}`}
                src={previewUrl}
                data-testid="embed-live-iframe"
                title="MooEarth Live 3D Globe Sandbox Preview"
                className="w-full h-full border-0"
                loading="lazy"
                allow="accelerometer; gyroscope; magnetometer; fullscreen"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 font-mono px-1">
            <span>Dimensions: {viewport === 'mobile' ? '375px' : '100%'} × {height}px</span>
            <span>Theme: {theme} • Layer: {view}</span>
          </div>
        </div>
      </div>

      {/* Generated Code Section */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">Generated Code</span>
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCodeType('html')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  codeType === 'html' ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white'
                }`}
              >
                HTML &lt;iframe&gt;
              </button>
              <button
                type="button"
                onClick={() => setCodeType('react')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  codeType === 'react' ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white'
                }`}
              >
                React / Next.js
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="copy-embed-code-btn"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY EMBED CODE'}</span>
            </button>

            <a
              href={productionEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              Open URL ↗
            </a>
          </div>
        </div>

        {/* Code Display Area */}
        <div className="relative rounded-2xl border border-white/10 bg-[#04040c] p-4 font-mono text-xs text-cyan-200 overflow-x-auto shadow-inner">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {activeSnippet}
          </pre>
        </div>

        {/* Legitimate Distribution Notice */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-emerald-200/90 flex items-start gap-3">
          <span className="text-base shrink-0">🛡️</span>
          <div className="space-y-1">
            <span className="font-bold text-emerald-300 block">
              Legitimate Distribution & Attribution Guarantee
            </span>
            <p className="text-emerald-200/80 leading-relaxed">
              Every embed snippet includes a non-intrusive MooEarth Live attribution badge with transparent Google Analytics UTM parameters (<code>utm_source=embed&utm_medium=globe_widget</code>).
              MooEarth Live strictly prohibits automated link networks, artificial backlinks, and spam generation.
              Use of this embed is free for verified educational, editorial, journalistic, and creator audiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
