import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';
import { fetchQuizForCountry } from '@/services/countryQuizService';
import { shouldIndexCountryIntentPage } from '@/lib/seo/countryIntentQualityGate';
import CountryQuizRunner from '@/components/Quiz/CountryQuizRunner';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { getContinentForCountry } from '@/data/continents';
import { getCountryKnowledgeGraph } from '@/lib/seo/knowledgeGraph';

interface CountryQuizPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryQuizPageProps): Promise<Metadata> {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    return {
      title: 'Country Not Found | MooEarth Live',
      description: 'The requested sovereign nation could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const quizResult = fetchQuizForCountry(country.name);
  const gateResult = shouldIndexCountryIntentPage(decoded, 'quiz', quizResult);

  const title = `${country.name} Quiz & Geography Trivia Challenge | MooEarth Live`;
  const description = `Test your knowledge with authentic Play Earth trivia for ${country.name} (${country.region}). ${quizResult.questions.length} questions on landmarks (${country.landmark}), geography, capital (${country.capital}), and history.`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/quiz`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: gateResult.robotsDirective,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${country.name} Geography Quiz - MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function CountryQuizPage({ params }: CountryQuizPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const quizResult = fetchQuizForCountry(country.name);
  const { questions } = quizResult;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/quiz`;
  const continent = getContinentForCountry(country);
  const kg = getCountryKnowledgeGraph(country);

  // Breadcrumbs JSON-LD
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
        name: 'World Map',
        item: 'https://www.mooearth.live/world-map',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: continent.name,
        item: `https://www.mooearth.live/continents/${continent.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: country.name,
        item: `https://www.mooearth.live/countries/${country.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: 'Quiz',
        item: canonicalUrl,
      },
    ],
  };

  // Quiz Schema.org JSON-LD
  const quizJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${country.name} Geography & Country Trivia Challenge`,
    description: `Official Play Earth interactive questions testing knowledge about ${country.name}.`,
    url: canonicalUrl,
    about: {
      '@type': 'Country',
      name: country.name,
    },
    hasPart: questions.map((q, idx) => ({
      '@type': 'Question',
      position: idx + 1,
      name: q.question,
      text: q.question,
      suggestedAnswer: q.choices.map((opt: string) => ({
        '@type': 'Answer',
        text: opt,
      })),
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.choices[q.correctIndex],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header & Breadcrumb */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4 flex-wrap">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href={`/continents/${continent.slug}`} className="hover:text-cyan-400 transition-colors">{continent.name}</Link>
            <span>/</span>
            <Link href={`/countries/${country.slug}`} className="hover:text-cyan-400 transition-colors">{country.name}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Quiz</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/continents/${continent.slug}`}
                      className="text-cyan-400 hover:text-cyan-300 text-xs font-mono tracking-widest uppercase font-semibold transition-colors"
                    >
                      {continent.name} Atlas
                    </Link>
                    <span className="text-white/20">&bull;</span>
                    <span className="text-xs text-white/40 font-mono">Play Earth Gaming</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">
                    {questions.length} Questions Loaded &bull; Capital: {country.capital} &bull; Landmark: {country.landmark}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} Geography Quiz & Trivia Challenge
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Official Play Earth challenge bank. Explore authentic questions spanning topography, capitals, world landmarks, and planetary trivia.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8 flex-1">
          {/* Quick Intent Navigation Pill Bar */}
          <nav aria-label="Country Intent Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Explore {country.name}:</span>
            <Link href={`/countries/${country.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              Overview Atlas
            </Link>
            <Link href={`/countries/${country.slug}/news`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              📰 News
            </Link>
            <Link href={`/countries/${country.slug}/geography`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🏔️ Geography
            </Link>
            <Link href={`/countries/${country.slug}/weather`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌤️ Weather
            </Link>
            <Link href={`/countries/${country.slug}/map`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🗺️ 3D Map
            </Link>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              🎮 Quiz (Active)
            </span>
            <Link href={`/continents/${continent.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌍 {continent.name} Hub
            </Link>
          </nav>

          {/* Interactive Quiz Runner */}
          {questions.length > 0 ? (
            <CountryQuizRunner
              questions={questions}
              countryName={country.name}
              countrySlug={country.slug}
            />
          ) : (
            <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4">
              <span className="text-4xl">🎮</span>
              <h2 className="text-xl font-bold text-white">Questions Being Compiled</h2>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Play Earth questions for {country.name} are currently undergoing curation review. Play the global challenge below.
              </p>
              <Link
                href="/play-earth"
                className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
              >
                Play Global Earth Quiz &rarr;
              </Link>
            </div>
          )}

          {/* Neighboring Country Quizzes & Continental Challenge */}
          <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏆</span> Neighboring Country Challenges in {country.region}
                </h2>
                <p className="text-sm text-white/70">
                  Test your knowledge on other nations in {country.region}:
                </p>
              </div>
              <Link
                href={`/continents/${continent.slug}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono tracking-wider transition-colors inline-flex items-center gap-1 shrink-0"
              >
                {continent.name} Hub &rarr;
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={`/games/geography/${country.slug}`}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors text-xs font-semibold text-cyan-300 flex items-center gap-1.5"
              >
                <span>🎮</span> Play Dedicated {country.name} Interactive Game &rarr;
              </Link>
              <Link
                href={`/continents/${continent.slug}`}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-semibold text-emerald-300 flex items-center gap-1.5"
              >
                <span>🌍</span> {continent.name} Continental Hub &rarr;
              </Link>
              {country.relatedSlugs.map(slug => (
                <Link
                  key={slug}
                  href={`/countries/${slug}/quiz`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-colors text-xs font-semibold text-white/90"
                >
                  {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Quiz &rarr;
                </Link>
              ))}
            </div>
          </section>

          {/* Knowledge Graph Internal Links */}
          <section className="pt-8 border-t border-white/10 space-y-5">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">Contextual Knowledge Graph</span>
              <h2 className="text-base font-bold text-white">Connected Portals for {country.name}</h2>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Link href={`/countries/${country.slug}`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🏛️ Overview Atlas
              </Link>
              <Link href={`/countries/${country.slug}/news`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                📰 Live News Dispatches
              </Link>
              <Link href={`/countries/${country.slug}/geography`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🏔️ Physical Geography
              </Link>
              <Link href={`/countries/${country.slug}/weather`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🌤️ Live Weather
              </Link>
              <Link href={`/countries/${country.slug}/map`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🗺️ Interactive 3D Map
              </Link>
              <Link href={`/games/geography/${country.slug}`} className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors">
                🎯 {country.name} Game
              </Link>
              <Link href={`/continents/${continent.slug}`} className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors">
                🌍 {continent.name} Hub
              </Link>
            </div>

            {kg.canonicalCities.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-white/50 font-mono block mb-2">Major Canonical Cities in {country.name}:</span>
                <div className="flex flex-wrap gap-2">
                  {kg.canonicalCities.map(({ city, href, isCapital }) => (
                    <Link
                      key={city.slug}
                      href={href}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>📍</span> {city.name} {isCapital && <span className="text-[10px] text-cyan-400 font-mono">(Capital)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
