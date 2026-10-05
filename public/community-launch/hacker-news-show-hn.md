Show HN: MooEarth Live – An open 3D interactive living globe and daily geography ritual

URL: https://www.mooearth.live

Hi HN,

We built MooEarth Live because we wanted an intuitive, tactile way to understand what is happening across the planet right now without doom-scrolling flat text feeds.

### Technical Highlights:
- **WebGL at 60 FPS**: Built on Three.js, Next.js 16 (Turbopack), and Framer Motion with custom LOD (level-of-detail) rendering on mobile.
- **Zero-Marginal-Cost Game Engine**: Daily Earth Challenge (/daily) and Global Nations Cup (/tournament) use UTC-seeded deterministic pseudo-random distribution. 10M daily users cost $0.00 in LLM compute.
- **Audio Synthesizer**: Uses Web Audio API oscillator nodes (C5-E5-G5 arpeggios) directly in the browser—zero external audio MP3 network roundtrips.
- **Multilingual Programmatic SEO**: Static generation across 8 Tier-1 languages (/es, /fr, /de, /pt, /ja, /hi, /ar) with reciprocal hreflang indexing.
- **Embeddable Iframe Widget (/embed/globe)**: Custom frame options headers allowing newsrooms and bloggers to embed a lightweight 3D globe.

Would love your thoughts on performance, texture optimizations, and feature ideas!
