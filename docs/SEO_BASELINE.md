# 🌐 MooEarth Live — Global SEO Phase 0 Baseline & Production Audit

> **Audit Date:** October 6, 2026  
> **Target Production Hostname:** `https://www.mooearth.live`  
> **Canonical Hostname:** `https://www.mooearth.live`  
> **Next.js Engine:** 16.2.9 (Turbopack, App Router)  
> **Branch:** `seo/global-seo-v1`  
> **Status:** AUDIT & BASELINE ONLY — ZERO CODE MODIFICATIONS TO APPLICATION RUNTIME

---

## 1. Executive Summary

This Phase 0 audit establishes an uncompromising, empirical baseline of MooEarth Live's technical SEO, indexability, crawl budget efficiency, metadata contracts, and Core Web Vitals across both the production environment (`https://www.mooearth.live`) and the local build pipeline.

### High-Level Audit Verdict:
- **Indexable Public Routes:** 81 pre-rendered / dynamic App Router routes compiled cleanly.
- **Sitemap Coverage:** 255 URLs dynamically emitted in `sitemap.xml` covering core pages, news categories, verified countries, localized international hubs, and legal disclaimers.
- **TypeScript & Static Types:** 0 Errors (`tsc --noEmit` passed).
- **Data Integrity & Mock Leak Protection:** 100/100 Production Score (0 mock leaks in production runtime).
- **Sentry Regression Sentinel:** 5/5 suites passed.
- **Identified Blockers & Discrepancies:**
  - **CRITICAL:** Missing reciprocal `hreflang` tags on the root `/` homepage (only child localized routes currently output them).
  - **CRITICAL:** Domain mismatch in metadata: Canonical points to `https://www.mooearth.live`, whereas OpenGraph (`og:url`) points to apex `https://mooearth.live`.
  - **HIGH:** `robots.txt` explicitly includes `Allow: /country` and `Allow: /challenge`, which return HTTP 404 status codes.

---

## 2. Current Architecture & Stack Inspection

| Layer | Implementation | Notes / Constraints |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2.9 | Turbopack compilation, standalone output enabled |
| **Router** | App Router (`src/app`) | 100% App Router; Pages router (`src/pages`) is not present |
| **Rendering Strategy** | Hybrid SSG + SSR | 28 static localized routes + dynamic SSR fallback routes |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | CSS file size: 199.3 KB |
| **3D Rendering** | Three.js + `react-globe.gl` | 1.58 MB client bundle, client-only dynamic loading |
| **PWA & Cache** | `public/sw.js` + `manifest.json` | Timestamp-synchronized cache with push notifications |
| **i18n Engine** | Custom `src/lib/i18n` | 8 Tier-1 locales (`en`, `es`, `fr`, `pt`, `de`, `ja`, `hi`, `ar`) |
| **Middleware** | None | No edge `middleware.ts` configured |
| **Edge Redirects** | DNS & Vercel Host-level | `https://mooearth.live` ➔ 308 redirect to `https://www.mooearth.live` |

---

## 3. Current Routes Inventory

The Next.js Turbopack production build generates 81 routes across 4 functional categories:

### A. Core Public & Discovery Hubs
- `/` — Living Earth 3D Interactive Home & Global Reaction Hub (Status: 200)
- `/explore` — Planetary Explorer & Country Search (Status: 200)
- `/news` — Global Aggregated Real-Time News Wire (Status: 200)
- `/sports` — International Sports Reactions & Match Feed (Status: 200)
- `/technology` — Tech & Science Breakthroughs (Status: 200)
- `/business` — Global Markets & Economic Stories (Status: 200)
- `/weather` — Extreme Climate & Meteorological Events (Status: 200)
- `/trending` — Global Viral Stories & Pulse Intensity (Status: 200)
- `/about` — Platform Overview & Mission (Status: 200)

