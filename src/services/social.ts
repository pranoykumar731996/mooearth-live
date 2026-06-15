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

export async function fetchSocialReactions(country: string, category?: string | null) {
  const cleanCountry = country.replace(/\s+/g, '');
  const allCelebrations = readCelebrations();
  
  const isSportsRelated = !category || ['sports', 'football', 'worldcup'].includes(category);
  
  const countryCelebrations = isSportsRelated
    ? allCelebrations.filter(
        (c: any) => c.country.toLowerCase() === country.toLowerCase() && (!c.reports || c.reports < 3)
      )
    : [];

  let hashtags = [`#${cleanCountry}Sports`, `#WorldCup2026`];
  let mockTemplates: string[] = [];

  const cat = category || 'home';

  if (cat === 'technology') {
    hashtags = [`#${cleanCountry}Tech`, `#${cleanCountry}Innovation`, `#FutureTech`];
    mockTemplates = [
      `Fascinating AI and robotics developments coming out of ${country} today. The innovation ecosystem here is thriving! 💻🚀`,
      `Local startups in ${country} are pushing boundaries in green technology and space research. Truly inspiring to watch!`,
      `Hearing exciting news about new tech research centers opening up in ${country}. A massive boost for local engineering talent!`
    ];
  } else if (cat === 'weather') {
    hashtags = [`#${cleanCountry}Weather`, `#${cleanCountry}Climate`, `#Forecast`];
    mockTemplates = [
      `Watching the climate updates from ${country}. Clean energies are making local power grids far more weather-resilient! 🌦️`,
      `Unusually pleasant weather reported across the major regions of ${country} today. Perfect day to go outdoors.`,
      `Meteorology teams in ${country} just deployed next-gen smart forecasting grids. Great tech for storm safety!`
    ];
  } else if (cat === 'business') {
    hashtags = [`#${cleanCountry}Business`, `#${cleanCountry}Economy`, `#Markets`];
    mockTemplates = [
      `Markets in ${country} are showing solid gains following the positive trade volume reports. Economic indicators look strong! 📈`,
      `Very bullish on the new industrial investments in ${country}. The commercial hubs here are expanding rapidly.`,
      `Analysts in ${country} note renewed consumer confidence and rising venture funding in local clean energy sectors.`
    ];
  } else if (cat === 'entertainment') {
    hashtags = [`#${cleanCountry}PopCulture`, `#${cleanCountry}Entertainment`, `#Cinema`];
    mockTemplates = [
      `The local music scene in ${country} is breaking streaming records today! So much creative energy here. 🎬🎵`,
      `Just watched an incredible film release from ${country}. The storytelling and visuals are absolute state-of-the-art.`,
      `Pop culture trends from ${country} are viral globally. Social platforms are flooded with fan reactions!`
    ];
  } else if (cat === 'breaking') {
    hashtags = [`#${cleanCountry}News`, `#${cleanCountry}Headlines`, `#Breaking`];
    mockTemplates = [
      `Major headlines from ${country} focus on community development and government policy reforms today. 📰`,
      `Discussions are surging online regarding the latest social developments in ${country}. Citizens are actively engaged.`,
      `Breaking news broadcasts in ${country} report high public participation in regional initiatives.`
    ];
  } else {
    // sports, football, worldcup, or home
    hashtags = [`#${cleanCountry}Sports`, `#WorldCup2026`];
    if (countryCelebrations.length === 0) {
      mockTemplates = [
        `Enthusiasm for the upcoming fixtures in ${country} is reaching fever pitch! Stadiums and fan zones are ready. ⚽🏆`,
        `The national squad in ${country} shows incredible form in training. Pundits are predicting a strong tournament run!`,
        `Local clubs in ${country} host massive football events this weekend. The team form is looking outstanding.`
      ];
    }
  }

  // Map real celebrations to tweets
  const realPosts = countryCelebrations.map((c: any) => {
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

  const generatedPosts = mockTemplates.map((text, idx) => {
    const minutes = (idx + 1) * 12;
    return {
      id: `gen-post-${country}-${cat}-${idx}`,
      user: `@${cleanCountry}Fan_${idx + 1}`,
      text,
      time: `${minutes}m ago`,
      likes: Math.floor(50 + Math.random() * 300)
    };
  });

  const posts = [...realPosts, ...generatedPosts].slice(0, 10);

  return {
    hashtags,
    posts
  };
}

