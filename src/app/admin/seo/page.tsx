'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SeoGrowthReport } from '@/lib/seo/searchConsoleGrowthEngine';

export default function AdminSeoDashboardPage() {
  const [report, setReport] = useState<SeoGrowthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'striking' | 'pages' | 'content' | 'countries' | 'languages'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/seo-report')
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load SEO report:', err);
        setLoading(false);
      });
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo-report');
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-cyan-400/80 tracking-wider">
          ANALYZING SEARCH CONSOLE TELEMETRY &amp; OPPORTUNITY ALGORITHMS...
        </p>
      </div>
    );
  }

  const { summary } = report;
  const isConnected = summary.connectionStatus === 'CONNECTED';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            GLOBAL SEO PHASE 13 • SEARCH CONSOLE GROWTH ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Search Console Intelligence &amp; Opportunity Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-3xl">
            Real Google Search Console intelligence turning SERP impressions, rankings, and click-through rates into automated editorial and indexing priorities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🔄</span> Refresh Telemetry
          </button>

          <a
            href="/api/admin/seo-export?format=markdown"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>📥</span> Export Report (.md)
          </a>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>⚙️</span> GSC API Setup
          </button>
        </div>
      </div>

      {/* 2. Connection Status & Integrity Banner */}
      <div
        data-testid="gsc-connection-status"
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isConnected
            ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
            : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <span className="text-2xl shrink-0">{isConnected ? '🟢' : '⚡'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold">
                Search Console API Status:
              </span>
              <span
                data-testid="gsc-connection-badge"
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border"
              >
                {summary.connectionStatus}
              </span>
            </div>
            <p className="text-xs mt-1 text-white/80 leading-relaxed max-w-3xl">
              {summary.connectionMessage}
            </p>
          </div>
        </div>

        {!isConnected && (
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
          >
            Connect API Keys →
          </button>
        )}
      </div>

      {/* 3. Core KPI Strip (Track Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div data-testid="kpi-indexed-pages" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Indexed Pages
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
            {summary.indexedPagesCount}
          </span>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">100% SSG Verified</span>
        </div>

        <div data-testid="kpi-organic-visitors" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Organic Visitors
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
            {summary.organicUsersCount}
          </span>
          <span className="text-[11px] text-white/40 mt-0.5 block">Active Telemetry</span>
        </div>

        <div data-testid="kpi-impressions" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Search Impressions
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
            {summary.totalImpressions.toLocaleString()}
          </span>
          <span className="text-[11px] text-white/40 mt-0.5 block">Last 28 Days</span>
        </div>

        <div data-testid="kpi-clicks" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Organic Clicks
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
            {summary.totalClicks.toLocaleString()}
          </span>
          <span className="text-[11px] text-white/40 mt-0.5 block">
            CTR: <strong className="text-white">{summary.averageCtr}%</strong>
          </span>
        </div>

        <div data-testid="kpi-avg-position" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Avg Position
          </span>
          <span className="text-xl sm:text-2xl font-black text-purple-300 mt-1 block">
            {summary.averagePosition}
          </span>
          <span className="text-[11px] text-white/40 mt-0.5 block">Striking Range</span>
        </div>

        <div data-testid="kpi-game-conversion" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Game Conversion
          </span>
          <span className="text-xl sm:text-2xl font-black text-cyan-300 mt-1 block">
            {summary.gameConversionRate}%
          </span>
          <span className="text-[11px] text-white/40 mt-0.5 block">
            Shares: <strong className="text-white">{summary.shareConversionRate}%</strong>
          </span>
        </div>
      </div>

      {/* 4. Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'all', label: 'All Opportunities' },
          { id: 'striking', label: '🎯 Top Opportunities (5-20)' },
          { id: 'pages', label: '⚡ Pages to Improve' },
          { id: 'content', label: '💡 New Content' },
          { id: 'countries', label: '🌍 Country Growth' },
          { id: 'languages', label: '🌐 Languages' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. TOP OPPORTUNITIES SECTION (Striking Distance: Positions 5-20) */}
      {(activeTab === 'all' || activeTab === 'striking') && (
        <section
          id="top-opportunities"
          data-testid="top-opportunities"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">
                HIGH LEVERAGE RANKINGS
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🎯</span> TOP OPPORTUNITIES (STRIKING DISTANCE: POSITIONS 5–20)
              </h2>
              <p className="text-xs text-white/60">
                Queries already ranking on pages 1–2. Modest on-page and internal-link optimization can propel them into top 3 spots.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              {report.topOpportunities.length} High-Yield Targets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.topOpportunities.map((op, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        op.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : op.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {op.priority} PRIORITY
                    </span>
                    <span className="text-xs font-mono text-white/50">
                      Rank #{op.currentPosition}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    "{op.query}"
                  </h3>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/40">Target:</span>
                    <Link
                      href={op.targetPage}
                      className="text-cyan-400 hover:underline font-mono truncate max-w-xs"
                    >
                      {op.targetPage}
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-white/40 text-[10px] block">IMPRESSIONS</span>
                      <span className="font-bold text-white">{op.impressions.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-white/40 text-[10px] block">CLICKS</span>
                      <span className="font-bold text-white">{op.currentClicks} ({op.currentCtr}%)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                      <span className="text-emerald-300 text-[10px] block">POTENTIAL</span>
                      <span className="font-bold text-emerald-400">+{op.estimatedTop3Clicks}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 text-xs text-white/70">
                  <strong className="text-cyan-300">Action:</strong> {op.actionableStep}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. PAGES TO IMPROVE SECTION (High Impressions, Low CTR) */}
      {(activeTab === 'all' || activeTab === 'pages') && (
        <section
          id="pages-to-improve"
          data-testid="pages-to-improve"
          className="space-y-4"
        >
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-0.5">
              CLICK-THROUGH OPTIMIZATION
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>⚡</span> PAGES TO IMPROVE (HIGH IMPRESSIONS, LOW CTR)
            </h2>
            <p className="text-xs text-white/60">
              Pages generating healthy SERP visibility but underperforming in clicks due to uninspiring title tags or snippet intent mismatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.pagesToImprove.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60 border border-white/10">
                      {p.pageType}
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      CTR: {p.ctr}% ({p.clicks}/{p.impressions})
                    </span>
                  </div>

                  <Link href={p.page} className="text-sm font-bold text-cyan-300 hover:underline block truncate">
                    {p.page}
                  </Link>

                  <p className="text-xs text-rose-300/90 bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/20 leading-relaxed">
                    <strong>Issue:</strong> {p.issue}
                  </p>

                  <div className="space-y-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-white/40 block text-[10px] font-mono">SUGGESTED TITLE TAG</span>
                      <span className="text-emerald-300 font-semibold">{p.suggestedTitle}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] font-mono">SUGGESTED META SNIPPET</span>
                      <span className="text-white/70">{p.suggestedMetaDescription}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-white/60">
                  <strong className="text-amber-300">Strategy:</strong> {p.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. NEW CONTENT OPPORTUNITIES SECTION */}
      {(activeTab === 'all' || activeTab === 'content') && (
        <section
          id="new-content-opportunities"
          data-testid="new-content-opportunities"
          className="space-y-4"
        >
          <div>
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest block mb-0.5">
              UNMET SEARCH DEMAND
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>💡</span> NEW CONTENT OPPORTUNITIES
            </h2>
            <p className="text-xs text-white/60">
              High-value keyword themes and geographic concepts frequently searched with zero dedicated landing page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.newContentOpportunities.map((c, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {c.targetCategory}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {c.estimatedDemand} DEMAND
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {c.topic}
                  </h3>

                  <div className="text-xs font-mono text-cyan-400">
                    Slug: <code>{c.suggestedSlug}</code>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">
                    {c.rationale}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 text-[11px] text-white/50">
                  Intent: <span className="text-white/80">{c.targetIntent}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. COUNTRY OPPORTUNITIES SECTION */}
      {(activeTab === 'all' || activeTab === 'countries') && (
        <section
          id="country-opportunities"
          data-testid="country-opportunities"
          className="space-y-4"
        >
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-0.5">
              GEOGRAPHIC SEARCH MOMENTUM
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🌍</span> COUNTRY OPPORTUNITIES (FASTEST GROWING MARKETS)
            </h2>
            <p className="text-xs text-white/60">
              Sovereign nations recording the steepest percentage growth in international organic queries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.countryOpportunities.map((co, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white">
                      {co.country} ({co.countryCode})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +{co.growthRatePercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-white/60">
                    <span>Impr: <strong className="text-white">{co.impressions.toLocaleString()}</strong></span>
                    <span>Clicks: <strong className="text-emerald-400">{co.clicks}</strong></span>
                    <span>Lang: <strong className="text-white">{co.primaryLanguage}</strong></span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed pt-1">
                    {co.recommendedAction}
                  </p>
                </div>

                <Link
                  href={`/countries/${co.country.toLowerCase().replace(/\s+/g, '-')}`}
                  className="pt-2 border-t border-white/5 text-xs text-cyan-400 hover:underline block"
                >
                  Inspect {co.country} Hub →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. LANGUAGE OPPORTUNITIES SECTION */}
      {(activeTab === 'all' || activeTab === 'languages') && (
        <section
          id="language-opportunities"
          data-testid="language-opportunities"
          className="space-y-4"
        >
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">
              MULTILINGUAL EXPANSION
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🌐</span> LANGUAGE OPPORTUNITIES (8 WORLD LANGUAGES)
            </h2>
            <p className="text-xs text-white/60">
              Prioritizing localized hreflang translations and regional metadata across global language markets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.languageOpportunities.map((lo, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{lo.language}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                        lo.marketPotential === 'SURGING'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : lo.marketPotential === 'HIGH'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {lo.marketPotential}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-white/50">
                    <span>Impr: {lo.impressions}</span>
                    <span>Clicks: {lo.clicks}</span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">
                    {lo.actionItem}
                  </p>
                </div>

                <Link
                  href={`/${lo.locale}`}
                  className="pt-2 border-t border-white/5 text-xs text-cyan-400 hover:underline block"
                >
                  View /{lo.locale} Edition →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Games & Cities Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/10">
        {/* Games Telemetry */}
        <section data-testid="games-search-traffic" aria-label="Games Search Telemetry" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎮</span> Games Receiving Search Traffic
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Avg Conv: {summary.gameConversionRate}%
            </span>
          </div>

          <div className="space-y-2">
            {report.gamesSearchTelemetry.map((g) => (
              <div
                key={g.gameId}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <Link href={g.route} className="font-bold text-white hover:text-cyan-300">
                    {g.gameTitle}
                  </Link>
                  <p className="text-[11px] text-white/40 mt-0.5">{g.optimizationNote}</p>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span className="text-emerald-400 font-bold block">{g.gameConversionRate}%</span>
                  <span className="text-white/40 text-[10px]">{g.clicks} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cities Telemetry */}
        <section data-testid="cities-search-traffic" aria-label="Cities Search Telemetry" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏙️</span> Cities Receiving Search Traffic
            </h3>
            <span className="text-xs font-mono text-cyan-400">Metropolitan Intent</span>
          </div>

          <div className="space-y-2">
            {report.citiesSearchTelemetry.map((c) => (
              <div
                key={c.citySlug}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <Link href={`/cities/${c.citySlug}`} className="font-bold text-white hover:text-cyan-300">
                    {c.cityName}, {c.country}
                  </Link>
                  <p className="text-[11px] text-white/40 mt-0.5">{c.intent}</p>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span className="text-cyan-300 font-bold block">{c.clicks} clicks</span>
                  <span className="text-white/40 text-[10px]">{c.impressions} impr</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 11. GSC Setup Guide Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-[#090915] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Google Search Console API Connection Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              To stream real live Google Search Console query metrics directly into this dashboard without third-party tools, configure a Google Cloud Service Account:
            </p>

            <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
              <li>Open Google Cloud Console and enable the <strong>Google Search Console API</strong>.</li>
              <li>Create a Service Account and download its JSON credentials key.</li>
              <li>In Google Search Console, go to <em>Settings &gt; Users and permissions</em> and add the Service Account email with <strong>Full / Owner</strong> permissions for <code>https://www.mooearth.live/</code>.</li>
              <li>Add these environment variables to your deployment environment or <code>.env.local</code>:
                <pre className="mt-2 p-2 rounded bg-black/60 text-cyan-300 font-mono text-[11px] overflow-x-auto">
{`GSC_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
GSC_SITE_URL="https://www.mooearth.live/"`}
                </pre>
              </li>
            </ol>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
