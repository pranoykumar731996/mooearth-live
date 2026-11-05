import {
  GEOSTATIONARY_SECTORS,
  getGeostationarySectorForCoords,
  isIodcFeatureEnabled,
} from '../src/services/weather/satelliteImageryService';

// Partition of unity implementation with IODC
function getSectorWeights(angle: number, hasIodc: boolean) {
  const normAngle = (((angle % 360) + 360) % 360);
  let wHimawari = 0;
  let wGoesWest = 0;
  let wGoesEast = 0;
  let wEumet = 0;
  let wIodc = 0;

  if (hasIodc) {
    // IODC (45.5°E)
    if (normAngle >= 25.0 && normAngle <= 45.0) {
      wIodc = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 25.0) / 20.0)));
    } else if (normAngle > 45.0 && normAngle <= 75.0) {
      wIodc = 1.0;
    } else if (normAngle > 75.0 && normAngle <= 95.0) {
      wIodc = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 75.0) / 20.0)));
    }

    // Himawari (140.7°E)
    if (normAngle >= 75.0 && normAngle <= 95.0) {
      wHimawari = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 75.0) / 20.0)));
    } else if (normAngle > 95.0 && normAngle <= 165.0) {
      wHimawari = 1.0;
    } else if (normAngle > 165.0 && normAngle <= 195.0) {
      wHimawari = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 165.0) / 30.0)));
    }

    // GOES-West (-135°W = 225°E)
    if (normAngle >= 165.0 && normAngle <= 195.0) {
      wGoesWest = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 165.0) / 30.0)));
    } else if (normAngle > 195.0 && normAngle <= 225.0) {
      wGoesWest = 1.0;
    } else if (normAngle > 225.0 && normAngle <= 265.0) {
      wGoesWest = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 225.0) / 40.0)));
    }

    // GOES-East (-75°W = 285°E)
    if (normAngle >= 225.0 && normAngle <= 265.0) {
      wGoesEast = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 225.0) / 40.0)));
    } else if (normAngle > 265.0 && normAngle <= 320.0) {
      wGoesEast = 1.0;
    } else if (normAngle > 320.0 && normAngle <= 345.0) {
      wGoesEast = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 320.0) / 25.0)));
    }

    // EUMETSAT Prime (0°E)
    if (normAngle >= 320.0 && normAngle <= 345.0) {
      wEumet = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
    } else if (normAngle > 345.0 || normAngle <= 25.0) {
      wEumet = 1.0;
    } else if (normAngle > 25.0 && normAngle <= 45.0) {
      wEumet = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 25.0) / 20.0)));
    }
  } else {
    // Legacy 4-satellite baseline
    if (normAngle >= 60.0 && normAngle <= 75.0) {
      wHimawari = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 60.0) / 15.0)));
    } else if (normAngle > 75.0 && normAngle <= 165.0) {
      wHimawari = 1.0;
    } else if (normAngle > 165.0 && normAngle <= 195.0) {
      wHimawari = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 165.0) / 30.0)));
    }

    if (normAngle >= 165.0 && normAngle <= 195.0) {
      wGoesWest = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 165.0) / 30.0)));
    } else if (normAngle > 195.0 && normAngle <= 225.0) {
      wGoesWest = 1.0;
    } else if (normAngle > 225.0 && normAngle <= 265.0) {
      wGoesWest = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 225.0) / 40.0)));
    }

    if (normAngle >= 225.0 && normAngle <= 265.0) {
      wGoesEast = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 225.0) / 40.0)));
    } else if (normAngle > 265.0 && normAngle <= 320.0) {
      wGoesEast = 1.0;
    } else if (normAngle > 320.0 && normAngle <= 345.0) {
      wGoesEast = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 320.0) / 25.0)));
    }

    if (normAngle >= 320.0 && normAngle <= 345.0) {
      wEumet = 0.5 * (1.0 - Math.cos(Math.PI * ((normAngle - 320.0) / 25.0)));
    } else if (normAngle > 345.0 || normAngle <= 60.0) {
      wEumet = 1.0;
    } else if (normAngle > 60.0 && normAngle <= 75.0) {
      wEumet = 0.5 * (1.0 + Math.cos(Math.PI * ((normAngle - 60.0) / 15.0)));
    }
  }

  const sum = wHimawari + wGoesWest + wGoesEast + wEumet + wIodc;
  return { wHimawari, wGoesWest, wGoesEast, wEumet, wIodc, sum };
}

