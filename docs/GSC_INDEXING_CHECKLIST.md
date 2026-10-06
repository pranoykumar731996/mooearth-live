# MOOEARTH LIVE — GOOGLE SEARCH CONSOLE READINESS & INDEXING CHECKLIST
**Global SEO Phase 1: Technical SEO & Crawling Foundation**

---

## 1. PRODUCTION ASSETS & TARGET ENDPOINTS

| Resource | Canonical Production Value | Status |
| :--- | :--- | :--- |
| **Canonical Hostname** | `https://www.mooearth.live` | Enforced (Apex 308 redirects to `www`) |
| **Sitemap Endpoint** | `https://www.mooearth.live/sitemap.xml` | Live, dynamic, deduplicated |
| **Robots Endpoint** | `https://www.mooearth.live/robots.txt` | Live, explicit allow/disallow |
| **Organization Schema** | `@type: "Organization"`, `name: "MooEarth Live"` | Root layout JSON-LD |
| **WebSite Schema** | `@type: "WebSite"`, `SearchAction` query template | Root layout JSON-LD |

---

## 2. GOOGLE SEARCH CONSOLE PROPERTY SETUP

### Property Recommendation
- **Domain Property (Recommended)**: `mooearth.live` (covers `https://www.mooearth.live`, `https://mooearth.live`, and all subdomains).
  - *Verification*: DNS TXT record at DNS provider (e.g., Cloudflare / Namecheap / Google Cloud DNS).
- **URL-Prefix Property (Secondary)**: `https://www.mooearth.live/`
  - *Verification*: HTML tag in `<head>` or Google Analytics link.

### Sitemap Submission
1. In Google Search Console, navigate to **Indexing** ➔ **Sitemaps**.
2. Enter `sitemap.xml` under *Add a new sitemap*.
3. Click **Submit**.
4. Verify *Status*: **Success** (Googlebot reads the XML and schedules URL discovery).

---

## 3. URL INSPECTION CHECKLIST (PRE-LAUNCH & LIVE TESTING)

For each core landing page, execute the **URL Inspection Tool** in Search Console (`Inspect any URL in "https://www.mooearth.live/"`):

### Protocol Steps:
1. **Request Indexing / Test Live URL**:
   - Click **TEST LIVE URL**.
   - Verify: *Page can be indexed* (Green checkmark).
2. **HTTP Response Code**:
   - Header must be `HTTP/2 200 OK`.
3. **Google-Selected Canonical**:
   - Inspect *Page fetch*: Successful.
   - Inspect *User-declared canonical*: Must strictly match `https://www.mooearth.live/<route>`.
   - Inspect *Google-selected canonical*: Must match User-declared canonical.
4. **Mobile Usability**:
   - Inspect *Page is usable on mobile* (Viewport configured: `width=device-width, initial-scale=1`).
5. **Rich Results**:
   - Inspect *Structured data*: Valid BreadcrumbList, WebSite, Organization schemas without errors or warnings.

---

## 4. PRIORITY SEED URLS FOR INITIAL MANUAL INSPECTION & REQUEST

Submit these seed URLs in Search Console immediately after DNS verification:

1. `https://www.mooearth.live/` — Main Interactive 3D World Globe & Real-Time reactions
2. `https://www.mooearth.live/explore` — Global Country Directory & Regional Hub
3. `https://www.mooearth.live/daily` — Daily Earth Challenge (Daily recurring content)
4. `https://www.mooearth.live/games` — Earth Games Hub
5. `https://www.mooearth.live/tournament` — Global Nations Cup Weekly Championship
6. `https://www.mooearth.live/war-room` — Real-Time Situational War Room
7. `https://www.mooearth.live/trending` — Trending Worldwide Locations & Topics
8. `https://www.mooearth.live/news` — World News Category Hub
9. `https://www.mooearth.live/sports` — World Sports Category Hub
10. `https://www.mooearth.live/weather` — Planetary Weather Hub

---

## 5. PRIVATE AREAS CRAWL BLOCK VERIFICATION

Test in Search Console's robots.txt tester to ensure the following paths are blocked from crawling:
- `/admin/` ➔ **Blocked by robots.txt**
- `/api/` ➔ **Blocked by robots.txt**
- `/auth/` ➔ **Blocked by robots.txt**
- `/account/` ➔ **Blocked by robots.txt**
- `/debug/` ➔ **Blocked by robots.txt**
- `/private/` ➔ **Blocked by robots.txt**

---

## 6. COVERAGE REPORT MONITORING (WEEK 1 TO WEEK 4)

| Metric | Target | Action If Anomaly Detected |
| :--- | :--- | :--- |
| **Discovered - currently not indexed** | Temporary (< 14 days) | Google has queued the URL. Increase internal link equity from `/explore` or homepage. |
| **Crawled - currently not indexed** | 0 pages | Check page content thickness; ensure server-rendered text is present. |
| **Page with redirect** | Only legacy URLs | Verify 308 redirects (`/countries` ➔ `/explore`, `/globe` ➔ `/`). Ensure sitemap contains 0 redirects. |
| **Duplicate without user-selected canonical** | 0 pages | Ensure every new page has an explicit self-referential canonical tag. |
| **Soft 404** | 0 pages | Ensure missing parameters return genuine 404 or clean 308 redirect. |