### B. Virality, Game & Engagement Modes
- `/daily` — Daily Earth Challenge (Wordle-style geography challenge) (Status: 200)
- `/challenge/[challengeId]` — 1v1 Asynchronous Head-to-Head Duel Arena (Status: 200)
- `/challenges` — Community Challenges Hub (Status: 200)
- `/games` — Game Modes Directory (Status: 200)
- `/play-earth` — Fullscreen 11+ Discovery & Trivia Mode Arena (Status: 200)
- `/party` — Classroom & Party Multiplayer Trivia Arena (Status: 200)
- `/party/[roomCode]` — Direct Room Code Multiplayer Lobby (Status: 200)
- `/tournament` — Global Nations Cup Weekly Championship (Status: 200)
- `/war-room` — Tactical Geopolitical Situation Center (Status: 200)
- `/war-room/[eventId]` — Dedicated Tactical Hotspot Situation Page (Status: 200)
- `/embed/globe` — Lightweight 3D Iframe Widget for Newsrooms (Status: 200)

### C. Multilingual International Programmatic Routes (`/[lang]`)
Pre-rendered static and dynamic SSR routes across 7 non-English locales (`es`, `fr`, `pt`, `de`, `ja`, `hi`, `ar`):
- `/[lang]` — Localized Homepages (e.g., `/es`, `/ja`, `/ar`) (Status: 200)
- `/[lang]/daily` — Localized Daily Challenge (e.g., `/es/daily`, `/fr/daily`) (Status: 200)
- `/[lang]/country/[country]` — Localized Country Profiles (e.g., `/ja/country/japan`) (Status: 200)
- `/[lang]/party` — Localized Party Arenas (Status: 200)
- `/[lang]/tournament` — Localized Global Nations Cup (Status: 200)
- `/[lang]/war-room` — Localized War Room Dashboards (Status: 200)

### D. Legal & Compliance Pages
- `/privacy`, `/terms`, `/cookies`, `/copyright`, `/dmca`, `/disclaimer`, `/data-sources`, `/accessibility`, `/community`, `/security`, `/ai-transparency`, `/advertising` (All Status: 200)

### E. Internal / Non-Indexable / API Routes
- `/api/events`, `/api/news`, `/api/locations`, `/api/perspective`, `/api/quiz/*`, `/api/celebrations/*`, `/api/admin/*`
- `/admin/analytics`, `/admin/health` (Protected by authentication & Disallow rules)

---

## 4. Production HTTP & Network Baseline (`https://www.mooearth.live`)

Live audit executed on production domain on October 6, 2026:

```
[Status] [Requested URL]                              [Target / Redirect URL]
200      https://www.mooearth.live/                   (Direct 200 OK)
308      https://mooearth.live/                    -> https://www.mooearth.live/
308      http://mooearth.live/                     -> https://mooearth.live/ (-> https://www.mooearth.live/)
308      http://www.mooearth.live/                 -> https://www.mooearth.live/
200      https://www.mooearth.live/robots.txt         (Direct 200 OK)
200      https://www.mooearth.live/sitemap.xml        (Direct 200 OK - 255 URLs)
200      https://www.mooearth.live/daily              (Direct 200 OK)
200      https://www.mooearth.live/party              (Direct 200 OK)
200      https://www.mooearth.live/tournament         (Direct 200 OK)
200      https://www.mooearth.live/war-room           (Direct 200 OK)
200      https://www.mooearth.live/news               (Direct 200 OK)
200      https://www.mooearth.live/country/japan      (Direct 200 OK)
200      https://www.mooearth.live/es/daily           (Direct 200 OK)
200      https://www.mooearth.live/ja/country/japan   (Direct 200 OK)
404      https://www.mooearth.live/country            (404 Not Found — Discrepancy with robots.txt)
404      https://www.mooearth.live/challenge          (404 Not Found — Discrepancy with robots.txt)
```

---

## 5. Current SEO & Metadata Implementation Audit

