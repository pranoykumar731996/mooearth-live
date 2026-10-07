// ============================================================
// MooEarth Live — SEO Growth Report Markdown Export API
// GET /api/admin/seo-export
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getMasterSeoReport } from '@/services/searchConsoleService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const report = await getMasterSeoReport();
    const format = request.nextUrl.searchParams.get('format') || 'markdown';

    if (format === 'json') {
      return NextResponse.json(report, {
        headers: {
          'Content-Disposition': 'attachment; filename="mooearth-seo-growth-report.json"',
          'Content-Type': 'application/json',
        },
      });
    }

    // Markdown Output
    const md = `# MOOEARTH LIVE — GLOBAL SEO SEARCH CONSOLE GROWTH REPORT
**Generated**: ${report.summary.lastUpdated}
**Connection Status**: ${report.summary.connectionStatus} (${report.summary.connectionMessage})

---

## 📊 EXECUTIVE SUMMARY
- **Indexed Pages**: ${report.summary.indexedPagesCount}
- **Organic Users Tracked**: ${report.summary.organicUsersCount}
- **Total Impressions**: ${report.summary.totalImpressions.toLocaleString()}
- **Total Clicks**: ${report.summary.totalClicks.toLocaleString()}
- **Average CTR**: ${report.summary.averageCtr}%
- **Average SERP Position**: ${report.summary.averagePosition}
- **Game Conversion Rate**: ${report.summary.gameConversionRate}%
- **Share Conversion Rate**: ${report.summary.shareConversionRate}%
- **Return Visitors**: ${report.summary.returnUsersRate}%

---

## 🎯 1. TOP OPPORTUNITIES (STRIKING DISTANCE: POSITIONS 5–20)
${report.topOpportunities.map((op, idx) => `
### ${idx + 1}. "${op.query}" [${op.priority} PRIORITY]
- **Target Page**: \`${op.targetPage}\`
- **Position**: ${op.currentPosition}
- **Impressions**: ${op.impressions.toLocaleString()} | **Current Clicks**: ${op.currentClicks} (${op.currentCtr}% CTR)
- **Estimated Top 3 Clicks**: **+${op.estimatedTop3Clicks.toLocaleString()} clicks/mo**
- **Action**: ${op.actionableStep}
`).join('\n')}

---

## ⚡ 2. PAGES TO IMPROVE (HIGH IMPRESSION, LOW CTR)
${report.pagesToImprove.map((p, idx) => `
### ${idx + 1}. Page: \`${p.page}\` (${p.pageType})
- **Impressions**: ${p.impressions.toLocaleString()} | **Clicks**: ${p.clicks} | **CTR**: ${p.ctr}%
- **Issue**: ${p.issue}
- **Action**: ${p.recommendation}
- **Suggested Title**: "${p.suggestedTitle}"
- **Suggested Meta**: "${p.suggestedMetaDescription}"
`).join('\n')}

---

## 💡 3. NEW CONTENT OPPORTUNITIES
${report.newContentOpportunities.map((c, idx) => `
### ${idx + 1}. ${c.topic} [${c.estimatedDemand} DEMAND]
- **Suggested Slug**: \`${c.suggestedSlug}\`
- **Target Category**: ${c.targetCategory} | **Intent**: ${c.targetIntent}
- **Rationale**: ${c.rationale}
`).join('\n')}

---

## 🌍 4. COUNTRY OPPORTUNITIES
${report.countryOpportunities.map((co, idx) => `
### ${idx + 1}. ${co.country} (${co.countryCode}) — +${co.growthRatePercent}% Growth
- **Impressions**: ${co.impressions.toLocaleString()} | **Clicks**: ${co.clicks}
- **Languages**: \`${co.primaryLanguage}\`
- **Action**: ${co.recommendedAction}
`).join('\n')}

---

## 🌐 5. LANGUAGE OPPORTUNITIES
${report.languageOpportunities.map((lo, idx) => `
### ${idx + 1}. ${lo.language} (\`${lo.locale}\`) — ${lo.marketPotential} POTENTIAL
- **Impressions**: ${lo.impressions.toLocaleString()} | **Clicks**: ${lo.clicks}
- **Action**: ${lo.actionItem}
`).join('\n')}

---

## 🎮 6. GAMES RECEIVING SEARCH TRAFFIC
${report.gamesSearchTelemetry.map((g) => `
- **${g.gameTitle}** (\`${g.route}\`): ${g.impressions.toLocaleString()} impressions, ${g.clicks} clicks, **${g.gameConversionRate}% Game Conversion**. Note: ${g.optimizationNote}
`).join('\n')}

---

## 🏙️ 7. CITIES RECEIVING SEARCH TRAFFIC
${report.citiesSearchTelemetry.map((c) => `
- **${c.cityName}, ${c.country}** (\`/cities/${c.citySlug}\`): ${c.impressions} impressions, ${c.clicks} clicks. Intent: ${c.intent}
`).join('\n')}
`;

    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'inline; filename="mooearth-seo-growth-report.md"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
