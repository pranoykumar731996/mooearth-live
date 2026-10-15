// ============================================================
// MooEarth Live — Geophysical & Atmospheric AI Briefing Generator (Phase 3)
// Objective, scientifically grounded briefings for planetary events
// 100% Open Data & Public Domain Telemetry (USGS, NASA, NOAA)
// ============================================================

import { PlanetaryTelemetry } from '@/types';
import type { ArticleDetails } from '../article';

const PLANETARY_IMAGES: Record<string, string> = {
  seismic: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800',
  severe_weather: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=800',
  wildfires: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?q=80&w=800',
  space_weather: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800',
  climate_oceans: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=800',
  science_nature: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
  breaking: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
};

export interface PlanetaryBriefingInput {
  id: string;
  title: string;
  summary: string;
  country: string;
  category: string;
  publishedAt: string;
  sourceUrl?: string;
  lat?: number;
  lng?: number;
  telemetry?: PlanetaryTelemetry;
}

/**
 * Tectonic plate boundary model
 */
export interface TectonicContext {
  plateBoundary: string;
  faultMechanism: string;
  regionalRisk: string;
  energyJoules: number;
  tntEquivalent: string;
  focalLayer: 'Crustal (Shallow)' | 'Wadati-Benioff (Intermediate)' | 'Mantle Transition (Deep)';
  tsunamiRisk: string;
}

