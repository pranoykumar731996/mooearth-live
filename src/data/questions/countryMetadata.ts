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
  'Libya': {
    name: 'Libya', capital: 'Tripoli', continent: 'Africa', currency: 'Libyan Dinar',
    language: 'Arabic', population: '7 million', landmark: 'Leptis Magna',
    flag: '🇱🇾', funFact: 'Libya has the largest proven oil reserves in Africa and is home to the stunning ancient Roman city of Leptis Magna.',
    famousPerson: 'Omar Mukhtar', famousDish: 'Couscous', sport: 'Football',
    climate: 'Desert', independence: '1951', neighbours: ['Egypt', 'Tunisia', 'Algeria', 'Chad', 'Niger', 'Sudan'],
  },

  // ============ ASIA — EXPANDED ============
  'Iran': {
    name: 'Iran', capital: 'Tehran', continent: 'Asia', currency: 'Iranian Rial',
    language: 'Persian (Farsi)', population: '88 million', landmark: 'Persepolis',
    flag: '🇮🇷', funFact: 'Iran is home to one of the oldest civilizations in the world, dating back to 3200 BC.',
    famousPerson: 'Rumi', famousDish: 'Ghormeh Sabzi', sport: 'Wrestling',
    climate: 'Arid', independence: '1979 (Islamic Revolution)', neighbours: ['Iraq', 'Turkey', 'Afghanistan', 'Pakistan'],
  },
  'Cambodia': {
    name: 'Cambodia', capital: 'Phnom Penh', continent: 'Asia', currency: 'Cambodian Riel',
    language: 'Khmer', population: '17 million', landmark: 'Angkor Wat',
    flag: '🇰🇭', funFact: 'Angkor Wat in Cambodia is the largest religious monument in the world.',
    famousPerson: 'King Norodom Sihanouk', famousDish: 'Amok', sport: 'Football',
    climate: 'Tropical', independence: '1953', neighbours: ['Thailand', 'Vietnam', 'Laos'],
  },
  'Pakistan': {
    name: 'Pakistan', capital: 'Islamabad', continent: 'Asia', currency: 'Pakistani Rupee',
    language: 'Urdu & English', population: '230 million', landmark: 'Badshahi Mosque',
    flag: '🇵🇰', funFact: 'Pakistan is home to K2, the second tallest mountain in the world.',
    famousPerson: 'Imran Khan', famousDish: 'Biryani', sport: 'Cricket',
    climate: 'Arid to Tropical', independence: '1947', neighbours: ['India', 'China', 'Afghanistan', 'Iran'],
  },
  'Bangladesh': {
    name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia', currency: 'Bangladeshi Taka',
    language: 'Bengali', population: '170 million', landmark: 'Sundarbans',
    flag: '🇧🇩', funFact: 'Bangladesh is home to the Sundarbans, the largest mangrove forest in the world.',
    famousPerson: 'Sheikh Mujibur Rahman', famousDish: 'Hilsa Fish Curry', sport: 'Cricket',
    climate: 'Tropical Monsoon', independence: '1971', neighbours: ['India', 'Myanmar'],
  },
  'Vietnam': {
    name: 'Vietnam', capital: 'Hanoi', continent: 'Asia', currency: 'Vietnamese Dong',
    language: 'Vietnamese', population: '100 million', landmark: 'Ha Long Bay',
    flag: '🇻🇳', funFact: 'Vietnam is the world\'s largest exporter of cashew nuts and black pepper.',
    famousPerson: 'Ho Chi Minh', famousDish: 'Pho', sport: 'Football',
    climate: 'Tropical', independence: '1945', neighbours: ['China', 'Laos', 'Cambodia'],
  },
  'Philippines': {
    name: 'Philippines', capital: 'Manila', continent: 'Asia', currency: 'Philippine Peso',
    language: 'Filipino & English', population: '115 million', landmark: 'Chocolate Hills',
    flag: '🇵🇭', funFact: 'The Philippines has over 7,600 islands, and is named after King Philip II of Spain.',
    famousPerson: 'Manny Pacquiao', famousDish: 'Adobo', sport: 'Boxing',
    climate: 'Tropical', independence: '1946', neighbours: ['Indonesia', 'Taiwan'],
  },
  'Malaysia': {
    name: 'Malaysia', capital: 'Kuala Lumpur', continent: 'Asia', currency: 'Malaysian Ringgit',
    language: 'Malay', population: '33 million', landmark: 'Petronas Twin Towers',
    flag: '🇲🇾', funFact: 'Malaysia\'s Petronas Twin Towers were the tallest buildings in the world from 1998 to 2004.',
    famousPerson: 'Lee Chong Wei', famousDish: 'Nasi Lemak', sport: 'Badminton',
    climate: 'Tropical', independence: '1957', neighbours: ['Thailand', 'Singapore', 'Indonesia'],
  },
  'Israel': {
    name: 'Israel', capital: 'Jerusalem', continent: 'Asia', currency: 'Israeli Shekel',
    language: 'Hebrew & Arabic', population: '9.5 million', landmark: 'Western Wall',
    flag: '🇮🇱', funFact: 'Israel is one of the smallest countries in the world but has more startups per capita than any other nation.',
    famousPerson: 'Albert Einstein (honorary)', famousDish: 'Falafel', sport: 'Football',
    climate: 'Mediterranean', independence: '1948', neighbours: ['Lebanon', 'Syria', 'Jordan', 'Egypt'],
  },
  'Singapore': {
    name: 'Singapore', capital: 'Singapore', continent: 'Asia', currency: 'Singapore Dollar',
    language: 'English, Malay, Mandarin & Tamil', population: '6 million', landmark: 'Marina Bay Sands',
    flag: '🇸🇬', funFact: 'Singapore is a city-state and one of only three surviving sovereign city-states in the world.',
    famousPerson: 'Lee Kuan Yew', famousDish: 'Hainanese Chicken Rice', sport: 'Football',
    climate: 'Tropical', independence: '1965', neighbours: ['Malaysia', 'Indonesia'],
  },
  'Iraq': {
    name: 'Iraq', capital: 'Baghdad', continent: 'Asia', currency: 'Iraqi Dinar',
    language: 'Arabic & Kurdish', population: '43 million', landmark: 'Ziggurat of Ur',
    flag: '🇮🇶', funFact: 'Iraq is home to ancient Mesopotamia, often called the "Cradle of Civilization".',
    famousPerson: 'Zaha Hadid', famousDish: 'Masgouf', sport: 'Football',
    climate: 'Desert', independence: '1932', neighbours: ['Iran', 'Turkey', 'Syria', 'Kuwait', 'Saudi Arabia'],
  },
  'Afghanistan': {
    name: 'Afghanistan', capital: 'Kabul', continent: 'Asia', currency: 'Afghan Afghani',
    language: 'Pashto & Dari', population: '40 million', landmark: 'Bamiyan Buddhas',
    flag: '🇦🇫', funFact: 'Afghanistan is known as the "Graveyard of Empires" due to the many invaders it has resisted.',
    famousPerson: 'Rumi (born in Balkh)', famousDish: 'Kabuli Pulao', sport: 'Cricket',
    climate: 'Arid to Alpine', independence: '1919', neighbours: ['Pakistan', 'Iran', 'China'],
  },
  'Nepal': {
    name: 'Nepal', capital: 'Kathmandu', continent: 'Asia', currency: 'Nepalese Rupee',
    language: 'Nepali', population: '30 million', landmark: 'Mount Everest',
    flag: '🇳🇵', funFact: 'Nepal has the only non-rectangular national flag in the world — it consists of two overlapping triangles.',
    famousPerson: 'Tenzing Norgay', famousDish: 'Dal Bhat', sport: 'Cricket',
    climate: 'Alpine to Tropical', independence: 'Never colonized', neighbours: ['India', 'China'],
  },
  'Sri Lanka': {
    name: 'Sri Lanka', capital: 'Sri Jayawardenepura Kotte', continent: 'Asia', currency: 'Sri Lankan Rupee',
    language: 'Sinhala & Tamil', population: '22 million', landmark: 'Sigiriya Rock Fortress',
    flag: '🇱🇰', funFact: 'Sri Lanka was known as Ceylon and is the world\'s fourth-largest tea producer.',
    famousPerson: 'Muttiah Muralitharan', famousDish: 'Rice and Curry', sport: 'Cricket',
    climate: 'Tropical', independence: '1948', neighbours: ['India'],
  },
  'Myanmar': {
    name: 'Myanmar', capital: 'Naypyidaw', continent: 'Asia', currency: 'Myanmar Kyat',
    language: 'Burmese', population: '55 million', landmark: 'Shwedagon Pagoda',
    flag: '🇲🇲', funFact: 'Myanmar\'s Shwedagon Pagoda is covered in gold and stands 99 meters tall.',
    famousPerson: 'Aung San Suu Kyi', famousDish: 'Mohinga', sport: 'Football',
    climate: 'Tropical', independence: '1948', neighbours: ['Thailand', 'China', 'India', 'Laos'],
  },
  'Kazakhstan': {
    name: 'Kazakhstan', capital: 'Astana', continent: 'Asia', currency: 'Kazakhstani Tenge',
    language: 'Kazakh & Russian', population: '19 million', landmark: 'Bayterek Tower',
    flag: '🇰🇿', funFact: 'Kazakhstan is the largest landlocked country in the world and the 9th largest country overall.',
    famousPerson: 'Gennady Golovkin', famousDish: 'Beshbarmak', sport: 'Boxing',
    climate: 'Continental', independence: '1991', neighbours: ['Russia', 'China', 'Uzbekistan'],
  },
  'Uzbekistan': {
    name: 'Uzbekistan', capital: 'Tashkent', continent: 'Asia', currency: 'Uzbekistani Som',
    language: 'Uzbek', population: '35 million', landmark: 'Registan Square',
    flag: '🇺🇿', funFact: 'Uzbekistan\'s ancient Silk Road cities of Samarkand and Bukhara are UNESCO World Heritage Sites.',
    famousPerson: 'Amir Timur (Tamerlane)', famousDish: 'Plov', sport: 'Football',
    climate: 'Continental', independence: '1991', neighbours: ['Kazakhstan', 'Afghanistan', 'Tajikistan'],
  },
  'Yemen': {
    name: 'Yemen', capital: 'Sanaa', continent: 'Asia', currency: 'Yemeni Rial',
    language: 'Arabic', population: '33 million', landmark: 'Old City of Sanaa',
    flag: '🇾🇪', funFact: 'Yemen is believed to be the ancient land of the Queen of Sheba.',
    famousPerson: 'Queen of Sheba', famousDish: 'Saltah', sport: 'Football',
    climate: 'Desert', independence: '1990 (unification)', neighbours: ['Saudi Arabia', 'Oman'],
  },
  'Syria': {
    name: 'Syria', capital: 'Damascus', continent: 'Asia', currency: 'Syrian Pound',
    language: 'Arabic', population: '22 million', landmark: 'Umayyad Mosque',
    flag: '🇸🇾', funFact: 'Damascus is one of the oldest continuously inhabited cities in the world, dating back to 10,000 BC.',
    famousPerson: 'Queen Zenobia', famousDish: 'Shawarma', sport: 'Football',
    climate: 'Mediterranean to Desert', independence: '1946', neighbours: ['Turkey', 'Iraq', 'Jordan', 'Lebanon', 'Israel'],
  },
  'Jordan': {
    name: 'Jordan', capital: 'Amman', continent: 'Asia', currency: 'Jordanian Dinar',
    language: 'Arabic', population: '11 million', landmark: 'Petra',
    flag: '🇯🇴', funFact: 'Petra, the ancient city carved into rose-red cliffs, is one of the New Seven Wonders of the World.',
    famousPerson: 'Queen Rania', famousDish: 'Mansaf', sport: 'Football',
    climate: 'Arid', independence: '1946', neighbours: ['Saudi Arabia', 'Iraq', 'Syria', 'Israel'],
  },
  'Lebanon': {
    name: 'Lebanon', capital: 'Beirut', continent: 'Asia', currency: 'Lebanese Pound',
    language: 'Arabic', population: '5.5 million', landmark: 'Baalbek Temples',
    flag: '🇱🇧', funFact: 'Lebanon\'s cedar tree is so iconic that it appears on the national flag.',
    famousPerson: 'Khalil Gibran', famousDish: 'Tabbouleh', sport: 'Basketball',
    climate: 'Mediterranean', independence: '1943', neighbours: ['Syria', 'Israel'],
  },
  'Oman': {
    name: 'Oman', capital: 'Muscat', continent: 'Asia', currency: 'Omani Rial',
    language: 'Arabic', population: '5 million', landmark: 'Sultan Qaboos Grand Mosque',
    flag: '🇴🇲', funFact: 'Oman is one of the oldest independent states in the Arab world.',
    famousPerson: 'Sultan Qaboos', famousDish: 'Shuwa', sport: 'Football',
    climate: 'Desert', independence: '1650', neighbours: ['UAE', 'Saudi Arabia', 'Yemen'],
  },
  'Kuwait': {
    name: 'Kuwait', capital: 'Kuwait City', continent: 'Asia', currency: 'Kuwaiti Dinar',
    language: 'Arabic', population: '4.3 million', landmark: 'Kuwait Towers',
    flag: '🇰🇼', funFact: 'The Kuwaiti Dinar is the highest-valued currency unit in the world.',
    famousPerson: 'Sheikh Jaber Al-Ahmad', famousDish: 'Machboos', sport: 'Football',
    climate: 'Desert', independence: '1961', neighbours: ['Iraq', 'Saudi Arabia'],
  },
  'Qatar': {
    name: 'Qatar', capital: 'Doha', continent: 'Asia', currency: 'Qatari Riyal',
    language: 'Arabic', population: '3 million', landmark: 'Museum of Islamic Art',
    flag: '🇶🇦', funFact: 'Qatar hosted the 2022 FIFA World Cup, the first World Cup held in the Middle East.',
    famousPerson: 'Sheikh Tamim bin Hamad', famousDish: 'Machboos', sport: 'Football',
    climate: 'Desert', independence: '1971', neighbours: ['Saudi Arabia'],
  },
  'Bahrain': {
    name: 'Bahrain', capital: 'Manama', continent: 'Asia', currency: 'Bahraini Dinar',
    language: 'Arabic', population: '1.5 million', landmark: 'Bahrain Fort',
    flag: '🇧🇭', funFact: 'Bahrain was the first Gulf state to discover oil in 1932.',
    famousPerson: 'Sheikh Isa bin Ali', famousDish: 'Machboos', sport: 'Football',
    climate: 'Desert', independence: '1971', neighbours: ['Saudi Arabia', 'Qatar'],
  },
  'United Arab Emirates': {
    name: 'United Arab Emirates', capital: 'Abu Dhabi', continent: 'Asia', currency: 'UAE Dirham',
    language: 'Arabic', population: '10 million', landmark: 'Burj Khalifa',
    flag: '🇦🇪', funFact: 'The Burj Khalifa in Dubai is the tallest building in the world at 828 meters.',
    famousPerson: 'Sheikh Zayed', famousDish: 'Al Harees', sport: 'Football',
    climate: 'Desert', independence: '1971', neighbours: ['Saudi Arabia', 'Oman'],
  },
  'Laos': {
    name: 'Laos', capital: 'Vientiane', continent: 'Asia', currency: 'Lao Kip',
    language: 'Lao', population: '7.5 million', landmark: 'Luang Prabang',
    flag: '🇱🇦', funFact: 'Laos is the most heavily bombed country per capita in history, from the Vietnam War era.',
    famousPerson: 'Kaysone Phomvihane', famousDish: 'Laap', sport: 'Football',
    climate: 'Tropical', independence: '1953', neighbours: ['Thailand', 'Vietnam', 'Cambodia', 'China', 'Myanmar'],
  },
  'Mongolia': {
    name: 'Mongolia', capital: 'Ulaanbaatar', continent: 'Asia', currency: 'Mongolian Tögrög',
    language: 'Mongolian', population: '3.4 million', landmark: 'Genghis Khan Statue',
    flag: '🇲🇳', funFact: 'Mongolia is the most sparsely populated sovereign country in the world.',
    famousPerson: 'Genghis Khan', famousDish: 'Buuz', sport: 'Wrestling',
    climate: 'Continental', independence: '1911', neighbours: ['China', 'Russia'],
  },
  'North Korea': {
    name: 'North Korea', capital: 'Pyongyang', continent: 'Asia', currency: 'North Korean Won',
    language: 'Korean', population: '26 million', landmark: 'Juche Tower',
    flag: '🇰🇵', funFact: 'North Korea uses its own calendar, called the Juche calendar, starting from 1912.',
    famousPerson: 'Kim Il-sung', famousDish: 'Naengmyeon', sport: 'Football',
    climate: 'Temperate', independence: '1948', neighbours: ['South Korea', 'China', 'Russia'],
  },
  'Taiwan': {
    name: 'Taiwan', capital: 'Taipei', continent: 'Asia', currency: 'New Taiwan Dollar',
    language: 'Mandarin Chinese', population: '24 million', landmark: 'Taipei 101',
    flag: '🇹🇼', funFact: 'Taiwan\'s Taipei 101 was the world\'s tallest building from 2004 to 2010.',
    famousPerson: 'Ang Lee', famousDish: 'Beef Noodle Soup', sport: 'Baseball',
    climate: 'Subtropical', independence: '1949 (ROC govt moved)', neighbours: ['China', 'Japan', 'Philippines'],
  },
  'Brunei': {
    name: 'Brunei', capital: 'Bandar Seri Begawan', continent: 'Asia', currency: 'Brunei Dollar',
    language: 'Malay', population: '450,000', landmark: 'Omar Ali Saifuddien Mosque',
    flag: '🇧🇳', funFact: 'Brunei is one of the wealthiest nations in the world, thanks to oil and gas reserves.',
    famousPerson: 'Sultan Hassanal Bolkiah', famousDish: 'Ambuyat', sport: 'Football',
    climate: 'Tropical', independence: '1984', neighbours: ['Malaysia'],
  },
  'Maldives': {
    name: 'Maldives', capital: 'Malé', continent: 'Asia', currency: 'Maldivian Rufiyaa',
    language: 'Dhivehi', population: '520,000', landmark: 'Maldives Coral Reefs',
    flag: '🇲🇻', funFact: 'The Maldives is the lowest-lying country in the world, with an average elevation of just 1.5 meters.',
    famousPerson: 'Mohamed Nasheed', famousDish: 'Garudhiya', sport: 'Football',
    climate: 'Tropical', independence: '1965', neighbours: ['Sri Lanka', 'India'],
  },
  'Bhutan': {
    name: 'Bhutan', capital: 'Thimphu', continent: 'Asia', currency: 'Bhutanese Ngultrum',
    language: 'Dzongkha', population: '780,000', landmark: 'Tiger\'s Nest Monastery',
    flag: '🇧🇹', funFact: 'Bhutan measures national success by Gross National Happiness rather than GDP.',
    famousPerson: 'King Jigme Khesar', famousDish: 'Ema Datshi', sport: 'Archery',
    climate: 'Alpine to Subtropical', independence: '1907', neighbours: ['India', 'China'],
  },
  'Tajikistan': {
    name: 'Tajikistan', capital: 'Dushanbe', continent: 'Asia', currency: 'Tajikistani Somoni',
    language: 'Tajik', population: '10 million', landmark: 'Ismoil Somoni Peak',
    flag: '🇹🇯', funFact: 'Tajikistan is home to the Pamir Mountains, nicknamed the "Roof of the World".',
    famousPerson: 'Ismoil Somoni', famousDish: 'Qurutob', sport: 'Football',
    climate: 'Continental', independence: '1991', neighbours: ['Afghanistan', 'China', 'Kyrgyzstan', 'Uzbekistan'],
  },
  'Kyrgyzstan': {
    name: 'Kyrgyzstan', capital: 'Bishkek', continent: 'Asia', currency: 'Kyrgyzstani Som',
    language: 'Kyrgyz & Russian', population: '7 million', landmark: 'Issyk-Kul Lake',
    flag: '🇰🇬', funFact: 'Kyrgyzstan has a 3,000-year-old nomadic tradition and the "Epic of Manas" is one of the world\'s longest epic poems.',
    famousPerson: 'Chinghiz Aitmatov', famousDish: 'Beshbarmak', sport: 'Wrestling',
    climate: 'Continental', independence: '1991', neighbours: ['Kazakhstan', 'China', 'Tajikistan', 'Uzbekistan'],
  },
  'Turkmenistan': {
    name: 'Turkmenistan', capital: 'Ashgabat', continent: 'Asia', currency: 'Turkmenistani Manat',
    language: 'Turkmen', population: '6.3 million', landmark: 'Darvaza Gas Crater',
    flag: '🇹🇲', funFact: 'Turkmenistan\'s Darvaza Gas Crater is called the "Door to Hell" and has been burning since 1971.',
    famousPerson: 'Saparmurat Niyazov', famousDish: 'Plov', sport: 'Football',
    climate: 'Desert', independence: '1991', neighbours: ['Iran', 'Afghanistan', 'Uzbekistan'],
  },
  'Georgia': {
    name: 'Georgia', capital: 'Tbilisi', continent: 'Asia', currency: 'Georgian Lari',
    language: 'Georgian', population: '3.7 million', landmark: 'Svetitskhoveli Cathedral',
    flag: '🇬🇪', funFact: 'Georgia is one of the oldest wine-producing regions in the world, dating back 8,000 years.',
    famousPerson: 'Joseph Stalin', famousDish: 'Khachapuri', sport: 'Rugby',
    climate: 'Subtropical to Alpine', independence: '1991', neighbours: ['Russia', 'Turkey', 'Armenia', 'Azerbaijan'],
  },
  'Armenia': {
    name: 'Armenia', capital: 'Yerevan', continent: 'Asia', currency: 'Armenian Dram',
    language: 'Armenian', population: '3 million', landmark: 'Mount Ararat (view)',
    flag: '🇦🇲', funFact: 'Armenia was the first country to officially adopt Christianity as a state religion in 301 AD.',
    famousPerson: 'Charles Aznavour', famousDish: 'Dolma', sport: 'Chess',
    climate: 'Continental', independence: '1991', neighbours: ['Turkey', 'Georgia', 'Iran', 'Azerbaijan'],
  },
  'Azerbaijan': {
    name: 'Azerbaijan', capital: 'Baku', continent: 'Asia', currency: 'Azerbaijani Manat',
    language: 'Azerbaijani', population: '10 million', landmark: 'Flame Towers',
    flag: '🇦🇿', funFact: 'Azerbaijan is known as the "Land of Fire" because of its natural gas fires and mud volcanoes.',
    famousPerson: 'Garry Kasparov', famousDish: 'Plov', sport: 'Wrestling',
    climate: 'Subtropical to Continental', independence: '1991', neighbours: ['Russia', 'Georgia', 'Armenia', 'Iran'],
  },

  // ============ EUROPE — EXPANDED ============
  'Ireland': {
    name: 'Ireland', capital: 'Dublin', continent: 'Europe', currency: 'Euro',
    language: 'Irish & English', population: '5 million', landmark: 'Cliffs of Moher',
    flag: '🇮🇪', funFact: 'Ireland has no snakes — legend says St. Patrick banished them all.',
    famousPerson: 'Oscar Wilde', famousDish: 'Irish Stew', sport: 'Gaelic Football',
    climate: 'Temperate Maritime', independence: '1922', neighbours: ['United Kingdom'],
  },
  'Austria': {
    name: 'Austria', capital: 'Vienna', continent: 'Europe', currency: 'Euro',
    language: 'German', population: '9 million', landmark: 'Schönbrunn Palace',
    flag: '🇦🇹', funFact: 'Austria\'s flag is one of the oldest national flags in the world, dating back to 1230.',
    famousPerson: 'Wolfgang Amadeus Mozart', famousDish: 'Wiener Schnitzel', sport: 'Alpine Skiing',
    climate: 'Temperate', independence: '1955', neighbours: ['Germany', 'Italy', 'Switzerland', 'Hungary'],
  },
  'Hungary': {
    name: 'Hungary', capital: 'Budapest', continent: 'Europe', currency: 'Hungarian Forint',
    language: 'Hungarian', population: '10 million', landmark: 'Hungarian Parliament Building',
    flag: '🇭🇺', funFact: 'Budapest has the largest thermal water cave system in the world.',
    famousPerson: 'Franz Liszt', famousDish: 'Goulash', sport: 'Water Polo',
    climate: 'Continental', independence: '1918', neighbours: ['Austria', 'Slovakia', 'Romania', 'Serbia'],
  },
  'Czech Republic': {
    name: 'Czech Republic', capital: 'Prague', continent: 'Europe', currency: 'Czech Koruna',
    language: 'Czech', population: '10.5 million', landmark: 'Prague Castle',
    flag: '🇨🇿', funFact: 'The Czech Republic drinks more beer per capita than any other country in the world.',
    famousPerson: 'Franz Kafka', famousDish: 'Svíčková', sport: 'Ice Hockey',
    climate: 'Temperate', independence: '1993', neighbours: ['Germany', 'Poland', 'Slovakia', 'Austria'],
  },
  'Romania': {
    name: 'Romania', capital: 'Bucharest', continent: 'Europe', currency: 'Romanian Leu',
    language: 'Romanian', population: '19 million', landmark: 'Bran Castle',
    flag: '🇷🇴', funFact: 'Romania\'s Bran Castle is popularly known as "Dracula\'s Castle".',
    famousPerson: 'Nadia Comăneci', famousDish: 'Sarmale', sport: 'Football',
    climate: 'Temperate Continental', independence: '1877', neighbours: ['Hungary', 'Bulgaria', 'Ukraine', 'Moldova'],
  },
  'Bulgaria': {
    name: 'Bulgaria', capital: 'Sofia', continent: 'Europe', currency: 'Bulgarian Lev',
    language: 'Bulgarian', population: '6.5 million', landmark: 'Rila Monastery',
    flag: '🇧🇬', funFact: 'Bulgaria is the oldest country in Europe to have kept its original name since 681 AD.',
    famousPerson: 'Hristo Stoichkov', famousDish: 'Banitsa', sport: 'Football',
    climate: 'Temperate Continental', independence: '1908', neighbours: ['Romania', 'Greece', 'Turkey', 'Serbia'],
  },
  'Denmark': {
    name: 'Denmark', capital: 'Copenhagen', continent: 'Europe', currency: 'Danish Krone',
    language: 'Danish', population: '5.9 million', landmark: 'The Little Mermaid',
    flag: '🇩🇰', funFact: 'Denmark\'s flag, the Dannebrog, is the oldest continuously used national flag in the world.',
    famousPerson: 'Hans Christian Andersen', famousDish: 'Smørrebrød', sport: 'Football',
    climate: 'Temperate Maritime', independence: 'Ancient kingdom', neighbours: ['Germany', 'Sweden', 'Norway'],
  },
  'Finland': {
    name: 'Finland', capital: 'Helsinki', continent: 'Europe', currency: 'Euro',
    language: 'Finnish & Swedish', population: '5.5 million', landmark: 'Helsinki Cathedral',
    flag: '🇫🇮', funFact: 'Finland has about 188,000 lakes, earning it the nickname "Land of a Thousand Lakes".',
    famousPerson: 'Kimi Räikkönen', famousDish: 'Karjalanpiirakka', sport: 'Ice Hockey',
    climate: 'Subarctic to Temperate', independence: '1917', neighbours: ['Sweden', 'Norway', 'Russia'],
  },
  'Serbia': {
    name: 'Serbia', capital: 'Belgrade', continent: 'Europe', currency: 'Serbian Dinar',
    language: 'Serbian', population: '6.6 million', landmark: 'Belgrade Fortress',
    flag: '🇷🇸', funFact: 'Serbia is the birthplace of Nikola Tesla, one of the greatest inventors in history.',
    famousPerson: 'Nikola Tesla', famousDish: 'Ćevapi', sport: 'Basketball',
    climate: 'Continental', independence: '2006', neighbours: ['Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Bosnia and Herzegovina'],
  },
  'Ukraine': {
    name: 'Ukraine', capital: 'Kyiv', continent: 'Europe', currency: 'Ukrainian Hryvnia',
    language: 'Ukrainian', population: '44 million', landmark: 'Saint Sophia\'s Cathedral',
    flag: '🇺🇦', funFact: 'Ukraine is the largest country entirely within Europe by area.',
    famousPerson: 'Andriy Shevchenko', famousDish: 'Borshch', sport: 'Football',
    climate: 'Temperate Continental', independence: '1991', neighbours: ['Poland', 'Romania', 'Russia', 'Belarus'],
  },
  'Belarus': {
    name: 'Belarus', capital: 'Minsk', continent: 'Europe', currency: 'Belarusian Ruble',
    language: 'Belarusian & Russian', population: '9.4 million', landmark: 'Mir Castle',
    flag: '🇧🇾', funFact: 'Belarus has one of the largest remaining primeval forests in Europe — the Białowieża Forest.',
    famousPerson: 'Marc Chagall', famousDish: 'Draniki', sport: 'Ice Hockey',
    climate: 'Continental', independence: '1991', neighbours: ['Russia', 'Poland', 'Ukraine', 'Lithuania'],
  },
  'Lithuania': {
    name: 'Lithuania', capital: 'Vilnius', continent: 'Europe', currency: 'Euro',
    language: 'Lithuanian', population: '2.8 million', landmark: 'Trakai Island Castle',
    flag: '🇱🇹', funFact: 'Lithuanian is one of the oldest surviving Indo-European languages in the world.',
    famousPerson: 'Arvydas Sabonis', famousDish: 'Cepelinai', sport: 'Basketball',
    climate: 'Temperate', independence: '1990', neighbours: ['Latvia', 'Poland', 'Belarus'],
  },
  'Latvia': {
    name: 'Latvia', capital: 'Riga', continent: 'Europe', currency: 'Euro',
    language: 'Latvian', population: '1.8 million', landmark: 'Riga Old Town',
    flag: '🇱🇻', funFact: 'Latvia is home to the widest waterfall in Europe — Venta Rapid.',
    famousPerson: 'Mikhail Eisenstein', famousDish: 'Rye Bread', sport: 'Ice Hockey',
    climate: 'Temperate', independence: '1991', neighbours: ['Estonia', 'Lithuania', 'Belarus'],
  },
  'Estonia': {
    name: 'Estonia', capital: 'Tallinn', continent: 'Europe', currency: 'Euro',
    language: 'Estonian', population: '1.3 million', landmark: 'Tallinn Old Town',
    flag: '🇪🇪', funFact: 'Estonia is considered the most digitally advanced nation in the world, even offering e-Residency.',
    famousPerson: 'Arvo Pärt', famousDish: 'Black Bread', sport: 'Cross-Country Skiing',
    climate: 'Temperate', independence: '1991', neighbours: ['Latvia', 'Russia', 'Finland'],
  },
  'Slovenia': {
    name: 'Slovenia', capital: 'Ljubljana', continent: 'Europe', currency: 'Euro',
    language: 'Slovenian', population: '2.1 million', landmark: 'Lake Bled',
    flag: '🇸🇮', funFact: 'Slovenia has the third-highest proportion of land covered by forest in Europe.',
    famousPerson: 'Luka Dončić', famousDish: 'Potica', sport: 'Alpine Skiing',
    climate: 'Mediterranean to Alpine', independence: '1991', neighbours: ['Italy', 'Austria', 'Hungary', 'Croatia'],
  },
  'Slovakia': {
    name: 'Slovakia', capital: 'Bratislava', continent: 'Europe', currency: 'Euro',
    language: 'Slovak', population: '5.4 million', landmark: 'Bratislava Castle',
    flag: '🇸🇰', funFact: 'Slovakia has more castles and chateaux per capita than any other country in the world.',
    famousPerson: 'Andy Warhol (parents)', famousDish: 'Bryndzové Halušky', sport: 'Ice Hockey',
    climate: 'Temperate Continental', independence: '1993', neighbours: ['Czech Republic', 'Poland', 'Hungary', 'Austria'],
  },
  'Albania': {
    name: 'Albania', capital: 'Tirana', continent: 'Europe', currency: 'Albanian Lek',
    language: 'Albanian', population: '2.8 million', landmark: 'Berat Castle',
    flag: '🇦🇱', funFact: 'Albania has more bunkers per capita than any other country — over 170,000 were built during the Cold War.',
    famousPerson: 'Mother Teresa', famousDish: 'Tavë Kosi', sport: 'Football',
    climate: 'Mediterranean', independence: '1912', neighbours: ['Greece', 'North Macedonia', 'Montenegro', 'Serbia'],
  },
  'North Macedonia': {
    name: 'North Macedonia', capital: 'Skopje', continent: 'Europe', currency: 'Macedonian Denar',
    language: 'Macedonian', population: '2 million', landmark: 'Lake Ohrid',
    flag: '🇲🇰', funFact: 'Lake Ohrid is one of the oldest and deepest lakes in Europe, over 3 million years old.',
    famousPerson: 'Alexander the Great (historical)', famousDish: 'Tavče Gravče', sport: 'Football',
    climate: 'Continental', independence: '1991', neighbours: ['Greece', 'Albania', 'Serbia', 'Bulgaria'],
  },
  'Montenegro': {
    name: 'Montenegro', capital: 'Podgorica', continent: 'Europe', currency: 'Euro',
    language: 'Montenegrin', population: '620,000', landmark: 'Bay of Kotor',
    flag: '🇲🇪', funFact: 'Montenegro means "Black Mountain" and is one of the newest countries in the world.',
    famousPerson: 'Dejan Savićević', famousDish: 'Njeguški Steak', sport: 'Water Polo',
    climate: 'Mediterranean', independence: '2006', neighbours: ['Croatia', 'Bosnia and Herzegovina', 'Serbia', 'Albania'],
  },
  'Bosnia and Herzegovina': {
    name: 'Bosnia and Herzegovina', capital: 'Sarajevo', continent: 'Europe', currency: 'Convertible Mark',
    language: 'Bosnian, Croatian & Serbian', population: '3.2 million', landmark: 'Stari Most (Old Bridge)',
    flag: '🇧🇦', funFact: 'Sarajevo hosted the 1984 Winter Olympics and has a rich multicultural heritage.',
    famousPerson: 'Emir Kusturica', famousDish: 'Ćevapi', sport: 'Football',
    climate: 'Continental', independence: '1992', neighbours: ['Croatia', 'Serbia', 'Montenegro'],
  },
  'Moldova': {
    name: 'Moldova', capital: 'Chișinău', continent: 'Europe', currency: 'Moldovan Leu',
    language: 'Romanian', population: '2.6 million', landmark: 'Mileștii Mici Wine Cellar',
    flag: '🇲🇩', funFact: 'Moldova has the world\'s largest wine cellar, Mileștii Mici, stretching over 200 km.',
    famousPerson: 'Dan Bălan', famousDish: 'Mămăligă', sport: 'Football',
    climate: 'Continental', independence: '1991', neighbours: ['Romania', 'Ukraine'],
  },
  'Iceland': {
    name: 'Iceland', capital: 'Reykjavik', continent: 'Europe', currency: 'Icelandic Króna',
    language: 'Icelandic', population: '375,000', landmark: 'Blue Lagoon',
    flag: '🇮🇸', funFact: 'Iceland has no army and is powered almost entirely by geothermal and hydroelectric energy.',
    famousPerson: 'Björk', famousDish: 'Hákarl (fermented shark)', sport: 'Football',
    climate: 'Subarctic Maritime', independence: '1944', neighbours: ['Greenland (Denmark)'],
  },
  'Luxembourg': {
    name: 'Luxembourg', capital: 'Luxembourg City', continent: 'Europe', currency: 'Euro',
    language: 'Luxembourgish, French & German', population: '650,000', landmark: 'Casemates du Bock',
    flag: '🇱🇺', funFact: 'Luxembourg is one of the smallest countries in the world but has the highest GDP per capita.',
    famousPerson: 'Grand Duke Henri', famousDish: 'Judd mat Gaardebounen', sport: 'Cycling',
    climate: 'Temperate', independence: '1839', neighbours: ['Belgium', 'Germany', 'France'],
  },
  'Malta': {
    name: 'Malta', capital: 'Valletta', continent: 'Europe', currency: 'Euro',
    language: 'Maltese & English', population: '530,000', landmark: 'Megalithic Temples',
    flag: '🇲🇹', funFact: 'Malta has the oldest free-standing structures in the world, older than the Egyptian pyramids.',
    famousPerson: 'Caravaggio (lived there)', famousDish: 'Pastizzi', sport: 'Water Polo',
    climate: 'Mediterranean', independence: '1964', neighbours: ['Italy'],
  },
  'Cyprus': {
    name: 'Cyprus', capital: 'Nicosia', continent: 'Europe', currency: 'Euro',
    language: 'Greek & Turkish', population: '1.2 million', landmark: 'Aphrodite\'s Rock',
    flag: '🇨🇾', funFact: 'Cyprus is the birthplace of Aphrodite, the Greek goddess of love, according to mythology.',
    famousPerson: 'Marcos Baghdatis', famousDish: 'Halloumi', sport: 'Football',
    climate: 'Mediterranean', independence: '1960', neighbours: ['Turkey', 'Greece'],
  },

  // ============ AFRICA — EXPANDED ============
  'Ethiopia': {
    name: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa', currency: 'Ethiopian Birr',
    language: 'Amharic', population: '120 million', landmark: 'Lalibela Rock Churches',
    flag: '🇪🇹', funFact: 'Ethiopia uses its own calendar, which is 7-8 years behind the Gregorian calendar.',
    famousPerson: 'Haile Selassie', famousDish: 'Injera with Wot', sport: 'Long-Distance Running',
    climate: 'Tropical to Alpine', independence: 'Never colonized', neighbours: ['Eritrea', 'Somalia', 'Kenya', 'Sudan'],
  },
  'Ghana': {
    name: 'Ghana', capital: 'Accra', continent: 'Africa', currency: 'Ghanaian Cedi',
    language: 'English', population: '33 million', landmark: 'Cape Coast Castle',
    flag: '🇬🇭', funFact: 'Ghana was the first sub-Saharan African country to gain independence in 1957.',
    famousPerson: 'Kofi Annan', famousDish: 'Jollof Rice', sport: 'Football',
    climate: 'Tropical', independence: '1957', neighbours: ['Ivory Coast', 'Togo', 'Burkina Faso'],
  },
  'Tanzania': {
    name: 'Tanzania', capital: 'Dodoma', continent: 'Africa', currency: 'Tanzanian Shilling',
    language: 'Swahili & English', population: '65 million', landmark: 'Mount Kilimanjaro',
    flag: '🇹🇿', funFact: 'Mount Kilimanjaro is the tallest freestanding mountain in the world.',
    famousPerson: 'Julius Nyerere', famousDish: 'Ugali', sport: 'Football',
    climate: 'Tropical', independence: '1961', neighbours: ['Kenya', 'Uganda', 'Mozambique', 'Rwanda'],
  },
  'Uganda': {
    name: 'Uganda', capital: 'Kampala', continent: 'Africa', currency: 'Ugandan Shilling',
    language: 'English & Swahili', population: '47 million', landmark: 'Bwindi Impenetrable Forest',
    flag: '🇺🇬', funFact: 'Uganda is home to half of the world\'s remaining mountain gorilla population.',
    famousPerson: 'Joshua Cheptegei', famousDish: 'Matoke', sport: 'Cricket',
    climate: 'Tropical', independence: '1962', neighbours: ['Kenya', 'Tanzania', 'Rwanda', 'Congo'],
  },
  'Algeria': {
    name: 'Algeria', capital: 'Algiers', continent: 'Africa', currency: 'Algerian Dinar',
    language: 'Arabic & Berber', population: '45 million', landmark: 'Casbah of Algiers',
    flag: '🇩🇿', funFact: 'Algeria is the largest country in Africa by land area.',
    famousPerson: 'Zinedine Zidane (parents)', famousDish: 'Couscous', sport: 'Football',
    climate: 'Mediterranean to Desert', independence: '1962', neighbours: ['Morocco', 'Tunisia', 'Libya', 'Mali'],
  },
  'Tunisia': {
    name: 'Tunisia', capital: 'Tunis', continent: 'Africa', currency: 'Tunisian Dinar',
    language: 'Arabic', population: '12 million', landmark: 'Carthage Ruins',
    flag: '🇹🇳', funFact: 'Tunisia is home to the ancient city of Carthage, once a powerful rival of Rome.',
    famousPerson: 'Ibn Khaldun', famousDish: 'Brik', sport: 'Football',
    climate: 'Mediterranean', independence: '1956', neighbours: ['Algeria', 'Libya'],
  },
  'Cameroon': {
    name: 'Cameroon', capital: 'Yaoundé', continent: 'Africa', currency: 'Central African CFA Franc',
    language: 'French & English', population: '27 million', landmark: 'Mount Cameroon',
    flag: '🇨🇲', funFact: 'Cameroon is called "Africa in miniature" because of its incredible geographic and cultural diversity.',
    famousPerson: 'Samuel Eto\'o', famousDish: 'Ndolé', sport: 'Football',
    climate: 'Tropical', independence: '1960', neighbours: ['Nigeria', 'Chad', 'Gabon'],
  },
  'Ivory Coast': {
    name: 'Ivory Coast', capital: 'Yamoussoukro', continent: 'Africa', currency: 'West African CFA Franc',
    language: 'French', population: '28 million', landmark: 'Basilica of Our Lady of Peace',
    flag: '🇨🇮', funFact: 'Ivory Coast has the largest church in the world, the Basilica of Our Lady of Peace.',
    famousPerson: 'Didier Drogba', famousDish: 'Attiéké', sport: 'Football',
    climate: 'Tropical', independence: '1960', neighbours: ['Ghana', 'Mali', 'Guinea'],
  },
  'Madagascar': {
    name: 'Madagascar', capital: 'Antananarivo', continent: 'Africa', currency: 'Malagasy Ariary',
    language: 'Malagasy & French', population: '29 million', landmark: 'Avenue of the Baobabs',
    flag: '🇲🇬', funFact: 'About 90% of Madagascar\'s wildlife is found nowhere else on Earth.',
    famousPerson: 'King Andrianampoinimerina', famousDish: 'Romazava', sport: 'Football',
    climate: 'Tropical', independence: '1960', neighbours: ['Mozambique'],
  },
  'Mozambique': {
    name: 'Mozambique', capital: 'Maputo', continent: 'Africa', currency: 'Mozambican Metical',
    language: 'Portuguese', population: '32 million', landmark: 'Island of Mozambique',
    flag: '🇲🇿', funFact: 'Mozambique is the only country in the world with an AK-47 on its national flag.',
    famousPerson: 'Eusébio (born in Maputo)', famousDish: 'Piri Piri Chicken', sport: 'Football',
    climate: 'Tropical', independence: '1975', neighbours: ['South Africa', 'Tanzania', 'Malawi', 'Zimbabwe'],
  },
  'Zimbabwe': {
    name: 'Zimbabwe', capital: 'Harare', continent: 'Africa', currency: 'Zimbabwean Dollar',
    language: 'English, Shona & Ndebele', population: '16 million', landmark: 'Victoria Falls',
    flag: '🇿🇼', funFact: 'Victoria Falls, shared with Zambia, is the largest curtain of falling water in the world.',
    famousPerson: 'Morgan Tsvangirai', famousDish: 'Sadza', sport: 'Cricket',
    climate: 'Tropical', independence: '1980', neighbours: ['South Africa', 'Botswana', 'Zambia', 'Mozambique'],
  },
  'Zambia': {
    name: 'Zambia', capital: 'Lusaka', continent: 'Africa', currency: 'Zambian Kwacha',
    language: 'English', population: '20 million', landmark: 'Victoria Falls',
    flag: '🇿🇲', funFact: 'Zambia shares Victoria Falls with Zimbabwe and calls it "Mosi-oa-Tunya" — the Smoke that Thunders.',
    famousPerson: 'Kenneth Kaunda', famousDish: 'Nshima', sport: 'Football',
    climate: 'Tropical', independence: '1964', neighbours: ['Zimbabwe', 'Tanzania', 'Botswana', 'Congo'],
  },
  'Rwanda': {
    name: 'Rwanda', capital: 'Kigali', continent: 'Africa', currency: 'Rwandan Franc',
    language: 'Kinyarwanda, French & English', population: '13.5 million', landmark: 'Volcanoes National Park',
    flag: '🇷🇼', funFact: 'Rwanda is called the "Land of a Thousand Hills" and is the cleanest country in Africa.',
    famousPerson: 'Paul Kagame', famousDish: 'Ugali & Beans', sport: 'Football',
    climate: 'Tropical Highland', independence: '1962', neighbours: ['Uganda', 'Tanzania', 'Burundi', 'Congo'],
  },
  'Namibia': {
    name: 'Namibia', capital: 'Windhoek', continent: 'Africa', currency: 'Namibian Dollar',
    language: 'English', population: '2.6 million', landmark: 'Sossusvlei Sand Dunes',
    flag: '🇳🇦', funFact: 'Namibia was the first African country to include environmental protection in its constitution.',
    famousPerson: 'Sam Nujoma', famousDish: 'Kapana', sport: 'Rugby',
    climate: 'Desert', independence: '1990', neighbours: ['South Africa', 'Botswana', 'Angola', 'Zambia'],
  },
  'Botswana': {
    name: 'Botswana', capital: 'Gaborone', continent: 'Africa', currency: 'Botswana Pula',
    language: 'English & Setswana', population: '2.6 million', landmark: 'Okavango Delta',
    flag: '🇧🇼', funFact: 'Botswana\'s Okavango Delta is the world\'s largest inland river delta, a UNESCO World Heritage Site.',
    famousPerson: 'Sir Seretse Khama', famousDish: 'Seswaa', sport: 'Football',
    climate: 'Semiarid', independence: '1966', neighbours: ['South Africa', 'Namibia', 'Zimbabwe', 'Zambia'],
  },
  'Somalia': {
    name: 'Somalia', capital: 'Mogadishu', continent: 'Africa', currency: 'Somali Shilling',
    language: 'Somali & Arabic', population: '17 million', landmark: 'Laas Geel Cave Paintings',
    flag: '🇸🇴', funFact: 'Somalia has the longest coastline in mainland Africa, stretching over 3,000 km.',
    famousPerson: 'Mo Farah (born in Mogadishu)', famousDish: 'Bariis Iskukaris', sport: 'Football',
    climate: 'Desert to Tropical', independence: '1960', neighbours: ['Ethiopia', 'Kenya', 'Djibouti'],
  },
  'Sudan': {
    name: 'Sudan', capital: 'Khartoum', continent: 'Africa', currency: 'Sudanese Pound',
    language: 'Arabic & English', population: '45 million', landmark: 'Pyramids of Meroë',
    flag: '🇸🇩', funFact: 'Sudan has more ancient pyramids than Egypt — over 200 in the Nubian desert.',
    famousPerson: 'Ahmed Amin', famousDish: 'Ful Medames', sport: 'Football',
    climate: 'Desert to Tropical', independence: '1956', neighbours: ['Egypt', 'Libya', 'Ethiopia', 'Chad'],
  },

  // ============ AMERICAS — EXPANDED ============
  'Ecuador': {
    name: 'Ecuador', capital: 'Quito', continent: 'South America', currency: 'US Dollar',
    language: 'Spanish', population: '18 million', landmark: 'Galápagos Islands',
    flag: '🇪🇨', funFact: 'Ecuador is named after the equator, which runs right through the country.',
    famousPerson: 'Jefferson Pérez', famousDish: 'Llapingachos', sport: 'Football',
    climate: 'Tropical to Alpine', independence: '1822', neighbours: ['Colombia', 'Peru'],
  },
  'Bolivia': {
    name: 'Bolivia', capital: 'Sucre', continent: 'South America', currency: 'Boliviano',
    language: 'Spanish, Quechua & Aymara', population: '12 million', landmark: 'Salar de Uyuni',
    flag: '🇧🇴', funFact: 'Bolivia\'s Salar de Uyuni is the world\'s largest salt flat, covering over 10,000 sq km.',
    famousPerson: 'Evo Morales', famousDish: 'Salteñas', sport: 'Football',
    climate: 'Tropical to Alpine', independence: '1825', neighbours: ['Brazil', 'Peru', 'Chile', 'Argentina', 'Paraguay'],
  },
  'Paraguay': {
    name: 'Paraguay', capital: 'Asunción', continent: 'South America', currency: 'Paraguayan Guaraní',
    language: 'Spanish & Guaraní', population: '7.4 million', landmark: 'Itaipú Dam',
    flag: '🇵🇾', funFact: 'Paraguay is one of only two landlocked countries in South America and shares the massive Itaipú Dam.',
    famousPerson: 'José Luis Chilavert', famousDish: 'Sopa Paraguaya', sport: 'Football',
    climate: 'Subtropical', independence: '1811', neighbours: ['Brazil', 'Argentina', 'Bolivia'],
  },
  'Venezuela': {
    name: 'Venezuela', capital: 'Caracas', continent: 'South America', currency: 'Venezuelan Bolívar',
    language: 'Spanish', population: '28 million', landmark: 'Angel Falls',
    flag: '🇻🇪', funFact: 'Angel Falls in Venezuela is the world\'s highest uninterrupted waterfall at 979 meters.',
    famousPerson: 'Simón Bolívar', famousDish: 'Arepa', sport: 'Baseball',
    climate: 'Tropical', independence: '1811', neighbours: ['Colombia', 'Brazil', 'Guyana'],
  },
  'Guyana': {
    name: 'Guyana', capital: 'Georgetown', continent: 'South America', currency: 'Guyanese Dollar',
    language: 'English', population: '800,000', landmark: 'Kaieteur Falls',
    flag: '🇬🇾', funFact: 'Guyana is the only English-speaking country in South America.',
    famousPerson: 'Cheddi Jagan', famousDish: 'Pepperpot', sport: 'Cricket',
    climate: 'Tropical', independence: '1966', neighbours: ['Venezuela', 'Brazil', 'Suriname'],
  },
  'Cuba': {
    name: 'Cuba', capital: 'Havana', continent: 'North America', currency: 'Cuban Peso',
    language: 'Spanish', population: '11 million', landmark: 'Old Havana',
    flag: '🇨🇺', funFact: 'Cuba has a 99.8% literacy rate, one of the highest in the world.',
    famousPerson: 'Fidel Castro', famousDish: 'Ropa Vieja', sport: 'Baseball',
    climate: 'Tropical', independence: '1902', neighbours: ['Jamaica', 'Haiti'],
  },
  'Jamaica': {
    name: 'Jamaica', capital: 'Kingston', continent: 'North America', currency: 'Jamaican Dollar',
    language: 'English', population: '3 million', landmark: 'Blue Mountains',
    flag: '🇯🇲', funFact: 'Jamaica is the birthplace of reggae music and the legendary Bob Marley.',
    famousPerson: 'Usain Bolt', famousDish: 'Jerk Chicken', sport: 'Athletics',
    climate: 'Tropical', independence: '1962', neighbours: ['Cuba', 'Haiti'],
  },
  'Haiti': {
    name: 'Haiti', capital: 'Port-au-Prince', continent: 'North America', currency: 'Haitian Gourde',
    language: 'French & Haitian Creole', population: '11.5 million', landmark: 'Citadelle Laferrière',
    flag: '🇭🇹', funFact: 'Haiti was the first independent nation in Latin America and the Caribbean, and the first Black republic.',
    famousPerson: 'Toussaint Louverture', famousDish: 'Griot', sport: 'Football',
    climate: 'Tropical', independence: '1804', neighbours: ['Dominican Republic'],
  },
  'Dominican Republic': {
    name: 'Dominican Republic', capital: 'Santo Domingo', continent: 'North America', currency: 'Dominican Peso',
    language: 'Spanish', population: '11 million', landmark: 'Colonial Zone of Santo Domingo',
    flag: '🇩🇴', funFact: 'Santo Domingo is the oldest continuously inhabited European-established settlement in the Americas.',
    famousPerson: 'David Ortiz', famousDish: 'La Bandera', sport: 'Baseball',
    climate: 'Tropical', independence: '1844', neighbours: ['Haiti'],
  },
  'Honduras': {
    name: 'Honduras', capital: 'Tegucigalpa', continent: 'North America', currency: 'Honduran Lempira',
    language: 'Spanish', population: '10 million', landmark: 'Copán Ruins',
    flag: '🇭🇳', funFact: 'Honduras is home to the ancient Mayan ruins of Copán, a UNESCO World Heritage Site.',
    famousPerson: 'Carlos Pavón', famousDish: 'Baleada', sport: 'Football',
    climate: 'Tropical', independence: '1821', neighbours: ['Guatemala', 'El Salvador', 'Nicaragua'],
  },
  'Guatemala': {
    name: 'Guatemala', capital: 'Guatemala City', continent: 'North America', currency: 'Guatemalan Quetzal',
    language: 'Spanish', population: '17 million', landmark: 'Tikal',
    flag: '🇬🇹', funFact: 'Guatemala is home to Tikal, one of the largest ancient Mayan cities ever discovered.',
    famousPerson: 'Rigoberta Menchú', famousDish: 'Pepián', sport: 'Football',
    climate: 'Tropical', independence: '1821', neighbours: ['Mexico', 'Belize', 'Honduras', 'El Salvador'],
  },
  'Costa Rica': {
    name: 'Costa Rica', capital: 'San José', continent: 'North America', currency: 'Costa Rican Colón',
    language: 'Spanish', population: '5.2 million', landmark: 'Arenal Volcano',
    flag: '🇨🇷', funFact: 'Costa Rica abolished its military in 1948 and redirected funds to education and healthcare.',
    famousPerson: 'Keylor Navas', famousDish: 'Gallo Pinto', sport: 'Football',
    climate: 'Tropical', independence: '1821', neighbours: ['Nicaragua', 'Panama'],
  },
  'Panama': {
    name: 'Panama', capital: 'Panama City', continent: 'North America', currency: 'Panamanian Balboa & US Dollar',
    language: 'Spanish', population: '4.4 million', landmark: 'Panama Canal',
    flag: '🇵🇦', funFact: 'The Panama Canal connects the Atlantic and Pacific Oceans and handles about 5% of world trade.',
    famousPerson: 'Roberto Durán', famousDish: 'Sancocho', sport: 'Baseball',
    climate: 'Tropical', independence: '1903', neighbours: ['Colombia', 'Costa Rica'],
  },
  'El Salvador': {
    name: 'El Salvador', capital: 'San Salvador', continent: 'North America', currency: 'US Dollar',
    language: 'Spanish', population: '6.5 million', landmark: 'Joya de Cerén',
    flag: '🇸🇻', funFact: 'El Salvador was the first country to adopt Bitcoin as legal tender in 2021.',
    famousPerson: 'Óscar Romero', famousDish: 'Pupusa', sport: 'Football',
    climate: 'Tropical', independence: '1821', neighbours: ['Guatemala', 'Honduras'],
  },
  'Nicaragua': {
    name: 'Nicaragua', capital: 'Managua', continent: 'North America', currency: 'Nicaraguan Córdoba',
    language: 'Spanish', population: '7 million', landmark: 'Lake Nicaragua',
    flag: '🇳🇮', funFact: 'Lake Nicaragua is the only freshwater lake in the world that has sharks (bull sharks).',
    famousPerson: 'Rubén Darío', famousDish: 'Gallo Pinto', sport: 'Baseball',
    climate: 'Tropical', independence: '1821', neighbours: ['Honduras', 'Costa Rica'],
  },
  'Trinidad and Tobago': {
    name: 'Trinidad and Tobago', capital: 'Port of Spain', continent: 'North America', currency: 'Trinidad and Tobago Dollar',
    language: 'English', population: '1.4 million', landmark: 'Pitch Lake',
    flag: '🇹🇹', funFact: 'Trinidad has the world\'s largest natural deposit of asphalt — the famous Pitch Lake.',
    famousPerson: 'Nicki Minaj', famousDish: 'Doubles', sport: 'Cricket',
    climate: 'Tropical', independence: '1962', neighbours: ['Venezuela'],
  },

  // ============ OCEANIA — EXPANDED ============
  'Papua New Guinea': {
    name: 'Papua New Guinea', capital: 'Port Moresby', continent: 'Oceania', currency: 'Papua New Guinean Kina',
    language: 'Tok Pisin, English & Hiri Motu', population: '10 million', landmark: 'Kokoda Track',
    flag: '🇵🇬', funFact: 'Papua New Guinea has over 800 languages — the most linguistically diverse country on Earth.',
    famousPerson: 'Michael Somare', famousDish: 'Mumu', sport: 'Rugby League',
    climate: 'Tropical', independence: '1975', neighbours: ['Indonesia', 'Australia'],
  },
  'Fiji': {
    name: 'Fiji', capital: 'Suva', continent: 'Oceania', currency: 'Fijian Dollar',
    language: 'English, Fijian & Hindi', population: '900,000', landmark: 'Navua River',
    flag: '🇫🇯', funFact: 'Fiji has over 330 islands, and rugby sevens is a national obsession — they won Olympic gold in 2016.',
    famousPerson: 'Waisale Serevi', famousDish: 'Kokoda', sport: 'Rugby',
    climate: 'Tropical', independence: '1970', neighbours: ['Tonga', 'Samoa'],
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
  if (norm === 'uae') return COUNTRY_METADATA['United Arab Emirates'];
  if (norm === 'czechia') return COUNTRY_METADATA['Czech Republic'];
  if (norm === 'cote d\'ivoire' || norm === 'cote divoire') return COUNTRY_METADATA['Ivory Coast'];
  if (norm === 'republic of korea') return COUNTRY_METADATA['South Korea'];
  if (norm === 'dprk') return COUNTRY_METADATA['North Korea'];
  if (norm === 'islamic republic of iran') return COUNTRY_METADATA['Iran'];
  if (norm === 'eswatini' || norm === 'swaziland') return COUNTRY_METADATA['Eswatini'] || null;
  if (norm === 'burma') return COUNTRY_METADATA['Myanmar'];
  if (norm === 'persia') return COUNTRY_METADATA['Iran'];
  if (norm === 'ceylon') return COUNTRY_METADATA['Sri Lanka'];
  if (norm === 'siam') return COUNTRY_METADATA['Thailand'];
  if (norm === 'holland') return COUNTRY_METADATA['Netherlands'];
  if (norm === 'palestine' || norm === 'west bank' || norm === 'gaza') return null; // No metadata yet
  return null;
}
