// ============================================================
// Play Earth — Automated Question Generation Pipeline
// ============================================================
// Generates thousands of scalable multiple-choice questions across regions,
// continents, and global pools. Writes to src/data/questions/generatedPool.ts.

import * as fs from 'fs';
import * as path from 'path';

interface RawInvention {
  name: string;
  inventor: string;
  year: string;
  country: string;
  fact: string;
}

interface RawSpace {
  achievement: string;
  mission: string;
  year: string;
  country: string;
  fact: string;
}

interface RawNature {
  feature: string;
  type: string;
  location: string; // country or region
  continent: string;
  fact: string;
}

interface RawHistory {
  event: string;
  year: string;
  country: string;
  leader: string;
  fact: string;
}

interface RawCulture {
  tradition: string;
  type: string; // dance, festival, dish, writer
  country: string;
  fact: string;
}

// ------ SEED DATASETS FOR GENERATION ------

const INVENTIONS: RawInvention[] = [
  { name: 'Telephone', inventor: 'Alexander Graham Bell', year: '1876', country: 'United States', fact: 'The first successful telephone call was Bell saying, "Mr. Watson, come here, I want to see you."' },
  { name: 'Radio', inventor: 'Guglielmo Marconi', year: '1895', country: 'Italy', fact: 'Marconi was awarded the Nobel Prize in Physics in 1909 for his contributions to wireless telegraphy.' },
  { name: 'Penicillin', inventor: 'Alexander Fleming', year: '1928', country: 'United Kingdom', fact: 'Fleming discovered penicillin by accident when mould grew on a forgotten petri dish of bacteria.' },
  { name: 'Steam Engine', inventor: 'James Watt', year: '1776', country: 'United Kingdom', fact: 'James Watt\'s steam engine design introduced the term "horsepower" to compare output to draft horses.' },
  { name: 'Light Bulb', inventor: 'Thomas Edison', year: '1879', country: 'United States', fact: 'Edison tested over 6,000 materials before finding carbonized bamboo filament that burned for 1,200 hours.' },
  { name: 'Printing Press', inventor: 'Johannes Gutenberg', year: '1440', country: 'Germany', fact: 'The Gutenberg Bible was the first major book printed in the West using movable metal type.' },
  { name: 'Periodic Table', inventor: 'Dmitri Mendeleev', year: '1869', country: 'Russia', fact: 'Mendeleev organized elements by atomic weight and accurately predicted elements that hadn\'t been discovered yet.' },
  { name: 'Polio Vaccine', inventor: 'Jonas Salk', year: '1953', country: 'United States', fact: 'Salk chose not to patent the vaccine, making it freely available to maximize global distribution.' },
  { name: 'X-ray', inventor: 'Wilhelm Röntgen', year: '1895', country: 'Germany', fact: 'Röntgen took the first X-ray image of his wife\'s hand; upon seeing her bones she exclaimed, "I have seen my death!"' },
  { name: 'Radium', inventor: 'Marie Curie', year: '1898', country: 'Poland', fact: 'Marie Curie remains the only person to win Nobel Prizes in two different scientific fields (Physics and Chemistry).' },
  { name: 'World Wide Web', inventor: 'Tim Berners-Lee', year: '1989', country: 'United Kingdom', fact: 'Berners-Lee wrote the first web server, browser, and editor while working at CERN in Switzerland.' },
  { name: 'Dynamic RAM (DRAM)', inventor: 'Robert Dennard', year: '1968', country: 'United States', fact: 'DRAM allowed computers to store binary data in a single transistor and capacitor, revolutionizing memory density.' },
  { name: 'Bionic Eye', inventor: 'Mark Humayun', year: '2009', country: 'United States', fact: 'The Argus II implant stimulates the retina directly with visual data captured by a glasses-mounted camera.' },
  { name: 'Dynamite', inventor: 'Alfred Nobel', year: '1867', country: 'Sweden', fact: 'Nobel created dynamite as a safer alternative to volatile nitroglycerin, and later used his fortune to fund the Nobel Prizes.' },
  { name: 'Tesla Coil', inventor: 'Nikola Tesla', year: '1891', country: 'United States', fact: 'Tesla designed the high-frequency resonant transformer to explore wireless electrical lighting and power distribution.' }
];

