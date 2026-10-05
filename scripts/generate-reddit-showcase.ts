// ============================================================
// MooEarth Live — Reddit & Hacker News Showcase Generator
// ============================================================
// Generates ready-to-publish launch packages for r/InternetIsBeautiful,
// r/dataisbeautiful, r/MapPorn, and Hacker News Show HN.

import * as fs from 'fs';
import * as path from 'path';

function run() {
  console.log('📣 Generating Reddit & Community Launch Package...');

  const outputDir = path.join(process.cwd(), 'public', 'community-launch');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. r/InternetIsBeautiful Post
  const iibContent = `# [Show IIB] MooEarth Live — An open, interactive 3D living globe of world events, live weather & daily geography duels

**Link**: https://www.mooearth.live

### What is this?
Hey everyone, we spent the last several months building MooEarth Live: an interactive 3D WebGL globe running at 60 FPS directly in your browser with zero installs or sign-ups.

### Key Features:
- **Living Planet**: Watch real-time global news events, regional emotional sentiment, and weather patterns mapped onto 3D coordinates.
- **Daily Earth Challenge (\`/daily\`)**: A Wordle-style synchronized daily trivia game (5 curated questions every 24 hours at 00:00 UTC) with zero-spoiler emoji cards and streak multipliers.
- **Classroom & Party Arena (\`/party\`)**: Create live 6-digit room PINs to play with friends or students in real-time like Kahoot, but in a 3D orbital space.
- **Global Nations Cup (\`/tournament\`)**: Pick your home country and score points to elevate your nation on the weekly global medal leaderboard.
- **Embeddable 3D Widget (\`/embed/globe\`)**: A 1-line \`<iframe>\` that allows any blog or newsletter to embed a live interactive 3D earth.

Everything is completely free and works on mobile Safari/Chrome without downloading an app. Feedback and feature requests are very welcome!
`;
  fs.writeFileSync(path.join(outputDir, 'reddit-internetisbeautiful.md'), iibContent, 'utf-8');

  // 2. r/dataisbeautiful Post
  const dibContent = `# [OC] We mapped global news and cultural events across 139 countries in interactive 3D in real-time

**Interactive Visualization**: https://www.mooearth.live

### Visualization & Methodology:
- **Data Source**: Aggregated from verified global RSS news feeds, geocoded to country and city coordinates.
- **Rendering Engine**: Three.js, React-Globe.gl, and WebGL running with custom shader atmosphere and high-res night topology bump maps.
- **Zero Marginal Cost Architecture**: Deterministic seed hashing client-side, edge CDN static asset caching, and synthesized Web Audio API for zero latency.

### How to Explore:
Rotate the globe, click on any event marker to see full regional context, or switch between Standard, Night, Weather, and Satellite orbital view modes.
`;
  fs.writeFileSync(path.join(outputDir, 'reddit-dataisbeautiful.md'), dibContent, 'utf-8');

  // 3. Hacker News Show HN
  const hnContent = `Show HN: MooEarth Live – An open 3D interactive living globe and daily geography ritual

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
`;
  fs.writeFileSync(path.join(outputDir, 'hacker-news-show-hn.md'), hnContent, 'utf-8');

  console.log(`✅ Launch templates written to: ${outputDir}`);
  console.log('  - reddit-internetisbeautiful.md');
  console.log('  - reddit-dataisbeautiful.md');
  console.log('  - hacker-news-show-hn.md');
}

run();
