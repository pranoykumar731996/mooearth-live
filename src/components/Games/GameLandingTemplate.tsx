import React from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';
import {
  GameLandingConfig,
  FEATURED_COUNTRY_SELECTION,
  GEOGRAPHY_NAVIGATION_LINKS,
  GAME_LANDING_CONFIGS,
} from '@/services/gameLandingService';
import PlayableGameLandingRunner from './PlayableGameLandingRunner';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface GameLandingTemplateProps {
  config: GameLandingConfig;
  initialQuestions: EarthQuestion[];
  countryName?: string;
  countrySlug?: string;
}

export default function GameLandingTemplate({
  config,
  initialQuestions,
  countryName,
  countrySlug,
}: GameLandingTemplateProps) {
  // Breadcrumb Schema.org JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mooearth.live',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Games',
        item: 'https://www.mooearth.live/games',
      },
      ...(countryName
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: `${countryName} Geography Game`,
              item: config.canonical,
            },
          ]
        : config.slug !== 'games'
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: config.name,
              item: config.canonical,
            },
          ]
        : []),
    ],
  };

  // VideoGame / WebApplication Schema.org JSON-LD
  const gameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: config.h1,
    url: config.canonical,
    description: config.metaDescription,
    genre: ['Geography', 'Trivia', 'Educational', 'Puzzle'],
    gamePlatform: ['Web Browser', 'Mobile Browser'],
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    inLanguage: 'en',
    author: {
      '@type': 'Organization',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    numberOfPlayers: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 100,
    },
  };

  // Related game modes list
  const relatedGames = config.relatedSlugs
    .map(slug => GAME_LANDING_CONFIGS[slug])
    .filter(Boolean);

  const shareText = `Play ${config.name} on MooEarth Live! Free online geography trivia and 1v1 challenges: ${config.canonical}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/games" className="hover:text-cyan-400 transition-colors">Games</Link>
            {config.slug !== 'games' && (
              <>
                <span>/</span>
                <span className="text-white/80 font-medium">{config.name}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-3xl" role="img" aria-label={config.name}>
                  {config.emoji}
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {config.badge}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  Difficulty: {config.difficulty}
                </span>
              </div>

              {/* Single H1 Tag */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {config.h1}
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                {config.metaDescription}
              </p>
            </div>

            {/* Quick Share Capability Box */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Share This Game:</span>
              <div className="flex items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>🐦</span>
                  <span>X (Twitter)</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Quick Intent Navigation Pill Bar */}
          <nav aria-label="Game Modes Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Game Hubs:</span>
            {Object.values(GAME_LANDING_CONFIGS).map(g => {
              const isActive = g.slug === config.slug;
              return isActive ? (
                <span
                  key={g.slug}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                >
                  {g.emoji} {g.name}
                </span>
              ) : (
                <Link
                  key={g.slug}
                  href={`/${g.slug}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                >
                  {g.emoji} {g.name}
                </Link>
              );
            })}
          </nav>

          {/* REAL PLAYABLE GAME SECTION */}
          <section aria-label="Playable Game" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>⚡</span> Playable Game Arena
              </h2>
              <span className="text-xs text-white/40 font-mono">
                No sign-up &bull; Free instant play
              </span>
            </div>

            <PlayableGameLandingRunner
              initialQuestions={initialQuestions}
              gameTitle={config.name}
              gameSlug={config.slug}
              gameMode={config.gameModeKey}
              countryName={countryName}
              badge={config.badge}
            />
          </section>

          {/* GAME DESCRIPTION & HOW TO PLAY SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {/* Left Column: Game Description */}
            <section className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>📖</span> About {config.name}
                </h2>
                <div className="space-y-3 text-sm text-white/70 leading-relaxed">
                  {config.detailedDescription.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span className="text-cyan-400">✓</span> 195 Sovereign Countries Covered
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span className="text-cyan-400">✓</span> Real-Time Scorecard Generation
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span className="text-cyan-400">✓</span> Verified Cartographic Data
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: How to Play & Rules */}
            <section className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🎯</span> How to Play
                </h2>

                <div className="space-y-4">
                  {config.howToPlay.map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {item.step}
                      </span>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-white/60 leading-normal">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  <span className="text-[11px] font-mono text-white/40 uppercase block">Scoring Rules:</span>
                  <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                    {config.scoringRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* RELATED GAMES SECTION */}
          <section className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🕹️</span> Related Geography Games
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Explore other free world challenges on MooEarth Live.
                </p>
              </div>
              <Link
                href="/games"
                className="text-xs font-semibold text-cyan-400 hover:underline shrink-0"
              >
                View All Games &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedGames.map(game => (
                <Link
                  key={game.slug}
                  href={`/${game.slug}`}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{game.emoji}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-white/50">
                      {game.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2">
                    {game.metaDescription}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* COUNTRY LINKS SECTION */}
          <section className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌍</span> Country Geography Games & Challenges
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Play country-specific geography challenges for individual nations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
              {FEATURED_COUNTRY_SELECTION.map(c => (
                <Link
                  key={c.slug}
                  href={`/games/geography/${c.slug}`}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.07] text-center space-y-1 transition-all group"
                >
                  <span className="text-xl block">{c.flag}</span>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-cyan-300 block truncate">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-white/40 block truncate">
                    {c.capital}
                  </span>
                </Link>
              ))}
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-white/50 border-t border-white/5">
              <span className="font-semibold text-white/70">Country Hubs:</span>
              {FEATURED_COUNTRY_SELECTION.slice(0, 8).map(c => (
                <Link
                  key={`hub-${c.slug}`}
                  href={`/countries/${c.slug}`}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {c.name} Atlas
                </Link>
              ))}
            </div>
          </section>

          {/* GEOGRAPHY LINKS SECTION */}
          <section className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🧭</span> World Geography Resources & Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GEOGRAPHY_NAVIGATION_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all space-y-1 group"
                >
                  <div className="flex items-center gap-2">
                    <span>{link.emoji}</span>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {link.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-normal">
                    {link.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
