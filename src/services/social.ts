export async function fetchSocialReactions(country: string, context: string) {
  // Simulate fetching from a social API (Twitter/X, Reddit, etc.)
  // Since we don't have access, we generate realistic mock data based on the context.

  const isWin = context.toLowerCase().includes('win') || context.toLowerCase().includes('victory') || context.toLowerCase().includes('goal');
  const isLoss = context.toLowerCase().includes('loss') || context.toLowerCase().includes('defeat') || context.toLowerCase().includes('out');

  let hashtags = [`#${country.replace(/\s+/g, '')}Football`, `#WorldCup2026`];
  let posts = [];

  if (isWin) {
    hashtags.push(`#Vamos${country.replace(/\s+/g, '')}`, '#Unbelievable');
    posts = [
      { id: '1', user: '@fanatic_10', text: `WHAT A MATCH!! ${country} is going all the way this year! 🔥🔥`, time: '1m ago', likes: 1240 },
      { id: '2', user: '@football_insider', text: `Incredible performance from the squad. The streets of ${country} are going crazy right now.`, time: '5m ago', likes: 580 },
      { id: '3', user: '@diehard_supporter', text: `I never doubted them! Let's gooooo! 🏆`, time: '7m ago', likes: 890 }
    ];
  } else if (isLoss) {
    hashtags.push(`#CoachOut`, `#Disgrace`);
    posts = [
      { id: '1', user: '@angry_fan99', text: `Absolutely pathetic defending. We deserved to lose. Changes needed NOW.`, time: '2m ago', likes: 3200 },
      { id: '2', user: '@sports_analyst', text: `A tactical disasterclass for ${country}. They looked completely lost in the second half.`, time: '4m ago', likes: 1540 },
      { id: '3', user: '@sad_supporter', text: `Heartbroken. We waited 4 years for this. 💔`, time: '8m ago', likes: 2100 }
    ];
  } else {
    hashtags.push(`#Matchday`, `#Tense`);
    posts = [
      { id: '1', user: '@neutral_fan', text: `This match is way too close to call. Both teams are playing cautiously.`, time: '3m ago', likes: 450 },
      { id: '2', user: '@tactics_guy', text: `Midfield battle is intense. ${country} needs to push higher up the pitch.`, time: '6m ago', likes: 820 },
      { id: '3', user: '@nervous_wreck', text: `I can't watch this anymore, my heart rate is through the roof. 😰`, time: '10m ago', likes: 1100 }
    ];
  }

  return {
    hashtags,
    posts
  };
}
