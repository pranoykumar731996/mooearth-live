# Design System Document: MooEarth Live Mobile

## 1. Overview & Creative North Star
**The Creative North Star: "Cosmic Cyber-Emotionalism"**

MooEarth Live is an immersive, real-time emotional visualization of the Earth during the FIFA World Cup and global events. The mobile design rejects flat, boring list-based news feeds. Instead, it places a glowing, interactive 3D Globe at the center, layered with premium glassmorphic panels, neon state indicators, and dynamic sliding sheets.

The design language mimics the feeling of looking through the windshield of a high-tech cosmic observation station. Visual sections are defined by background tone shifts and glassmorphic blurs rather than hard lines, allowing the beautiful 3D Earth and neon arcs to act as the visual backbone of the app.

---

## 2. Color Palette & Dark-Mode Atmosphere

Our palette uses deep space navy-blacks as the canvas, accented by highly saturated, glowing neon indicators for live events and emotions.

### Core Swatches
- **Root Background:** `#05050f` (deep cosmic space navy-black)
- **Glass Card Base (Surface):** `#0a0a1a` (translucent cosmic card base with 20px blur, opacity 85%)
- **Primary Accent (Neon Cyan):** `#00e5ff` (used for active connections, digital HUD outlines, and normal news alerts)
- **Secondary Accent (Emerald Green):** `#10b981` (used for live football updates, scoreboards, and active matches)
- **Tertiary Accent (Fan Purple):** `#8b5cf6` (used for player streaks, uploads, and fan celebration overlays)
- **Alert / Highlight (Neon Red):** `#ef4444` (used for goal scoring events and breaking world news)
- **On-Surface Text:** `#ffffff` (high contrast white for readability against dark cards)
- **Secondary Text:** `rgba(255, 255, 255, 0.5)` (subtle text color for timestamps and cities)
- **Border / Outline:** `rgba(255, 255, 255, 0.08)` (subtle divider lines, used sparingly)

---

## 3. Typography: Digital Precision

We use the font **Outfit** or **Inter** for a clean, geometric, high-tech aesthetic.

- **Display & Header (Outfit):** Bold, heavy weights with tight letter-spacing (-0.01em) to render country titles, live scores, and status messages with authority.
- **Body & Captions (Inter):** Highly legible, open aperture style to ensure breaking news headlines remain readable on small mobile screens.

---

## 4. Key Screens & Mobile Layout Architecture

The mobile app consists of three primary visual layers stacked on top of each other:

### Screen 1: The 3D Globe Viewport (Core Canvas)
- **Description:** A full-bleed WebGL view of the Earth with curved arc trails connecting reaction centers, pulsing hotspots, and translucent country highlights.
- **Interactions:** Pinch-to-zoom, rotate, and tap-to-select countries.

### Screen 2: The Top Navigation Bar (Header)
- **Height:** 64px
- **Layout:** Translucent glassmorphic bar pinned to the top.
  - **Left:** Logo (Emoji globe `🌍` + title text hidden on mobile).
  - **Center:** Search trigger icon (toggles a full-bleed overlays search interface).
  - **Right:** Play Earth Controller button (`🎮`), Leaderboard Cup (`🏆`), and Profile Avatar or Sign In button.

### Screen 3: The Live Events Bottom Drawer (Collapsible Panel)
- **Height:** Collapsed: 24px (just drag handle), Half-Open: `55vh` (default list view), Full-Screen: `95vh` (detailed reading).
- **Layout:** Sliding sheet from the bottom with a 12px drag handler.
  - Contains tabs for filtering categories (Matches, News, Weather, Tech).
  - Renders a list of card components for live stories or live match scoreboards.

### Screen 4: Floating Action Control Bar
- **Position:** Pinned at `bottom-[calc(55vh+16px)]` when the bottom sheet is open, sliding down to `bottom-6` when minimized.
- **Content:** Four square buttons (`w-14 h-14`):
  1. Full-screen Globe Toggle (`📱`/`📺`).
  2. EarthCast AI narration Microphone toggle (`🎙️`).
  3. Upload Fan Reaction Megaphone button (`📣`).
  4. AI Assistant Drawer trigger (`💬`).

---

## 5. UI Components & Micro-interactions

### Glass Cards (News & Matches)
- **Styling:** `background: rgba(10, 10, 26, 0.4)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.05)`.
- **Interaction:** Glow borders animate to neon cyan or green on hover/tap.

### Live Scorecards
- **Styling:** Split layout showing team flag emojis (`🇧🇷` vs `🇨🇭`), team names, active timer (`74'`), and score count. 
- **Animation:** The live timer has a red/green pulse animation.

### Button Controls
- **Styling:** Height 56px, fully rounded (2xl) or circular, with gradient backgrounds (`from-purple-600 to-pink-600` for Upload, `from-cyan-500 to-blue-600` for primary actions).
- **Interaction:** Downscales to 95% on tap.