### A. Title & Meta Description Audit
- **Homepage:**
  - `<title>`: `MooEarth Live`
  - `<meta name="description">`: `An immersive emotional globe visualizing global news, live sports reactions, celebrations, and world energy.`
  - **Assessment:** Title is brief. Missing high-value target keywords (e.g., *Interactive 3D Earth Globe*, *World News Map*, *Live Geography Trivia*).
- **Daily Challenge (`/daily`):**
  - `<title>`: `Daily Earth Challenge — Test Your World Knowledge | MooEarth Live`
  - `<meta name="description">`: `Take on today's Daily Earth Challenge. 5 synchronized geography questions, build your streak, earn XP, and compete with players worldwide. A new challenge every day on MooEarth Live.`
  - **Assessment:** Excellent, high-intent targeting.
- **Country Hubs (`/country/[country]`):**
  - `<title>`: `[Country] News, Sports, Weather & Live Events | MooEarth Live`
  - Dynamic metadata correctly resolves capitalized country names.

### B. Canonical & Domain Uniformity
- Root layout defines:
  ```ts
  metadataBase: new URL('https://www.mooearth.live'),
  alternates: { canonical: '/' }
  ```
- **Discrepancy Detected:**
  - `og:url` in root layout is hardcoded to `https://mooearth.live` instead of `https://www.mooearth.live`.
  - While Vercel 308-redirects apex to `www`, search engine crawlers and social scrapers (Facebook, LinkedIn, Twitter/X) register this as a split canonical signal.

### C. Hreflang Implementation
- Subpages (`/daily`, `/party`, `/tournament`, `/[lang]/*`, `/[lang]/country/*`) implement complete reciprocal `hreflang` alternate links using `generateHreflangs()`:
  - `x-default`: `https://www.mooearth.live/daily`
  - `en`: `https://www.mooearth.live/daily`
  - `es`: `https://www.mooearth.live/es/daily`
  - `fr`: `https://www.mooearth.live/fr/daily`
  - `pt`: `https://www.mooearth.live/pt/daily`
  - `de`: `https://www.mooearth.live/de/daily`
  - `ja`: `https://www.mooearth.live/ja/daily`
  - `hi`: `https://www.mooearth.live/hi/daily`
  - `ar`: `https://www.mooearth.live/ar/daily`
- **Missing Baseline:**
  - Root layout (`/`) does NOT invoke `generateHreflangs('')`. As a result, the main homepage has `0` hreflang tags in production HTML, disconnecting the international homepages (`/es`, `/fr`, `/ja`, etc.) from Google's language cluster indexing on the root domain.

### D. Structured Data (JSON-LD)
The following Schema.org schemas are currently emitted:
1. **Organization Schema** (in `layout.tsx`):
   - `@type`: `Organization`
   - `name`: `MooEarth Live`
   - `url`: `https://www.mooearth.live`
   - `logo`: `https://www.mooearth.live/icons/icon-512.svg`
   - `sameAs`: Twitter, Facebook links
2. **WebSite Schema with SearchAction** (in `layout.tsx`):
   - `@type`: `WebSite`
   - `potentialAction.target`: `https://www.mooearth.live/?q={search_term_string}`
3. **BreadcrumbList Schema** (in `/daily`, `/challenge/*`, legal pages):
   - Multi-tier navigation breadcrumbs
4. **VideoGame Schema** (in `/party`, `/tournament`):
   - `@type`: `VideoGame`
   - `genre`: `Educational Game, Trivia, Multiplayer`
5. **NewsMediaOrganization Schema** (in `/war-room`):
   - `@type`: `NewsMediaOrganization`

---

## 6. Indexing & Crawl Budget Configuration

### A. `robots.txt` Analysis (`src/app/robots.ts`)
```txt
User-Agent: *
Allow: /
Allow: /news
Allow: /country
Allow: /sports
Allow: /weather
Allow: /business
Allow: /technology
Allow: /play-earth
Allow: /games
Allow: /daily
Allow: /challenges
Allow: /challenge
Allow: /trending
Allow: /explore
Allow: /category/*
Allow: /article/*
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Disallow: /api/
Disallow: /admin/
Disallow: /debug/
Disallow: /private/

Sitemap: https://www.mooearth.live/sitemap.xml
```

