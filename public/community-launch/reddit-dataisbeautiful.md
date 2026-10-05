# [OC] We mapped global news and cultural events across 139 countries in interactive 3D in real-time

**Interactive Visualization**: https://www.mooearth.live

### Visualization & Methodology:
- **Data Source**: Aggregated from verified global RSS news feeds, geocoded to country and city coordinates.
- **Rendering Engine**: Three.js, React-Globe.gl, and WebGL running with custom shader atmosphere and high-res night topology bump maps.
- **Zero Marginal Cost Architecture**: Deterministic seed hashing client-side, edge CDN static asset caching, and synthesized Web Audio API for zero latency.

### How to Explore:
Rotate the globe, click on any event marker to see full regional context, or switch between Standard, Night, Weather, and Satellite orbital view modes.
