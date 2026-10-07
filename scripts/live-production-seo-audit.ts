import https from 'https';
import http from 'http';

interface AuditResult {
  domainChecks: Record<string, any>;
  robotsCheck: Record<string, any>;
  sitemapCheck: Record<string, any>;
  canonicalChecks: Array<any>;
  hreflangMatrix: Array<any>;
  representativeCrawl: Array<any>;
  ssrChecks: Array<any>;
  googleFriendlyAudit: Record<string, any>;
}

const BASE_URL = 'https://www.mooearth.live';

// Helper to fetch response with followRedirect option and headers
async function fetchUrl(url: string, followRedirect = true): Promise<{
  url: string;
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  redirectHistory: Array<{ url: string; statusCode: number; location?: string }>;
  body: string;
}> {
  const redirectHistory: Array<{ url: string; statusCode: number; location?: string }> = [];
  let currentUrl = url;
  let redirectsCount = 0;
  const maxRedirects = 10;

  while (redirectsCount < maxRedirects) {
    const isHttps = currentUrl.startsWith('https://');
    const client = isHttps ? https : http;

    const res = await new Promise<{
      statusCode: number;
      headers: Record<string, string | string[] | undefined>;
      body: string;
    }>((resolve, reject) => {
      const req = client.get(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
      }, (resp) => {
        let data = '';
        resp.on('data', chunk => { data += chunk; });
        resp.on('end', () => {
          resolve({
            statusCode: resp.statusCode || 0,
            headers: resp.headers,
            body: data,
          });
        });
      });
      req.on('error', err => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${currentUrl}`));
      });
    });

    if (!followRedirect || ![301, 302, 307, 308].includes(res.statusCode)) {
      return {
        url: currentUrl,
        statusCode: res.statusCode,
        headers: res.headers,
        redirectHistory,
        body: res.body,
      };
    }

    const location = res.headers.location as string;
    redirectHistory.push({ url: currentUrl, statusCode: res.statusCode, location });
    if (!location) {
      return {
        url: currentUrl,
        statusCode: res.statusCode,
        headers: res.headers,
        redirectHistory,
        body: res.body,
      };
    }

    currentUrl = new URL(location, currentUrl).toString();
    redirectsCount++;
  }

  throw new Error(`Too many redirects for ${url}`);
}

async function runAudit() {
  console.log('🚀 Starting MOOEARTH LIVE Production SEO Verification Audit against', BASE_URL);
  const audit: AuditResult = {
    domainChecks: {},
    robotsCheck: {},
    sitemapCheck: {},
    canonicalChecks: [],
    hreflangMatrix: [],
    representativeCrawl: [],
    ssrChecks: [],
    googleFriendlyAudit: {},
  };

  // 1. DOMAIN & REDIRECTS
  console.log('\n--- 1. Testing Domain & Redirects ---');
  const domainTests = [
    { name: 'Canonical HTTPS Origin', url: 'https://www.mooearth.live' },
    { name: 'HTTP www Redirect', url: 'http://www.mooearth.live' },
    { name: 'HTTP non-www Redirect', url: 'http://mooearth.live' },
    { name: 'HTTPS non-www Redirect', url: 'https://mooearth.live' },
    { name: 'Trailing slash on /globe/', url: 'https://www.mooearth.live/globe/' },
  ];

  for (const dt of domainTests) {
    try {
      const res = await fetchUrl(dt.url, false);
      audit.domainChecks[dt.name] = {
        testUrl: dt.url,
        statusCode: res.statusCode,
        location: res.headers.location || null,
        redirects: res.redirectHistory,
        verdict: res.statusCode === 200 || [301, 308, 302, 307].includes(res.statusCode) ? 'PASS' : 'WARNING',
      };
      console.log(`[Domain] ${dt.name} (${dt.url}) -> Status: ${res.statusCode}${res.headers.location ? ' -> ' + res.headers.location : ''}`);
    } catch (e: any) {
      audit.domainChecks[dt.name] = { testUrl: dt.url, error: e.message, verdict: 'FAIL' };
      console.log(`[Domain] ${dt.name} error: ${e.message}`);
    }
  }

  // 2. ROBOTS.TXT
  console.log('\n--- 2. Auditing Robots.txt ---');
  try {
    const robotsRes = await fetchUrl(`${BASE_URL}/robots.txt`);
    const content = robotsRes.body;
    const hasValidSyntax = content.includes('User-agent:') || content.includes('User-Agent:');
    const blocksApi = content.includes('Disallow: /api') || content.includes('Disallow: /api/');
    const blocksAdmin = content.includes('Disallow: /admin') || content.includes('Disallow: /admin/');
    const hasSitemap = content.includes('Sitemap: https://www.mooearth.live/sitemap.xml');
    
    // Check accidental blocks
    const accidentallyBlocksPublic = [
      '/countries', '/cities', '/globe', '/world-map', '/geography', '/games', '/world-news', '/weather'
    ].filter(p => content.includes(`Disallow: ${p}`) && !content.includes(`Disallow: ${p}/private`));

    audit.robotsCheck = {
      statusCode: robotsRes.statusCode,
      hasValidSyntax,
      blocksApi,
      blocksAdmin,
      hasSitemap,
      accidentallyBlocksPublic,
      content,
      verdict: hasValidSyntax && blocksAdmin && hasSitemap && accidentallyBlocksPublic.length === 0 ? 'PASS' : 'WARNING',
    };
    console.log(`[Robots] Status: ${robotsRes.statusCode}, Blocks Admin: ${blocksAdmin}, Blocks API: ${blocksApi}, Has Sitemap: ${hasSitemap}, Accidental blocks: ${accidentallyBlocksPublic.length}`);
  } catch (e: any) {
    audit.robotsCheck = { error: e.message, verdict: 'FAIL' };
    console.log(`[Robots] Error: ${e.message}`);
  }

  // 3. SITEMAP
  console.log('\n--- 3. Auditing Sitemap.xml ---');
  let sitemapUrls: string[] = [];
  try {
    const sitemapRes = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    const xml = sitemapRes.body;
    const isXml = xml.includes('<?xml') || xml.includes('<urlset');
    
    // Extract URLs
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    sitemapUrls = locMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

    // Check for dev/localhost URLs
    const localhostUrls = sitemapUrls.filter(u => u.includes('localhost') || u.includes('127.0.0.1'));
    const nonHttpsUrls = sitemapUrls.filter(u => !u.startsWith('https://www.mooearth.live'));
    const duplicates = sitemapUrls.filter((item, index) => sitemapUrls.indexOf(item) !== index);
    const privateAdminUrls = sitemapUrls.filter(u => u.includes('/admin') || u.includes('/api'));

    // Categorize
    const categoryCounts: Record<string, number> = {
      core: 0,
      countries: 0,
      cities: 0,
      games: 0,
      news: 0,
      weather: 0,
      continents: 0,
      localized: 0,
      other: 0,
    };
    const langCounts: Record<string, number> = {
      en: 0, es: 0, fr: 0, pt: 0, de: 0, ja: 0, hi: 0, ar: 0,
    };
    const countriesInSitemap = new Set<string>();

    for (const u of sitemapUrls) {
      const path = u.replace('https://www.mooearth.live', '');
      
      // Check language prefix
      const matchLang = path.match(/^\/(es|fr|pt|de|ja|hi|ar)(\/.*)?$/);
      if (matchLang) {
        langCounts[matchLang[1]] = (langCounts[matchLang[1]] || 0) + 1;
        categoryCounts.localized++;
      } else {
        langCounts.en++;
      }

      if (path.includes('/countries/') || path.includes('/country/')) {
        categoryCounts.countries++;
        const parts = path.split('/');
        const cIndex = parts.indexOf('countries') !== -1 ? parts.indexOf('countries') : parts.indexOf('country');
        if (cIndex !== -1 && parts[cIndex + 1]) {
          countriesInSitemap.add(parts[cIndex + 1]);
        }
      } else if (path.includes('/cities/')) {
        categoryCounts.cities++;
      } else if (path.includes('/games') || path.includes('-quiz')) {
        categoryCounts.games++;
      } else if (path.includes('/news')) {
        categoryCounts.news++;
      } else if (path.includes('/weather')) {
        categoryCounts.weather++;
      } else if (path.includes('/continents')) {
        categoryCounts.continents++;
      } else if (['', '/', '/globe', '/world-map', '/geography', '/about', '/privacy'].includes(path)) {
        categoryCounts.core++;
      } else {
        categoryCounts.other++;
      }
    }

    audit.sitemapCheck = {
      statusCode: sitemapRes.statusCode,
      isValidXml: isXml,
      totalUrls: sitemapUrls.length,
      localhostUrlsCount: localhostUrls.length,
      nonHttpsUrlsCount: nonHttpsUrls.length,
      duplicateCount: duplicates.length,
      privateAdminUrlsCount: privateAdminUrls.length,
      categoryCounts,
      langCounts,
      uniqueCountriesCount: countriesInSitemap.size,
      hasHreflangAlternates: xml.includes('xhtml:link') || xml.includes('hreflang'),
      verdict: isXml && sitemapUrls.length > 0 && localhostUrls.length === 0 && duplicateCount(duplicates) === 0 ? 'PASS' : 'WARNING',
    };
    console.log(`[Sitemap] Total URLs: ${sitemapUrls.length}, Countries: ${countriesInSitemap.size}, Localized: ${categoryCounts.localized}, Localhost URLs: ${localhostUrls.length}, Duplicates: ${duplicates.length}`);
  } catch (e: any) {
    audit.sitemapCheck = { error: e.message, verdict: 'FAIL' };
    console.log(`[Sitemap] Error: ${e.message}`);
  }

  function duplicateCount(d: string[]) { return d.length; }

  // 4. CANONICAL & ROBOTS META AUDIT
  console.log('\n--- 4. Auditing Canonical & Meta Tags on Sample Pages ---');
  const canonicalSamplePages = [
    '/',
    '/globe',
    '/world-map',
    '/geography',
    '/countries/india',
    '/countries/japan',
    '/countries/brazil',
    '/countries/france',
    '/cities/tokyo',
    '/cities/mumbai',
    '/world-news',
    '/weather',
    '/games',
    '/es/country/spain',
    '/es/country-quiz',
  ];

  for (const path of canonicalSamplePages) {
    const pageUrl = `${BASE_URL}${path}`;
    try {
      const res = await fetchUrl(pageUrl);
      const html = res.body;

      // Extract canonical tag
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
      const canonicalHref = canonicalMatch ? canonicalMatch[1] : null;

      // Extract robots meta
      const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const robotsContent = robotsMatch ? robotsMatch[1] : null;

      // Check title & description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : null;

      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const description = descMatch ? descMatch[1].trim() : null;

      // Assertions
      const pointsToProd = canonicalHref?.startsWith(BASE_URL) || false;
      const noLocalhost = !canonicalHref?.includes('localhost') && !canonicalHref?.includes('127.0.0.1');
      const noNoindex = !robotsContent?.toLowerCase().includes('noindex');

      const result = {
        path,
        statusCode: res.statusCode,
        canonicalHref,
        robotsMeta: robotsContent || 'index, follow (default)',
        title: title ? title.slice(0, 60) + '...' : null,
        hasDescription: !!description,
        pointsToProd,
        noLocalhost,
        noNoindex,
        verdict: canonicalHref && pointsToProd && noLocalhost && noNoindex ? 'PASS' : 'WARNING',
      };
      audit.canonicalChecks.push(result);
      console.log(`[Canonical] ${path} -> Status: ${res.statusCode}, Canonical: ${canonicalHref}, Robots: ${robotsContent || 'default'}`);
    } catch (e: any) {
      audit.canonicalChecks.push({ path, error: e.message, verdict: 'FAIL' });
      console.log(`[Canonical] ${path} error: ${e.message}`);
    }
  }

  // 5. HREFLANG AUDIT (8 Locales Matrix)
  console.log('\n--- 5. Auditing Hreflang Alternates Matrix across 8 Locales ---');
  const hreflangTestRoots = ['/country-quiz', '/daily', '/party', '/weather', '/world-map'];
  const testLocales = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'hi', 'ar'];

  for (const root of hreflangTestRoots) {
    for (const lang of testLocales) {
      const pagePath = lang === 'en' ? root : `/${lang}${root}`;
      const pageUrl = `${BASE_URL}${pagePath}`;
      try {
        const res = await fetchUrl(pageUrl);
        const html = res.body;

        // Find all hreflang links
        const hreflangRegex = /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
        const matches: Array<{ hreflang: string; href: string }> = [];
        let m: RegExpExecArray | null = null;
        while ((m = hreflangRegex.exec(html)) !== null) {
          matches.push({ hreflang: m[1], href: m[2] });
        }

        // Also reverse attribute order regex
        const hreflangRegex2 = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]*>/gi;
        while ((m = hreflangRegex2.exec(html)) !== null) {
          const currentM = m;
          if (currentM && !matches.some(x => x.hreflang === currentM[2])) {
            matches.push({ hreflang: currentM[2], href: currentM[1] });
          }
        }

        const selfRef = matches.find(x => x.hreflang === lang || (lang === 'en' && x.hreflang === 'en'));
        const xDefault = matches.find(x => x.hreflang === 'x-default');

        audit.hreflangMatrix.push({
          pagePath,
          lang,
          statusCode: res.statusCode,
          alternateCount: matches.length,
          hasSelfRef: !!selfRef,
          selfRefHref: selfRef?.href || null,
          hasXDefault: !!xDefault,
          xDefaultHref: xDefault?.href || null,
          verdict: matches.length >= 7 && !!selfRef ? 'PASS' : (matches.length > 0 ? 'WARNING' : 'INFO'),
        });
        console.log(`[Hreflang] ${pagePath} (${lang}) -> Status: ${res.statusCode}, Alternates: ${matches.length}, Self-ref: ${!!selfRef}, x-default: ${!!xDefault}`);
      } catch (e: any) {
        audit.hreflangMatrix.push({ pagePath, lang, error: e.message, verdict: 'FAIL' });
      }
    }
  }

  // 6 & 7. REPRESENTATIVE CRAWL TEST (at least 60 URLs)
  console.log('\n--- 6 & 7. Representative Production URL Crawl Test ---');
  const representativeUrls = [
    // 10 Country Pages
    '/countries/india', '/countries/japan', '/countries/brazil', '/countries/france',
    '/countries/germany', '/countries/united-states', '/countries/australia', '/countries/canada',
    '/countries/egypt', '/countries/south-africa',
    // 5 Country/News Pages
    '/countries/india/news', '/countries/japan/news', '/countries/brazil/news',
    '/countries/france/news', '/countries/germany/news',
    // 5 Country/Geography Pages
    '/countries/india/geography', '/countries/japan/geography', '/countries/brazil/geography',
    '/countries/france/geography', '/countries/germany/geography',
    // 5 Country/Weather Pages
    '/countries/india/weather', '/countries/japan/weather', '/countries/brazil/weather',
    '/countries/france/weather', '/countries/germany/weather',
    // 5 Country/Map Pages
    '/countries/india/map', '/countries/japan/map', '/countries/brazil/map',
    '/countries/france/map', '/countries/germany/map',
    // 5 Country/Quiz Pages
    '/countries/india/quiz', '/countries/japan/quiz', '/countries/brazil/quiz',
    '/countries/france/quiz', '/countries/germany/quiz',
    // 5 City Pages
    '/cities/mumbai', '/cities/tokyo', '/cities/new-delhi', '/cities/paris', '/cities/london',
    // 5 Game Pages
    '/games', '/country-quiz', '/flag-quiz', '/geography-quiz', '/capital-quiz',
    // 5 News Pages
    '/news', '/world-news', '/live-world-news', '/live-events', '/trending',
    // 5 Weather Pages
    '/weather', '/world-weather', '/weather-map', '/weather/india', '/weather/japan',
    // 5 Localized Pages
    '/es', '/es/country/spain', '/fr/weather', '/ja/games', '/ar/world-news',
  ];

  for (const path of representativeUrls) {
    const fullUrl = `${BASE_URL}${path}`;
    try {
      const res = await fetchUrl(fullUrl);
      const html = res.body;

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const h1 = h1Match ? h1Match[1].trim() : '';

      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const desc = descMatch ? descMatch[1].trim() : '';

      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      const canonical = canonicalMatch ? canonicalMatch[1] : '';

      const hasSchema = html.includes('application/ld+json');
      const hasLinks = html.includes('<a ') || html.includes('href=');

      const isIndexable = !html.includes('content="noindex"') && !html.includes("content='noindex'");

      const crawlItem = {
        path,
        statusCode: res.statusCode,
        hasHtml: html.length > 500,
        contentLength: html.length,
        hasTitle: title.length > 0,
        title: title.slice(0, 50),
        hasH1: h1.length > 0,
        h1: h1.slice(0, 50),
        hasDesc: desc.length > 0,
        hasCanonical: !!canonical,
        isIndexable,
        hasSchema,
        hasLinks,
        verdict: res.statusCode === 200 && title.length > 0 && desc.length > 0 && isIndexable ? 'PASS' : 'WARNING',
      };
      audit.representativeCrawl.push(crawlItem);
      console.log(`[Crawl] ${path} -> Status: ${res.statusCode}, Title: "${title.slice(0, 30)}...", H1: "${h1.slice(0, 25)}...", Schema: ${hasSchema}`);
    } catch (e: any) {
      audit.representativeCrawl.push({ path, error: e.message, verdict: 'FAIL' });
      console.log(`[Crawl] ${path} error: ${e.message}`);
    }
  }

  // 8. SSR CONTENT AUDIT (HTML verification without client JS)
  console.log('\n--- 8. Checking Raw Server-Rendered HTML for SEO Content ---');
  const ssrTargets = [
    { path: '/countries/india', expectedText: ['India', 'New Delhi', 'Asia'] },
    { path: '/countries/japan', expectedText: ['Japan', 'Tokyo', 'Asia'] },
    { path: '/countries/brazil', expectedText: ['Brazil', 'Brasília', 'South America'] },
    { path: '/weather', expectedText: ['Weather', 'Forecast'] },
    { path: '/geography', expectedText: ['Geography', 'Continents'] },
    { path: '/es/country/spain', expectedText: ['España', 'Madrid', 'Europa'] },
  ];

  for (const target of ssrTargets) {
    try {
      const res = await fetchUrl(`${BASE_URL}${target.path}`);
      const rawHtml = res.body;

      const foundTerms = target.expectedText.filter(t => rawHtml.toLowerCase().includes(t.toLowerCase()));
      const percentFound = (foundTerms.length / target.expectedText.length) * 100;

      const ssrItem = {
        path: target.path,
        expectedTerms: target.expectedText,
        foundTerms,
        percentFound,
        verdict: percentFound >= 66 ? 'PASS' : 'WARNING',
      };
      audit.ssrChecks.push(ssrItem);
      console.log(`[SSR] ${target.path} -> Found ${foundTerms.length}/${target.expectedText.length} keywords in raw HTML (${percentFound}%)`);
    } catch (e: any) {
      audit.ssrChecks.push({ path: target.path, error: e.message, verdict: 'FAIL' });
    }
  }

  // 9. GOOGLE-FRIENDLY URL AUDIT
  console.log('\n--- 9. Analyzing Google-Friendly URL Constraints ---');
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  let soft404Count = 0;
  let emptyContentCount = 0;

  for (const item of audit.representativeCrawl) {
    if (item.title) {
      const list = titles.get(item.title) || [];
      list.push(item.path);
      titles.set(item.title, list);
    }
    if (item.desc) {
      const list = descriptions.get(item.desc) || [];
      list.push(item.path);
      descriptions.set(item.desc, list);
    }
    if (item.contentLength < 800) {
      emptyContentCount++;
    }
    if (item.title.toLowerCase().includes('not found') || item.title.toLowerCase().includes('404')) {
      soft404Count++;
    }
  }

  const duplicateTitles = Array.from(titles.entries()).filter(([_, paths]) => paths.length > 1);
  const duplicateDescriptions = Array.from(descriptions.entries()).filter(([_, paths]) => paths.length > 1);

  audit.googleFriendlyAudit = {
    totalChecked: audit.representativeCrawl.length,
    duplicateTitlesCount: duplicateTitles.length,
    duplicateTitlesSamples: duplicateTitles.slice(0, 5),
    duplicateDescriptionsCount: duplicateDescriptions.length,
    soft404CandidatesCount: soft404Count,
    emptyContentCount,
    verdict: soft404Count === 0 && emptyContentCount === 0 ? 'PASS' : 'WARNING',
  };
  console.log(`[Google-Friendly] Duplicate Titles: ${duplicateTitles.length}, Duplicate Descriptions: ${duplicateDescriptions.length}, Soft 404s: ${soft404Count}, Empty pages: ${emptyContentCount}`);

  // Summary
  console.log('\n==================================================');
  console.log('AUDIT COMPLETE. Writing results to test-results/live-seo-audit.json');
  console.log('==================================================');

  const fs = await import('fs');
  fs.writeFileSync('test-results/live-seo-audit.json', JSON.stringify(audit, null, 2));
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