**Issues Detected in `robots.txt`:**
1. `Allow: /country` ➔ `/country` does not exist (returns 404). Crawlers attempt to fetch it and consume crawl budget on a dead end. Should be `/country/*`.
2. `Allow: /challenge` ➔ `/challenge` does not exist (returns 404). Challenges exist at `/challenges` and `/challenge/[challengeId]`. Should be `/challenge/*`.
3. Missing rules for search parameter bloat (e.g. `Disallow: /*?*c=` or tracking query strings).

### B. `sitemap.xml` Analysis (`src/app/sitemap.ts`)
- **Total Emitted URLs:** 255 URLs
- **Breakdown:**
  - Core Hubs: 11 URLs
  - Content Categories: 5 URLs
  - Dynamic News Categories: 7 URLs
  - Unique Countries: 25 URLs
  - Multilingual Pages (7 locales × Home + Daily + 25 Countries): 189 URLs
  - Fallback Articles & War Room Situation Pages: 4 URLs
  - Legal & Informational: 14 URLs
- **Validation:** Every URL in `sitemap.xml` uses absolute canonical `https://www.mooearth.live` prefixes and includes ISO `lastModified` and `changeFrequency`.

---

## 7. Performance & Core Web Vitals Baseline

Measured directly on production (`https://www.mooearth.live`) on October 6, 2026:

| Metric | Desktop Home (`/`) | Mobile Home (`/`) | Daily Challenge (`/daily`) | Country Hub (`/country/japan`) | Google Good Threshold |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **HTTP Status** | 200 OK | 200 OK | 200 OK | 200 OK | 200 |
| **TTFB** | **49 ms** | **164 ms** | **44 ms** | **50 ms** | < 800 ms |
| **LCP** | **680 ms** | **664 ms** | **652 ms** | **1,784 ms** | < 2,500 ms |
| **CLS** | **0.1828** ⚠️ | **0.0001** ✅ | **0.0000** ✅ | **0.0000** ✅ | < 0.1000 |
| **DOM Complete** | 186 ms | 242 ms | 542 ms | 1,187 ms | — |
| **Total Duration**| 2,466 ms | 859 ms | 543 ms | 1,190 ms | — |

### Client Bundle Breakdown (`.next/static`):
- **Total Static Asset Size:** **4.59 MB** across 67 chunks
- **Top Static Chunks:**
  1. `1,583.2 KB` — Three.js WebGL Engine (`three`, `react-globe.gl`)
  2. `466.3 KB` — React & Next.js Framework Vendor Chunk
  3. `313.4 KB` — Globe 3D Shaders, Textures & Geometries
  4. `221.0 KB` — Live Feed & Telemetry State
  5. `199.3 KB` — Global Tailwind CSS Bundle

### Key Performance Findings:
1. **LCP is exceptionally fast (< 700 ms)** across the homepage and daily challenge.
2. **Desktop CLS (0.1828) exceeds the 0.1 threshold**:
   - Cause: The Live Feed sidebar (`w-96`) and navigation search container render dynamically after client mount without reserved layout dimensions, shifting the central globe canvas.
   - Mobile CLS is pristine (`0.0001`) because the mobile layout uses a fixed bottom drawer.

---

## 8. Test Suite Baseline Results