async function runPrototypeTests() {
  console.log('====================================================');
  console.log('🧪 EUMETSAT IODC PROTOTYPE & PARTITION OF UNITY TEST');
  console.log('====================================================');

  // Test 1: Feature Flag Isolation
  console.log('\n[Test 1] Testing Feature Flag Isolation...');
  process.env.NEXT_PUBLIC_ENABLE_EUMETSAT_IODC = 'false';
  if (isIodcFeatureEnabled()) {
    throw new Error('FAILED: IODC should be disabled when NEXT_PUBLIC_ENABLE_EUMETSAT_IODC is false');
  }
  const defaultSector = getGeostationarySectorForCoords(20.0, 78.0, 'infra');
  console.log('  ✅ Default production fallback for India (78°E):', defaultSector.id, `(${defaultSector.name})`);
  if (!defaultSector.id.includes('himawari')) {
    throw new Error('FAILED: Default production fallback must remain Himawari when IODC is disabled');
  }

  process.env.NEXT_PUBLIC_ENABLE_EUMETSAT_IODC = 'true';
  if (!isIodcFeatureEnabled()) {
    throw new Error('FAILED: IODC should be enabled when NEXT_PUBLIC_ENABLE_EUMETSAT_IODC is true');
  }
  const iodcSector = getGeostationarySectorForCoords(20.0, 78.0, 'infra');
  console.log('  ✅ Enabled IODC prototype for India (78°E):', iodcSector.id, `(${iodcSector.name})`);
  if (!iodcSector.id.includes('iodc')) {
    throw new Error('FAILED: When IODC is enabled, India coordinates must route to IODC');
  }

  // Reset flag
  process.env.NEXT_PUBLIC_ENABLE_EUMETSAT_IODC = 'false';

  // Test 2: Mathematical Partition of Unity (360 degrees check)
  console.log('\n[Test 2] Verifying Mathematical Partition of Unity across 360 Longitudes...');
  let maxDevBaseline = 0;
  let maxDevIodc = 0;

  for (let deg = 0; deg < 360; deg += 0.5) {
    const resBaseline = getSectorWeights(deg, false);
    const devBaseline = Math.abs(resBaseline.sum - 1.0);
    if (devBaseline > maxDevBaseline) maxDevBaseline = devBaseline;

    const resIodc = getSectorWeights(deg, true);
    const devIodc = Math.abs(resIodc.sum - 1.0);
    if (devIodc > maxDevIodc) maxDevIodc = devIodc;

    if (devIodc > 0.0001) {
      throw new Error(`FAILED: Partition of unity violated at longitude ${deg}°: sum = ${resIodc.sum}`);
    }
  }

  console.log(`  ✅ Baseline 4-Satellite Max Weight Deviation: ${maxDevBaseline.toExponential(4)}`);
  console.log(`  ✅ IODC 5-Satellite Max Weight Deviation:     ${maxDevIodc.toExponential(4)} (Strictly 1.0000 Everywhere)`);

  // Test 3: Live EUMETSAT IODC Network Tile Fetch
  console.log('\n[Test 3] Live EUMETSAT IODC Real Imagery Retrieval (EPSG:3857 BBOX query)...');
  // Uzbekistan / Central Asia: tile 5/12/21
  const bbox = '6261721.357121639,3757032.814272983,7514065.628545966,5009377.085697312';
  const visUrl = `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bbox}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=msg_iodc:vis006&FORMAT=image/png`;
  const irUrl = `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bbox}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=msg_iodc:ir108&FORMAT=image/png`;

  console.log('  Fetching IODC Visible (msg_iodc:vis006)...');
  const t0 = performance.now();
  const visRes = await fetch(visUrl);
  const visMs = Math.round(performance.now() - t0);
  if (!visRes.ok) throw new Error(`IODC Visible HTTP error: ${visRes.status}`);
  const visBuf = Buffer.from(await visRes.arrayBuffer());
  console.log(`  ✅ IODC Visible: ${visRes.status} OK (${visMs}ms, ${visBuf.length} bytes, format: PNG)`);

  console.log('  Fetching IODC Infrared (msg_iodc:ir108)...');
  const t1 = performance.now();
  const irRes = await fetch(irUrl);
  const irMs = Math.round(performance.now() - t1);
  if (!irRes.ok) throw new Error(`IODC IR HTTP error: ${irRes.status}`);
  const irBuf = Buffer.from(await irRes.arrayBuffer());
  console.log(`  ✅ IODC Infrared: ${irRes.status} OK (${irMs}ms, ${irBuf.length} bytes, format: PNG)`);

  console.log('\n════════════════════════════════════════════════════');
  console.log('🎉 ALL IODC PROTOTYPE INVARIANTS VERIFIED SUCCESSFULLY');
  console.log('════════════════════════════════════════════════════\n');
}

runPrototypeTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
