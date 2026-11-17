import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Sources & Scientific Attribution | MooEarth.Live',
  description: 'Official attribution for open scientific datasets, planetary telemetry, meteorological models, and geospatial cartography on MooEarth.Live.',
  alternates: {
    canonical: 'https://www.mooearth.live/data-sources'
  }
};

export default function DataSources() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Data Sources & Scientific Attribution</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: October 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Planetary Science & Earth Observation Data</h2>
          <p>
            MooEarth.Live operates as an interactive global planetary intelligence hub powered strictly by open, public domain scientific datasets provided by international space and meteorological agencies.
          </p>
          <ul className="list-disc pl-6 space-y-3 mt-4">
            <li>
              <strong>USGS Earthquake Hazards Program (NEIC):</strong> Real-time seismic event telemetry, moment magnitudes ($M_w$), hypocentral coordinates, and focal depths are sourced from the United States Geological Survey National Earthquake Information Center. USGS data is in the public domain and provided free of commercial restrictions.
            </li>
            <li>
              <strong>NASA EONET (Earth Observatory Natural Event Tracker):</strong> Wildfire thermal signatures, volcanic ash plumes, severe storms, and sea ice anomalies are ingested via NASA Goddard Space Flight Center&apos;s open EONET v3 repository.
            </li>
            <li>
              <strong>NOAA Space Weather Prediction Center (SWPC):</strong> Real-time Planetary Kp indices, geomagnetic storm classifications (G1&ndash;G5), solar wind velocity, and magnetospheric disturbances originate from the National Oceanic and Atmospheric Administration (NOAA) Space Weather Prediction Center.
            </li>
            <li>
              <strong>NASA Earth Observatory & FIRMS:</strong> Moderate Resolution Imaging Spectroradiometer (MODIS) and Visible Infrared Imaging Radiometer Suite (VIIRS) satellite imagery and thermal anomaly telemetry are made available through NASA open data initiatives.
            </li>
            <li>
              <strong>NASA GIBS & NOAA GOES Satellite Constellation:</strong> High-resolution visible, clean infrared (10.4–10.8 µm), and upper-tropospheric water vapor imagery is ingested directly from the NASA Global Imagery Browse Services (GIBS), NOAA GOES-East (GOES-16), NOAA GOES-West (GOES-18), and Japan Meteorological Agency (JMA) Himawari-9. Data is in the public domain under NASA Earth Science Open Data Policy and 17 U.S.C. § 105.
            </li>
            <li>
              <strong>EUMETSAT Geostationary Data:</strong> Meteosat Prime (0°) and Meteosat-9 Indian Ocean Data Coverage (IODC 45.5°E) imagery is accessed via open EUMETSAT Web Map Services (WMS) in accordance with the EUMETSAT Data Policy for non-exclusive public meteorological observation.
            </li>
            <li>
              <strong>Open-Meteo:</strong> Global meteorological forecasts, atmospheric pressure gradients, precipitation radar vectors, elevation models, and air quality telemetry are powered by Open-Meteo under the open Creative Commons Attribution (CC BY 4.0) license.
            </li>
            <li>
              <strong>Esri World Imagery:</strong> Global satellite ground basemaps are powered by Esri ArcGIS Online under standard attribution: &quot;Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community&quot;.
            </li>
            <li>
              <strong>Survey of India Official Boundary:</strong> Sovereign boundaries of the Republic of India are rendered strictly in accordance with the Survey of India administrative boundary specifications (National Geospatial Policy 2022).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Zero Commercial Scraping & Fair Information Policy</h2>
          <p>
            MooEarth.Live does not perform unauthorized web scraping of commercial news publishers, does not bypass subscription paywalls, and does not store or reproduce full-text proprietary journalism.
          </p>
          <p className="mt-2">
            All event briefings are generated either directly from open telemetry or through objective scientific analysis of public agency releases. Direct links to official agency repositories (e.g., USGS event pages, NOAA bulletins, NASA mission portals) are provided so users can explore raw primary observations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Geographic Datasets & World Atlas Standards</h2>
          <p>
            Country borders, capital cities, population metrics, currencies, and geographic coordinate centroids presented across MooEarth.Live are compiled from trusted public open data repositories, including Natural Earth Data, the World Bank Open Data catalog, and ISO 3166 country standards.
          </p>
          <p className="mt-2">
            These datasets are used exclusively for educational geography challenges, spatial visualization, and localized weather orientation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Open Source & Geospatial Visualization</h2>
          <p>
            Our interactive 3D globe and city-level mapping engines utilize open-source spatial visualization libraries, including:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Three.js & React-Globe.gl:</strong> 3D WebGL spherical rendering, orbital camera physics, and volumetric atmosphere shaders.</li>
            <li><strong>MapLibre GL:</strong> Vector tile city mapping and local geospatial exploration.</li>
            <li><strong>OpenStreetMap & CARTO:</strong> Cartographic street basemaps, coastlines, and geographic boundaries provided by OpenStreetMap contributors under ODbL and CARTO under CC BY 4.0.</li>
            <li><strong>Natural Earth & GeoJSON:</strong> Boundary polygons and national centroid coordinates derived from Natural Earth public domain datasets.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Independent Platform & Trademark Disclaimer</h2>
          <p>
            MooEarth.Live is an independent, non-affiliated planetary visualization platform. Any references to third-party commercial portals, service providers, or trademarks (including Windy&reg;, Zoom Earth&reg;, Google Maps&trade;, or Apple Maps&trade;) in comparative technical benchmarks or informational text are strictly nominative fair use.
          </p>
          <p className="mt-2">
            MooEarth.Live has no official affiliation with, sponsorship from, or endorsement by any commercial weather service. All weather data, satellite imagery, and telemetry are ingested independently from primary public open data repositories.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Questions & Data Inquiries</h2>
          <p>
            For questions regarding scientific attribution, API integrations, or institutional inquiries, please contact our research and legal team at <a href="mailto:legal@mooearth.live" className="text-cyan-400 hover:underline">legal@mooearth.live</a>.
          </p>
        </section>
      </div>
    </>
  );
}