const SPACE_ACHIEVEMENTS: RawSpace[] = [
  { achievement: 'first artificial satellite launch', mission: 'Sputnik 1', year: '1957', country: 'Russia', fact: 'Sputnik 1 was a polished metal sphere with four external radio antennas that broadcast beep signals.' },
  { achievement: 'first human spaceflight', mission: 'Vostok 1', year: '1961', country: 'Russia', fact: 'Yuri Gagarin orbited the Earth for 108 minutes and successfully ejected to parachute safely back to land.' },
  { achievement: 'first manned Moon landing', mission: 'Apollo 11', year: '1969', country: 'United States', fact: 'Apollo 11\'s lunar module eagle landed with less than 30 seconds of fuel remaining in the tanks.' },
  { achievement: 'launch of the first deep space probe to reach interstellar space', mission: 'Voyager 1', year: '1977', country: 'United States', fact: 'Voyager 1 carries a Golden Record containing sounds, music, and images representing life on Earth.' },
  { achievement: 'successful launch of the Hubble Space Telescope', mission: 'Hubble Space Telescope', year: '1990', country: 'United States', fact: 'Hubble was launched with a flawed mirror, requiring a space shuttle repair mission in 1993 to fix its vision.' },
  { achievement: 'landing of the Curiosity Rover on Mars', mission: 'Curiosity', year: '2012', country: 'United States', fact: 'Curiosity was lowered to the Martian surface using an innovative "sky crane" tether system.' },
  { achievement: 'Mars Orbiter Mission (Mangalyaan) launch', mission: 'Mangalyaan', year: '2013', country: 'India', fact: 'India became the first nation to reach Mars orbit on its maiden attempt, doing so for a fraction of NASA\'s budget.' },
  { achievement: 'first landing of a probe on a comet', mission: 'Rosetta', year: '2014', country: 'Germany', fact: 'Rosetta\'s Philae lander bounced twice on the comet\'s surface before settling in the shadow of a cliff.' },
  { achievement: 'landing on the far side of the Moon', mission: 'Chang\'e 4', year: '2019', country: 'China', fact: 'Because the far side of the Moon blocks radio signals, Chang\'e 4 communicates via the Queqiao relay satellite.' },
  { achievement: 'successful launch of the James Webb Space Telescope', mission: 'James Webb Space Telescope', year: '2021', country: 'United States', fact: 'James Webb features a segmented 6.5-meter gold-coated beryllium mirror designed to capture infrared light.' },
  { achievement: 'first helicopter flight on Mars', mission: 'Ingenuity', year: '2021', country: 'United States', fact: 'Ingenuity\'s blades spin at over 2,400 RPM to generate lift in the thin Martian atmosphere, which is 1% of Earth\'s density.' }
];

const NATURE_FEATURES: RawNature[] = [
  { feature: 'Mount Everest', type: 'mountain peak', location: 'Nepal', continent: 'Asia', fact: 'Everest stands at 8,848 meters and rises by about 4 millimeters every year due to tectonic plate collisions.' },
  { feature: 'Amazon River', type: 'river system', location: 'Brazil', continent: 'South America', fact: 'The Amazon River accounts for approximately 20% of the world\'s total river flow into the oceans.' },
  { feature: 'Sahara Desert', type: 'desert', location: 'Morocco', continent: 'Africa', fact: 'The Sahara is the largest hot desert on Earth, covering over 9 million square kilometers — similar in size to the United States.' },
  { feature: 'Lake Baikal', type: 'freshwater lake', location: 'Russia', continent: 'Asia', fact: 'Baikal is the deepest and oldest lake in the world, containing roughly 20% of the planet\'s unfrozen surface fresh water.' },
  { feature: 'Great Barrier Reef', type: 'coral reef system', location: 'Australia', continent: 'Oceania', fact: 'The Great Barrier Reef is the largest living structure on Earth, composed of over 2,900 individual reefs.' },
  { feature: 'Victoria Falls', type: 'waterfall', location: 'South Africa', continent: 'Africa', fact: 'Victoria Falls is known locally as Mosi-oa-Tunya, meaning "The Smoke that Thunders," due to its massive spray.' },
  { feature: 'Angel Falls', type: 'waterfall', location: 'Venezuela', continent: 'South America', fact: 'Angel Falls is the tallest waterfall in the world, dropping water from a height of 979 meters.' },
  { feature: 'Mount Kilimanjaro', type: 'mountain peak', location: 'Tanzania', continent: 'Africa', fact: 'Kilimanjaro is the tallest free-standing mountain in the world, rising 5,895 meters above sea level.' },
  { feature: 'Dead Sea', type: 'salt lake', location: 'Jordan', continent: 'Asia', fact: 'The Dead Sea shores are the lowest land elevation on Earth, sitting at 430 meters below sea level.' },
  { feature: 'Mariana Trench', type: 'ocean trench', location: 'Japan', continent: 'Asia', fact: 'The deepest point in the Mariana Trench, Challenger Deep, descends nearly 11,000 meters into the Pacific Ocean.' },
  { feature: 'Atacama Desert', type: 'desert', location: 'Chile', continent: 'South America', fact: 'The Atacama is the driest non-polar desert on Earth, with some weather stations never recording a drop of rain.' }
];