| Suite | Command | Total Tests | Passed | Failed | Status | Root Cause / Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **TypeScript Typecheck** | `npx tsc --noEmit` | — | All | 0 | ✅ **PASSED** | 0 compile errors |
| **ESLint Standards** | `npm run lint` | 200 rules | 200 | 0 | ✅ **PASSED** | 0 errors, 200 non-blocking warnings |
| **Mock/Fake Data Leak Guard** | `npm run test:mock-scan` | 448 files | 448 | 0 | ✅ **PASSED** | **100/100 Production Score** |
| **Sentry Sentinel** | `npm run test:sentry` | 5 suites | 5 | 0 | ✅ **PASSED** | Math invariants & game engine verified |
| **Playwright Growth E2E** | `npx playwright test tests/growth-engine.spec.ts ...` | 24 | 21 | 3 | ⚠️ **PARTIAL** | 3 tests failed due to strict string assertion on challenge headings (`Alex Challenged You!` vs `Earth Challenge`) |
| **Playwright Data-Integrity** | `npm run test:data-integrity` | 50 | 34 | 16 | ⚠️ **PARTIAL** | Upstream OpenAI 429 quota rate limit on live summary API during test runs |
| **Production Build** | `npm run build` | 81 routes | 81 | 0 | ✅ **PASSED** | Next.js Turbopack SSG/SSR compile 100% clean |

---

## 9. Current Problems & Risks Classification

### 🔴 CRITICAL ISSUES
1. **Root Homepage Missing `hreflang` Alternates**:
   - Root `/` outputs 0 hreflang links, while `/es`, `/fr`, `/ja`, `/daily`, etc. do. This breaks Google's international cluster graph at the root level.
2. **Canonical vs. OpenGraph Hostname Mismatch**:
   - Root layout defines Canonical as `https://www.mooearth.live` but OpenGraph `og:url` as `https://mooearth.live`. This dilutes social sharing signals and search indexing consistency.

### 🟠 HIGH ISSUES
1. **Robots.txt Crawl Traps (404 Endpoints)**:
   - `Allow: /country` and `Allow: /challenge` direct crawlers to non-existent index pages that return 404.
2. **Desktop Layout Shift (CLS = 0.1828)**:
   - Fails Google's Core Web Vitals threshold (< 0.1). Caused by unreserved space during sidebar hydration.
3. **Upstream API Rate Limiting (OpenAI 429)**:
   - During high traffic or test runs, dynamic summary calls trigger 429. Need resilient fallback caching.

### 🟡 MEDIUM ISSUES
1. **Lack of City / Location Landing Pages**:
   - The platform has 25+ country pages, but 0 city pages (e.g. `/location/tokyo`, `/location/paris`), missing long-tail local search demand.
2. **No Edge Geo-IP Language Redirects**:
   - Users from Spanish-speaking or Japanese-speaking countries must manually toggle the language selector because there is no edge middleware inspecting `Accept-Language` headers.
3. **Thin Title on Root Homepage**:
   - The `<title>` is only 13 characters (`MooEarth Live`), lacking descriptive primary search terms.

### 🟢 LOW ISSUES
1. **200 ESLint Warnings**:
   - Unused type imports and minor react-hooks dependency warnings.
2. **Sitemap Size Overhead**:
   - Currently 255 URLs in a single file; will need sitemap index splitting when scaling beyond 10,000 programmatic URLs.

---

## 10. Recommended Phase 1 Action Plan (Preparation Only)

*Note: Per Phase 0 guidelines, none of the following changes will be executed until authorized.*

1. **Fix Root Hreflangs & Canonical Alignment**:
   - Attach `generateHreflangs('')` to the root page/layout metadata.
   - Synchronize `og:url` across all layouts to `https://www.mooearth.live`.
2. **Sanitize `robots.ts`**:
   - Change `/country` to `/country/*` and `/challenge` to `/challenge/*` (or create dedicated hub directory pages).
3. **Stabilize Desktop CLS**:
   - Provide static CSS aspect ratios / width reservations for the sidebar container so it does not shift the globe viewport upon hydration.
4. **Enhance Root Title & Meta Description**:
   - Update homepage title to: `MooEarth Live — 3D Interactive World Globe & Live News Reactions`.

---
*Report generated and archived on branch `seo/global-seo-v1`.*
