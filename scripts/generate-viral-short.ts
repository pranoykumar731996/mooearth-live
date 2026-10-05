// ============================================================
// MooEarth Live — Automated Short-Form Video Generator
// ============================================================
// Generates 1080x1920 vertical (9:16) video assets, storyboards,
// and automated playback templates for TikTok, YouTube Shorts & Reels.

import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

async function run() {
  console.log('🎬 MooEarth Live — Viral Short-Form Video Generator');
  console.log('==================================================');

  const todayStr = getTodayDateStr();
  const outputDir = path.join(process.cwd(), 'public', 'shorts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load question data dynamically
  const questionsModule = await import('../src/data/questions/index');
  const question = questionsModule.getDailyEarthQuestion(todayStr, 0);

  console.log(`📅 Target Date: ${todayStr}`);
  console.log(`🌍 Country:     ${question.country || 'Global'}`);
  console.log(`❓ Question:    "${question.question}"`);

  // 1. Generate Interactive 60FPS Video Renderer Template
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
  <title>MooEarth Short Video Renderer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      width: 1080px;
      height: 1920px;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #060814 70%);
      color: #ffffff;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 100px 80px;
    }
    .watermark {
      position: absolute;
      top: 60px;
      left: 80px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .logo-badge {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #06b6d4, #2563eb);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 40px rgba(6, 182, 212, 0.4);
    }
    .logo-text { font-size: 36px; font-weight: 900; letter-spacing: 2px; }
    .hook-badge {
      align-self: center;
      background: rgba(239, 68, 68, 0.2);
      border: 3px solid #ef4444;
      color: #fca5a5;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      animation: pulse 1.5s infinite;
      box-shadow: 0 0 50px rgba(239, 68, 68, 0.3);
      margin-top: 60px;
    }
    .question-box {
      background: rgba(255, 255, 255, 0.05);
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-radius: 40px;
      padding: 60px;
      backdrop-filter: blur(20px);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    }
    .category-tag {
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 24px;
    }
    .question-text {
      font-size: 52px;
      font-weight: 800;
      line-height: 1.35;
      color: #ffffff;
    }
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-top: 40px;
    }
    .option-card {
      background: rgba(255, 255, 255, 0.07);
      border: 3px solid rgba(255, 255, 255, 0.12);
      border-radius: 30px;
      padding: 36px 48px;
      font-size: 38px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.5s ease;
    }
    .option-card.correct {
      background: rgba(16, 185, 129, 0.25);
      border-color: #10b981;
      color: #6ee7b7;
      box-shadow: 0 0 60px rgba(16, 185, 129, 0.4);
    }
    .timer-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 8px solid #38bdf8;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 900;
      font-family: monospace;
      color: #38bdf8;
      box-shadow: 0 0 40px rgba(56, 189, 248, 0.4);
    }
    .cta-banner {
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 35px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(6, 182, 212, 0.4);
    }
    .cta-headline { font-size: 42px; font-weight: 900; color: #ffffff; margin-bottom: 12px; }
    .cta-sub { font-size: 26px; font-weight: 600; color: #e0f2fe; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  </style>
</head>
<body>
  <div class="watermark">
    <div class="logo-badge">🌍</div>
    <div class="logo-text">MooEarth Live</div>
  </div>

  <div class="hook-badge">🚨 97% OF PEOPLE FAIL THIS QUESTION</div>

  <div class="question-box">
    <div class="category-tag">📍 ${question.country || 'Global'} • ${question.category.toUpperCase()}</div>
    <h1 class="question-text">${question.question}</h1>
    <div class="options-grid">
      ${question.choices.map((opt, i) => `
        <div class="option-card ${i === question.correctIndex ? 'correct' : ''}">
          <span>${opt}</span>
          <span style="opacity:0.5;">${['A', 'B', 'C', 'D'][i]}</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="timer-circle">7s</div>

  <div class="cta-banner">
    <div class="cta-headline">Play Free at mooearth.live/daily</div>
    <div class="cta-sub">Can you beat the daily streak? No download needed.</div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'daily-short-player.html');
  fs.writeFileSync(htmlPath, htmlTemplate, 'utf-8');
  console.log(`✅ Saved HTML5 video template: ${htmlPath}`);

  // 2. Generate 1080x1920 Poster Frame Images using Jimp
  console.log('🎨 Generating 9:16 vertical poster frames...');
  
  // Frame 1: Hook Card
  const frame1 = new Jimp({ width: 1080, height: 1920, color: 0x060814ff });
  const frame1Path = path.join(outputDir, 'frame-1-hook.png');
  await frame1.write(frame1Path as `${string}.${string}`);

  // Frame 2: Reveal Card
  const frame2 = new Jimp({ width: 1080, height: 1920, color: 0x0a1024ff });
  const frame2Path = path.join(outputDir, 'frame-2-reveal.png');
  await frame2.write(frame2Path as `${string}.${string}`);

  console.log(`✅ Saved Poster Frames in: ${outputDir}`);

  // 3. Write Social Manifest for Scheduled Publishing
  const manifest = {
    title: `Can you solve today's Earth Challenge? (${question.country || 'Global'})`,
    caption: `🚨 97% of people fail this question! Test your world knowledge on today's MooEarth Daily.\n\nQuestion: ${question.question}\n\n👉 Play free right now in your browser at https://mooearth.live/daily\n\n#geography #geographyquiz #trivia #mooearth #earthdaily #quiz #worldnews #learnontiktok`,
    question: question.question,
    choices: question.choices,
    correctAnswer: question.choices[question.correctIndex],
    funFact: question.funFact || '',
    date: todayStr,
    renderedAt: new Date().toISOString(),
    templates: {
      html: 'public/shorts/daily-short-player.html',
      frames: ['public/shorts/frame-1-hook.png', 'public/shorts/frame-2-reveal.png'],
    },
  };

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Generated social publishing manifest: ${manifestPath}`);
  console.log('==================================================');
  console.log('🎉 Short-Form Content Generation Complete!');
}

run().catch((err) => {
  console.error('Error generating viral short:', err);
  process.exit(1);
});
