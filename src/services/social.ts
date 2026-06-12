/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src/data/celebrations.json');

function readCelebrations(): any[] {
  try {
    if (!fs.existsSync(dbPath)) return [];
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading celebrations for social mapping:', error);
    return [];
  }
}

export async function fetchSocialReactions(country: string) {
  const allCelebrations = readCelebrations();
  const countryCelebrations = allCelebrations.filter(
    (c: any) => c.country.toLowerCase() === country.toLowerCase() && (!c.reports || c.reports < 3)
  );

  const hashtags = [`#${country.replace(/\s+/g, '')}Football`, `#WorldCup2026`];

  // Map real celebrations to tweets
  const posts = countryCelebrations.map((c: any) => {
    const diff = Date.now() - c.timestamp;
    const minutes = Math.floor(diff / 60000);
    const timeStr = minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes/60)}h ago`;

    return {
      id: c.id,
      user: `@${c.username}`,
      text: c.comment,
      time: timeStr,
      likes: Math.floor(100 + Math.random() * 900)
    };
  });

  return {
    hashtags,
    posts
  };
}

