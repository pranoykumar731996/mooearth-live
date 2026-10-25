<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:anti-regression-safeguards -->
# MANDATORY ANTI-REGRESSION SAFEGUARDS PROTOCOL

> [!CRITICAL]
> **RULE: ANTI-REGRESSION SAFEGUARDS MUST ALWAYS BE IMPLEMENTED AND EXECUTED AFTER EVERY CHANGE.**
> Any bug that was fixed must NEVER repeat, even when adding new features or refactoring.
> Before any task, feature, or bug fix is considered complete or ready for deployment, the agent MUST run and pass the automated regression suites with ZERO failures.

### Mandatory Verification Command
After every code change, run:
```bash
npm run test:regression
```
or run the individual suites:
```bash
npx tsc --noEmit
npx tsx scripts/test-explore-city-suite.ts
npx tsx scripts/test-weather-layers-suite.ts
npx tsx scripts/test-anti-repeat.ts
```

---

### Non-Negotiable Core Invariants (Zero-Regression Guarantees)

1. **Multi-Scale Cloud Progressive Zoom Dissolve (HD Places Protection)**:
   - Regional cloud views (NASA GIBS / Geostationary IR) must maintain full opacity at macro/regional levels (zooms ≤ 8.5 at 84%–88% opacity).
   - Clouds must smoothly dissolve between zooms 9.0 and 11.5.
   - At zoom ≥ 12.0 (city and monument levels like Bhubaneswar at zoom 12.8), cloud opacity **MUST BE STRICTLY 0.00** and `maxzoom: 12` clamped. This prevents tile stretching and ensures 100% crisp, razor-sharp 4K/HD satellite ground imagery of monuments, streets, parks, and buildings without any foggy or milky overlay.
   - Verified by Section 8 of `scripts/test-explore-city-suite.ts`.

2. **Persistent Location Weather Telemetry**:
   - Location weather telemetry (current temperature, wind speed/direction, humidity, pressure, visibility, conditions, marker popups, HUD badges, and the `WeatherPanel`) must reliably display live data across ALL layers (Satellite, Radar, Hurricane, Lightning, Wind).
   - Telemetry must never disappear, fail to load, or flicker when switching modes or exploring cities.
   - Handled safely with fallback models and verified by `scripts/test-weather-layers-suite.ts`.

3. **Geostationary Clouds HUD Dismissal Crossbar & Restore Toggle**:
   - The Geostationary Clouds floating HUD must feature an immediate crossbar (`✕`) dismissal button so users can hide it when viewing the map.
   - The top navigation bar must maintain a restore toggle pill (`🛰️ Clouds [VIS]`) to reopen the HUD at any time without page reload.
   - Verified in `src/components/Map/CityMapViewer.tsx`.

4. **Direct NASA GIBS WMTS & UTC Swath Threshold**:
   - NASA GIBS tiles must point to official direct WMTS endpoints (`wmts.earthdata.nasa.gov`), bypassing unstable third-party proxies.
   - Swath threshold logic (`< 14:00 UTC` fallback to yesterday's complete global swath) must remain intact to prevent blank or missing tile grids.

5. **Zero Question Repetition Invariant**:
   - In quiz/game modes, questions must never repeat within sliding windows.
   - Verified by `scripts/test-anti-repeat.ts`.

6. **Static Type Safety & Data Integrity**:
   - `npx tsc --noEmit` must return 0 errors.
   - No mock/placeholder leaks in production code, verified by `scripts/data-integrity-scanner.js`.
<!-- END:anti-regression-safeguards -->
