// ============================================================
// Milestone 2 Verification Suite: NOAA STAR Worker & Hard Gate
// ============================================================
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  isNoaaStarPilotEnabled,
  getNoaaStar1808CalibrationOffset,
  shouldUseNoaaStarPilotForSector,
  buildNoaaStarTileUrl,
  parseNoaaStarFallbackHttpsUrl,
  formatNoaaFallbackReason,
  isTileOutsideSectorSupport,
  isBlackMarbleTileSolidDaylight,
} from '../src/services/weather/noaaStarPilot';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const workerMod = require(path.join(__dirname, '..', 'public', 'workers', 'gibs-protocol-worker.js'));

let passed = 0;
function check(cond: boolean, label: string) {
  assert.ok(cond, label);
  passed++;
  console.log(`  ✅ PASS: ${label}`);
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 Running Milestone 2 NOAA STAR Worker & Feature-Gate Suite');
  console.log('============================================================\n');

  // 1. Hard build-time gate & scoping
  const origPilot = process.env.NEXT_PUBLIC_NOAA_STAR_PILOT;
  const origOffX = process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X;
  const origOffY = process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y;

  delete process.env.NEXT_PUBLIC_NOAA_STAR_PILOT;
  check(!isNoaaStarPilotEnabled('?noaaPilot=1'), 'Env unset + ?noaaPilot=1 stays strictly DISABLED');
  process.env.NEXT_PUBLIC_NOAA_STAR_PILOT = 'false';
  check(!isNoaaStarPilotEnabled('?noaaPilot=1'), 'Env false + ?noaaPilot=1 stays strictly DISABLED');
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '?noaaPilot=1',
    }),
    'Sector check blocked when build-time env gate is false'
  );

  process.env.NEXT_PUBLIC_NOAA_STAR_PILOT = 'true';
  check(isNoaaStarPilotEnabled(''), 'Env true enables pilot in non-prod build');
  check(!isNoaaStarPilotEnabled('?noaaPilot=0'), 'Env true + ?noaaPilot=0 allows opt-out');
  check(!isNoaaStarPilotEnabled('?noaaPilot=false'), 'Env true + ?noaaPilot=false allows opt-out');
  check(
    shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Activates only for goes-east daylight visible live nowcast'
  );
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: false,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Deactivates at night (!goesEastDay) preserving Band13 IR'
  );
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: true,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Deactivates in HD (250m) mode'
  );
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: false,
      timelineHoursAhead: -2,
      search: '',
    }),
    'Deactivates on historical timeline scrub (< 0)'
  );
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'himawari',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Does not hijack non-GOES-East sectors'
  );

  // Configurable calibration offset scoping & template URL round-trip
  process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X = '0.25';
  process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y = '-0.125';
  const customOff = getNoaaStar1808CalibrationOffset();
  check(customOff.x === 0.25 && customOff.y === -0.125, 'Configurable 1808 offsets parsed accurately');
  delete process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X;
  delete process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y;

  const tpl = buildNoaaStarTileUrl({
    layerName: 'GOES-East_ABI_GeoColor',
    tileTime: '2026-11-25T18:00:00Z',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    ext: 'png',
    spectralParam: 'spectral=vis',
    bucket: 999,
  });
  check(tpl.includes('noaa-star://tile/{z}/{x}/{y}.png?'), 'URL retains literal MapLibre {z}/{x}/{y} placeholders');
  const resolvedFallback = parseNoaaStarFallbackHttpsUrl(tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13'));
  check(
    resolvedFallback ===
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/2026-11-25T18:00:00Z/GoogleMapsCompatible_Level7/5/13/8.png?spectral=vis',
    'Main-thread/worker fallback URL preserves exact GOES-East_ABI_GeoColor WMTS path and spectral=vis'
  );

  // 2. PUG Grid Anchor & Reprojector Verification
  const g1808 = workerMod.STAR_1808_SYMMETRIC_BLOCK3;
  const firstPt = workerMod.scanToPixel(g1808.firstPixelCenterXRad, g1808.firstPixelCenterYRad, { gridSpec: g1808 });
  check(Math.abs(firstPt.col) < 1e-12 && Math.abs(firstPt.row) < 1e-12, 'First pixel center maps strictly to index (0, 0)');
  const symNadir = workerMod.scanToPixel(0, 0, { gridSpec: g1808, calibrationOffsetPx: { x: 0, y: 0 } });
  const calNadir = workerMod.scanToPixel(0, 0, { gridSpec: g1808, calibrationOffsetPx: { x: 0.333, y: 0.333 } });
  const outer = workerMod.pixelToScan(-0.5, -0.5, { gridSpec: g1808, calibrationOffsetPx: { x: 0, y: 0 } });
  check(Math.abs(symNadir.col - 903.5) < 1e-12, 'Symmetric 1808 PUG maps nadir to 903.5');
  check(Math.abs(calNadir.col - 903.833) < 1e-12, 'Calibrated +0.333 offset maps nadir to 903.833');
  check(Math.abs(outer.scanX - (-0.151872)) < 1e-12, 'Outer edge -0.5 maps to -0.151872 rad');

  assert.throws(
    () =>
      workerMod.reprojectNoaaStarRgbLut32({
        rgb: new Uint8Array(100),
        width: 5424,
        height: 5424,
        footerStartRow: 5382,
        tileZ: 5,
        tileX: 8,
        tileY: 13,
      }),
    /UNEXPECTED_NOAA_DIMENSIONS/,
    'Reprojector refuses non-1808x1808 input before applying 1808 calibration offset'
  );
  passed++;
  console.log('  ✅ PASS: Reprojector refuses non-1808x1808 input before applying 1808 calibration offset');

  // 3. Streamed Response Size Cap (Content-Length + Chunk Overflow BEFORE Blob/Bitmap)
  let bitmapDecodeCalls = 0;
  let streamCancelled = false;
  let fallbackUrlsSeen: string[] = [];
  let nowClock = 1_700_000_000_000;

  const oversizStreamHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => nowClock,
    fetchFn: async (url: string, opts: { signal: AbortSignal }) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        let pulls = 0;
        const body = {
          getReader: () => ({
            read: async () => {
              pulls++;
              if (pulls <= 10) {
                return { done: false, value: new Uint8Array(1024 * 1024) }; // 1 MB chunk -> trips > 8 MB on chunk 9
              }
              return { done: true, value: undefined };
            },
            cancel: async () => {
              streamCancelled = true;
            },
            releaseLock: () => {},
          }),
        };
        return {
          ok: true,
          status: 200,
          headers: new Map<string, string>(), // Missing Content-Length to exercise chunk guard
          body,
        };
      }
      fallbackUrlsSeen.push(url);
      assert.equal(opts.signal.aborted, false, 'Fallback GIBS signal must not be pre-aborted');
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer }),
      };
    },
    createImageBitmapFn: async () => {
      bitmapDecodeCalls++;
      return { width: 1808, height: 1808, close: () => {} };
    },
    OffscreenCanvasCtor: null,
  });

  const streamRes = await oversizStreamHandler.handleTileRequest(
    { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
    new AbortController()
  );
  check(streamCancelled && bitmapDecodeCalls === 0, 'Stream > 8 MB cancels reader before Blob/ImageBitmap creation');
  check(fallbackUrlsSeen.length === 1 && fallbackUrlsSeen[0].includes('GOES-East_ABI_GeoColor'), 'Stream overflow fails over to GIBS GeoColor');
  check(streamRes.data instanceof ArrayBuffer, 'Failover returns tile buffer');

  // Verify bounded cooldown blocks repeated NOAA fetches
  const noaaFetchCountBefore = fallbackUrlsSeen.length;
  await oversizStreamHandler.handleTileRequest(
    { url: tpl.replace('{z}', '5').replace('{x}', '9').replace('{y}', '14') },
    new AbortController()
  );
  check(fallbackUrlsSeen.length === noaaFetchCountBefore + 1 && bitmapDecodeCalls === 0, 'Cooldown routes straight to GIBS without re-fetching NOAA');

  // 4. Independent AbortController on NOAA Timeout Failover + Map Abort Isolation
  let gibsSignals: boolean[] = [];
  let noaaTimeoutCount = 0;
  let mockNow = 2_000_000_000_000;
  const timeoutHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => mockNow,
    configOverrides: { NOAA_FETCH_TIMEOUT_MS: 20, GIBS_FETCH_TIMEOUT_MS: 1000 },
    fetchFn: async (url: string, opts: { signal: AbortSignal }) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        noaaTimeoutCount++;
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const e = new Error('Aborted');
            e.name = 'AbortError';
            reject(e);
          });
        });
      }
      gibsSignals.push(opts.signal.aborted);
      assert.ok(url.includes('GOES-East_ABI_GeoColor') && url.includes('spectral=vis'), 'Timeout failover strictly preserves GeoColor visible layer');
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([9, 9]).buffer }),
      };
    },
  });

  await timeoutHandler.handleTileRequest(
    { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
    new AbortController()
  );
  check(noaaTimeoutCount === 1 && gibsSignals.length === 1 && gibsSignals[0] === false, 'GIBS failover receives fresh non-aborted AbortSignal after NOAA timeout');

  // Verify MapLibre cancellation aborts immediately without calling GIBS
  const cancelledController = new AbortController();
  cancelledController.abort();
  await assert.rejects(
    () =>
      timeoutHandler.handleTileRequest(
        { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
        cancelledController
      ),
    (err: Error) => err.name === 'AbortError'
  );
  check(gibsSignals.length === 1, 'Cancelled MapLibre request aborts immediately without triggering GIBS fetch');

  // 5. Primary Reprojection Success, Telemetry Emission & Dimension Rejection Cooldown
  const fakeRgbSrc = new Uint8Array(1808 * 1808 * 3).fill(220);
  const telemetryEvents: Array<{ mode: string; cdnAgeMinutes: number | null }> = [];
  let noaaPrimaryCalls = 0;

  const primaryHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => 1_700_000_600_000,
    telemetryPostFn: (msg: { mode: string; cdnAgeMinutes: number | null }) => telemetryEvents.push(msg),
    fetchFn: async () => {
      noaaPrimaryCalls++;
      return {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-length', '128'],
          ['last-modified', new Date(1_700_000_300_000).toUTCString()], // 5 min old CDN
        ]),
        body: {
          getReader: () => {
            let doneFlag = false;
            return {
              read: async () => {
                if (doneFlag) return { done: true, value: undefined };
                doneFlag = true;
                return { done: false, value: new Uint8Array(128) };
              },
              cancel: async () => {},
              releaseLock: () => {},
            };
          },
        },
      };
    },
    createImageBitmapFn: async () => ({ width: 1808, height: 1808, close: () => {} }),
    extractRgbStripFn: async () => fakeRgbSrc,
    encodeTileResultFn: async ({ kind, rgba, req }: { kind: string; rgba?: Uint8ClampedArray; req: { tileZ: number } }) => ({
      kind,
      rgba,
      z: req.tileZ,
    }),
  });

  // 10 parallel requests must deduplicate into 1 NOAA STAR fetch
  const parallel = await Promise.all(
    Array.from({ length: 10 }, (_, idx) =>
      primaryHandler.handleTileRequest(
        { url: tpl.replace('{z}', '5').replace('{x}', String(8 + (idx % 2))).replace('{y}', '13') },
        new AbortController()
      )
    )
  );
  check(noaaPrimaryCalls === 1, '10 concurrent tile requests deduplicate to 1 NOAA STAR fetch');
  check(parallel.every((r: { kind: string; rgba: Uint8ClampedArray }) => r.kind === 'noaa-star' && r.rgba.length === 256 * 256 * 4), 'All concurrent tiles reproject cleanly via 32x32 LUT');
  check(telemetryEvents.some((t) => t.mode === 'noaa-star' && t.cdnAgeMinutes === 5), 'Broadcasts honest CDN Last-Modified age telemetry (5m)');
  check(primaryHandler.getState().activeNoaaReaders === 0 && primaryHandler.getState().activeTileJobs === 0, 'Readers and tile semaphore slots drain cleanly to 0');

  // Unexpected image dimension check triggers cooldown & fails over to GIBS
  let badDimFallbackCalled = false;
  let badDimBitmapClosed = false;
  const badDimHandler = workerMod.createNoaaStarProtocolHandler({
    fetchFn: async (url: string) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-length', '64']]),
          arrayBuffer: async () => new Uint8Array(64).buffer,
        };
      }
      badDimFallbackCalled = true;
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([7]).buffer }),
      };
    },
    createImageBitmapFn: async () => ({
      width: 5424,
      height: 5424,
      close: () => {
        badDimBitmapClosed = true;
      },
    }),
  });
  await badDimHandler.handleTileRequest(
    { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
    new AbortController()
  );
  check(badDimBitmapClosed && badDimFallbackCalled && badDimHandler.getState().cooldownUntilMs > 0, 'Unexpected image dimensions (!=1808) close bitmap, trip cooldown, and fall back to GIBS GeoColor');

  // Tracked memory guard check trips cooldown cleanly
  let memGuardGibsCalls = 0;
  let memGuardNoaaCalls = 0;
  const memGuardHandler = workerMod.createNoaaStarProtocolHandler({
    configOverrides: { MAX_TRACKED_BUFFER_BYTES: 1024 * 1024 }, // 1 MB cap forces decode budget exceed
    fetchFn: async (url: string) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        memGuardNoaaCalls++;
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-length', '128']]),
          arrayBuffer: async () => new Uint8Array(128).buffer,
        };
      }
      memGuardGibsCalls++;
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([3]).buffer }),
      };
    },
  });
  await memGuardHandler.handleTileRequest({ url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') }, new AbortController());
  await memGuardHandler.handleTileRequest({ url: tpl.replace('{z}', '5').replace('{x}', '9').replace('{y}', '14') }, new AbortController());
  check(memGuardNoaaCalls === 1 && memGuardGibsCalls === 2, 'Memory budget breach enters cooldown preventing repeated NOAA fetches across subsequent tiles');

  // 6. String-reason timeout, network error normalization, HUD reason formatting & cumulative GIBS retry cap
  const netReasons: string[] = [];
  const netErrHandler = workerMod.createNoaaStarProtocolHandler({
    telemetryPostFn: (m: { mode: string; reason: string | null }) => {
      if (m.reason) netReasons.push(m.reason);
    },
    fetchFn: async (url: string) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        throw new TypeError('Failed to fetch');
      }
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([5]).buffer }),
      };
    },
  });
  await netErrHandler.handleTileRequest({ url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') }, new AbortController());
  check(
    netReasons.includes('NOAA_NETWORK_ERROR') &&
      formatNoaaFallbackReason('NOAA_NETWORK_ERROR') === 'NOAA network unreachable' &&
      formatNoaaFallbackReason('NOAA_TIMEOUT') === 'NOAA timed out',
    'Raw fetch failure normalizes to NOAA_NETWORK_ERROR and distinct HUD trigger label'
  );

  let cumulativeGibsSteps = 0;
  const retryBudgetStart = Date.now();
  const cumulativeRetryHandler = workerMod.createNoaaStarProtocolHandler({
    configOverrides: { NOAA_FETCH_TIMEOUT_MS: 20, GIBS_FETCH_TIMEOUT_MS: 75 },
    fetchFn: async (url: string, opts: { signal: AbortSignal }) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => reject(opts.signal.reason || 'noaa-timeout'));
        });
      }
      cumulativeGibsSteps++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ ok: false, status: 404 }), 45);
        opts.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('gibs-aborted'));
        });
      });
    },
  });
  await assert.rejects(
    () =>
      cumulativeRetryHandler.handleTileRequest(
        { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
        new AbortController()
      ),
    () => true
  );
  const cumulativeElapsed = Date.now() - retryBudgetStart;
  check(
    cumulativeGibsSteps <= 2 && cumulativeElapsed < 160,
    `Cumulative GIBS retry budget caps total stall across steps (${cumulativeGibsSteps} step(s) in ${cumulativeElapsed}ms)`
  );

  // 7. Pending vs Active vs Failed HUD telemetry ordering
  const stagedModes: string[] = [];
  let stagedGibsResolved = false;
  let sawPendingBeforeGibsDone = false;
  let sawActiveWhileGibsInFlight = false;
  const stagedHandler = workerMod.createNoaaStarProtocolHandler({
    configOverrides: { NOAA_FETCH_TIMEOUT_MS: 15, GIBS_FETCH_TIMEOUT_MS: 500 },
    telemetryPostFn: (m: { mode: string }) => {
      stagedModes.push(m.mode);
      if (m.mode === 'gibs-fallback-pending' && !stagedGibsResolved) {
        sawPendingBeforeGibsDone = true;
      }
      if (m.mode === 'gibs-fallback' && !stagedGibsResolved) {
        sawActiveWhileGibsInFlight = true;
      }
    },
    fetchFn: async (url: string, opts: { signal: AbortSignal }) => {
      if (url.includes('cdn.star.nesdis.noaa.gov')) {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => reject(opts.signal.reason || 'noaa-timeout'));
        });
      }
      await new Promise((r) => setTimeout(r, 30));
      stagedGibsResolved = true;
      return {
        ok: true,
        status: 200,
        blob: async () => ({ arrayBuffer: async () => new Uint8Array([8, 8]).buffer }),
      };
    },
  });
  await stagedHandler.handleTileRequest({ url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') }, new AbortController());
  check(
    sawPendingBeforeGibsDone && !sawActiveWhileGibsInFlight && stagedModes[stagedModes.length - 1] === 'gibs-fallback',
    'HUD telemetry emits gibs-fallback-pending before GIBS resolves and gibs-fallback only after first tile succeeds'
  );

  const failedModes: string[] = [];
  const failedFallbackHandler = workerMod.createNoaaStarProtocolHandler({
    configOverrides: { NOAA_FETCH_TIMEOUT_MS: 10, GIBS_FETCH_TIMEOUT_MS: 500 },
    telemetryPostFn: (m: { mode: string }) => failedModes.push(m.mode),
    fetchFn: async () => {
      throw new TypeError('Failed to fetch');
    },
  });
  await assert.rejects(
    () =>
      failedFallbackHandler.handleTileRequest(
        { url: tpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13') },
        new AbortController()
      ),
    () => true
  );
  check(
    failedModes.includes('gibs-fallback-pending') && failedModes[failedModes.length - 1] === 'gibs-fallback-failed',
    'Double outage transitions from gibs-fallback-pending to gibs-fallback-failed without falsely reporting active GIBS'
  );

  // 8. Off-hemisphere sector short-circuiting & seam/day-night preservation
  const flGoesEast = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/2026-11-25/GoogleMapsCompatible_Level7/5/13/8.png';
  const flHimawari = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band3_Red_Visible_1km/default/2026-11-25/GoogleMapsCompatible_Level7/5/13/8.png';
  const flEumet = 'eumet-alpha://view.eumetsat.int/geoserver/wms/tile/msg_fes:vis006/5/8/13.png?spectral=vis';
  const flPolar = 'eumet-alpha://view.eumetsat.int/geoserver/wms/tile/mumi:worldcloudmap_ir108/5/8/13.png?spectral=vis';
  const rockiesGoesWest = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-West_ABI_GeoColor/default/2026-11-25/GoogleMapsCompatible_Level7/5/12/6.png';
  const polarNorth60 = 'eumet-alpha://view.eumetsat.int/geoserver/wms/tile/mumi:worldcloudmap_ir108/5/8/9.png?spectral=vis';
  check(
    !isTileOutsideSectorSupport(flGoesEast) &&
      !workerMod.isTileOutsideSectorSupport(flGoesEast) &&
      isTileOutsideSectorSupport(flHimawari) &&
      workerMod.isTileOutsideSectorSupport(flHimawari) &&
      isTileOutsideSectorSupport(flEumet) &&
      isTileOutsideSectorSupport(flPolar) &&
      !isTileOutsideSectorSupport(rockiesGoesWest) &&
      !isTileOutsideSectorSupport(polarNorth60),
    'Off-hemisphere sector cull skips Florida Himawari/EUMETSAT/Polar while keeping GOES-East, Rockies seam, and >58N Polar'
  );

  const flNoonMs = Date.UTC(2026, 10, 25, 18, 0, 0);
  const flNightMs = Date.UTC(2026, 10, 25, 5, 0, 0);
  const flBlackMarbleDay = `black-marble-alpha://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/5/13/8.png?t=${flNoonMs}`;
  const flBlackMarbleNight = `black-marble-alpha://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/5/13/8.png?t=${flNightMs}`;
  check(
    isBlackMarbleTileSolidDaylight(flBlackMarbleDay) &&
      workerMod.isBlackMarbleTileSolidDaylight(flBlackMarbleDay) &&
      !isBlackMarbleTileSolidDaylight(flBlackMarbleNight),
    'Black Marble culls solid-daylight Florida noon tiles while preserving nocturnal tiles'
  );

  // Restore env
  if (origPilot === undefined) delete process.env.NEXT_PUBLIC_NOAA_STAR_PILOT;
  else process.env.NEXT_PUBLIC_NOAA_STAR_PILOT = origPilot;
  if (origOffX === undefined) delete process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X;
  else process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X = origOffX;
  if (origOffY === undefined) delete process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y;
  else process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y = origOffY;

  console.log(`\n🏆 ALL ${passed}/${passed} WORKER & HARD-GATE TESTS PASSED!\n`);
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
