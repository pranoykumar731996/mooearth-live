// ============================================================
// MooEarth Live — Evidence Depth & Multi-Source Transparency UI
// ============================================================
// Renders rich multi-source corroboration, timeline developments,
// attributed statements, open questions, and research transparency.
// ============================================================

import React from 'react';
import { ArticleDetails } from '@/services/article';

interface EvidenceDepthReportProps {
  article: ArticleDetails;
}

export const EvidenceDepthReport: React.FC<EvidenceDepthReportProps> = ({ article }) => {
  const {
    depthMode,
    publicationStatus,
    newlyReportedFacts,
    attributedStatements,
    timelineDevelopments,
    historicalBackground,
    analysisAndImplications,
    competingAccountsOrContradictions,
    unresolvedQuestions,
    evidenceRecord,
    sourceTransparency,
    telemetry,
    relatedSources,
  } = article;

  // Compile combined sources list from evidence record or relatedSources
  const sourcesList = evidenceRecord?.sources || (relatedSources || []).map((s) => ({
    title: s.title,
    publisher: s.publisher,
    url: s.url,
    accessStatus: 'accessible_full' as const,
    publishedAt: article.publishedAt,
  }));

  const isLimited = publicationStatus === 'limited_evidence';
  const isReview = publicationStatus === 'under_review';

  return (
    <div className="w-full space-y-5 font-sans select-text">
      {/* 1. Publication Status Callout (when restricted or under review) */}
      {isLimited && (
        <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-400">
            <span>⚠️</span>
            <span>Limited Evidence Dispatch</span>
          </div>
          <p className="leading-relaxed opacity-90">
            Independent corroboration across wire agencies is currently limited for this breaking event. We have published this initial factual briefing while our news desk tracks further primary confirmation.
          </p>
        </div>
      )}

      {isReview && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-rose-400">
            <span>🛑</span>
            <span>Under Editorial Review</span>
          </div>
          <p className="leading-relaxed opacity-90">
            Conflicting accounts or stale report coordinates were identified during research. This story is restricted to initial verifiable claims until reconciled by international bureaus.
          </p>
        </div>
      )}

      {/* 2. Timeline Developments (if multi-step chronology exists) */}
      {timelineDevelopments && timelineDevelopments.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span>⏱️</span> Chronological Timeline
            </span>
            <span className="text-[9px] font-mono text-white/40">{timelineDevelopments.length} key milestones</span>
          </div>

          <div className="relative border-l border-white/10 ml-2 pl-4 space-y-4 pt-1">
            {timelineDevelopments.map((step, idx) => (
              <div key={idx} className="relative group">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400/80 border-2 border-black" />
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-300">{step.timeOrPhase || step.timeOrDate}</span>
                  {step.sourcePublisher && (
                    <span className="text-[9px] text-white/40 italic">({step.sourcePublisher})</span>
                  )}
                </div>
                <p className="text-xs text-white/80 leading-relaxed mt-0.5">{step.development || step.event}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Attributed Statements & Key Quotes */}
      {attributedStatements && attributedStatements.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <span>💬</span> Official Statements & Perspectives
          </span>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {attributedStatements.map((item, idx) => (
              <blockquote
                key={idx}
                className="p-3.5 rounded-xl bg-purple-500/[0.03] border-l-2 border-purple-400 border-y border-r border-white/5 space-y-1.5"
              >
                <p className="text-xs text-white/90 italic leading-relaxed">
                  &ldquo;{item.quoteOrClaim || item.statement}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span className="font-semibold text-purple-300">
                    — {item.speakerOrOrg || item.sourcePublisher}
                  </span>
                  {item.sourcePublisher && <span className="italic text-white/40">via {item.sourcePublisher}</span>}
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* 4. Strategic Implications & Analysis (if deep dive) */}
      {analysisAndImplications && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <span>📊</span> Strategic Implications & Impact
          </span>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            {analysisAndImplications}
          </p>
        </div>
      )}

      {/* 5. Historical Background Context (if present) */}
      {historicalBackground && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
            <span>🏛️</span> Historical Background & Context
          </span>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            {historicalBackground}
          </p>
        </div>
      )}

      {/* 6. Competing Accounts & Unresolved Questions */}
      {((competingAccountsOrContradictions && competingAccountsOrContradictions.length > 0) ||
        (unresolvedQuestions && unresolvedQuestions.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {competingAccountsOrContradictions && competingAccountsOrContradictions.length > 0 && (
            <div className="rounded-2xl p-4 bg-rose-500/[0.03] border border-rose-500/20 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1">
                <span>⚡</span> Competing Accounts
              </span>
              <ul className="space-y-1.5 text-xs text-white/70">
                {competingAccountsOrContradictions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unresolvedQuestions && unresolvedQuestions.length > 0 && (
            <div className="rounded-2xl p-4 bg-amber-500/[0.03] border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <span>❓</span> What We Don't Know Yet
              </span>
              <ul className="space-y-1.5 text-xs text-white/70">
                {unresolvedQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 7. Cross-Source Corroboration & Citations Grid */}
      <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Cross-Source Corroboration ({sourcesList.length} sources)
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {depthMode === 'deep_dive'
                ? 'Deep-Dive Synthesis'
                : depthMode === 'multi_source'
                ? 'Multi-Source Corroborated'
                : 'Briefing Wire'}
            </span>
          </div>
          {telemetry && (
            <span className="text-[9px] font-mono text-white/30 hidden sm:inline">
              Latency: {telemetry.researchLatencyMs}ms
            </span>
          )}
        </div>

        <p className="text-[11px] text-white/50 leading-relaxed">
          MooEarth synthesizes live coverage by cross-referencing independent global publishers, public records, and official statements. Primary and corroborating outlets consulted for this report:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {sourcesList.map((src: any, idx: number) => {
            const isPaywalled = (src.accessStatus as string) === 'paywalled_restricted' || (src.accessStatus as string) === 'failed_unreachable';
            return (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                      {src.publisher}
                    </span>
                    {isPaywalled ? (
                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Excerpt Only
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Corroborated
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">{src.title}</p>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-white/30 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            );
          })}
        </div>

        {/* AI & Sourcing Transparency Disclosure */}
        <div className="pt-2 text-[10px] text-white/40 flex items-center justify-between border-t border-white/5">
          <span>
            {sourceTransparency?.aiDisclosure || 'Generated by MooEarth Research Bureau with strict factual grounding.'}
          </span>
          <span className="font-mono text-white/30">MooEarth 2.0</span>
        </div>
      </div>
    </div>
  );
};
