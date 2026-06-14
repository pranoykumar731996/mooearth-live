// ============================================================
// Play Earth — Curated High-Quality Questions
// ============================================================

import { EarthQuestion } from '@/types';

export const CURATED_QUESTIONS: EarthQuestion[] = [
  // ---- BRAZIL ----
  { id: 'br-geo-1', country: 'Brazil', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Brazil?',
    choices: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correctIndex: 2,
    funFact: 'Brasília was purpose-built as the capital in the 1960s and designed in the shape of an airplane.' },
  { id: 'br-sports-1', country: 'Brazil', category: 'sports', difficulty: 'easy',
    question: 'How many FIFA World Cups has Brazil won?',
    choices: ['3', '4', '5', '6'], correctIndex: 2,
    funFact: 'Brazil is the most successful nation in World Cup history with 5 titles.' },
  { id: 'br-geo-2', country: 'Brazil', category: 'geography', difficulty: 'medium',
    question: 'Which is the longest river flowing through Brazil?',
    choices: ['Paraná', 'Amazon', 'São Francisco', 'Tocantins'], correctIndex: 1,
    funFact: 'The Amazon River is the largest by volume and second longest river in the world.' },
  { id: 'br-history-1', country: 'Brazil', category: 'history', difficulty: 'medium',
    question: 'From which country did Brazil gain independence in 1822?',
    choices: ['Spain', 'France', 'Portugal', 'Netherlands'], correctIndex: 2,
    funFact: 'Prince Pedro declared independence with the famous "Cry of Ipiranga" on September 7, 1822.' },
  { id: 'br-trivia-1', country: 'Brazil', category: 'trivia', difficulty: 'hard',
    question: 'What unique feature does Brazil\'s flag show that changes with new states?',
    choices: ['The number of stripes', 'The stars representing states', 'The color of the diamond', 'The motto text'], correctIndex: 1,
    funFact: 'Each star on the Brazilian flag represents a state, and the pattern shows the sky over Rio de Janeiro.' },

  // ---- ARGENTINA ----
  { id: 'ar-geo-1', country: 'Argentina', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Argentina?',
    choices: ['Córdoba', 'Mendoza', 'Rosario', 'Buenos Aires'], correctIndex: 3,
    funFact: 'Buenos Aires means "Good Winds" or "Fair Winds" in Spanish.' },
  { id: 'ar-sports-1', country: 'Argentina', category: 'sports', difficulty: 'easy',
    question: 'Who is Argentina\'s all-time leading goal scorer?',
    choices: ['Diego Maradona', 'Lionel Messi', 'Gabriel Batistuta', 'Sergio Agüero'], correctIndex: 1,
    funFact: 'Lionel Messi surpassed 100 international goals and won the 2022 World Cup with Argentina.' },
  { id: 'ar-geo-2', country: 'Argentina', category: 'geography', difficulty: 'medium',
    question: 'Which famous waterfall system is located on the Argentina-Brazil border?',
    choices: ['Angel Falls', 'Niagara Falls', 'Iguazu Falls', 'Victoria Falls'], correctIndex: 2,
    funFact: 'Iguazu Falls consists of 275 individual waterfalls spanning nearly 3 kilometers.' },

  // ---- UNITED STATES ----
  { id: 'us-geo-1', country: 'United States', category: 'geography', difficulty: 'easy',
    question: 'How many states are in the United States?',
    choices: ['48', '50', '51', '52'], correctIndex: 1,
    funFact: 'Hawaii and Alaska were the last two states to be admitted in 1959.' },
  { id: 'us-space-1', country: 'United States', category: 'space', difficulty: 'easy',
    question: 'Which US space agency landed humans on the Moon?',
    choices: ['SpaceX', 'NASA', 'ESA', 'DARPA'], correctIndex: 1,
    funFact: 'Neil Armstrong was the first person to walk on the Moon on July 20, 1969.' },
  { id: 'us-tech-1', country: 'United States', category: 'technology', difficulty: 'medium',
    question: 'In which city is Silicon Valley located?',
    choices: ['Los Angeles', 'San Francisco Bay Area', 'Seattle', 'Austin'], correctIndex: 1,
    funFact: 'Silicon Valley got its name from the silicon used in computer chips manufactured there.' },
  { id: 'us-history-1', country: 'United States', category: 'history', difficulty: 'medium',
    question: 'In which year did the United States declare independence?',
    choices: ['1765', '1776', '1789', '1801'], correctIndex: 1,
    funFact: 'The Declaration of Independence was primarily authored by Thomas Jefferson.' },

  // ---- UNITED KINGDOM ----
  { id: 'uk-geo-1', country: 'United Kingdom', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of the United Kingdom?',
    choices: ['Edinburgh', 'Manchester', 'London', 'Birmingham'], correctIndex: 2,
    funFact: 'London is one of the most diverse cities in the world, with over 300 languages spoken.' },
  { id: 'uk-sports-1', country: 'United Kingdom', category: 'sports', difficulty: 'medium',
    question: 'In which year was the first FIFA World Cup held in England?',
    choices: ['1958', '1962', '1966', '1970'], correctIndex: 2,
    funFact: 'England won their only World Cup in 1966, beating West Germany 4-2 in the final at Wembley.' },
  { id: 'uk-history-1', country: 'United Kingdom', category: 'history', difficulty: 'hard',
    question: 'Which monarch saw the longest reign in British history before Queen Elizabeth II?',
    choices: ['Queen Victoria', 'King George III', 'King Henry VIII', 'King Edward VII'], correctIndex: 0,
    funFact: 'Queen Victoria reigned for 63 years from 1837 to 1901, before Elizabeth II broke the record.' },

  // ---- FRANCE ----
  { id: 'fr-geo-1', country: 'France', category: 'geography', difficulty: 'easy',
    question: 'What famous tower stands in Paris?',
    choices: ['Big Ben', 'Leaning Tower', 'Eiffel Tower', 'CN Tower'], correctIndex: 2,
    funFact: 'The Eiffel Tower was built in 1889 and was supposed to be temporary!' },
  { id: 'fr-history-1', country: 'France', category: 'history', difficulty: 'medium',
    question: 'In which year did the French Revolution begin?',
    choices: ['1776', '1789', '1804', '1815'], correctIndex: 1,
    funFact: 'The storming of the Bastille on July 14, 1789 is celebrated as France\'s national day.' },
  { id: 'fr-trivia-1', country: 'France', category: 'trivia', difficulty: 'medium',
    question: 'Which French dish is made from snails?',
    choices: ['Ratatouille', 'Escargot', 'Bouillabaisse', 'Crêpe'], correctIndex: 1,
    funFact: 'France consumes approximately 30,000 tonnes of snails per year.' },

  // ---- GERMANY ----
  { id: 'de-geo-1', country: 'Germany', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Germany?',
    choices: ['Munich', 'Hamburg', 'Frankfurt', 'Berlin'], correctIndex: 3,
    funFact: 'Berlin is 9 times bigger than Paris and has more bridges than Venice.' },
  { id: 'de-tech-1', country: 'Germany', category: 'technology', difficulty: 'medium',
    question: 'Which German invented the printing press?',
    choices: ['Albert Einstein', 'Johannes Gutenberg', 'Karl Benz', 'Werner Heisenberg'], correctIndex: 1,
    funFact: 'Gutenberg\'s printing press, invented around 1440, revolutionized the spread of knowledge.' },
  { id: 'de-sports-1', country: 'Germany', category: 'sports', difficulty: 'medium',
    question: 'How many FIFA World Cups has Germany won?',
    choices: ['2', '3', '4', '5'], correctIndex: 2,
    funFact: 'Germany won the World Cup in 1954, 1974, 1990, and 2014.' },

  // ---- JAPAN ----
  { id: 'jp-geo-1', country: 'Japan', category: 'geography', difficulty: 'easy',
    question: 'What is the highest mountain in Japan?',
    choices: ['Mount Kita', 'Mount Fuji', 'Mount Tate', 'Mount Hotaka'], correctIndex: 1,
    funFact: 'Mount Fuji last erupted in 1707 and is considered an active volcano.' },
  { id: 'jp-tech-1', country: 'Japan', category: 'technology', difficulty: 'medium',
    question: 'Which Japanese company created the PlayStation?',
    choices: ['Nintendo', 'Sega', 'Sony', 'Panasonic'], correctIndex: 2,
    funFact: 'The original PlayStation launched in Japan in December 1994.' },
  { id: 'jp-trivia-1', country: 'Japan', category: 'trivia', difficulty: 'hard',
    question: 'What does "sakura" mean in Japanese?',
    choices: ['Sunset', 'Mountain', 'Cherry Blossom', 'Ocean'], correctIndex: 2,
    funFact: 'Cherry blossom season (hanami) is celebrated every spring and symbolizes renewal.' },

  // ---- INDIA ----
  { id: 'in-geo-1', country: 'India', category: 'geography', difficulty: 'easy',
    question: 'Which famous white marble building is located in Agra, India?',
    choices: ['Red Fort', 'Taj Mahal', 'Gateway of India', 'Lotus Temple'], correctIndex: 1,
    funFact: 'The Taj Mahal was built by Mughal emperor Shah Jahan as a memorial for his wife Mumtaz Mahal.' },
  { id: 'in-sports-1', country: 'India', category: 'sports', difficulty: 'easy',
    question: 'Which sport is the most popular in India?',
    choices: ['Football', 'Hockey', 'Cricket', 'Tennis'], correctIndex: 2,
    funFact: 'India has won the Cricket World Cup twice — in 1983 and 2011.' },
  { id: 'in-space-1', country: 'India', category: 'space', difficulty: 'medium',
    question: 'What is the name of India\'s space agency?',
    choices: ['NASA India', 'ISRO', 'DRDO', 'CSIR'], correctIndex: 1,
    funFact: 'ISRO successfully sent a mission to Mars on its very first attempt in 2014.' },
  { id: 'in-tech-1', country: 'India', category: 'technology', difficulty: 'medium',
    question: 'Which Indian city is known as the "Silicon Valley of India"?',
    choices: ['Mumbai', 'Hyderabad', 'Bengaluru', 'Pune'], correctIndex: 2,
    funFact: 'Bengaluru hosts offices of over 400 Fortune 500 companies.' },

  // ---- CHINA ----
  { id: 'cn-geo-1', country: 'China', category: 'geography', difficulty: 'easy',
    question: 'How long is the Great Wall of China approximately?',
    choices: ['5,000 km', '10,000 km', '21,000 km', '50,000 km'], correctIndex: 2,
    funFact: 'The Great Wall was built over many centuries and is NOT visible from space with the naked eye.' },
  { id: 'cn-history-1', country: 'China', category: 'history', difficulty: 'medium',
    question: 'Which dynasty built the Terracotta Army?',
    choices: ['Han Dynasty', 'Qin Dynasty', 'Ming Dynasty', 'Tang Dynasty'], correctIndex: 1,
    funFact: 'The Terracotta Army consists of approximately 8,000 life-sized soldiers buried with Emperor Qin Shi Huang.' },

  // ---- AUSTRALIA ----
  { id: 'au-geo-1', country: 'Australia', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Australia?',
    choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2,
    funFact: 'Canberra was chosen as the capital as a compromise between rivals Sydney and Melbourne.' },
  { id: 'au-trivia-1', country: 'Australia', category: 'trivia', difficulty: 'medium',
    question: 'Which iconic Australian animal carries its baby in a pouch?',
    choices: ['Koala', 'Platypus', 'Kangaroo', 'Wombat'], correctIndex: 2,
    funFact: 'Both kangaroos and koalas are marsupials, but the kangaroo\'s pouch is most well-known.' },
  { id: 'au-geo-2', country: 'Australia', category: 'geography', difficulty: 'hard',
    question: 'What is the world\'s largest coral reef system, located off Australia?',
    choices: ['Belize Barrier Reef', 'Great Barrier Reef', 'Red Sea Coral Reef', 'Ningaloo Reef'], correctIndex: 1,
    funFact: 'The Great Barrier Reef is so large it can be seen from outer space.' },

  // ---- CANADA ----
  { id: 'ca-geo-1', country: 'Canada', category: 'geography', difficulty: 'easy',
    question: 'Which leaf appears on the Canadian flag?',
    choices: ['Oak Leaf', 'Maple Leaf', 'Pine Leaf', 'Birch Leaf'], correctIndex: 1,
    funFact: 'The maple leaf has been a symbol of Canada since the 18th century.' },
  { id: 'ca-sports-1', country: 'Canada', category: 'sports', difficulty: 'easy',
    question: 'Which sport is considered Canada\'s national winter sport?',
    choices: ['Curling', 'Figure Skating', 'Ice Hockey', 'Skiing'], correctIndex: 2,
    funFact: 'Ice hockey was invented in Canada in the 19th century.' },

  // ---- MEXICO ----
  { id: 'mx-geo-1', country: 'Mexico', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Mexico?',
    choices: ['Cancún', 'Guadalajara', 'Monterrey', 'Mexico City'], correctIndex: 3,
    funFact: 'Mexico City is one of the largest cities in the world with over 21 million in the metro area.' },
  { id: 'mx-history-1', country: 'Mexico', category: 'history', difficulty: 'medium',
    question: 'Which ancient civilization built the pyramid at Chichén Itzá?',
    choices: ['Aztecs', 'Incas', 'Maya', 'Olmecs'], correctIndex: 2,
    funFact: 'Chichén Itzá is one of the New Seven Wonders of the World.' },

  // ---- SOUTH KOREA ----
  { id: 'kr-tech-1', country: 'South Korea', category: 'technology', difficulty: 'easy',
    question: 'Which South Korean company manufactures the Galaxy smartphone series?',
    choices: ['LG', 'Samsung', 'Hyundai', 'SK Hynix'], correctIndex: 1,
    funFact: 'Samsung is the largest technology company by revenue in South Korea.' },
  { id: 'kr-trivia-1', country: 'South Korea', category: 'trivia', difficulty: 'medium',
    question: 'What is the traditional fermented cabbage dish of Korea?',
    choices: ['Sushi', 'Kimchi', 'Bibimbap', 'Ramen'], correctIndex: 1,
    funFact: 'Kimchi has been part of Korean culture for over 2,000 years and was added to UNESCO\'s cultural heritage list.' },

  // ---- ITALY ----
  { id: 'it-geo-1', country: 'Italy', category: 'geography', difficulty: 'easy',
    question: 'What is the capital of Italy?',
    choices: ['Milan', 'Venice', 'Florence', 'Rome'], correctIndex: 3,
    funFact: 'Rome was founded in 753 BC and is known as the "Eternal City".' },
  { id: 'it-history-1', country: 'Italy', category: 'history', difficulty: 'medium',
    question: 'Which famous artist painted the ceiling of the Sistine Chapel?',
    choices: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'], correctIndex: 1,
    funFact: 'Michelangelo painted the Sistine Chapel ceiling between 1508 and 1512, mostly lying on his back.' },

  // ---- SPAIN ----
  { id: 'es-trivia-1', country: 'Spain', category: 'trivia', difficulty: 'easy',
    question: 'What is Spain\'s most famous traditional rice dish?',
    choices: ['Risotto', 'Sushi', 'Paella', 'Biryani'], correctIndex: 2,
    funFact: 'Paella originated in Valencia and traditionally uses rabbit, chicken, and snails.' },
  { id: 'es-sports-1', country: 'Spain', category: 'sports', difficulty: 'medium',
    question: 'How many UEFA Champions League titles has Real Madrid won (as of 2024)?',
    choices: ['10', '12', '15', '18'], correctIndex: 2,
    funFact: 'Real Madrid is the most successful club in Champions League history.' },

  // ---- MOROCCO ----
  { id: 'ma-geo-1', country: 'Morocco', category: 'geography', difficulty: 'easy',
    question: 'On which continent is Morocco located?',
    choices: ['Asia', 'South America', 'Africa', 'Europe'], correctIndex: 2,
    funFact: 'Morocco is only 14 km from Spain across the Strait of Gibraltar.' },
  { id: 'ma-sports-1', country: 'Morocco', category: 'sports', difficulty: 'medium',
    question: 'In which FIFA World Cup did Morocco reach the semi-finals for the first time?',
    choices: ['2018 Russia', '2022 Qatar', '2014 Brazil', '2010 South Africa'], correctIndex: 1,
    funFact: 'Morocco became the first African and Arab nation to reach a World Cup semi-final.' },

  // ---- EGYPT ----
  { id: 'eg-history-1', country: 'Egypt', category: 'history', difficulty: 'easy',
    question: 'What are the ancient monumental structures built as tombs for pharaohs?',
    choices: ['Ziggurats', 'Pyramids', 'Colosseum', 'Temples'], correctIndex: 1,
    funFact: 'The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years.' },
  { id: 'eg-geo-1', country: 'Egypt', category: 'geography', difficulty: 'medium',
    question: 'Which river flows through Egypt and is the longest in Africa?',
    choices: ['Congo', 'Niger', 'Zambezi', 'Nile'], correctIndex: 3,
    funFact: 'The Nile River is approximately 6,650 km long.' },

  // ---- SOUTH AFRICA ----
  { id: 'za-trivia-1', country: 'South Africa', category: 'trivia', difficulty: 'medium',
    question: 'How many official languages does South Africa have?',
    choices: ['3', '7', '9', '11'], correctIndex: 3,
    funFact: 'South Africa has the most official languages of any country.' },
  { id: 'za-sports-1', country: 'South Africa', category: 'sports', difficulty: 'medium',
    question: 'What sport is most associated with the South African Springboks?',
    choices: ['Football', 'Cricket', 'Rugby', 'Hockey'], correctIndex: 2,
    funFact: 'South Africa\'s 1995 Rugby World Cup win was immortalized in the film "Invictus".' },

  // ---- TURKEY ----
  { id: 'tr-geo-1', country: 'Turkey', category: 'geography', difficulty: 'medium',
    question: 'Which Turkish city straddles two continents?',
    choices: ['Ankara', 'Izmir', 'Istanbul', 'Antalya'], correctIndex: 2,
    funFact: 'Istanbul is the only major city in the world that sits on two continents: Europe and Asia.' },

  // ---- RUSSIA ----
  { id: 'ru-geo-1', country: 'Russia', category: 'geography', difficulty: 'easy',
    question: 'Russia is the largest country by what measure?',
    choices: ['Population', 'GDP', 'Land area', 'Coastline'], correctIndex: 2,
    funFact: 'Russia covers more than 17 million square kilometers — spanning 11 time zones.' },

  // ---- PORTUGAL ----
  { id: 'pt-sports-1', country: 'Portugal', category: 'sports', difficulty: 'easy',
    question: 'Which Portuguese footballer is considered one of the greatest of all time?',
    choices: ['Eusébio', 'Cristiano Ronaldo', 'Luís Figo', 'Bernardo Silva'], correctIndex: 1,
    funFact: 'Cristiano Ronaldo is the all-time top scorer in men\'s international football.' },

  // ---- SWITZERLAND ----
  { id: 'ch-trivia-1', country: 'Switzerland', category: 'trivia', difficulty: 'medium',
    question: 'How many official languages does Switzerland have?',
    choices: ['2', '3', '4', '5'], correctIndex: 2,
    funFact: 'Switzerland\'s four official languages are German, French, Italian, and Romansh.' },

  // ---- NIGERIA ----
  { id: 'ng-trivia-1', country: 'Nigeria', category: 'trivia', difficulty: 'medium',
    question: 'What is Nigeria\'s film industry commonly called?',
    choices: ['Bollywood', 'Hollywood', 'Nollywood', 'Tollywood'], correctIndex: 2,
    funFact: 'Nollywood is the second largest film industry in the world by number of films produced.' },

  // ---- PERU ----
  { id: 'pe-geo-1', country: 'Peru', category: 'geography', difficulty: 'easy',
    question: 'Which famous Inca citadel sits high in the Andes mountains of Peru?',
    choices: ['Teotihuacan', 'Angkor Wat', 'Machu Picchu', 'Petra'], correctIndex: 2,
    funFact: 'Machu Picchu sits at 2,430 meters above sea level and was built around 1450.' },

  // ---- NEW ZEALAND ----
  { id: 'nz-trivia-1', country: 'New Zealand', category: 'trivia', difficulty: 'medium',
    question: 'Which famous film trilogy was shot entirely in New Zealand?',
    choices: ['Harry Potter', 'Star Wars', 'The Lord of the Rings', 'The Matrix'], correctIndex: 2,
    funFact: 'Peter Jackson filmed all three Lord of the Rings movies in his home country of New Zealand.' },

  // ---- KENYA ----
  { id: 'ke-sports-1', country: 'Kenya', category: 'sports', difficulty: 'medium',
    question: 'Kenya is world-renowned for producing champions in which athletic discipline?',
    choices: ['Sprinting', 'Long-Distance Running', 'Swimming', 'Weightlifting'], correctIndex: 1,
    funFact: 'Eliud Kipchoge from Kenya was the first person to run a marathon in under 2 hours.' },

  // ---- NORWAY ----
  { id: 'no-geo-1', country: 'Norway', category: 'geography', difficulty: 'medium',
    question: 'What are the deep, narrow inlets carved by glaciers along Norway\'s coast called?',
    choices: ['Atolls', 'Fjords', 'Deltas', 'Estuaries'], correctIndex: 1,
    funFact: 'Norway has over 1,000 fjords, with the longest being Sognefjorden at 204 km.' },

  // ---- THAILAND ----
  { id: 'th-trivia-1', country: 'Thailand', category: 'trivia', difficulty: 'easy',
    question: 'What is the former name of Thailand?',
    choices: ['Burma', 'Siam', 'Ceylon', 'Formosa'], correctIndex: 1,
    funFact: 'Thailand changed its name from Siam to Thailand in 1939, meaning "Land of the Free".' },

  // ---- GREECE ----
  { id: 'gr-history-1', country: 'Greece', category: 'history', difficulty: 'easy',
    question: 'Where did the ancient Olympic Games originate?',
    choices: ['Rome', 'Athens', 'Olympia, Greece', 'Sparta'], correctIndex: 2,
    funFact: 'The first recorded Olympic Games were held in Olympia in 776 BC.' },
];
