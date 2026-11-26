// ============================================================
// Milestone 2 Verification Suite: NOAA STAR Worker & Hard Gate
// ============================================================
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  isNoaaStarPilotEnabled,
  isSatHiResExperimentEnabled,
  isSatSoftCloudExperimentEnabled,
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
    'Activates for goes-east daylight visible live nowcast'
  );
  check(
    shouldUseNoaaStarPilotForSector({
      sectorId: 'goes-east',
      isVisibleMode: true,
      goesEastDay: false,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Remains active 24/7 at night (GeoColor Night + Band13 IR fallback)'
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
    ['goes-east', 'goes-west', 'himawari', 'eumet-iodc', 'europe-africa'].every((sid) =>
      shouldUseNoaaStarPilotForSector({
        sectorId: sid,
        spectralMode: 'visible',
        isVisibleMode: true,
        goesEastDay: true,
        isHdMode: false,
        timelineHoursAhead: 0,
        search: '',
      })
    ) &&
      shouldUseNoaaStarPilotForSector({
        sectorId: 'himawari',
        spectralMode: 'blue',
        isVisibleMode: false,
        goesEastDay: false,
        isHdMode: false,
        timelineHoursAhead: 0,
        search: '',
      }) &&
      shouldUseNoaaStarPilotForSector({
        sectorId: 'europe-africa',
        spectralMode: 'infra',
        isVisibleMode: false,
        goesEastDay: false,
        isHdMode: false,
        timelineHoursAhead: 0,
        search: '',
      }),
    'Activates all 5 geostationary sectors across Visible, Blue, and Infra modes'
  );
  check(
    !shouldUseNoaaStarPilotForSector({
      sectorId: 'global-polar',
      spectralMode: 'visible',
      isVisibleMode: true,
      goesEastDay: true,
      isHdMode: false,
      timelineHoursAhead: 0,
      search: '',
    }),
    'Does not hijack non-geostationary global-polar sector'
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
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/2026-11-25T18:00:00Z/GoogleMapsCompatible_Level7/5/13/8.png?spectral=vis&sector=goes-east',
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

  // 9. Milestone 3 Global 5-Satellite Geometries, Day/Night Pixel Transfer, & LRU/Sector Isolation
  const sectorSpecs = workerMod.NOAA_GLOBAL_SECTORS;
  const himSpec = sectorSpecs['himawari:vis'];
  const hNadirScan = workerMod.geodeticToGeoScan(0, himSpec.lon0Deg, himSpec);
  const hNadirPx = workerMod.scanToPixel(hNadirScan.scanX, hNadirScan.scanY, { gridSpec: himSpec });
  check(
    Math.abs(hNadirPx.col - 687.5) < 1e-6 && Math.abs(hNadirPx.row - 686.5) < 1e-6,
    'Himawari nadir maps accurately to verified calibrated center (687.5, 686.5)'
  );

  const m9Spec = sectorSpecs['eumet-iodc:vis'];
  const m9Scan = workerMod.geodeticToGeoScan(0, m9Spec.lon0Deg, m9Spec);
  const m9Px = workerMod.scanToPixel(m9Scan.scanX, m9Scan.scanY, { gridSpec: m9Spec });
  check(
    Math.abs(m9Px.col - 463.5) < 1e-6 && Math.abs(m9Px.row - 463.5) < 1e-6,
    'Meteosat-9 nadir maps accurately to (463.5, 463.5)'
  );

  const goesIrSpec = sectorSpecs['goes-east:ir'];
  const gIrScan = workerMod.geodeticToGeoScan(0, goesIrSpec.lon0Deg, goesIrSpec);
  const gIrPx = workerMod.scanToPixel(gIrScan.scanX, gIrScan.scanY, { gridSpec: goesIrSpec });
  check(
    Math.abs(gIrPx.col - 677.25) < 1e-6 && Math.abs(gIrPx.row - 677.25) < 1e-6,
    'GOES-19 Band 13 (1356x1356) nadir maps accurately to calibrated (677.25, 677.25)'
  );

  // Verify CIRA URL routing + EUMETSAT fallback routing + per-sector spatial culling
  const himNoaaTpl = buildNoaaStarTileUrl({
    sectorId: 'himawari',
    layerName: 'Himawari_AHI_Band3_Red_Visible_1km',
    tileTime: '2026-11-25T04:00:00Z',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    ext: 'png',
    spectralParam: 'spectral=vis',
    bucket: 999,
  });
  const tokyoTile = himNoaaTpl.replace('{z}', '5').replace('{x}', '28').replace('{y}', '12');
  const floridaOnHim = himNoaaTpl.replace('{z}', '5').replace('{x}', '8').replace('{y}', '13');
  check(
    !isTileOutsideSectorSupport(tokyoTile) &&
      !workerMod.isTileOutsideSectorSupport(tokyoTile) &&
      isTileOutsideSectorSupport(floridaOnHim) &&
      workerMod.isTileOutsideSectorSupport(floridaOnHim),
    'noaa-star:// URL respects sector=himawari bounds (keeps Tokyo, culls Florida)'
  );

  const eumetNoaaTpl = buildNoaaStarTileUrl({
    sectorId: 'europe-africa',
    layerName: 'msg_fes:vis006',
    tileTime: '2026-11-25T12:00:00Z',
    tileMatrixSet: 'EPSG:3857',
    ext: 'png',
    spectralParam: 'spectral=vis',
    bucket: 999,
  });
  const parsedEumetFb = parseNoaaStarFallbackHttpsUrl(eumetNoaaTpl.replace('{z}', '4').replace('{x}', '8').replace('{y}', '6'));
  check(
    Boolean(parsedEumetFb && parsedEumetFb.startsWith('/api/weather/satellite/eumet-tile?z=4&x=8&y=6')),
    'Meteosat noaa-star:// URL routes fallbackProto=eumet to Edge eumet-tile proxy'
  );

  // Day/Night GeoColor + Clean IR pixel extraction checks on 16x16 tiles (away from 1px border speckle removal)
  function makeSolid16Tile(r: number, g: number, b: number) {
    const arr = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < arr.length; i += 4) {
      arr[i] = r; arr[i + 1] = g; arr[i + 2] = b; arr[i + 3] = 255;
    }
    return arr;
  }
  const dayUrl = `https://live.mooearth.internal/tile/5/8/13.png?sector=goes-east&spectral=vis&product=GeoColor&t=${flNoonMs}`;
  const nightUrl = `https://live.mooearth.internal/tile/5/8/13.png?sector=goes-east&spectral=vis&product=GeoColor&t=${flNightMs}`;
  const irBlueUrl = `https://live.mooearth.internal/tile/5/8/13.png?sector=goes-east&spectral=blue&product=Band13&t=${flNightMs}`;

  const centerAlpha = (buf: Uint8ClampedArray) => buf[(8 * 16 + 8) * 4 + 3];
  const dayCloud = makeSolid16Tile(215, 215, 215);
  const dayOcean = makeSolid16Tile(18, 52, 118);
  const daySand = makeSolid16Tile(205, 175, 130);
  workerMod.processTilePixels(dayCloud, 16, 16, dayUrl);
  workerMod.processTilePixels(dayOcean, 16, 16, dayUrl);
  workerMod.processTilePixels(daySand, 16, 16, dayUrl);
  check(
    centerAlpha(dayCloud) > 150 && centerAlpha(dayOcean) === 0 && centerAlpha(daySand) === 0,
    'GeoColor daytime keeps clouds while stripping ocean & Sahara sand'
  );

  const nightLowStratus = makeSolid16Tile(65, 108, 148);
  const nightCityLight = makeSolid16Tile(212, 152, 62);
  const nightPurpleLand = makeSolid16Tile(76, 60, 96);
  workerMod.processTilePixels(nightLowStratus, 16, 16, nightUrl);
  workerMod.processTilePixels(nightCityLight, 16, 16, nightUrl);
  workerMod.processTilePixels(nightPurpleLand, 16, 16, nightUrl);
  check(
    centerAlpha(nightLowStratus) > 40 && centerAlpha(nightCityLight) === 0 && centerAlpha(nightPurpleLand) === 0,
    'GeoColor nighttime preserves cyan-blue low stratus while stripping golden city lights & dark purple clear land'
  );

  const irClearNightLand = makeSolid16Tile(90, 90, 90);
  const irWarmCloud = makeSolid16Tile(124, 124, 124);
  workerMod.processTilePixels(irClearNightLand, 16, 16, irBlueUrl);
  workerMod.processTilePixels(irWarmCloud, 16, 16, irBlueUrl);
  check(
    centerAlpha(irClearNightLand) === 0 && centerAlpha(irWarmCloud) > 50,
    'Clean IR suppresses clear night land (~90) while keeping low/mid cloud decks (~124)'
  );

  // Verify CIRA 2x2 fetch + LRU sector eviction + isolated sector cooldowns
  let lruNowMs = 5_000_000;
  const mockLruHandler = workerMod.createNoaaStarProtocolHandler({
    fetchFn: async (u: string) => {
      if (u.includes('sat=goes-18')) {
        return { ok: false, status: 503, headers: { get: () => null }, body: null };
      }
      if (u.includes('action=meta')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ latestTs: '20261125210000', observedIso: '2026-11-25T21:00:00Z' }),
        };
      }
      if (u.includes('gibs.earthdata.nasa.gov')) {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => null },
          blob: async () => ({ arrayBuffer: async () => new Uint8Array([9, 8, 7]).buffer }),
        };
      }
      const bytes = new Uint8Array([1, 2, 3, 4]);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'Wed, 25 Nov 2026 21:00:00 GMT' },
        arrayBuffer: async () => bytes.buffer,
      };
    },
    createImageBitmapFn: async () => ({ width: 464, height: 464, close() {} }),
    extractRgbStripFn: async (bmp: { width: number; height: number }) =>
      new Uint8Array(bmp.width * bmp.height * 3).fill(190),
    nowFn: () => {
      lruNowMs += 10;
      return lruNowMs;
    },
    configOverrides: {
      // 5 MiB fits one 928x928 peak (3.51 MiB) cleanly, forcing LRU eviction when a second sector loads (5.98 MiB combined)
      MAX_TRACKED_BUFFER_BYTES: 5 * 1024 * 1024,
      STRIP_HEIGHT: 64,
    },
  });

  await mockLruHandler.handleTileRequest(
    { url: 'noaa-star://tile/4/8/6.png?sector=europe-africa&spectral=infra' },
    new AbortController()
  );
  await mockLruHandler.handleTileRequest(
    { url: 'noaa-star://tile/4/10/7.png?sector=eumet-iodc&spectral=infra' },
    new AbortController()
  );
  const stAfterTwo = mockLruHandler.getState();
  check(
    !stAfterTwo.sectors['europe-africa:ir'].hasRgb && stAfterTwo.sectors['eumet-iodc:ir'].hasRgb,
    'LRU pool evicts older idle sector buffer cleanly to stay under tracked memory budget'
  );

  // Fault on goes-18 CIRA IR should trip cooldown ONLY on goes-west:ir without touching eumet-iodc:ir
  const goesWestFb = await mockLruHandler.handleTileRequest(
    { url: 'noaa-star://tile/4/2/6.png?sector=goes-west&spectral=infra&fallbackLayer=GOES-West_ABI_Band13_Clean_Infrared' },
    new AbortController()
  );
  const stAfterFault = mockLruHandler.getState();
  check(
    goesWestFb.data instanceof ArrayBuffer &&
      stAfterFault.sectors['goes-west:ir'].cooldownUntilMs > lruNowMs &&
      stAfterFault.sectors['eumet-iodc:ir'].cooldownUntilMs === 0,
    'Outage trips cooldown only on failing sector while healthy sectors continue serving live data'
  );

  // 10. Day-GeoColor + Night-IR 24/7 blender (nightIr=1 fetches CIRA Band09/13 cleanly at night)
  const nightBlendUrls: string[] = [];
  let nightClkMs = Date.UTC(2026, 10, 25, 22, 0, 0); // 03:30 AM IST over Sri Lanka/India (night!)
  const nightHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => nightClkMs,
    fetchFn: async (u: string) => {
      nightBlendUrls.push(u);
      if (u.includes('action=meta')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ latestTs: '20261125215000', observedIso: '2026-11-25T21:50:00Z' }),
        };
      }
      const bytes = new Uint8Array([1, 2, 3, 4]);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'Wed, 25 Nov 2026 21:55:00 GMT' },
        arrayBuffer: async () => bytes.buffer,
      };
    },
    createImageBitmapFn: async (blobOrBytes: { type?: string }) => {
      if (blobOrBytes && blobOrBytes.type === 'image/jpeg') {
        return { width: 1808, height: 1808, close() {} };
      }
      return { width: 464, height: 464, close() {} };
    },
    extractRgbStripFn: async (bmp: { width: number; height: number }) =>
      new Uint8Array(bmp.width * bmp.height * 3).fill(145),
    processTilePixelsFn: (rgba: Uint8ClampedArray, w: number, h: number, u: string) =>
      workerMod.processTilePixels(rgba, w, h, u),
  });

  // Sri Lanka tile z=4, x=11, y=7 (~67.5E..90E, 0..21.9N) -> 100% night at 22:00 UTC -> uses Band09 IR!
  const sriLankaVisUrl = buildNoaaStarTileUrl({
    sectorId: 'eumet-iodc',
    enableNightIr: true,
    layerName: 'msg_iodc:ir108',
    tileTime: '2026-11-25T22:00:00Z',
    tileMatrixSet: 'EPSG:3857',
    ext: 'png',
    spectralParam: 'spectral=vis',
    bucket: 999,
  });
  check(sriLankaVisUrl.includes('nightIr=1'), 'Visible mode URL carries nightIr=1 for 24/7 Day-Optical + Night-IR compositing');
  const nightRes = await nightHandler.handleTileRequest(
    { url: sriLankaVisUrl.replace('{z}', '4').replace('{x}', '11').replace('{y}', '7') },
    new AbortController()
  );
  const nightRgba = new Uint8ClampedArray(nightRes.data);
  const midIdx = (128 * 256 + 128) * 4;
  check(
    nightBlendUrls.some((u) => u.includes('sat=meteosat-9&product=band_09')) &&
      !nightBlendUrls.some((u) => u.includes('product=geocolor')) &&
      nightRgba[midIdx] >= 210 &&
      nightRgba[midIdx + 3] > 120,
    'Nighttime visible tile with nightIr=1 routes cleanly to CIRA Band09 IR and outputs luminous white clouds'
  );

  // 11. Independent Flagged Clarity Experiments (satHiRes + satSoftCloud), Bounded CIRA Intersections & Overview Fallback
  const origHiRes = process.env.NEXT_PUBLIC_SAT_HIRES_PILOT;
  const origSoftCloud = process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT;
  delete process.env.NEXT_PUBLIC_SAT_HIRES_PILOT;
  delete process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT;
  check(
    !isSatHiResExperimentEnabled('?satHiRes=1') && !isSatSoftCloudExperimentEnabled('?satSoftCloud=1'),
    'Hi-res and soft-cloud experiments stay strictly OFF in production without build-time env flags'
  );
  process.env.NEXT_PUBLIC_SAT_HIRES_PILOT = 'true';
  process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT = 'true';
  check(
    !isSatHiResExperimentEnabled('') &&
      !isSatSoftCloudExperimentEnabled('') &&
      isSatHiResExperimentEnabled('?satHiRes=1') &&
      !isSatSoftCloudExperimentEnabled('?satHiRes=1') &&
      !isSatHiResExperimentEnabled('?satSoftCloud=1') &&
      isSatSoftCloudExperimentEnabled('?satSoftCloud=1'),
    'Hi-res (?satHiRes=1) and soft-cloud (?satSoftCloud=1) flags toggle strictly independently'
  );

  // Verify CIRA per-product adaptive zoom caps and intersection bounds
  const m9VisSpec = workerMod.getGlobalSectorSpec('eumet-iodc', 'vis');
  const g19VisSpec = workerMod.getGlobalSectorSpec('goes-east', 'vis');
  const g19IrSpec = workerMod.getGlobalSectorSpec('goes-east', 'ir');
  check(
    workerMod.getAdaptiveCiraZoomLevel(g19VisSpec, 3) === 1 &&
      workerMod.getAdaptiveCiraZoomLevel(g19VisSpec, 4) === 2 &&
      workerMod.getAdaptiveCiraZoomLevel(g19VisSpec, 6) === 3 &&
      workerMod.getAdaptiveCiraZoomLevel(g19VisSpec, 7) === 4 &&
      workerMod.getAdaptiveCiraZoomLevel(m9VisSpec, 7) === 3 &&
      workerMod.getAdaptiveCiraZoomLevel(g19IrSpec, 7) === 3,
    'Adaptive CIRA zoom levels obey strict per-(sector, product) ceilings (z3 max for Meteosat/IR, z4 for GOES/Himawari GeoColor)'
  );
  const g19InterZ6 = workerMod.getIntersectingCiraTilesForSlippyTile(g19VisSpec, 3, 6, 19, 27, 1, 256);
  const m9InterZ6 = workerMod.getIntersectingCiraTilesForSlippyTile(m9VisSpec, 3, 6, 43, 33, 1, 256);
  check(
    g19InterZ6.rcList.length >= 1 &&
      g19InterZ6.rcList.length <= 4 &&
      m9InterZ6.rcList.length >= 1 &&
      m9InterZ6.rcList.length <= 4,
    `CIRA adaptive z03 subsets for 6/19/27 (${g19InterZ6.rcList.length}) and 6/43/33 (${m9InterZ6.rcList.length}) stay strictly bounded (<=4 tiles)`
  );

  // Verify hiRes=1 CIRA z03 deduplication + same-provider CIRA z01 overview fallback on upstream hi-res 404 (no NOAA 1808 seam or GIBS failover!)
  const hrFetchUrls: string[] = [];
  let failHiRes = false;
  const hiResHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => 1_700_000_000_000,
    fetchFn: async (u: string) => {
      hrFetchUrls.push(u);
      if (u.includes('cdn.star.nesdis.noaa.gov')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'Wed, 25 Nov 2026 15:30:00 GMT' },
          arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
        };
      }
      if (u.includes('action=meta')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ latestTs: '20261126153020', observedIso: '2026-11-26T15:30:20Z' }),
        };
      }
      if (u.includes('action=tile')) {
        const isSubZ = /([?&])z=(02|03|04)\b/.test(u);
        if (failHiRes && isSubZ) {
          return { ok: false, status: 404, headers: { get: () => null } };
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          arrayBuffer: async () => new Uint8Array([5, 6, 7, 8]).buffer,
        };
      }
      throw new Error('Unexpected GIBS call: ' + u);
    },
    createImageBitmapFn: async (target: { type?: string }) =>
      target && target.type === 'image/png'
        ? { width: 678, height: 678, close() {} }
        : { width: 1808, height: 1808, close() {} },
    extractRgbStripFn: async (bmp: { width: number }) =>
      bmp.width === 678
        ? new Uint8Array(678 * 678 * 3).fill(180)
        : new Uint8Array(1808 * 1808 * 3).fill(140),
    processTilePixelsFn: (rgba: Uint8ClampedArray, w: number, h: number, u: string) =>
      workerMod.processTilePixels(rgba, w, h, u),
  });

  const hrUrl6 = buildNoaaStarTileUrl({
    sectorId: 'goes-east',
    hiResExperiment: true,
    softCloudExperiment: true,
    layerName: 'GOES-East_ABI_GeoColor',
    tileTime: '2026-11-26T15:30:00Z',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    ext: 'png',
    spectralParam: 'spectral=vis',
    bucket: 1000,
  });
  check(hrUrl6.includes('hiRes=1') && hrUrl6.includes('softCloud=1'), 'URL builder attaches independent hiRes=1 and softCloud=1 parameters when opted in');
  const hrRes1 = await hiResHandler.handleTileRequest(
    { url: hrUrl6.replace('{z}', '6').replace('{x}', '19').replace('{y}', '27') },
    new AbortController()
  );
  const stAfterHr1 = hiResHandler.getState();
  check(
    hrRes1.data instanceof ArrayBuffer &&
      stAfterHr1.hiResFetches === g19InterZ6.rcList.length &&
      stAfterHr1.hiResFallbacks === 0 &&
      stAfterHr1.cooldownUntilMs === 0 &&
      !hrFetchUrls.some((u) => u.includes('cdn.star.nesdis.noaa.gov')),
    `hiRes=1 fetched exact ${g19InterZ6.rcList.length} intersecting CIRA z03 tiles directly without waiting for full-disk 1808 or calling GIBS`
  );
  // Repeating the same slippy tile hits hiResTileCache with 0 new fetches
  await hiResHandler.handleTileRequest(
    { url: hrUrl6.replace('{z}', '6').replace('{x}', '19').replace('{y}', '27') },
    new AbortController()
  );
  const stAfterHr2 = hiResHandler.getState();
  check(
    stAfterHr2.hiResFetches === g19InterZ6.rcList.length && stAfterHr2.hiResCacheHits >= g19InterZ6.rcList.length,
    'hiRes=1 reuses LRU-cached CIRA tiles without repeat /cira requests'
  );
  // Failing a new CIRA tile at z=7 drops cleanly to same-provider CIRA z01 overview without crossing to 1808, tripping cooldown, or calling GIBS
  failHiRes = true;
  const hrFallbackRes = await hiResHandler.handleTileRequest(
    { url: hrUrl6.replace('{z}', '7').replace('{x}', '38').replace('{y}', '55') },
    new AbortController()
  );
  const stAfterFail = hiResHandler.getState();
  check(
    hrFallbackRes.data instanceof ArrayBuffer &&
      stAfterFail.hiResFallbacks >= 1 &&
      stAfterFail.cooldownUntilMs === 0 &&
      !hrFetchUrls.some((u) => u.includes('cdn.star.nesdis.noaa.gov')) &&
      !hrFetchUrls.some((u) => u.includes('gibs.earthdata.nasa.gov')),
    'hiRes tile failure falls back to same-provider CIRA z01 overview without crossing to NOAA 1808, tripping cooldown, or calling GIBS'
  );

  // Verify independent softCloud=1 desert-sand + coastal land-haze rejection & natural luminance preservation
  const testTileCurr = new Uint8ClampedArray(256 * 256 * 4);
  const testTileSoft = new Uint8ClampedArray(256 * 256 * 4);
  // Pixel 0: Pale Arabia desert sand (150, 138, 126);
  // Pixel 1: Cuba coastal forest land haze (75, 88, 88);
  // Pixel 2: Mid storm trough (160, 162, 165);
  // Pixel 3: Thin maritime cumulus (106, 114, 126)
  const seedPixels = (buf: Uint8ClampedArray) => {
    buf[0] = 150; buf[1] = 138; buf[2] = 126; buf[3] = 255;
    buf[4] = 75; buf[5] = 88; buf[6] = 88; buf[7] = 255;
    buf[8] = 160; buf[9] = 162; buf[10] = 165; buf[11] = 255;
    buf[12] = 106; buf[13] = 114; buf[14] = 126; buf[15] = 255;
  };
  seedPixels(testTileCurr);
  seedPixels(testTileSoft);
  workerMod.processTilePixels(testTileCurr, 256, 256, 'https://live.mooearth.internal/tile/6/40/27.png?sector=eumet-iodc&spectral=vis&product=GeoColor&t=1700996400000');
  workerMod.processTilePixels(testTileSoft, 256, 256, 'https://live.mooearth.internal/tile/6/40/27.png?sector=eumet-iodc&spectral=vis&product=GeoColor&softCloud=1&t=1700996400000');
  check(
    testTileCurr[3] > 0 &&
      testTileSoft[3] === 0 &&
      testTileSoft[7] === 0 &&
      testTileCurr[9] >= 224 &&
      testTileSoft[9] < 200 &&
      testTileSoft[15] > 0,
    'softCloud=1 rejects warm desert sand & coastal forest haze while preserving translucent cumulus and storm shading < 224'
  );

  // Verify applySpatialAntiAliasing does NOT overwrite softCloud=1 interior shaded RGB (<200 -> 238) or create a tile-edge seam
  const seamCurr = new Uint8ClampedArray(256 * 256 * 4);
  const seamSoft = new Uint8ClampedArray(256 * 256 * 4);
  for (let i = 0; i < 256 * 256 * 4; i += 4) {
    seamCurr[i] = 158; seamCurr[i + 1] = 160; seamCurr[i + 2] = 164; seamCurr[i + 3] = 255;
    seamSoft[i] = 158; seamSoft[i + 1] = 160; seamSoft[i + 2] = 164; seamSoft[i + 3] = 255;
  }
  // 1701018000000 = 2023-11-26T17:00:00Z (solar noon over Caribbean 6/19/27)
  workerMod.processTilePixels(seamCurr, 256, 256, 'https://live.mooearth.internal/tile/6/19/27.png?sector=goes-east&spectral=vis&product=GeoColor&t=1701018000000');
  workerMod.processTilePixels(seamSoft, 256, 256, 'https://live.mooearth.internal/tile/6/19/27.png?sector=goes-east&spectral=vis&product=GeoColor&softCloud=1&t=1701018000000');
  const edgeR = seamSoft[(10 * 256 + 0) * 4];
  const interiorR = seamSoft[(10 * 256 + 10) * 4];
  check(
    interiorR < 200 && Math.abs(edgeR - interiorR) <= 4 && seamCurr[(10 * 256 + 10) * 4] >= 224,
    `softCloud=1 preserves uniform shaded RGB across tile border (x=0:${edgeR} vs x=10:${interiorR}) with zero 238-clamp box seam`
  );

  // Verify refcounted hiRes abort cancellation & single 502 transient retry
  let retryAttempt = 0;
  let abortedUpstreamSignal = false;
  const retryAbortHandler = workerMod.createNoaaStarProtocolHandler({
    nowFn: () => 1_700_000_000_000,
    fetchFn: async (u: string, init?: { signal?: AbortSignal }) => {
      if (u.includes('action=meta')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ latestTs: '20261126153020', observedIso: '2026-11-26T15:30:20Z' }),
        };
      }
      if (u.includes('action=tile') && u.includes('z=03')) {
        retryAttempt++;
        if (retryAttempt === 1) {
          return { ok: false, status: 502, headers: { get: () => null } };
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          arrayBuffer: async () => new Uint8Array([5, 6, 7, 8]).buffer,
        };
      }
      if (u.includes('action=tile') && u.includes('z=04')) {
        return await new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            abortedUpstreamSignal = true;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }
      throw new Error('Unexpected fetch: ' + u);
    },
    createImageBitmapFn: async () => ({ width: 678, height: 678, close() {} }),
    extractRgbStripFn: async () => new Uint8Array(678 * 678 * 3).fill(180),
  });
  const retryRes = await retryAbortHandler.handleTileRequest(
    { url: hrUrl6.replace('{z}', '6').replace('{x}', '19').replace('{y}', '27') },
    new AbortController()
  );
  check(
    retryRes.data instanceof ArrayBuffer && retryAttempt >= 2 && retryAbortHandler.getState().hiResFallbacks === 0,
    'Transient CIRA 502 triggers fast retry before hiRes fallback'
  );
  const abortCtrl7 = new AbortController();
  const z7Pending = retryAbortHandler.handleTileRequest(
    { url: hrUrl6.replace('{z}', '7').replace('{x}', '38').replace('{y}', '55') },
    abortCtrl7
  );
  setTimeout(() => abortCtrl7.abort(), 20);
  let abortThrew = false;
  try {
    await z7Pending;
  } catch (err) {
    abortThrew = err instanceof Error && err.name === 'AbortError';
  }
  check(abortThrew && abortedUpstreamSignal, 'Cancelling all callers of an in-flight hiRes tile aborts upstream fetch immediately');

  // Restore env
  if (origPilot === undefined) delete process.env.NEXT_PUBLIC_NOAA_STAR_PILOT;
  else process.env.NEXT_PUBLIC_NOAA_STAR_PILOT = origPilot;
  if (origHiRes === undefined) delete process.env.NEXT_PUBLIC_SAT_HIRES_PILOT;
  else process.env.NEXT_PUBLIC_SAT_HIRES_PILOT = origHiRes;
  if (origSoftCloud === undefined) delete process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT;
  else process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT = origSoftCloud;
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