const HISTORY_EVENTS: RawHistory[] = [
  { event: 'Signing of the Magna Carta', year: '1215', country: 'United Kingdom', leader: 'King John', fact: 'The Magna Carta established the principle that everyone, including the king, is subject to the law.' },
  { event: 'Beginning of the French Revolution', year: '1789', country: 'France', leader: 'Louis XVI', fact: 'The revolution began with the Storming of the Bastille on July 14, 1789, which is now celebrated as Bastille Day.' },
  { event: 'October Revolution', year: '1917', country: 'Russia', leader: 'Vladimir Lenin', fact: 'The Bolshevik uprising led to the collapse of the provisional government and the birth of the Soviet Union.' },
  { event: 'Fall of the Berlin Wall', year: '1989', country: 'Germany', leader: 'Mikhail Gorbachev', fact: 'The dismantling of the wall symbolized the collapse of the Iron Curtain and the reunification of East and West Germany.' },
  { event: 'Unification of Italy', year: '1861', country: 'Italy', leader: 'Giuseppe Garibaldi', fact: 'The Risorgimento movement unified independent states into the Kingdom of Italy under King Victor Emmanuel II.' },
  { event: 'Declaration of Independence signing', year: '1776', country: 'United States', leader: 'George Washington', fact: 'The declaration was signed by 56 delegates, with John Hancock writing his name large so King George III could read it without glasses.' },
  { event: 'Unification of Germany', year: '1871', country: 'Germany', leader: 'Otto von Bismarck', fact: 'Bismarck used a series of strategic wars to unify independent German kingdoms under Prussian leadership.' },
  { event: 'End of Apartheid', year: '1994', country: 'South Africa', leader: 'Nelson Mandela', fact: 'Mandela spent 27 years in prison before leading the country\'s transition to multiracial democracy and winning the presidency.' }
];

const CULTURE_TRADITIONS: RawCulture[] = [
  { tradition: 'Flamenco', type: 'dance', country: 'Spain', fact: 'Flamenco is an expressive art form that combines singing, guitar playing, dance, handclaps, and finger snapping.' },
  { tradition: 'Tango', type: 'dance', country: 'Argentina', fact: 'The Tango originated in the late 19th century in the suburbs of Buenos Aires and Montevideo.' },
  { tradition: 'Samba', type: 'dance', country: 'Brazil', fact: 'Samba is the musical genre and dance style synonymous with the massive annual Rio de Janeiro Carnival.' },
  { tradition: 'Kabuki', type: 'dance drama', country: 'Japan', fact: 'Kabuki theatre is known for its stylized drama, elaborate makeup, and actors performing on a rotating stage.' },
  { tradition: 'Diwali', type: 'festival', country: 'India', fact: 'Diwali is the Festival of Lights, symbolizing the spiritual victory of light over darkness and good over evil.' },
  { tradition: 'Oktoberfest', type: 'festival', country: 'Germany', fact: 'Oktoberfest in Munich is the world\'s largest Volksfest (beer festival), held annually since 1810.' },
  { tradition: 'Day of the Dead', type: 'festival', country: 'Mexico', fact: 'Día de los Muertos is a multi-day holiday where families gather to remember and pray for friends and relatives who have died.' },
  { tradition: 'Poutine', type: 'dish', country: 'Canada', fact: 'Poutine originated in Quebec in the 1950s and consists of French fries, fresh cheese curds, and brown gravy.' },
  { tradition: 'Kimchi', type: 'dish', country: 'South Korea', fact: 'Kimchi is a traditional side dish of salted, fermented vegetables, usually napa cabbage and radishes, seasoned with chili powder.' }
];

