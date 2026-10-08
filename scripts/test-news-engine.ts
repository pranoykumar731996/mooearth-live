// ============================================================
// MooEarth Live — News Engine 2.0 Verification Suite
// ============================================================

import {
  parseRssXml,
  GLOBAL_PUBLISHER_FEEDS,
  resolveGeo,
  cleanTitleText,
} from '../src/services/newsEngine/rssFeeds';
import {
  extractKeywords,
  computeTokenSimilarity,
  areArticlesRelated,
  clusterAndDeduplicateArticles,
} from '../src/services/newsEngine/clustering';
import {
  resolveArticleAccess,
  isPaywalledContent,
  synthesizeKeyFacts,
} from '../src/services/newsEngine/accessResolver';
import {
  getGlobalNewsFeed,
  getCountryNewsEngineFeed,
  searchGlobalNewsFeed,
  findRelatedCluster,
} from '../src/services/newsEngine/index';
import { fetchLiveNews, searchLiveNews } from '../src/services/news';
import { fetchNewsForCountry } from '../src/services/countryNewsService';
import { EngineArticle } from '../src/services/newsEngine/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

async function runNewsEngineTests() {
  console.log('\n======================================================');
  console.log('🚀 MooEarth Global News Coverage Engine 2.0 Test Suite');
  console.log('======================================================\n');

  // ── TEST GROUP 1: RSS Feeds & Formatting ───────────────────
  console.log('\n--- 1. RSS Feed Parser & Geo Resolver ---');

  const sampleXml = `
    <rss version="2.0">
      <channel>
        <title>World News Wire</title>
        <item>
          <title><![CDATA[Major Clean Energy Accord Signed in Tokyo - BBC News]]></title>
          <link>https://bbc.com/news/world-asia-12345</link>
          <description>Leaders gathered in Tokyo, Japan to finalize unprecedented agreements on green infrastructure.</description>
          <pubDate>Wed, 07 Oct 2026 12:00:00 GMT</pubDate>
          <category>world</category>
        </item>
        <item>
          <title>Global Economic Summit in Paris</title>
          <link>https://aljazeera.com/economy/paris-summit</link>
          <description>Delegates in France discuss inflation stabilization and trade agreements.</description>
          <pubDate>Wed, 07 Oct 2026 14:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const parsedArticles = parseRssXml(sampleXml, GLOBAL_PUBLISHER_FEEDS[0]);
  assert(parsedArticles.length === 2, 'parseRssXml parsed 2 valid items');
  assert(
    parsedArticles[0].title === 'Major Clean Energy Accord Signed in Tokyo',
    'cleanTitleText stripped trailing publisher name'
  );
  assert(parsedArticles[0].country === 'Japan', 'resolveGeo correctly matched Japan in Tokyo report');
  assert(parsedArticles[1].country === 'France', 'resolveGeo correctly matched France in Paris report');

  // Test Atom feed support
  const sampleAtom = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Atom Tech Wire</title>
      <entry>
        <title>Breakthrough in Quantum Computing Algorithms</title>
        <link href="https://arstechnica.com/quantum-leap" rel="alternate"/>
        <summary>Scientists announce major step forward in quantum coherence times.</summary>
        <updated>2026-10-07T16:00:00Z</updated>
      </entry>
    </feed>
  `;
  const atomParsed = parseRssXml(sampleAtom, {
    id: 'test-atom',
    name: 'Test Atom',
    url: 'https://test.wire/atom',
    region: 'Global',
    language: 'en',
    category: 'technology',
  });
  assert(atomParsed.length === 1, 'parseRssXml parsed Atom entry element');
  assert(atomParsed[0].sourceUrl === 'https://arstechnica.com/quantum-leap', 'Atom link href attribute extracted');

  // ── TEST GROUP 2: Story Clustering & Deduplication ─────────
  console.log('\n--- 2. Story Clustering & Deduplication ---');

  const keywords = extractKeywords('Historic Peace Accord Signed between Neighboring Nations in Geneva');
  assert(keywords.includes('peace') && keywords.includes('accord') && keywords.includes('geneva'), 'extractKeywords tokenized correctly without stop words');

  const similarityHigh = computeTokenSimilarity(
    ['peace', 'accord', 'geneva', 'treaty'],
    ['peace', 'accord', 'geneva', 'summit']
  );
  assert(similarityHigh >= 0.5, 'computeTokenSimilarity returned >= 0.5 for similar headlines');

  const articleA: EngineArticle = {
    id: 'a1',
    title: 'Earthquake of Magnitude 6.4 Strikes Northern Chile',
    summary: 'A 6.4 magnitude tremor was reported off the coast of northern Chile with no tsunami warning.',
    sourceUrl: 'https://reuters.com/chile-quake',
    publisher: 'Reuters',
    publisherDomain: 'reuters.com',
    category: 'breaking',
    country: 'Chile',
    city: 'Santiago',
    lat: -33.4,
    lng: -70.6,
    publishedAt: new Date().toISOString(),
    language: 'en',
    accessLevel: 'full',
    accessLabel: 'Full Report',
    sourceType: 'wire',
  };

  const articleB: EngineArticle = {
    id: 'b1',
    title: 'Magnitude 6.4 Tremor Recorded in Northern Chile Coast',
    summary: 'Strong 6.4 earthquake shakes northern coastal Chile, authorities report.',
    sourceUrl: 'https://bbc.com/chile-tremor',
    publisher: 'BBC News',
    publisherDomain: 'bbc.com',
    category: 'breaking',
    country: 'Chile',
    city: 'Santiago',
    lat: -33.4,
    lng: -70.6,
    publishedAt: new Date().toISOString(),
    language: 'en',
    accessLevel: 'synthesis',
    accessLabel: 'Verified Synthesis',
    sourceType: 'rss',
  };

  const articleUnrelated: EngineArticle = {
    id: 'c1',
    title: 'New Space Telescope Discovers Distant Habitable Exoplanet',
    summary: 'Astronomers celebrate remarkable discovery using next-generation infrared observatory.',
    sourceUrl: 'https://guardian.com/space-telescope',
    publisher: 'The Guardian',
    publisherDomain: 'theguardian.com',
    category: 'technology',
    country: 'International',
    city: 'Global',
    lat: 0,
    lng: 0,
    publishedAt: new Date().toISOString(),
    language: 'en',
    accessLevel: 'full',
    accessLabel: 'Full Report',
    sourceType: 'rss',
  };

  assert(areArticlesRelated(articleA, articleB), 'areArticlesRelated recognized matching Chile earthquake stories');
  assert(!areArticlesRelated(articleA, articleUnrelated), 'areArticlesRelated correctly separated unrelated stories');

  const clusters = clusterAndDeduplicateArticles([articleA, articleB, articleUnrelated]);
  assert(clusters.length === 2, 'clusterAndDeduplicateArticles formed exactly 2 unique clusters');

  const chileCluster = clusters.find((c) => c.primaryArticle.country === 'Chile');
  assert(Boolean(chileCluster), 'Chile cluster identified');
  assert(chileCluster?.coverageCount === 2, 'Cluster correctly grouped 2 coverage sources');
  assert(
    chileCluster?.primaryArticle.relatedSources?.some((s) => s.publisher === 'BBC News') === true,
    'Primary article retained BBC News in relatedSources'
  );

  // ── TEST GROUP 3: Article Access Resolver & Transparency ───
  console.log('\n--- 3. Article Access Resolver & Tiers ---');

  assert(isPaywalledContent('Please subscribe to continue reading the full article.'), 'isPaywalledContent detected subscription blocker');

  // Tier 1: Full content
  const longBody = new Array(90).fill('verified factual dispatch report').join(' ');
  const fullResolution = resolveArticleAccess({
    url: 'https://example.com/story-1',
    title: 'Clean Energy Accord',
    country: 'Japan',
    rawContent: longBody,
    publisher: 'Associated Press',
  });
  assert(fullResolution.accessLevel === 'full', 'Full content resolved to full tier');
  assert(fullResolution.canReadInline === true, 'Full content flagged as canReadInline');

  // Tier 2: Verified Synthesis
  const synthesisResolution = resolveArticleAccess({
    url: 'https://example.com/story-2',
    title: 'Clean Energy Accord Details',
    summary: 'Detailed summary of the treaty agreed upon in Tokyo containing several paragraphs of factual details.',
    country: 'Japan',
    publisher: 'Reuters',
  });
  assert(synthesisResolution.accessLevel === 'synthesis', 'Substantial summary resolved to synthesis tier');
  assert((synthesisResolution.extractedKeyFacts?.length ?? 0) >= 3, 'Key facts synthesized for synthesis tier');

  // Tier 3: Publisher Dispatch (Paywalled / Minimal)
  const dispatchResolution = resolveArticleAccess({
    url: 'https://example.com/story-3',
    title: 'Breaking Business Merger',
    country: 'United States',
    rawContent: 'Subscribe to continue reading this exclusive report.',
    publisher: 'Financial Wire',
  });
  assert(dispatchResolution.accessLevel === 'dispatch', 'Paywalled content safely resolved to dispatch tier');
  assert(dispatchResolution.canReadInline === false, 'Dispatch tier does not claim false inline full text');

  // ── TEST GROUP 4: Ingestion Pipeline Integration ───────────
  console.log('\n--- 4. Live Ingestion & Service Integration ---');

  console.log('Testing fetchLiveNews()...');
  const liveResult = await fetchLiveNews();
  assert(liveResult.active === true, 'fetchLiveNews returned active=true');
  assert(liveResult.events.length > 0, `fetchLiveNews returned ${liveResult.events.length} events`);
  assert(Boolean(liveResult.events[0].title), 'Event has valid title');
  assert(Boolean(liveResult.events[0].source), 'Event has attributed source URL');

  console.log('Testing searchLiveNews("Japan")...');
  const searchResult = await searchLiveNews('Japan');
  assert(searchResult.active === true, 'searchLiveNews returned active=true');
  assert(searchResult.events.length > 0, `searchLiveNews returned ${searchResult.events.length} events`);

  console.log('Testing fetchNewsForCountry("India")...');
  const countryResult = await fetchNewsForCountry('India');
  assert(countryResult.isTemporaryError === false, 'fetchNewsForCountry returned without temporary error');
  assert(countryResult.articles.length > 0, `fetchNewsForCountry returned ${countryResult.articles.length} articles`);
  assert(Boolean(countryResult.articles[0].source), 'Country article has verified source publisher');

  // ── SUMMARY ────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`✅ Test Results: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runNewsEngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
