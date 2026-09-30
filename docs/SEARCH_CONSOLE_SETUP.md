# 🔍 Google Search Console Setup — MooEarth Live

## 1. Domain Verification

### Steps:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property** → **Domain** → Enter `mooearth.live`
3. Choose DNS verification (recommended):
   - Add a TXT record to your domain's DNS settings
   - Record type: `TXT`
   - Value: (provided by Search Console)
   - Host: `@`
4. Wait for DNS propagation (up to 48 hours)
5. Click **Verify** in Search Console

### Alternative: URL Prefix Method
1. Add property as URL prefix: `https://www.mooearth.live`
2. Choose HTML tag or file verification
3. For Vercel deployments, add the meta tag to `src/app/layout.tsx`:
   ```tsx
   <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
   ```

## 2. Sitemap Submission

### Steps:
1. Open Search Console → **Sitemaps** (left sidebar)
2. Enter sitemap URL: `https://www.mooearth.live/sitemap.xml`
3. Click **Submit**
4. Verify status shows "Success" with discovered URLs

### Current Sitemap Content:
- Core pages (homepage, explore, games, daily, challenges, trending, play-earth)
- Content category pages (news, sports, weather, business, technology)
- Dynamic categories (breaking, sports, football, technology, business, weather, entertainment)
- Country pages (~28 countries with verified coordinate data)
- Article pages (from events data)
- Legal pages (about, privacy, terms, etc.)

## 3. URL Inspection

### How to Use:
1. Open Search Console → **URL Inspection** (top search bar)
2. Enter a URL to check its indexing status
3. Key URLs to inspect:
   - `https://www.mooearth.live/`
   - `https://www.mooearth.live/games`
   - `https://www.mooearth.live/daily`
   - `https://www.mooearth.live/explore`
   - `https://www.mooearth.live/country/india`
   - `https://www.mooearth.live/play-earth`

### What to Check:
- **Page is on Google** — indexed and can appear in search
- **Coverage** — any crawl or index issues
- **Mobile Usability** — passes mobile-friendly test
- **Enhancements** — structured data validity

## 4. Indexing Monitoring

### Regular Checks:
1. **Coverage Report**: Search Console → **Pages** (formerly Coverage)
   - Monitor "Valid" vs "Excluded" pages
   - Check for crawl errors
   - Review "Discovered — currently not indexed" pages

2. **Important Metrics to Track**:
   - Total indexed pages (should grow as new content is added)
   - Crawl rate (pages crawled per day)
   - Crawl budget usage

## 5. Core Web Vitals

### How to Monitor:
1. Search Console → **Core Web Vitals**
2. Key metrics (aligned with existing performance goals):
   - **LCP** (Largest Contentful Paint): Target < 2.5s
   - **INP** (Interaction to Next Paint): Target < 200ms
   - **CLS** (Cumulative Layout Shift): Target < 0.1

### MooEarth-Specific Performance Notes:
- Globe WebGL render is lazy-loaded (dynamic import)
- Textures use progressive loading (placeholder → full)
- Heavy components use `dynamic()` with SSR disabled where appropriate
- Font loading uses `display: swap`

## 6. Search Performance

### How to Monitor:
1. Search Console → **Performance** → **Search Results**
2. Track:
   - **Total clicks** from Google Search
   - **Total impressions** (how often shown in results)
   - **Average CTR** (click-through rate)
   - **Average position** in search results

### Key Queries to Monitor:
- "mooearth"
- "interactive globe"
- "geography game"
- "daily earth challenge"
- "world trivia"
- Country-specific queries (e.g., "india news globe")

### Filters:
- By Country — identify which countries drive traffic
- By Device — compare mobile vs desktop performance
- By Page — identify top-performing pages

## 7. Rich Result Monitoring

### How to Monitor:
1. Search Console → **Enhancements**
2. Check for valid structured data types:
   - **BreadcrumbList** — used on all major pages
   - **Place** — used on country pages
   - **WebPage** — used on hub pages

### Validation Tools:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

### Key Pages to Validate:
| Page | Schema Types |
|------|-------------|
| `/` | WebSite, Organization |
| `/country/[country]` | Place, BreadcrumbList |
| `/play-earth` | BreadcrumbList |
| `/games` | WebPage, BreadcrumbList |
| `/daily` | BreadcrumbList |

## 8. International Targeting

### Current Status:
- Primary language: English (`lang="en"`)
- No multi-language implementation yet
- UTF-8 encoding supports international characters (São Paulo, Chișinău, etc.)

### Future Considerations:
- When adding i18n, implement `hreflang` tags
- Use Search Console → **International Targeting** to set target country if needed
- Consider `x-default` hreflang for language-neutral content

---

## ⚠️ Important Notes

- This document describes the **setup process**. Search Console has NOT been configured yet — it requires manual verification by the domain owner.
- Search Console data typically takes 2-3 days to start appearing after verification.
- Indexing of all sitemap URLs may take days to weeks.
- Do not expect immediate search traffic — organic growth takes time.
