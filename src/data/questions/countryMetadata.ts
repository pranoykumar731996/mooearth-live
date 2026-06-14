// ============================================================
// Play Earth — Country Metadata for Procedural Question Generation
// ============================================================

export interface CountryMeta {
  name: string;
  capital: string;
  continent: string;
  currency: string;
  language: string;
  population: string;       // Approximate (e.g., "1.4 billion")
  landmark: string;
  flag: string;             // Emoji flag
  funFact: string;
  famousPerson?: string;
  famousDish?: string;
  sport?: string;
  climate?: string;
  independence?: string;    // Year or note
  neighbours?: string[];
}

export const COUNTRY_METADATA: Record<string, CountryMeta> = {
  'Brazil': {
    name: 'Brazil', capital: 'Brasília', continent: 'South America', currency: 'Brazilian Real',
    language: 'Portuguese', population: '215 million', landmark: 'Christ the Redeemer',
    flag: '🇧🇷', funFact: 'Brazil has the largest tropical rainforest in the world — the Amazon.',
    famousPerson: 'Pelé', famousDish: 'Feijoada', sport: 'Football',
    climate: 'Tropical', independence: '1822', neighbours: ['Argentina', 'Colombia', 'Peru'],
  },
  'Argentina': {
    name: 'Argentina', capital: 'Buenos Aires', continent: 'South America', currency: 'Argentine Peso',
    language: 'Spanish', population: '46 million', landmark: 'Obelisco de Buenos Aires',
    flag: '🇦🇷', funFact: 'Argentina is home to the widest avenue in the world, Avenida 9 de Julio.',
    famousPerson: 'Lionel Messi', famousDish: 'Asado', sport: 'Football',
    climate: 'Temperate', independence: '1816', neighbours: ['Brazil', 'Chile', 'Uruguay'],
  },
  'United States': {
    name: 'United States', capital: 'Washington D.C.', continent: 'North America', currency: 'US Dollar',
    language: 'English', population: '331 million', landmark: 'Statue of Liberty',
    flag: '🇺🇸', funFact: 'The US has more tornadoes than any other country in the world.',
    famousPerson: 'Neil Armstrong', famousDish: 'Hamburger', sport: 'American Football',
    climate: 'Varied', independence: '1776', neighbours: ['Canada', 'Mexico'],
  },
  'United Kingdom': {
    name: 'United Kingdom', capital: 'London', continent: 'Europe', currency: 'British Pound',
    language: 'English', population: '67 million', landmark: 'Big Ben',
    flag: '🇬🇧', funFact: 'The London Underground was the world\'s first underground railway, opening in 1863.',
    famousPerson: 'William Shakespeare', famousDish: 'Fish and Chips', sport: 'Football',
    climate: 'Temperate Maritime', independence: 'N/A', neighbours: ['Ireland'],
  },
  'France': {
    name: 'France', capital: 'Paris', continent: 'Europe', currency: 'Euro',
    language: 'French', population: '68 million', landmark: 'Eiffel Tower',
    flag: '🇫🇷', funFact: 'France is the most visited country in the world with over 89 million tourists annually.',
    famousPerson: 'Napoleon Bonaparte', famousDish: 'Croissant', sport: 'Football',
    climate: 'Temperate', independence: '843', neighbours: ['Germany', 'Spain', 'Italy', 'Belgium'],
  },
  'Germany': {
    name: 'Germany', capital: 'Berlin', continent: 'Europe', currency: 'Euro',
    language: 'German', population: '84 million', landmark: 'Brandenburg Gate',
    flag: '🇩🇪', funFact: 'Germany has over 1,500 different types of beer and holds Oktoberfest annually.',
    famousPerson: 'Albert Einstein', famousDish: 'Bratwurst', sport: 'Football',
    climate: 'Temperate', independence: '1871', neighbours: ['France', 'Poland', 'Austria'],
  },
  'Spain': {
    name: 'Spain', capital: 'Madrid', continent: 'Europe', currency: 'Euro',
    language: 'Spanish', population: '47 million', landmark: 'Sagrada Família',
    flag: '🇪🇸', funFact: 'Spain has the second highest number of UNESCO World Heritage Sites after Italy.',
    famousPerson: 'Pablo Picasso', famousDish: 'Paella', sport: 'Football',
    climate: 'Mediterranean', independence: '1479', neighbours: ['France', 'Portugal'],
  },
  'Italy': {
    name: 'Italy', capital: 'Rome', continent: 'Europe', currency: 'Euro',
    language: 'Italian', population: '60 million', landmark: 'Colosseum',
    flag: '🇮🇹', funFact: 'Italy has the most UNESCO World Heritage Sites of any country in the world.',
    famousPerson: 'Leonardo da Vinci', famousDish: 'Pizza', sport: 'Football',
    climate: 'Mediterranean', independence: '1861', neighbours: ['France', 'Switzerland', 'Austria'],
  },
  'Japan': {
    name: 'Japan', capital: 'Tokyo', continent: 'Asia', currency: 'Japanese Yen',
    language: 'Japanese', population: '125 million', landmark: 'Mount Fuji',
    flag: '🇯🇵', funFact: 'Japan has over 6,800 islands, but most people live on just four of them.',
    famousPerson: 'Hayao Miyazaki', famousDish: 'Sushi', sport: 'Baseball',
    climate: 'Temperate to Subtropical', independence: '660 BC (traditional)', neighbours: ['South Korea', 'China'],
  },
  'India': {
    name: 'India', capital: 'New Delhi', continent: 'Asia', currency: 'Indian Rupee',
    language: 'Hindi & English', population: '1.4 billion', landmark: 'Taj Mahal',
    flag: '🇮🇳', funFact: 'India has the largest number of post offices in the world — over 155,000.',
    famousPerson: 'Mahatma Gandhi', famousDish: 'Biryani', sport: 'Cricket',
    climate: 'Tropical Monsoon', independence: '1947', neighbours: ['China', 'Pakistan', 'Nepal'],
  },
  'China': {
    name: 'China', capital: 'Beijing', continent: 'Asia', currency: 'Chinese Yuan',
    language: 'Mandarin Chinese', population: '1.4 billion', landmark: 'Great Wall of China',
    flag: '🇨🇳', funFact: 'China\'s Great Wall stretches over 21,000 kilometers.',
    famousPerson: 'Confucius', famousDish: 'Peking Duck', sport: 'Table Tennis',
    climate: 'Varied', independence: '221 BC (unified)', neighbours: ['India', 'Japan', 'South Korea', 'Russia'],
  },
  'Australia': {
    name: 'Australia', capital: 'Canberra', continent: 'Oceania', currency: 'Australian Dollar',
    language: 'English', population: '26 million', landmark: 'Sydney Opera House',
    flag: '🇦🇺', funFact: 'Australia has more kangaroos than people — about 50 million kangaroos.',
    famousPerson: 'Steve Irwin', famousDish: 'Vegemite on Toast', sport: 'Cricket',
    climate: 'Arid & Tropical', independence: '1901', neighbours: ['New Zealand'],
  },
  'Canada': {
    name: 'Canada', capital: 'Ottawa', continent: 'North America', currency: 'Canadian Dollar',
    language: 'English & French', population: '40 million', landmark: 'CN Tower',
    flag: '🇨🇦', funFact: 'Canada has the longest coastline of any country in the world — 243,042 km.',
    famousPerson: 'Terry Fox', famousDish: 'Poutine', sport: 'Ice Hockey',
    climate: 'Continental', independence: '1867', neighbours: ['United States'],
  },
  'Mexico': {
    name: 'Mexico', capital: 'Mexico City', continent: 'North America', currency: 'Mexican Peso',
    language: 'Spanish', population: '130 million', landmark: 'Chichén Itzá',
    flag: '🇲🇽', funFact: 'Mexico City was built on the ruins of the ancient Aztec capital, Tenochtitlán.',
    famousPerson: 'Frida Kahlo', famousDish: 'Tacos', sport: 'Football',
    climate: 'Tropical to Arid', independence: '1821', neighbours: ['United States'],
  },
  'South Korea': {
    name: 'South Korea', capital: 'Seoul', continent: 'Asia', currency: 'South Korean Won',
    language: 'Korean', population: '52 million', landmark: 'Gyeongbokgung Palace',
    flag: '🇰🇷', funFact: 'South Korea has the fastest average internet speed in the world.',
    famousPerson: 'BTS', famousDish: 'Kimchi', sport: 'Esports',
    climate: 'Temperate', independence: '1945', neighbours: ['Japan', 'China'],
  },
  'Morocco': {
    name: 'Morocco', capital: 'Rabat', continent: 'Africa', currency: 'Moroccan Dirham',
    language: 'Arabic & Berber', population: '37 million', landmark: 'Hassan II Mosque',
    flag: '🇲🇦', funFact: 'Morocco is home to the world\'s oldest university, the University of al-Qarawiyyin, founded in 859 AD.',
    famousPerson: 'Ibn Battuta', famousDish: 'Tagine', sport: 'Football',
    climate: 'Mediterranean', independence: '1956', neighbours: ['Algeria', 'Spain'],
  },
  'Portugal': {
    name: 'Portugal', capital: 'Lisbon', continent: 'Europe', currency: 'Euro',
    language: 'Portuguese', population: '10 million', landmark: 'Belém Tower',
    flag: '🇵🇹', funFact: 'Portugal is the oldest nation state in Europe, with the same borders since 1249.',
    famousPerson: 'Cristiano Ronaldo', famousDish: 'Pastel de Nata', sport: 'Football',
    climate: 'Mediterranean', independence: '1143', neighbours: ['Spain'],
  },
  'Netherlands': {
    name: 'Netherlands', capital: 'Amsterdam', continent: 'Europe', currency: 'Euro',
    language: 'Dutch', population: '17 million', landmark: 'Anne Frank House',
    flag: '🇳🇱', funFact: 'About one-third of the Netherlands lies below sea level.',
    famousPerson: 'Vincent van Gogh', famousDish: 'Stroopwafel', sport: 'Football',
    climate: 'Temperate Maritime', independence: '1581', neighbours: ['Germany', 'Belgium'],
  },
  'Belgium': {
    name: 'Belgium', capital: 'Brussels', continent: 'Europe', currency: 'Euro',
    language: 'Dutch, French & German', population: '11.5 million', landmark: 'Grand Place',
    flag: '🇧🇪', funFact: 'Belgium produces over 220,000 tonnes of chocolate per year.',
    famousPerson: 'Audrey Hepburn', famousDish: 'Belgian Waffles', sport: 'Football',
    climate: 'Temperate Maritime', independence: '1830', neighbours: ['France', 'Germany', 'Netherlands'],
  },
  'Croatia': {
    name: 'Croatia', capital: 'Zagreb', continent: 'Europe', currency: 'Euro',
    language: 'Croatian', population: '4 million', landmark: 'Dubrovnik Old Town',
    flag: '🇭🇷', funFact: 'The necktie (cravat) was invented in Croatia — the word derives from "Croat".',
    famousPerson: 'Luka Modrić', famousDish: 'Ćevapi', sport: 'Football',
    climate: 'Mediterranean', independence: '1991', neighbours: ['Italy', 'Hungary', 'Serbia'],
  },
  'Uruguay': {
    name: 'Uruguay', capital: 'Montevideo', continent: 'South America', currency: 'Uruguayan Peso',
    language: 'Spanish', population: '3.5 million', landmark: 'Estadio Centenario',
    flag: '🇺🇾', funFact: 'Uruguay hosted and won the very first FIFA World Cup in 1930.',
    famousPerson: 'Luis Suárez', famousDish: 'Chivito', sport: 'Football',
    climate: 'Temperate', independence: '1825', neighbours: ['Argentina', 'Brazil'],
  },
  'Colombia': {
    name: 'Colombia', capital: 'Bogotá', continent: 'South America', currency: 'Colombian Peso',
    language: 'Spanish', population: '52 million', landmark: 'Cartagena Old Town',
    flag: '🇨🇴', funFact: 'Colombia is the world\'s leading producer of emeralds.',
    famousPerson: 'Shakira', famousDish: 'Bandeja Paisa', sport: 'Football',
    climate: 'Tropical', independence: '1810', neighbours: ['Venezuela', 'Brazil', 'Peru'],
  },
  'Senegal': {
    name: 'Senegal', capital: 'Dakar', continent: 'Africa', currency: 'West African CFA Franc',
    language: 'French', population: '17 million', landmark: 'African Renaissance Monument',
    flag: '🇸🇳', funFact: 'Senegal is home to the Dakar Rally, one of the world\'s toughest motorsport events.',
    famousPerson: 'Sadio Mané', famousDish: 'Thieboudienne', sport: 'Football',
    climate: 'Tropical', independence: '1960', neighbours: ['Mauritania', 'Mali'],
  },
  // Extended countries for worldwide coverage
  'Russia': {
    name: 'Russia', capital: 'Moscow', continent: 'Europe/Asia', currency: 'Russian Ruble',
    language: 'Russian', population: '144 million', landmark: 'Red Square',
    flag: '🇷🇺', funFact: 'Russia spans 11 time zones, more than any other country.',
    famousPerson: 'Leo Tolstoy', famousDish: 'Borscht', sport: 'Ice Hockey',
    climate: 'Subarctic to Subtropical', independence: '1991', neighbours: ['China', 'Finland', 'Poland'],
  },
  'Egypt': {
    name: 'Egypt', capital: 'Cairo', continent: 'Africa', currency: 'Egyptian Pound',
    language: 'Arabic', population: '104 million', landmark: 'Great Pyramid of Giza',
    flag: '🇪🇬', funFact: 'The Great Pyramid of Giza is the only surviving Wonder of the Ancient World.',
    famousPerson: 'Mohamed Salah', famousDish: 'Koshari', sport: 'Football',
    climate: 'Desert', independence: '1922', neighbours: ['Libya', 'Sudan', 'Israel'],
  },
  'South Africa': {
    name: 'South Africa', capital: 'Pretoria', continent: 'Africa', currency: 'South African Rand',
    language: 'Zulu, Xhosa, Afrikaans, English & 7 others', population: '60 million', landmark: 'Table Mountain',
    flag: '🇿🇦', funFact: 'South Africa has 11 official languages — the most of any country.',
    famousPerson: 'Nelson Mandela', famousDish: 'Bobotie', sport: 'Rugby',
    climate: 'Varied', independence: '1910', neighbours: ['Namibia', 'Botswana', 'Mozambique'],
  },
  'Nigeria': {
    name: 'Nigeria', capital: 'Abuja', continent: 'Africa', currency: 'Nigerian Naira',
    language: 'English', population: '223 million', landmark: 'Zuma Rock',
    flag: '🇳🇬', funFact: 'Nigeria has the largest film industry in Africa — Nollywood produces over 2,500 films a year.',
    famousPerson: 'Wole Soyinka', famousDish: 'Jollof Rice', sport: 'Football',
    climate: 'Tropical', independence: '1960', neighbours: ['Cameroon', 'Niger', 'Benin'],
  },
  'Turkey': {
    name: 'Turkey', capital: 'Ankara', continent: 'Europe/Asia', currency: 'Turkish Lira',
    language: 'Turkish', population: '85 million', landmark: 'Hagia Sophia',
    flag: '🇹🇷', funFact: 'Turkey is the only country in the world that spans two continents — Europe and Asia.',
    famousPerson: 'Mustafa Kemal Atatürk', famousDish: 'Kebab', sport: 'Football',
    climate: 'Mediterranean', independence: '1923', neighbours: ['Greece', 'Syria', 'Iran'],
  },
  'Saudi Arabia': {
    name: 'Saudi Arabia', capital: 'Riyadh', continent: 'Asia', currency: 'Saudi Riyal',
    language: 'Arabic', population: '36 million', landmark: 'Mecca (Masjid al-Haram)',
    flag: '🇸🇦', funFact: 'Saudi Arabia has no rivers — it is the largest country in the world without any permanent rivers.',
    famousPerson: 'King Salman', famousDish: 'Kabsa', sport: 'Football',
    climate: 'Desert', independence: '1932', neighbours: ['Jordan', 'Iraq', 'UAE'],
  },
  'Indonesia': {
    name: 'Indonesia', capital: 'Jakarta', continent: 'Asia', currency: 'Indonesian Rupiah',
    language: 'Indonesian', population: '275 million', landmark: 'Borobudur Temple',
    flag: '🇮🇩', funFact: 'Indonesia has over 17,000 islands — more than any other country in the world.',
    famousPerson: 'Soekarno', famousDish: 'Nasi Goreng', sport: 'Badminton',
    climate: 'Tropical', independence: '1945', neighbours: ['Malaysia', 'Australia'],
  },
  'Thailand': {
    name: 'Thailand', capital: 'Bangkok', continent: 'Asia', currency: 'Thai Baht',
    language: 'Thai', population: '72 million', landmark: 'Grand Palace',
    flag: '🇹🇭', funFact: 'Thailand is the only Southeast Asian country that was never colonized by a European power.',
    famousPerson: 'Tony Jaa', famousDish: 'Pad Thai', sport: 'Muay Thai',
    climate: 'Tropical', independence: 'Never colonized', neighbours: ['Myanmar', 'Cambodia', 'Malaysia'],
  },
  'Sweden': {
    name: 'Sweden', capital: 'Stockholm', continent: 'Europe', currency: 'Swedish Krona',
    language: 'Swedish', population: '10 million', landmark: 'Vasa Museum',
    flag: '🇸🇪', funFact: 'Sweden invented the concept of the modern Nobel Prize, first awarded in 1901.',
    famousPerson: 'Alfred Nobel', famousDish: 'Swedish Meatballs', sport: 'Ice Hockey',
    climate: 'Subarctic to Temperate', independence: '1523', neighbours: ['Norway', 'Finland'],
  },
  'Norway': {
    name: 'Norway', capital: 'Oslo', continent: 'Europe', currency: 'Norwegian Krone',
    language: 'Norwegian', population: '5.4 million', landmark: 'Fjords',
    flag: '🇳🇴', funFact: 'Norway\'s coastline, including all its fjords and islands, stretches over 100,000 km.',
    famousPerson: 'Edvard Munch', famousDish: 'Lutefisk', sport: 'Cross-Country Skiing',
    climate: 'Subarctic to Temperate', independence: '1905', neighbours: ['Sweden', 'Finland'],
  },
  'Switzerland': {
    name: 'Switzerland', capital: 'Bern', continent: 'Europe', currency: 'Swiss Franc',
    language: 'German, French, Italian & Romansh', population: '9 million', landmark: 'Matterhorn',
    flag: '🇨🇭', funFact: 'Switzerland has enough nuclear bunkers to shelter its entire population.',
    famousPerson: 'Roger Federer', famousDish: 'Fondue', sport: 'Tennis',
    climate: 'Alpine', independence: '1291', neighbours: ['France', 'Germany', 'Italy', 'Austria'],
  },
  'Poland': {
    name: 'Poland', capital: 'Warsaw', continent: 'Europe', currency: 'Polish Złoty',
    language: 'Polish', population: '38 million', landmark: 'Wawel Castle',
    flag: '🇵🇱', funFact: 'Poland is home to the Wieliczka Salt Mine, a UNESCO World Heritage Site carved entirely from salt.',
    famousPerson: 'Marie Curie', famousDish: 'Pierogi', sport: 'Football',
    climate: 'Temperate', independence: '1918', neighbours: ['Germany', 'Czech Republic', 'Ukraine'],
  },
  'Greece': {
    name: 'Greece', capital: 'Athens', continent: 'Europe', currency: 'Euro',
    language: 'Greek', population: '10.5 million', landmark: 'Parthenon',
    flag: '🇬🇷', funFact: 'Greece has more archaeological museums than any other country in the world.',
    famousPerson: 'Socrates', famousDish: 'Moussaka', sport: 'Football',
    climate: 'Mediterranean', independence: '1821', neighbours: ['Turkey', 'Bulgaria', 'Albania'],
  },
  'Kenya': {
    name: 'Kenya', capital: 'Nairobi', continent: 'Africa', currency: 'Kenyan Shilling',
    language: 'Swahili & English', population: '54 million', landmark: 'Mount Kenya',
    flag: '🇰🇪', funFact: 'Kenya is famous for the Great Wildebeest Migration in the Masai Mara.',
    famousPerson: 'Eliud Kipchoge', famousDish: 'Nyama Choma', sport: 'Long-Distance Running',
    climate: 'Tropical', independence: '1963', neighbours: ['Tanzania', 'Uganda', 'Ethiopia'],
  },
  'New Zealand': {
    name: 'New Zealand', capital: 'Wellington', continent: 'Oceania', currency: 'New Zealand Dollar',
    language: 'English & Māori', population: '5 million', landmark: 'Milford Sound',
    flag: '🇳🇿', funFact: 'New Zealand was the first country to give women the right to vote in 1893.',
    famousPerson: 'Sir Edmund Hillary', famousDish: 'Pavlova', sport: 'Rugby',
    climate: 'Temperate Maritime', independence: '1907', neighbours: ['Australia'],
  },
  'Peru': {
    name: 'Peru', capital: 'Lima', continent: 'South America', currency: 'Peruvian Sol',
    language: 'Spanish', population: '34 million', landmark: 'Machu Picchu',
    flag: '🇵🇪', funFact: 'Machu Picchu was built in the 15th century and never discovered by Spanish colonizers.',
    famousPerson: 'Mario Vargas Llosa', famousDish: 'Ceviche', sport: 'Football',
    climate: 'Tropical to Alpine', independence: '1821', neighbours: ['Brazil', 'Colombia', 'Chile'],
  },
  'Chile': {
    name: 'Chile', capital: 'Santiago', continent: 'South America', currency: 'Chilean Peso',
    language: 'Spanish', population: '19 million', landmark: 'Atacama Desert',
    flag: '🇨🇱', funFact: 'Chile\'s Atacama Desert is the driest place on Earth — some areas haven\'t seen rain in centuries.',
    famousPerson: 'Arturo Vidal', famousDish: 'Empanada', sport: 'Football',
    climate: 'Arid to Subpolar', independence: '1818', neighbours: ['Argentina', 'Peru', 'Bolivia'],
  },
};

/** Get all country names with metadata */
export function getMetadataCountries(): string[] {
  return Object.keys(COUNTRY_METADATA);
}

/** Lookup metadata for a country name (fuzzy match) */
export function findCountryMeta(name: string): CountryMeta | null {
  if (!name) return null;
  const norm = name.toLowerCase().trim();
  // Direct match
  for (const [key, meta] of Object.entries(COUNTRY_METADATA)) {
    if (key.toLowerCase() === norm) return meta;
  }
  // Partial match
  for (const [key, meta] of Object.entries(COUNTRY_METADATA)) {
    const keyLower = key.toLowerCase();
    if (norm.includes(keyLower) || keyLower.includes(norm)) return meta;
  }
  // Alias check
  if (norm === 'usa' || norm === 'us' || norm === 'united states of america') return COUNTRY_METADATA['United States'];
  if (norm === 'uk' || norm === 'england' || norm === 'great britain') return COUNTRY_METADATA['United Kingdom'];
  if (norm === 'türkiye' || norm === 'turkiye') return COUNTRY_METADATA['Turkey'];
  return null;
}