function isValidSourceUrl(url?: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Calculates earthquake energy in Joules using Gutenberg-Richter relation:
 * log10(E) = 4.8 + 1.5 * M
 */
export function calculateSeismicEnergyJoules(magnitude: number): number {
  return Math.pow(10, 4.8 + 1.5 * magnitude);
}

/**
 * Formats seismic energy into equivalent mass of TNT
 */
export function formatTntEquivalent(joules: number): string {
  const tonsTnt = joules / 4.184e9;
  if (tonsTnt >= 1e6) {
    return `${(tonsTnt / 1e6).toFixed(2)} Megatons TNT`;
  } else if (tonsTnt >= 1e3) {
    return `${(tonsTnt / 1e3).toFixed(1)} Kilotons TNT`;
  } else if (tonsTnt >= 1) {
    return `${tonsTnt.toFixed(1)} Tons TNT`;
  }
  return `${(tonsTnt * 1000).toFixed(0)} kg TNT`;
}

/**
 * Resolves tectonic setting and plate boundaries from geographic coordinates
 */
export function resolveTectonicSetting(lat: number, lng: number, country: string): {
  plateBoundary: string;
  faultMechanism: string;
  regionalRisk: string;
} {
  const c = (country || '').toLowerCase();

  // 1. Pacific Ring of Fire — Japan, Kamchatka, Kuril
  if ((lat >= 30 && lat <= 60 && lng >= 130 && lng <= 165) || c.includes('japan') || c.includes('russia') && lng > 140) {
    return {
      plateBoundary: 'Pacific Plate subducting beneath the Okhotsk & North American Plates (Kuril-Kamchatka & Japan Trench)',
      faultMechanism: 'Thrust / Megathrust subduction interface with high slip rates (~8 cm/year)',
      regionalRisk: 'High vulnerability to intense ground motion, coastal tsunami propagation, and active volcanism.'
    };
  }

  // 2. Indonesia / Sunda Megathrust
  if ((lat >= -12 && lat <= 8 && lng >= 95 && lng <= 142) || c.includes('indonesia') || c.includes('papua')) {
    return {
      plateBoundary: 'Indo-Australian Plate subducting beneath the Sunda Plate (Sunda Arc & Java Trench)',
      faultMechanism: 'Oblique subduction accompanied by the Great Sumatran strike-slip fault system',
      regionalRisk: 'Extreme subduction megathrust potential, marine tsunami genesis, and volcanic chain activation.'
    };
  }

  // 3. Cascadia Subduction Zone (Pacific Northwest USA / Canada)
  if ((lat >= 40 && lat <= 52 && lng >= -130 && lng <= -120) || (c.includes('united states') && lng < -120 && lat > 40)) {
    return {
      plateBoundary: 'Juan de Fuca Plate subducting beneath the North American Plate (Cascadia Subduction Zone)',
      faultMechanism: 'Locked megathrust fault capable of episodic tremor and slip (ETS) and M 9+ events',
      regionalRisk: 'Potential for full-margin rupture, coastal inundation, and regional liquefaction.'
    };
  }

  // 4. San Andreas Fault System (California)
  if ((lat >= 32 && lat <= 40 && lng >= -125 && lng <= -115) || (c.includes('california'))) {
    return {
      plateBoundary: 'Pacific Plate sliding northwest past the North American Plate (San Andreas Transform Fault)',
      faultMechanism: 'Right-lateral strike-slip faulting along complex transpressional strands',
      regionalRisk: 'High risk of surface rupture, urban structural damage, and pipeline/infrastructure severing.'
    };
  }

  // 5. Peru-Chile Trench (South American Andes)
  if ((lat >= -56 && lat <= 0 && lng >= -82 && lng <= -65) || c.includes('chile') || c.includes('peru')) {
    return {
      plateBoundary: 'Nazca Plate converging with and subducting under the South American Plate',
      faultMechanism: 'Rapid oceanic-continental subduction (~6.5 cm/year) generating world-class megathrust events',
      regionalRisk: 'Severe coastal uplift, basin amplification, and trans-oceanic tsunami propagation.'
    };
  }

  // 6. Alpide Himalayan Collision Zone
  if ((lat >= 20 && lat <= 40 && lng >= 60 && lng <= 100) || c.includes('india') || c.includes('nepal') || c.includes('pakistan') || c.includes('china')) {
    return {
      plateBoundary: 'Indian Continental Plate colliding with the Eurasian Plate (Main Himalayan Thrust)',
      faultMechanism: 'Continent-continent continental collision with crustal shortening and intense mountain-building',
      regionalRisk: 'Widespread mountain landslides, valley sediment amplification, and prolonged aftershock sequences.'
    };
  }

  // 7. Mid-Atlantic Ridge & Iceland
  if ((lng >= -35 && lng <= -15 && Math.abs(lat) <= 70) || c.includes('iceland')) {
    return {
      plateBoundary: 'Eurasian Plate separating from the North American Plate (Mid-Atlantic Divergent Ridge)',
      faultMechanism: 'Sea-floor spreading, rift valley normal faulting, and basaltic magmatic intrusion',
      regionalRisk: 'Fissure eruptions, geothermal hydrothermal venting, and shallow earthquake swarms.'
    };
  }

  // 8. General fallback
  return {
    plateBoundary: 'Regional Lithospheric Plate Boundary & Intraplate Stress Field',
    faultMechanism: 'Crustal fault dislocation accommodating tectonic strain accumulation',
    regionalRisk: 'Localized ground acceleration governed by focal depth and regional geotechnical soil profiles.'
  };
}

/**
 * Analyzes space weather Kp index and solar-terrestrial dynamics
 */
export function analyzeSpaceWeather(kpIndex: number): {
  stormLevel: string;
  auroraVisibility: string;
  gridImpact: string;
  radioPropagation: string;
} {
  if (kpIndex >= 9) {
    return {
      stormLevel: 'G5 — Extreme Geomagnetic Storm',
      auroraVisibility: 'Aurora potentially visible across mid-to-low latitudes down to 40° geomagnetic latitude.',
      gridImpact: 'Widespread voltage control problems and protective system trips; potential grid collapse or blackouts.',
      radioPropagation: 'HF (high frequency) radio blackout on dayside; satellite navigation severely degraded for hours.'
    };
  } else if (kpIndex >= 8) {
    return {
      stormLevel: 'G4 — Severe Geomagnetic Storm',
      auroraVisibility: 'Aurora commonly seen down to 45° geomagnetic latitude (northern US, Central Europe).',
      gridImpact: 'Induced currents create grid voltage regulation issues; protective relays may trip prematurely.',
      radioPropagation: 'HF radio sporadic; satellite tracking and orientation require continuous corrections.'
    };
  } else if (kpIndex >= 7) {
    return {
      stormLevel: 'G3 — Strong Geomagnetic Storm',
      auroraVisibility: 'Aurora visible down to 50° geomagnetic latitude.',
      gridImpact: 'Voltage corrections required; false alarms triggered on some protection devices.',
      radioPropagation: 'Intermittent satellite navigation fixes and degraded HF marine/aeronautical communications.'
    };
  } else if (kpIndex >= 6) {
    return {
      stormLevel: 'G2 — Moderate Geomagnetic Storm',
      auroraVisibility: 'Aurora visible at high latitudes down to 55° geomagnetic latitude.',
      gridImpact: 'High-latitude power systems may experience voltage alarms; long-duration events cause transformer stress.',
      radioPropagation: 'HF radio fading at higher latitudes; satellite orbital drag increase detected by flight controllers.'
    };
  } else if (kpIndex >= 5) {
    return {
      stormLevel: 'G1 — Minor Geomagnetic Storm',
      auroraVisibility: 'Aurora observable at high latitudes (Alaska, Canada, Scandinavia, northern Scotland).',
      gridImpact: 'Weak power grid fluctuations can occur.',
      radioPropagation: 'Minor impact on high-latitude radio transmissions; migratory animal navigation slightly disrupted.'
    };
  } else if (kpIndex >= 4) {
    return {
      stormLevel: 'Active Geomagnetic Field (Unsettled)',
      auroraVisibility: 'Aurora restricted to polar regions (>65° geomagnetic latitude).',
      gridImpact: 'Nominal power transmission conditions.',
      radioPropagation: 'Normal ionospheric propagation with localized auroral zone absorption.'
    };
  }

  return {
    stormLevel: 'Quiet / Normal Geomagnetic Field',
    auroraVisibility: 'Confined to high-latitude polar caps.',
    gridImpact: 'All electrical infrastructure operating under baseline geomagnetic conditions.',
    radioPropagation: 'Optimal high-frequency skywave radio propagation worldwide.'
  };
}

/**
 * Analyzes wildfire thermal anomaly data (NASA EONET / MODIS / VIIRS)
 */
export function analyzeWildfireTelemetry(frpMw?: number): {
  intensityTier: string;
  combustionContext: string;
  atmosphericEmissions: string;
} {
  const mw = frpMw || 50;

  if (mw >= 500) {
    return {
      intensityTier: 'Extreme Convective Firestorm',
      combustionContext: `Fire Radiative Power measured at ${mw.toFixed(0)} MW indicates violent, high-intensity crowning fire behavior with rapid flame spread.`,
      atmosphericEmissions: 'High risk of Pyrocumulonimbus (PyroCb) cloud formation, lofting black carbon and aerosols into the upper troposphere.'
    };
  } else if (mw >= 200) {
    return {
      intensityTier: 'High-Intensity Forest / Brush Fire',
      combustionContext: `Thermal Radiative output of ${mw.toFixed(0)} MW indicates active flame fronts consuming dense canopy or heavy fuel beds.`,
      atmosphericEmissions: 'Dense particulate matter (PM2.5) plume generation, severe local air quality degradation, and significant carbon release.'
    };
  } else if (mw >= 80) {
    return {
      intensityTier: 'Moderate Thermal Anomaly',
      combustionContext: `Radiative heat release of ${mw.toFixed(0)} MW reflects active surface burning or agricultural clearing operations.`,
      atmosphericEmissions: 'Localized smoke haze downwind; elevated PM10 and carbon monoxide levels within boundary layer.'
    };
  }

  return {
    intensityTier: 'Standard Thermal Signature',
    combustionContext: 'Moderate thermal anomaly detected by spaceborne infrared radiometers.',
    atmosphericEmissions: 'Dispersed low-altitude smoke plume monitored by environmental satellite arrays.'
  };
}

/**
 * Synthesizes a deterministic scientific briefing when AI is unavailable or as a baseline
 */
export function generateDeterministicPlanetaryBriefing(input: PlanetaryBriefingInput): ArticleDetails {
  const { id, title, summary, country, category, publishedAt, sourceUrl, lat = 0, lng = 0, telemetry } = input;
  const image = PLANETARY_IMAGES[category] || PLANETARY_IMAGES.seismic;
  const source = sourceUrl || (telemetry?.externalDataUrl) || 'https://earthquake.usgs.gov';

  if (category === 'seismic') {
    const mag = telemetry?.magnitude || 5.0;
    const depth = telemetry?.depthKm || 10;
    const energy = calculateSeismicEnergyJoules(mag);
    const tnt = formatTntEquivalent(energy);
    const tectonic = resolveTectonicSetting(lat, lng, country);

    const focalLayer = depth <= 70
      ? 'Crustal (Shallow)'
      : depth <= 300
      ? 'Wadati-Benioff (Intermediate)'
      : 'Mantle Transition (Deep)';

    const tsunamiStatus = telemetry?.tsunamiWarning
      ? '⚠️ Active Tsunami Warning or Advisory Issued by NOAA PTWC / NTWC'
      : (depth <= 70 && mag >= 6.5)
      ? 'Potential Oceanic Slip: Tsunami evaluation active by regional watch centers'
      : 'No Significant Tsunami Threat (Event depth or magnitude below threshold)';

    const content = `## Geophysical Event Overview
On ${new Date(publishedAt).toUTCString()}, a magnitude **${mag.toFixed(1)}** earthquake struck near **${country}** at coordinates \`[${lat.toFixed(3)}°, ${lng.toFixed(3)}°]\`. The event was registered at a focal depth of **${depth.toFixed(1)} km** below the surface, classified as a **${focalLayer}** seismic event.

## Tectonic & Fault Dynamics
The hypocenter is situated within the influence zone of the **${tectonic.plateBoundary}**. In this geodynamic regime, tectonic deformation is dominated by **${tectonic.faultMechanism}**.

The physical energy released at the source is calculated at approximately **${energy.toExponential(2)} Joules**, the mechanical equivalent of detonating approximately **${tnt}**.

## Shaking Intensity & Secondary Hazards
- **Focal Depth Characteristics**: At ${depth.toFixed(1)} km, ${depth <= 70 ? 'crustal seismic waves (P and S waves, followed by high-amplitude Rayleigh and Love surface waves) propagate into the near-surface with minimal lithospheric attenuation, resulting in sharp localized peak ground accelerations (PGA).' : 'seismic energy travels upwards through the subducting slab, attenuating higher-frequency vibrations before reaching surface population centers.'}
- **Tsunami Risk Assessment**: ${tsunamiStatus}.
- **Geotechnical Vulnerability**: ${tectonic.regionalRisk}

## Scientific Observation & Instrumentation
This event was detected, triangulated, and cataloged by the **${telemetry?.sensorSource || 'USGS National Earthquake Information Center (NEIC)'}** using a global broadband seismograph network. Continuous monitoring of aftershock decay sequences is ongoing.`;

    const keyFacts = [
      `Tectonic Setting: ${tectonic.plateBoundary}`,
      `Seismic Energy Release: Equivalent to ${tnt} (${energy.toExponential(2)} Joules)`,
      `Focal Mechanism: ${focalLayer} depth of ${depth.toFixed(1)} km`,
      `Tsunami Evaluation: ${tsunamiStatus}`
    ];

    return {
      id,
      title: title || `M ${mag.toFixed(1)} Seismic Event — ${country}`,
      source,
      publishedAt,
      country: country || 'Global',
      category: 'seismic',
      aiSummary: `A magnitude ${mag.toFixed(1)} earthquake occurred near ${country} at a focal depth of ${depth.toFixed(1)} km (${focalLayer}). Tectonic energy release is estimated at ${tnt}. ${tsunamiStatus}.`,
      fullContent: content,
      keyFacts,
      author: 'MooEarth Planetary Geophysics Bureau & USGS NEIC',
      image,
      description: summary || `Scientific analysis of M ${mag.toFixed(1)} earthquake in ${country}.`,
      accessLevel: 'full',
      accessLabel: 'OFFICIAL SCIENTIFIC TELEMETRY',
      depthMode: 'deep_dive',
      publicationStatus: 'published_full',
      historicalBackground: `The regional plate boundary has historically accumulated tectonic strain, releasing energy through episodic megathrust and crustal dislocations characteristic of the ${tectonic.plateBoundary}.`,
      analysisAndImplications: `Seismological analysis confirms mechanical fault rupture along established tectonic trends. Real-time accelerometers continue recording aftershock distribution to delineate the fault rupture zone.`,
      debug: {
        articleId: id,
        publisher: 'USGS NEIC Scientific Feed',
        sourceUrl: source,
        contentRetrieved: true,
        summaryGenerated: true,
        cacheHit: false,
        validationPassed: isValidSourceUrl(sourceUrl),
      }
    };
  }

  if (category === 'space_weather') {
    const kp = telemetry?.kpIndex !== undefined ? telemetry.kpIndex : 2;
    const spaceAnalysis = analyzeSpaceWeather(kp);

    const content = `## Space Weather & Geomagnetic Overview
The NOAA Space Weather Prediction Center (SWPC) magnetometer array is reporting a **Planetary Kp Index of ${kp}**, classifying current space weather as **${spaceAnalysis.stormLevel}**.

## Magnetospheric & Solar Wind Interaction
Geomagnetic activity reflects the interaction between the solar wind (carrying the Interplanetary Magnetic Field / IMF) and Earth's protective magnetosphere. When solar wind velocity rises or the magnetic field turns southward (Bz < 0), magnetic reconnection channels high-energy solar particles into the polar ionosphere.

## Operational Infrastructure Impacts
- **Power Grid Systems**: ${spaceAnalysis.gridImpact}
- **High-Frequency Radio & GNSS**: ${spaceAnalysis.radioPropagation}
- **Aurora Borealis & Australis Visibility**: ${spaceAnalysis.auroraVisibility}

## Observation & Heliophysics Telemetry
Monitored in real time by the **${telemetry?.sensorSource || 'NOAA Space Weather Prediction Center (SWPC)'}** using DSCOVR and ACE spacecraft situated at the Sun-Earth L1 Lagrange point, alongside terrestrial ground magnetometer stations.`;

    const keyFacts = [
      `Geomagnetic Intensity: Planetary Kp Index ${kp} (${spaceAnalysis.stormLevel})`,
      `Auroral Reach: ${spaceAnalysis.auroraVisibility}`,
      `Technological Impact: ${spaceAnalysis.gridImpact}`,
      `Sensor Array: ${telemetry?.sensorSource || 'NOAA SWPC L1 Deep Space & Terrestrial Magnetometers'}`
    ];

    return {
      id,
      title: title || `Space Weather Alert: Planetary Kp Index ${kp}`,
      source: telemetry?.externalDataUrl || 'https://www.swpc.noaa.gov/',
      publishedAt,
      country: 'Global Magnetosphere',
      category: 'space_weather',
      aiSummary: `Current geomagnetic conditions indicate a Planetary Kp index of ${kp} (${spaceAnalysis.stormLevel}). ${spaceAnalysis.auroraVisibility}`,
      fullContent: content,
      keyFacts,
      author: 'MooEarth Space Weather Desk & NOAA SWPC',
      image: PLANETARY_IMAGES.space_weather,
      description: summary || `Real-time space weather conditions and geomagnetic Kp telemetry.`,
      accessLevel: 'full',
      accessLabel: 'OFFICIAL SPACE TELEMETRY',
      depthMode: 'deep_dive',
      publicationStatus: 'published_full',
      debug: {
        articleId: id,
        publisher: 'NOAA SWPC',
        sourceUrl: source,
        contentRetrieved: true,
        summaryGenerated: true,
        cacheHit: false,
        validationPassed: isValidSourceUrl(sourceUrl),
      }
    };
  }

  if (category === 'wildfires') {
    const fireAnalysis = analyzeWildfireTelemetry(telemetry?.fireRadiativePowerMw);

    const content = `## Thermal Anomaly & Fire Dynamics
Spaceborne infrared radiometers aboard NASA's Terra, Aqua, and Suomi-NPP satellites have detected high-intensity thermal radiation near **${country}** \`[${lat.toFixed(3)}°, ${lng.toFixed(3)}°]\`. The event is classified as a **${fireAnalysis.intensityTier}**.

## Combustion & Energetics
${fireAnalysis.combustionContext} The satellite-derived Fire Radiative Power (FRP) provides a direct quantitative measurement of biomass combustion rates and convective energy release.

## Atmospheric Aerosol & Smoke Dispersion
${fireAnalysis.atmosphericEmissions} Strong thermal updrafts inject fine particulate matter (PM2.5, black carbon) into regional atmospheric currents, affecting air quality and solar radiative balance downwind.

## Satellite Environmental Monitoring
Data gathered via **NASA Earth Observing System (EONET / FIRMS)** and the Moderate Resolution Imaging Spectroradiometer (MODIS) sensor suites.`;

    const keyFacts = [
      `Thermal Intensity: ${fireAnalysis.intensityTier}`,
      `Combustion Metric: ${fireAnalysis.combustionContext}`,
      `Atmospheric Impact: ${fireAnalysis.atmosphericEmissions}`,
      `Monitoring Sensor: NASA EONET / MODIS & VIIRS Thermal Radiometers`
    ];

    return {
      id,
      title: title || `Thermal Signature & Fire Anomaly — ${country}`,
      source: sourceUrl || 'https://eonet.gsfc.nasa.gov/',
      publishedAt,
      country: country || 'Global',
      category: 'wildfires',
      aiSummary: `Satellite thermal detection near ${country}. Characterized as ${fireAnalysis.intensityTier}. ${fireAnalysis.atmosphericEmissions}`,
      fullContent: content,
      keyFacts,
      author: 'MooEarth Earth Intelligence & NASA EONET',
      image: PLANETARY_IMAGES.wildfires,
      description: summary || `Thermal anomaly and wildfire observation data.`,
      accessLevel: 'full',
      accessLabel: 'NASA SATELLITE TELEMETRY',
      depthMode: 'deep_dive',
      publicationStatus: 'published_full',
      debug: {
        articleId: id,
        publisher: 'NASA Earth Observatory & EONET',
        sourceUrl: source,
        contentRetrieved: true,
        summaryGenerated: true,
        cacheHit: false,
        validationPassed: isValidSourceUrl(sourceUrl),
      }
    };
  }

  // Generic Severe Weather / Science / Planetary Fallback
  const content = `## Planetary & Atmospheric Observation
On ${new Date(publishedAt).toUTCString()}, global scientific monitoring networks cataloged an event in **${country}** (\`${lat.toFixed(3)}°, ${lng.toFixed(3)}°\`).

## Physical Context & Dynamics
${summary || 'Scientific environmental instrumentation detected anomalous atmospheric and geospatial conditions across this sector.'}

## Earth System Interaction
Regional environmental dynamics are influenced by atmospheric circulation patterns, ocean-atmosphere heat exchange, and regional topography. 

## Scientific Source & Instrumentation
Observation recorded by **${telemetry?.sensorSource || 'NASA Earth Observatory & Global Environmental Arrays'}**.`;

  return {
    id,
    title,
    source,
    publishedAt,
    country: country || 'Global',
    category,
    aiSummary: summary || `Scientific observation registered near ${country}. Monitored by global scientific satellite networks.`,
    fullContent: content,
    keyFacts: [
      `Geographic Coordinates: [${lat.toFixed(3)}°, ${lng.toFixed(3)}°]`,
      `Observational Sector: ${country}`,
      `Sensor Network: ${telemetry?.sensorSource || 'NASA Earth Observation Network'}`
    ],
    author: 'MooEarth Earth Intelligence Bureau',
    image,
    description: summary,
    accessLevel: 'full',
    accessLabel: 'OFFICIAL SCIENTIFIC TELEMETRY',
    depthMode: 'briefing',
    publicationStatus: 'published_full',
    debug: {
      articleId: id,
      publisher: 'Global Scientific Network',
      sourceUrl: source,
      contentRetrieved: true,
      summaryGenerated: true,
      cacheHit: false,
      validationPassed: isValidSourceUrl(sourceUrl),
    }
  };
}

/**
 * Generates an evidence-grounded scientific briefing using Gemini 2.0 (or fallback)
 */
export async function generatePlanetaryBriefing(input: PlanetaryBriefingInput): Promise<ArticleDetails> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If no AI keys are configured, use the rigorous algorithmic deterministic engine
  if (!geminiApiKey && !openaiApiKey) {
    return generateDeterministicPlanetaryBriefing(input);
  }

  const { id, title, summary, country, category, publishedAt, sourceUrl, lat = 0, lng = 0, telemetry } = input;
  const tectonic = category === 'seismic' ? resolveTectonicSetting(lat, lng, country) : null;
  const energy = telemetry?.magnitude ? calculateSeismicEnergyJoules(telemetry.magnitude) : null;
  const tnt = energy ? formatTntEquivalent(energy) : null;
  const space = category === 'space_weather' && telemetry?.kpIndex !== undefined ? analyzeSpaceWeather(telemetry.kpIndex) : null;

  const prompt = `
SYSTEM PROMPT:
You are the Senior Planetary Geophysicist & Meteorological Scientist at the MooEarth Global Earth Intelligence Observatory.
Your mission is to synthesize an authoritative, scientifically rigorous, and deeply informative scientific briefing for a real-time planetary/earth event.

CRITICAL INSTRUCTIONS:
1. STRICT PHYSICAL ACCURACY: Base your analysis entirely on the provided physical telemetry (coordinates, magnitude, focal depth, Kp index, or radiative power).
2. OBJECTIVE SCIENTIFIC TONE: Write like an academic bulletin from the USGS Earthquake Science Center, NOAA Space Weather Prediction Center, or NASA Goddard Space Flight Center.
3. ZERO COMMERCIAL GOSSIP: Never mention media gossip, celebrity quotes, or speculative clickbait. Focus entirely on geodynamics, lithospheric mechanics, atmospheric physics, and hazard assessments.
4. STRUCTURED MARKDOWN: Format fullContent with clear markdown headings (## Geophysical Overview, ## Geodynamic / Atmospheric Mechanism, ## Hazard & Impact Evaluation, ## Scientific Monitoring).

TELEMETRY & GEOPHYSICAL DATA:
${JSON.stringify({
  id,
  title,
  category,
  country,
  coordinates: { lat, lng },
  publishedAt,
  telemetry,
  tectonicContext: tectonic,
  energyJoules: energy,
  tntEquivalent: tnt,
  spaceWeatherScale: space,
  rawSummary: summary
}, null, 2)}

OUTPUT JSON FORMAT (Respond ONLY with valid JSON):
{
  "aiSummary": "2-3 sentence executive scientific overview summarizing event type, magnitude/intensity, location, and key implications.",
  "fullContent": "A detailed 400-600 word scientific report formatted in clean Markdown with headings: ## Overview, ## Physical Mechanism, ## Shaking & Secondary Hazard Assessment, ## Observation & Network.",
  "keyFacts": [
    "Tectonic / Physical Driver: [detailed explanation]",
    "Energetics & Focal Depth: [calculated energy and depth context]",
    "Hazard Status: [tsunami, auroral reach, or air quality evaluation]",
    "Monitoring Agency: [official sensor array]"
  ]
}
`;

  try {
    let result: any = null;

    if (geminiApiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          result = JSON.parse(text);
        }
      }
    }

    if (!result && openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a scientific AI assistant that generates structured JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          result = JSON.parse(text);
        }
      }
    }

    if (result && result.aiSummary && result.fullContent) {
      const image = PLANETARY_IMAGES[category] || PLANETARY_IMAGES.seismic;
      return {
        id,
        title: title || `Scientific Briefing: ${country}`,
        source: sourceUrl || (telemetry?.externalDataUrl) || 'https://earthquake.usgs.gov',
        publishedAt,
        country: country || 'Global',
        category,
        aiSummary: result.aiSummary,
        fullContent: result.fullContent,
        keyFacts: Array.isArray(result.keyFacts) ? result.keyFacts : [],
        author: 'MooEarth Earth Intelligence & Scientific AI Bureau',
        image,
        description: summary || result.aiSummary,
        accessLevel: 'full',
        accessLabel: 'OFFICIAL SCIENTIFIC TELEMETRY',
        depthMode: 'deep_dive',
        publicationStatus: 'published_full',
        debug: {
          articleId: id,
          publisher: 'MooEarth Planetary Engine (AI Synthesized)',
          sourceUrl: sourceUrl || '',
          contentRetrieved: true,
          summaryGenerated: true,
          cacheHit: false,
          validationPassed: isValidSourceUrl(sourceUrl),
        }
      };
    }
  } catch (err: any) {
    console.warn('[PlanetaryBriefingGenerator] AI generation encountered error, falling back to deterministic synthesis:', err.message);
  }

  // Graceful fallback to deterministic synthesis
  return generateDeterministicPlanetaryBriefing(input);
}