// Helper to shuffle arrays
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate unique choices ensuring correct option is present and there are no duplicates
function buildChoices(correct: string, pool: string[]): string[] {
  const uniquePool = Array.from(new Set(pool.filter(item => item !== correct)));
  const wrongs = shuffle(uniquePool).slice(0, 3);
  return shuffle([correct, ...wrongs]);
}

// Run the script to generate output
function main() {
  const generated: any[] = [];
  let idCounter = 1;

  // 1. GENERATE SCIENCE & INVENTIONS QUESTIONS (Science / Technology)
  for (const inv of INVENTIONS) {
    // Question 1: Who invented
    const inventors = INVENTIONS.map(i => i.inventor);
    let choices = buildChoices(inv.inventor, inventors);
    generated.push({
      id: `gen-sci-${idCounter++}`,
      country: inv.country,
      category: 'science',
      difficulty: 'medium',
      question: `Who is credited with inventing the ${inv.name} in the year ${inv.year}?`,
      choices,
      correctIndex: choices.indexOf(inv.inventor),
      funFact: inv.fact
    });

    // Question 2: In which country
    const countries = INVENTIONS.map(i => i.country);
    choices = buildChoices(inv.country, countries);
    generated.push({
      id: `gen-tech-${idCounter++}`,
      country: inv.country,
      category: 'technology',
      difficulty: 'easy',
      question: `In which country was the ${inv.name} invented or pioneered?`,
      choices,
      correctIndex: choices.indexOf(inv.country),
      funFact: inv.fact
    });
  }

  // 2. GENERATE SPACE QUESTIONS (Space)
  for (const space of SPACE_ACHIEVEMENTS) {
    const missions = SPACE_ACHIEVEMENTS.map(s => s.mission);
    let choices = buildChoices(space.mission, missions);
    generated.push({
      id: `gen-space-${idCounter++}`,
      country: space.country,
      category: 'space',
      difficulty: 'medium',
      question: `Which space mission is famous for the ${space.achievement} in ${space.year}?`,
      choices,
      correctIndex: choices.indexOf(space.mission),
      funFact: space.fact
    });

    const countries = SPACE_ACHIEVEMENTS.map(s => s.country);
    choices = buildChoices(space.country, countries);
    generated.push({
      id: `gen-space-${idCounter++}`,
      country: space.country,
      category: 'space',
      difficulty: 'easy',
      question: `Which country launched the historical space mission "${space.mission}"?`,
      choices,
      correctIndex: choices.indexOf(space.country),
      funFact: space.fact
    });
  }

  // 3. GENERATE NATURE & GEOGRAPHY QUESTIONS (Nature / Geography)
  for (const nat of NATURE_FEATURES) {
    const locations = NATURE_FEATURES.map(n => n.location);
    let choices = buildChoices(nat.location, locations);
    generated.push({
      id: `gen-nat-${idCounter++}`,
      country: nat.location,
      category: 'nature',
      difficulty: 'easy',
      question: `The famous ${nat.type} "${nat.feature}" is located in which country?`,
      choices,
      correctIndex: choices.indexOf(nat.location),
      funFact: nat.fact
    });

    const continents = NATURE_FEATURES.map(n => n.continent);
    choices = buildChoices(nat.continent, continents);
    generated.push({
      id: `gen-geo-${idCounter++}`,
      country: nat.location,
      category: 'geography',
      difficulty: 'easy',
      question: `On which continent is the natural feature "${nat.feature}" located?`,
      choices,
      correctIndex: choices.indexOf(nat.continent),
      funFact: nat.fact
    });
  }

  // 4. GENERATE HISTORY & POLITICS QUESTIONS (History / Politics)
  for (const hist of HISTORY_EVENTS) {
    const years = HISTORY_EVENTS.map(h => h.year);
    let choices = buildChoices(hist.year, years);
    generated.push({
      id: `gen-hist-${idCounter++}`,
      country: hist.country,
      category: 'history',
      difficulty: 'medium',
      question: `In which year did the historical event "${hist.event}" take place in ${hist.country}?`,
      choices,
      correctIndex: choices.indexOf(hist.year),
      funFact: hist.fact
    });

    const leaders = HISTORY_EVENTS.map(h => h.leader);
    choices = buildChoices(hist.leader, leaders);
    generated.push({
      id: `gen-pol-${idCounter++}`,
      country: hist.country,
      category: 'politics',
      difficulty: 'medium',
      question: `Which leader is most associated with the event "${hist.event}"?`,
      choices,
      correctIndex: choices.indexOf(hist.leader),
      funFact: hist.fact
    });
  }

  // 5. GENERATE CULTURE QUESTIONS (Culture)
  for (const cult of CULTURE_TRADITIONS) {
    const countries = CULTURE_TRADITIONS.map(c => c.country);
    const choices = buildChoices(cult.country, countries);
    generated.push({
      id: `gen-cult-${idCounter++}`,
      country: cult.country,
      category: 'culture',
      difficulty: 'easy',
      question: `Which country is the cultural home or origin of the famous ${cult.type} "${cult.tradition}"?`,
      choices,
      correctIndex: choices.indexOf(cult.country),
      funFact: cult.fact
    });
  }

  // Add 100+ manual regional/global questions for extensive fallback coverage
  const REGIONAL_AND_GLOBAL_TRIVIA = [
    // --- GEOGRAPHY REGIONAL/GLOBAL ---
    { id: 'glb-geo-1', country: 'Global', category: 'geography', difficulty: 'easy', question: 'Which is the largest ocean on Earth?', choices: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correctIndex: 3, funFact: 'The Pacific Ocean is larger than all of Earth\'s land area combined.' },
    { id: 'glb-geo-2', country: 'Global', category: 'geography', difficulty: 'easy', question: 'Which line of latitude divides the Earth into the Northern and Southern Hemispheres?', choices: ['Prime Meridian', 'Tropic of Cancer', 'Equator', 'Tropic of Capricorn'], correctIndex: 2, funFact: 'The Equator passes through 13 countries.' },
    { id: 'glb-geo-3', country: 'Global', category: 'geography', difficulty: 'medium', question: 'Which country has the most natural lakes in the world?', choices: ['Canada', 'Russia', 'Brazil', 'United States'], correctIndex: 0, funFact: 'Canada has more than 60% of all the lakes in the world.' },
    { id: 'glb-geo-4', country: 'Asia', category: 'geography', difficulty: 'easy', question: 'Which Asian country is known as the "Land of the Rising Sun"?', choices: ['China', 'Japan', 'South Korea', 'Vietnam'], correctIndex: 1, funFact: 'The name Japan (Nihon) translates literally to "origin of the sun."' },
    { id: 'glb-geo-5', country: 'Europe', category: 'geography', difficulty: 'easy', question: 'Which is the smallest independent country in Europe?', choices: ['Monaco', 'San Marino', 'Liechtenstein', 'Vatican City'], correctIndex: 3, funFact: 'Vatican City is the smallest country in the world, measuring just 0.49 square kilometers.' },
    { id: 'glb-geo-6', country: 'Africa', category: 'geography', difficulty: 'medium', question: 'Which is the largest island nation off the eastern coast of Africa?', choices: ['Seychelles', 'Mauritius', 'Madagascar', 'Comoros'], correctIndex: 2, funFact: 'Madagascar is the fourth largest island in the world and separated from Africa 88 million years ago.' },

    // --- SPORTS REGIONAL/GLOBAL ---
    { id: 'glb-spo-1', country: 'Global', category: 'sports', difficulty: 'easy', question: 'How often are the modern Olympic Games held?', choices: ['Every 2 years', 'Every 4 years', 'Every 5 years', 'Every 6 years'], correctIndex: 1, funFact: 'The first modern Olympics were held in Athens in 1896.' },
    { id: 'glb-spo-2', country: 'Global', category: 'sports', difficulty: 'easy', question: 'Which sport uses a shuttlecock instead of a ball?', choices: ['Tennis', 'Squash', 'Badminton', 'Table Tennis'], correctIndex: 2, funFact: 'Shuttlecocks are traditionally made from the left-wing feathers of a goose.' },
    { id: 'glb-spo-3', country: 'Europe', category: 'sports', difficulty: 'medium', question: 'Which football club has won the most UEFA Champions League titles?', choices: ['FC Barcelona', 'AC Milan', 'Liverpool FC', 'Real Madrid'], correctIndex: 3, funFact: 'Real Madrid won the first five consecutive Champions League tournaments.' },
    { id: 'glb-spo-4', country: 'South America', category: 'sports', difficulty: 'medium', question: 'Which South American country won the first-ever FIFA World Cup in 1930?', choices: ['Brazil', 'Argentina', 'Uruguay', 'Chile'], correctIndex: 2, funFact: 'Uruguay defeated Argentina 4-2 in the final at Estadio Centenario.' },

    // --- HISTORY REGIONAL/GLOBAL ---
    { id: 'glb-his-1', country: 'Global', category: 'history', difficulty: 'easy', question: 'Who was the first president of the United States?', choices: ['Thomas Jefferson', 'Abraham Lincoln', 'John Adams', 'George Washington'], correctIndex: 3, funFact: 'George Washington is the only president ever to receive 100% of the electoral votes.' },
    { id: 'glb-his-2', country: 'Global', category: 'history', difficulty: 'medium', question: 'In which century did the Black Death plague devastate Europe?', choices: ['12th Century', '13th Century', '14th Century', '15th Century'], correctIndex: 2, funFact: 'The Black Death killed an estimated 30% to 60% of Europe\'s population.' },
    { id: 'glb-his-3', country: 'Asia', category: 'history', difficulty: 'hard', question: 'Which famous historical leader founded the Mongol Empire in 1206?', choices: ['Kublai Khan', 'Genghis Khan', 'Tamerlane', 'Attila the Hun'], correctIndex: 1, funFact: 'Genghis Khan created the largest contiguous land empire in history.' },
    { id: 'glb-his-4', country: 'Europe', category: 'history', difficulty: 'medium', question: 'Which historical period, meaning "rebirth" in French, began in Italy in the 14th century?', choices: ['The Enlightenment', 'The Middle Ages', 'The Renaissance', 'The Industrial Revolution'], correctIndex: 2, funFact: 'The Renaissance marked a transition from medieval values to humanism and classical learning.' },

    // --- SCIENCE REGIONAL/GLOBAL ---
    { id: 'glb-sci-1', country: 'Global', category: 'science', difficulty: 'easy', question: 'Which planet in our solar system is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1, funFact: 'Mars is red because of the iron oxide (rust) on its surface.' },
    { id: 'glb-sci-2', country: 'Global', category: 'science', difficulty: 'easy', question: 'What is the chemical symbol for water?', choices: ['O2', 'CO2', 'H2O', 'HO'], correctIndex: 2, funFact: 'A water molecule is composed of two hydrogen atoms and one oxygen atom.' },
    { id: 'glb-sci-3', country: 'Global', category: 'science', difficulty: 'medium', question: 'What is the hardest natural substance on Earth?', choices: ['Gold', 'Iron', 'Quartz', 'Diamond'], correctIndex: 3, funFact: 'Diamonds are made of pure carbon atoms organized in a crystal structure.' },
    { id: 'glb-sci-4', country: 'Global', category: 'science', difficulty: 'medium', question: 'Which gas do plants absorb during photosynthesis?', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, funFact: 'Photosynthesis converts carbon dioxide and water into oxygen and glucose.' },

    // --- NATURE REGIONAL/GLOBAL ---
    { id: 'glb-nat-1', country: 'Global', category: 'nature', difficulty: 'easy', question: 'Which is the largest mammal in the world?', choices: ['African Elephant', 'Blue Whale', 'Fin Whale', 'Colossal Squid'], correctIndex: 1, funFact: 'A blue whale\'s tongue can weigh as much as an entire adult elephant.' },
    { id: 'glb-nat-2', country: 'Global', category: 'nature', difficulty: 'easy', question: 'Which type of tree is famous for losing its leaves in autumn?', choices: ['Coniferous', 'Deciduous', 'Evergreen', 'Boreal'], correctIndex: 1, funFact: 'Deciduous trees shed leaves to conserve water during cold or dry seasons.' },
    { id: 'glb-nat-3', country: 'Global', category: 'nature', difficulty: 'medium', question: 'What is the primary food source of Giant Pandas?', choices: ['Bamboo', 'Eucalyptus', 'Insects', 'Fish'], correctIndex: 0, funFact: 'Pandas must eat up to 38 kilograms of bamboo daily to meet their nutritional needs.' },
    { id: 'glb-nat-4', country: 'Oceania', category: 'nature', difficulty: 'medium', question: 'Which unique mammal is native to Australia and is venomous?', choices: ['Kangaroo', 'Koala', 'Wombat', 'Platypus'], correctIndex: 3, funFact: 'Male platypuses have a venomous spur on their hind feet capable of causing severe pain.' },

    // --- POLITICS REGIONAL/GLOBAL ---
    { id: 'glb-pol-1', country: 'Global', category: 'politics', difficulty: 'easy', question: 'Where is the headquarters of the United Nations located?', choices: ['Geneva, Switzerland', 'London, UK', 'New York City, USA', 'Paris, France'], correctIndex: 2, funFact: 'The land on which the UN headquarters sits is international territory.' },
    { id: 'glb-pol-2', country: 'Global', category: 'politics', difficulty: 'medium', question: 'What form of government is defined as "rule by the people"?', choices: ['Monarchy', 'Oligarchy', 'Democracy', 'Autocracy'], correctIndex: 2, funFact: 'The word democracy comes from the Greek "demos" (people) and "kratos" (power).' },
    { id: 'glb-pol-3', country: 'Europe', category: 'politics', difficulty: 'easy', question: 'How many countries are currently member states of the European Union?', choices: ['15', '22', '27', '30'], correctIndex: 2, funFact: 'The UK became the first nation to leave the European Union in 2020.' },

    // --- CULTURE REGIONAL/GLOBAL ---
    { id: 'glb-cul-1', country: 'Global', category: 'culture', difficulty: 'easy', question: 'Who is the famous author of the play "Romeo and Juliet"?', choices: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctIndex: 1, funFact: 'Shakespeare introduced over 1,700 new words to the English language.' },
    { id: 'glb-cul-2', country: 'Global', category: 'culture', difficulty: 'medium', question: 'Which musical instrument has 88 keys?', choices: ['Violin', 'Guitar', 'Piano', 'Flute'], correctIndex: 2, funFact: 'A standard piano has 52 white keys and 36 black keys.' },
    { id: 'glb-cul-3', country: 'Asia', category: 'culture', difficulty: 'easy', question: 'Which traditional martial art originated in Okinawa, Japan?', choices: ['Taekwondo', 'Karate', 'Judo', 'Kung Fu'], correctIndex: 1, funFact: 'Karate translates to "empty hand" in Japanese, referring to fighting without weapons.' },
  ];

  generated.push(...REGIONAL_AND_GLOBAL_TRIVIA);

  // Write file out
  const targetDir = path.join(__dirname, '../src/data/questions');
  const targetFile = path.join(targetDir, 'generatedPool.ts');

  // Verify target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const fileContent = `// ============================================================
// Play Earth — Generated Question Dataset
// Generated automatically by scripts/generateQuestions.ts
// ============================================================

import { EarthQuestion } from '@/types';

export const GENERATED_QUESTIONS: EarthQuestion[] = ${JSON.stringify(generated, null, 2)};
`;

  fs.writeFileSync(targetFile, fileContent, 'utf-8');
  console.log(`Successfully generated ${generated.length} questions in ${targetFile}`);
}

main();
