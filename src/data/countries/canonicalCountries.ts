// ============================================================
// MooEarth Live — Canonical 195 Sovereign Nations Dataset
// ============================================================
// Strict canonical dataset covering all 195 United Nations sovereign states
// (193 UN member states + Holy See/Vatican City + State of Palestine).
// Verified real geographic coordinates, capitals, populations, and demographics.

import { CountryRecord } from './types';

export const CANONICAL_COUNTRIES: CountryRecord[] = [
  {
    "id": "af",
    "name": "Afghanistan",
    "slug": "afghanistan",
    "iso2": "AF",
    "iso3": "AFG",
    "capital": "Kabul",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 33.9391,
      "lng": 67.71
    },
    "population": "41 million",
    "areaKm2": 652864,
    "currency": "Afghan Afghani (AFN)",
    "languages": "Pashto, Dari",
    "flag": "🇦🇫",
    "majorCities": [
      "Kabul",
      "Kandahar",
      "Herat",
      "Mazar-i-Sharif"
    ],
    "geography": "Landlocked country dominated by the rugged Hindu Kush mountain range and arid southern plains.",
    "landmark": "Minaret of Jam",
    "climate": "Arid to semi-arid; cold winters and hot summers",
    "funFact": "Afghanistan is home to the world’s oldest known oil paintings, created in caves around 650 AD.",
    "neighbours": [
      "Pakistan",
      "Iran",
      "Turkmenistan",
      "Uzbekistan",
      "Tajikistan",
      "China"
    ],
    "relatedSlugs": [
      "pakistan",
      "iran",
      "turkmenistan",
      "uzbekistan",
      "tajikistan",
      "china"
    ]
  },
  {
    "id": "al",
    "name": "Albania",
    "slug": "albania",
    "iso2": "AL",
    "iso3": "ALB",
    "capital": "Tirana",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 41.1533,
      "lng": 20.1683
    },
    "population": "2.8 million",
    "areaKm2": 28748,
    "currency": "Albanian Lek (ALL)",
    "languages": "Albanian",
    "flag": "🇦🇱",
    "majorCities": [
      "Tirana",
      "Durrës",
      "Vlorë",
      "Shkodër"
    ],
    "geography": "Mountainous Balkan nation featuring pristine Adriatic and Ionian coastlines and rugged interior alps.",
    "landmark": "Rozafa Castle",
    "climate": "Mediterranean along the coast, continental alpine inland",
    "funFact": "Albania has more than 173,000 concrete defense bunkers built across its landscape during the 20th century.",
    "neighbours": [
      "Montenegro",
      "Kosovo",
      "North Macedonia",
      "Greece"
    ],
    "relatedSlugs": [
      "montenegro",
      "north-macedonia",
      "greece"
    ]
  },
  {
    "id": "dz",
    "name": "Algeria",
    "slug": "algeria",
    "iso2": "DZ",
    "iso3": "DZA",
    "capital": "Algiers",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 28.0339,
      "lng": 1.6596
    },
    "population": "45 million",
    "areaKm2": 2381741,
    "currency": "Algerian Dinar (DZD)",
    "languages": "Arabic, Berber",
    "flag": "🇩🇿",
    "majorCities": [
      "Algiers",
      "Oran",
      "Constantine",
      "Annaba"
    ],
    "geography": "The largest country in Africa by land area, dominated by the vast Sahara Desert and northern Tell Atlas range.",
    "landmark": "Djémila Roman Ruins",
    "climate": "Mediterranean coastal climate transitioning to arid desert in the south",
    "funFact": "Over 80% of Algeria’s territory is part of the Sahara Desert.",
    "neighbours": [
      "Tunisia",
      "Libya",
      "Niger",
      "Mali",
      "Mauritania",
      "Morocco"
    ],
    "relatedSlugs": [
      "tunisia",
      "libya",
      "niger",
      "mali",
      "mauritania",
      "morocco"
    ]
  },
  {
    "id": "ad",
    "name": "Andorra",
    "slug": "andorra",
    "iso2": "AD",
    "iso3": "AND",
    "capital": "Andorra la Vella",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 42.5063,
      "lng": 1.5218
    },
    "population": "80,000",
    "areaKm2": 468,
    "currency": "Euro (EUR)",
    "languages": "Catalan",
    "flag": "🇦🇩",
    "majorCities": [
      "Andorra la Vella",
      "Escaldes-Engordany",
      "Encamp",
      "Sant Julià de Lòria"
    ],
    "geography": "High-elevation Pyrenean microstate nestled between France and Spain, known for steep alpine valleys.",
    "landmark": "Casa de la Vall",
    "climate": "Alpine and temperate with snowy winters",
    "funFact": "Andorra is the only country in the world where Catalan is the sole official language.",
    "neighbours": [
      "France",
      "Spain"
    ],
    "relatedSlugs": [
      "france",
      "spain"
    ]
  },
  {
    "id": "ao",
    "name": "Angola",
    "slug": "angola",
    "iso2": "AO",
    "iso3": "AGO",
    "capital": "Luanda",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": -11.2027,
      "lng": 17.8739
    },
    "population": "35 million",
    "areaKm2": 1246700,
    "currency": "Angolan Kwanza (AOA)",
    "languages": "Portuguese",
    "flag": "🇦🇴",
    "majorCities": [
      "Luanda",
      "Huambo",
      "Lobito",
      "Benguela"
    ],
    "geography": "Atlantic coastline with an expansive central plateau, tropical rainforests in the north, and savannahs in the south.",
    "landmark": "Kalandula Falls",
    "climate": "Semi-arid in the south to tropical humid in the north",
    "funFact": "Angola is home to the Welwitschia mirabilis, a unique desert plant that can live for over 1,000 years.",
    "neighbours": [
      "Democratic Republic of the Congo",
      "Republic of the Congo",
      "Zambia",
      "Namibia"
    ],
    "relatedSlugs": [
      "congo",
      "zambia",
      "namibia"
    ]
  },
  {
    "id": "ag",
    "name": "Antigua and Barbuda",
    "slug": "antigua-and-barbuda",
    "iso2": "AG",
    "iso3": "ATG",
    "capital": "St. John's",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 17.0608,
      "lng": -61.7964
    },
    "population": "94,000",
    "areaKm2": 442,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English",
    "flag": "🇦🇬",
    "majorCities": [
      "St. John's",
      "All Saints",
      "Liberta",
      "Codrington"
    ],
    "geography": "Twin-island nation in the Leeward Islands consisting of low-lying limestone formations and coral reefs.",
    "landmark": "Nelson's Dockyard",
    "climate": "Tropical maritime with cooling trade winds",
    "funFact": "Antigua is renowned for having 365 distinct beaches — one for every day of the year.",
    "neighbours": [
      "Saint Kitts and Nevis",
      "Guadeloupe",
      "Montserrat"
    ],
    "relatedSlugs": [
      "saint-kitts-and-nevis"
    ]
  },
  {
    "id": "ar",
    "name": "Argentina",
    "slug": "argentina",
    "iso2": "AR",
    "iso3": "ARG",
    "capital": "Buenos Aires",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -38.4161,
      "lng": -63.6167
    },
    "population": "46 million",
    "areaKm2": 2780400,
    "currency": "Argentine Peso (ARS)",
    "languages": "Spanish",
    "flag": "🇦🇷",
    "majorCities": [
      "Buenos Aires",
      "Córdoba",
      "Rosario",
      "Mendoza"
    ],
    "geography": "Spans from tropical rainforests and Iguazu Falls to the high Andes and windswept Patagonian steppe.",
    "landmark": "Obelisco de Buenos Aires & Perito Moreno Glacier",
    "climate": "Temperate in the center, arid in the west, subpolar in Patagonia",
    "funFact": "Aconcagua in Argentina is the highest mountain peak outside of Asia at 6,961 meters.",
    "neighbours": [
      "Chile",
      "Bolivia",
      "Paraguay",
      "Brazil",
      "Uruguay"
    ],
    "relatedSlugs": [
      "chile",
      "bolivia",
      "paraguay",
      "brazil",
      "uruguay"
    ]
  },
  {
    "id": "am",
    "name": "Armenia",
    "slug": "armenia",
    "iso2": "AM",
    "iso3": "ARM",
    "capital": "Yerevan",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 40.0691,
      "lng": 45.0382
    },
    "population": "2.8 million",
    "areaKm2": 29743,
    "currency": "Armenian Dram (AMD)",
    "languages": "Armenian",
    "flag": "🇦🇲",
    "majorCities": [
      "Yerevan",
      "Gyumri",
      "Vanadzor",
      "Vagharshapat"
    ],
    "geography": "Landlocked mountainous South Caucasus nation characterized by volcanic highlands and Lake Sevan.",
    "landmark": "Geghard Monastery & Mount Ararat view",
    "climate": "Highland continental with hot summers and cold snowy winters",
    "funFact": "Armenia was the first nation in the world to adopt Christianity as its official state religion in 301 AD.",
    "neighbours": [
      "Georgia",
      "Azerbaijan",
      "Iran",
      "Turkey"
    ],
    "relatedSlugs": [
      "georgia",
      "azerbaijan",
      "iran",
      "turkey"
    ]
  },
  {
    "id": "au",
    "name": "Australia",
    "slug": "australia",
    "iso2": "AU",
    "iso3": "AUS",
    "capital": "Canberra",
    "region": "Oceania",
    "subregion": "Australia and New Zealand",
    "coordinates": {
      "lat": -25.2744,
      "lng": 133.7751
    },
    "population": "26 million",
    "areaKm2": 7692024,
    "currency": "Australian Dollar (AUD)",
    "languages": "English",
    "flag": "🇦🇺",
    "majorCities": [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Canberra"
    ],
    "geography": "Island continent featuring an arid interior Outback, tropical northern reefs, and temperate southeastern coasts.",
    "landmark": "Sydney Opera House & Uluru",
    "climate": "Arid desert in the interior to temperate in the southeast and tropical in the north",
    "funFact": "The Great Barrier Reef off the coast of Australia is the largest living structure on Earth.",
    "neighbours": [
      "Papua New Guinea",
      "Indonesia",
      "New Zealand"
    ],
    "relatedSlugs": [
      "guinea",
      "indonesia",
      "new-zealand"
    ]
  },
  {
    "id": "at",
    "name": "Austria",
    "slug": "austria",
    "iso2": "AT",
    "iso3": "AUT",
    "capital": "Vienna",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 47.5162,
      "lng": 14.5501
    },
    "population": "9 million",
    "areaKm2": 83871,
    "currency": "Euro (EUR)",
    "languages": "German",
    "flag": "🇦🇹",
    "majorCities": [
      "Vienna",
      "Graz",
      "Linz",
      "Salzburg",
      "Innsbruck"
    ],
    "geography": "Central European alpine country dominated by the Alps with the Danube River basin flowing through the north.",
    "landmark": "Schönbrunn Palace",
    "climate": "Moderate continental with alpine highland conditions in the mountains",
    "funFact": "Austria is home to the world’s oldest continuously operating zoo, Tiergarten Schönbrunn, founded in 1752.",
    "neighbours": [
      "Germany",
      "Czech Republic",
      "Slovakia",
      "Hungary",
      "Slovenia",
      "Italy",
      "Switzerland",
      "Liechtenstein"
    ],
    "relatedSlugs": [
      "germany",
      "czech-republic",
      "slovakia",
      "hungary",
      "slovenia",
      "italy"
    ]
  },
  {
    "id": "az",
    "name": "Azerbaijan",
    "slug": "azerbaijan",
    "iso2": "AZ",
    "iso3": "AZE",
    "capital": "Baku",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 40.1431,
      "lng": 47.5769
    },
    "population": "10.3 million",
    "areaKm2": 86600,
    "currency": "Azerbaijani Manat (AZN)",
    "languages": "Azerbaijani",
    "flag": "🇦🇿",
    "majorCities": [
      "Baku",
      "Ganja",
      "Sumqayit",
      "Mingachevir"
    ],
    "geography": "Bounded by the Caspian Sea and the Greater Caucasus mountains, with fertile river valleys and semi-desert mud volcanoes.",
    "landmark": "Flame Towers & Maiden Tower",
    "climate": "Semi-arid to subtropical, containing 9 of the world’s 11 climate zones",
    "funFact": "Azerbaijan is known as the \"Land of Fire\" due to natural subterranean gas fires like Yanar Dag.",
    "neighbours": [
      "Russia",
      "Georgia",
      "Armenia",
      "Iran",
      "Turkey"
    ],
    "relatedSlugs": [
      "russia",
      "georgia",
      "armenia",
      "iran",
      "turkey"
    ]
  },
  {
    "id": "bs",
    "name": "Bahamas",
    "slug": "bahamas",
    "iso2": "BS",
    "iso3": "BHS",
    "capital": "Nassau",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 25.0343,
      "lng": -77.3963
    },
    "population": "410,000",
    "areaKm2": 13943,
    "currency": "Bahamian Dollar (BSD)",
    "languages": "English",
    "flag": "🇧🇸",
    "majorCities": [
      "Nassau",
      "Freeport",
      "West End",
      "Coopers Town"
    ],
    "geography": "Archipelago of over 700 subtropical coral islands and 2,000 cays situated north of Cuba.",
    "landmark": "Dean’s Blue Hole",
    "climate": "Tropical maritime with mild trade winds",
    "funFact": "The Bahamas has Dean’s Blue Hole, one of the deepest known underwater marine sinkholes at 202 meters.",
    "neighbours": [
      "United States",
      "Cuba",
      "Turks and Caicos"
    ],
    "relatedSlugs": [
      "united-states",
      "cuba"
    ]
  },
  {
    "id": "bh",
    "name": "Bahrain",
    "slug": "bahrain",
    "iso2": "BH",
    "iso3": "BHR",
    "capital": "Manama",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 26.0667,
      "lng": 50.5577
    },
    "population": "1.5 million",
    "areaKm2": 785,
    "currency": "Bahraini Dinar (BHD)",
    "languages": "Arabic",
    "flag": "🇧🇭",
    "majorCities": [
      "Manama",
      "Riffa",
      "Muharraq",
      "Hamad Town"
    ],
    "geography": "Low-lying island archipelago in the Persian Gulf connected to Saudi Arabia via the King Fahd Causeway.",
    "landmark": "Bahrain Fort (Qal’at al-Bahrain)",
    "climate": "Arid desert climate with mild winters and very hot, humid summers",
    "funFact": "Bahrain was the first Arabian Gulf nation to discover and export crude oil in 1932.",
    "neighbours": [
      "Saudi Arabia",
      "Qatar",
      "Iran"
    ],
    "relatedSlugs": [
      "saudi-arabia",
      "qatar",
      "iran"
    ]
  },
  {
    "id": "bd",
    "name": "Bangladesh",
    "slug": "bangladesh",
    "iso2": "BD",
    "iso3": "BGD",
    "capital": "Dhaka",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 23.685,
      "lng": 90.3563
    },
    "population": "170 million",
    "areaKm2": 147570,
    "currency": "Bangladeshi Taka (BDT)",
    "languages": "Bengali",
    "flag": "🇧🇩",
    "majorCities": [
      "Dhaka",
      "Chittagong",
      "Khulna",
      "Rajshahi",
      "Sylhet"
    ],
    "geography": "Fertile river delta formed by the confluence of the Ganges (Padma), Brahmaputra (Jamuna), and Meghna rivers.",
    "landmark": "Sundarbans Mangrove Forest",
    "climate": "Tropical monsoon with heavy summer rains and warm temperatures",
    "funFact": "Bangladesh contains the Sundarbans, the largest contiguous mangrove forest and habitat of the Bengal tiger.",
    "neighbours": [
      "India",
      "Myanmar"
    ],
    "relatedSlugs": [
      "india",
      "myanmar"
    ]
  },
  {
    "id": "bb",
    "name": "Barbados",
    "slug": "barbados",
    "iso2": "BB",
    "iso3": "BRB",
    "capital": "Bridgetown",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 13.1939,
      "lng": -59.5432
    },
    "population": "281,000",
    "areaKm2": 430,
    "currency": "Barbadian Dollar (BBD)",
    "languages": "English",
    "flag": "🇧🇧",
    "majorCities": [
      "Bridgetown",
      "Speightstown",
      "Oistins",
      "Bathsheba"
    ],
    "geography": "Coral limestone island situated east of the Windward chain in the western Atlantic Ocean.",
    "landmark": "Harrison’s Cave",
    "climate": "Tropical with moderate trade winds and clear wet and dry seasons",
    "funFact": "Barbados is considered the birthplace of rum, with Mount Gay Distilleries dating back to 1703.",
    "neighbours": [
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Trinidad and Tobago"
    ],
    "relatedSlugs": [
      "saint-lucia",
      "saint-vincent-and-the-grenadines",
      "trinidad-and-tobago"
    ]
  },
  {
    "id": "by",
    "name": "Belarus",
    "slug": "belarus",
    "iso2": "BY",
    "iso3": "BLR",
    "capital": "Minsk",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 53.7098,
      "lng": 27.9534
    },
    "population": "9.2 million",
    "areaKm2": 207600,
    "currency": "Belarusian Ruble (BYN)",
    "languages": "Belarusian, Russian",
    "flag": "🇧🇾",
    "majorCities": [
      "Minsk",
      "Gomel",
      "Mogilev",
      "Vitebsk",
      "Grodno"
    ],
    "geography": "Landlocked Eastern European plains featuring extensive pine forests, peat marshes, and over 11,000 glacial lakes.",
    "landmark": "Mir Castle Complex",
    "climate": "Moderate continental with cold winters and warm, moist summers",
    "funFact": "Nearly 40% of Belarus is covered by pristine forest, including the ancient primeval Białowieża Forest.",
    "neighbours": [
      "Russia",
      "Ukraine",
      "Poland",
      "Lithuania",
      "Latvia"
    ],
    "relatedSlugs": [
      "russia",
      "ukraine",
      "poland",
      "lithuania",
      "latvia"
    ]
  },
  {
    "id": "be",
    "name": "Belgium",
    "slug": "belgium",
    "iso2": "BE",
    "iso3": "BEL",
    "capital": "Brussels",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 50.5039,
      "lng": 4.4699
    },
    "population": "11.6 million",
    "areaKm2": 30528,
    "currency": "Euro (EUR)",
    "languages": "Dutch, French, German",
    "flag": "🇧🇪",
    "majorCities": [
      "Brussels",
      "Antwerp",
      "Ghent",
      "Charleroi",
      "Liège"
    ],
    "geography": "Low-lying coastal plains in Flanders rising to the rolling hills and dense forests of the Ardennes in Wallonia.",
    "landmark": "Grand Place & Atomium",
    "climate": "Temperate maritime with frequent cloud cover and rainfall",
    "funFact": "Brussels serves as the de facto administrative capital of the European Union and headquarters of NATO.",
    "neighbours": [
      "France",
      "Germany",
      "Luxembourg",
      "Netherlands"
    ],
    "relatedSlugs": [
      "france",
      "germany",
      "luxembourg",
      "netherlands"
    ]
  },
  {
    "id": "bz",
    "name": "Belize",
    "slug": "belize",
    "iso2": "BZ",
    "iso3": "BLZ",
    "capital": "Belmopan",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 17.1899,
      "lng": -88.4976
    },
    "population": "400,000",
    "areaKm2": 22966,
    "currency": "Belize Dollar (BZD)",
    "languages": "English, Spanish, Belizean Creole",
    "flag": "🇧🇿",
    "majorCities": [
      "Belize City",
      "San Ignacio",
      "Belmopan",
      "Orange Walk"
    ],
    "geography": "Caribbean coastal swamps, mangrove cays, and dense interior rainforests framed by the Maya Mountains.",
    "landmark": "Great Blue Hole",
    "climate": "Tropical with pronounced wet and dry seasons",
    "funFact": "Belize has the second largest coral barrier reef in the world after Australia’s Great Barrier Reef.",
    "neighbours": [
      "Mexico",
      "Guatemala"
    ],
    "relatedSlugs": [
      "mexico",
      "guatemala"
    ]
  },
  {
    "id": "bj",
    "name": "Benin",
    "slug": "benin",
    "iso2": "BJ",
    "iso3": "BEN",
    "capital": "Porto-Novo",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 9.3077,
      "lng": 2.3158
    },
    "population": "13.4 million",
    "areaKm2": 114763,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French",
    "flag": "🇧🇯",
    "majorCities": [
      "Cotonou",
      "Porto-Novo",
      "Parakou",
      "Djougou"
    ],
    "geography": "Narrow West African corridor stretching from the Gulf of Guinea north to the Niger River valley.",
    "landmark": "Royal Palaces of Abomey",
    "climate": "Tropical hot and humid in the south, semi-arid savannah in the north",
    "funFact": "Benin is the historic birthplace of Vodun (Voodoo), which is officially recognized as a religion in the country.",
    "neighbours": [
      "Nigeria",
      "Togo",
      "Burkina Faso",
      "Niger"
    ],
    "relatedSlugs": [
      "niger",
      "togo",
      "burkina-faso"
    ]
  },
  {
    "id": "bt",
    "name": "Bhutan",
    "slug": "bhutan",
    "iso2": "BT",
    "iso3": "BTN",
    "capital": "Thimphu",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 27.5142,
      "lng": 90.4336
    },
    "population": "780,000",
    "areaKm2": 38394,
    "currency": "Bhutanese Ngultrum (BTN)",
    "languages": "Dzongkha",
    "flag": "🇧🇹",
    "majorCities": [
      "Thimphu",
      "Phuntsholing",
      "Paro",
      "Punakha"
    ],
    "geography": "Landlocked Himalayan kingdom characterized by towering glaciers, dramatic gorges, and sub-alpine forests.",
    "landmark": "Paro Taktsang (Tiger’s Nest)",
    "climate": "Subtropical in southern plains to alpine tundra on Himalayan peaks",
    "funFact": "Bhutan measures national progress through Gross National Happiness (GNH) rather than GDP.",
    "neighbours": [
      "China",
      "India"
    ],
    "relatedSlugs": [
      "china",
      "india"
    ]
  },
  {
    "id": "bo",
    "name": "Bolivia",
    "slug": "bolivia",
    "iso2": "BO",
    "iso3": "BOL",
    "capital": "Sucre (constitutional), La Paz (seat of government)",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -16.2902,
      "lng": -63.5887
    },
    "population": "12 million",
    "areaKm2": 1098581,
    "currency": "Boliviano (BOB)",
    "languages": "Spanish, Quechua, Aymara, Guaraní",
    "flag": "🇧🇴",
    "majorCities": [
      "Santa Cruz",
      "La Paz",
      "Cochabamba",
      "Sucre"
    ],
    "geography": "Rugged Andean highlands and high-altitude Altiplano descending east into the vast Amazon basin.",
    "landmark": "Salar de Uyuni",
    "climate": "Arid alpine on the Altiplano to humid tropical in the eastern lowlands",
    "funFact": "Salar de Uyuni in Bolivia is the world’s largest salt flat, spanning over 10,000 square kilometers.",
    "neighbours": [
      "Brazil",
      "Paraguay",
      "Argentina",
      "Chile",
      "Peru"
    ],
    "relatedSlugs": [
      "brazil",
      "paraguay",
      "argentina",
      "chile",
      "peru"
    ]
  },
  {
    "id": "ba",
    "name": "Bosnia and Herzegovina",
    "slug": "bosnia-and-herzegovina",
    "iso2": "BA",
    "iso3": "BIH",
    "capital": "Sarajevo",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 43.9159,
      "lng": 17.6791
    },
    "population": "3.2 million",
    "areaKm2": 51209,
    "currency": "Bosnia and Herzegovina Convertible Mark (BAM)",
    "languages": "Bosnian, Croatian, Serbian",
    "flag": "🇧🇦",
    "majorCities": [
      "Sarajevo",
      "Banja Luka",
      "Tuzla",
      "Zenica",
      "Mostar"
    ],
    "geography": "Dinaric Alps dominate the interior with swift rivers like the Neretva flowing through limestone canyons.",
    "landmark": "Stari Most (Old Bridge of Mostar)",
    "climate": "Moderate continental inland; Mediterranean in southern Herzegovina",
    "funFact": "Sarajevo hosted the 1984 Winter Olympic Games, the first held in a socialist nation.",
    "neighbours": [
      "Croatia",
      "Serbia",
      "Montenegro"
    ],
    "relatedSlugs": [
      "croatia",
      "serbia",
      "montenegro"
    ]
  },
  {
    "id": "bw",
    "name": "Botswana",
    "slug": "botswana",
    "iso2": "BW",
    "iso3": "BWA",
    "capital": "Gaborone",
    "region": "Africa",
    "subregion": "Southern Africa",
    "coordinates": {
      "lat": -22.3285,
      "lng": 24.6849
    },
    "population": "2.6 million",
    "areaKm2": 581730,
    "currency": "Botswana Pula (BWP)",
    "languages": "English, Setswana",
    "flag": "🇧🇼",
    "majorCities": [
      "Gaborone",
      "Francistown",
      "Molepolole",
      "Maun"
    ],
    "geography": "Topographically flat country dominated by the Kalahari Desert and the inland Okavango Delta wetland.",
    "landmark": "Okavango Delta",
    "climate": "Semi-arid with hot summers and dry, mild winters",
    "funFact": "The Okavango Delta is one of the few inland deltas on Earth that does not flow into a sea or ocean.",
    "neighbours": [
      "South Africa",
      "Namibia",
      "Zimbabwe",
      "Zambia"
    ],
    "relatedSlugs": [
      "south-africa",
      "namibia",
      "zimbabwe",
      "zambia"
    ]
  },
  {
    "id": "br",
    "name": "Brazil",
    "slug": "brazil",
    "iso2": "BR",
    "iso3": "BRA",
    "capital": "Brasília",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -14.235,
      "lng": -51.9253
    },
    "population": "215 million",
    "areaKm2": 8515767,
    "currency": "Brazilian Real (BRL)",
    "languages": "Portuguese",
    "flag": "🇧🇷",
    "majorCities": [
      "São Paulo",
      "Rio de Janeiro",
      "Brasília",
      "Salvador",
      "Fortaleza"
    ],
    "geography": "Encompasses the immense Amazon River basin and rainforest, the Pantanal wetlands, and Atlantic coastal ranges.",
    "landmark": "Christ the Redeemer",
    "climate": "Mostly tropical, with temperate zones in the southern highlands",
    "funFact": "Brazil holds approximately 60% of the Amazon Rainforest, the largest biodiversity reservoir on the planet.",
    "neighbours": [
      "Argentina",
      "Bolivia",
      "Colombia",
      "Guyana",
      "Paraguay",
      "Peru",
      "Suriname",
      "Uruguay",
      "Venezuela"
    ],
    "relatedSlugs": [
      "argentina",
      "bolivia",
      "colombia",
      "guyana",
      "paraguay",
      "peru"
    ]
  },
  {
    "id": "bn",
    "name": "Brunei",
    "slug": "brunei",
    "iso2": "BN",
    "iso3": "BRN",
    "capital": "Bandar Seri Begawan",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 4.5353,
      "lng": 114.7277
    },
    "population": "450,000",
    "areaKm2": 5765,
    "currency": "Brunei Dollar (BND)",
    "languages": "Malay, English",
    "flag": "🇧🇳",
    "majorCities": [
      "Bandar Seri Begawan",
      "Kuala Belait",
      "Seria",
      "Tutong"
    ],
    "geography": "Situated on the northern coast of Borneo surrounded by the South China Sea and the Malaysian state of Sarawak.",
    "landmark": "Omar Ali Saifuddien Mosque",
    "climate": "Tropical rainforest climate with high humidity and year-round rainfall",
    "funFact": "Over 70% of Brunei’s landmass remains covered in pristine virgin tropical rainforest.",
    "neighbours": [
      "Malaysia"
    ],
    "relatedSlugs": [
      "malaysia"
    ]
  },
  {
    "id": "bg",
    "name": "Bulgaria",
    "slug": "bulgaria",
    "iso2": "BG",
    "iso3": "BGR",
    "capital": "Sofia",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 42.7339,
      "lng": 25.4858
    },
    "population": "6.5 million",
    "areaKm2": 110879,
    "currency": "Bulgarian Lev (BGN)",
    "languages": "Bulgarian",
    "flag": "🇧🇬",
    "majorCities": [
      "Sofia",
      "Plovdiv",
      "Varna",
      "Burgas",
      "Ruse"
    ],
    "geography": "Balkan Mountain ranges bisect the country, with the Danubian Plain to the north and Black Sea coast to the east.",
    "landmark": "Alexander Nevsky Cathedral & Rila Monastery",
    "climate": "Humid continental with Mediterranean influences in the south",
    "funFact": "Bulgaria is one of the world’s leading producers of natural rose oil, extracted in the Rose Valley.",
    "neighbours": [
      "Romania",
      "Serbia",
      "North Macedonia",
      "Greece",
      "Turkey"
    ],
    "relatedSlugs": [
      "oman",
      "serbia",
      "north-macedonia",
      "greece",
      "turkey"
    ]
  },
  {
    "id": "bf",
    "name": "Burkina Faso",
    "slug": "burkina-faso",
    "iso2": "BF",
    "iso3": "BFA",
    "capital": "Ouagadougou",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 12.2383,
      "lng": -1.5616
    },
    "population": "22 million",
    "areaKm2": 274200,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French",
    "flag": "🇧🇫",
    "majorCities": [
      "Ouagadougou",
      "Bobo-Dioulasso",
      "Koudougou",
      "Banfora"
    ],
    "geography": "Landlocked Sahelian plateau with scattered hills and savannahs draining into the Volta River system.",
    "landmark": "Sindou Peaks",
    "climate": "Tropical semi-arid with hot dry seasons and brief monsoonal rainfall",
    "funFact": "The name Burkina Faso translates to \"Land of Incorruptible People\" in Moré and Dioula.",
    "neighbours": [
      "Mali",
      "Niger",
      "Benin",
      "Togo",
      "Ghana",
      "Ivory Coast"
    ],
    "relatedSlugs": [
      "mali",
      "niger",
      "benin",
      "togo",
      "ghana",
      "ivory-coast"
    ]
  },
  {
    "id": "bi",
    "name": "Burundi",
    "slug": "burundi",
    "iso2": "BI",
    "iso3": "BDI",
    "capital": "Gitega (political), Bujumbura (economic)",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -3.3731,
      "lng": 29.9189
    },
    "population": "13 million",
    "areaKm2": 27834,
    "currency": "Burundian Franc (BIF)",
    "languages": "Kirundi, French, English",
    "flag": "🇧🇮",
    "majorCities": [
      "Bujumbura",
      "Gitega",
      "Ngozi",
      "Ruyigi"
    ],
    "geography": "Rolling hills and volcanic ridges in the Albertine Rift Valley bordering Lake Tanganyika.",
    "landmark": "Lake Tanganyika shoreline & Karera Falls",
    "climate": "Equatorial highland climate moderated by elevation",
    "funFact": "Burundi lies along Lake Tanganyika, the second deepest and second oldest freshwater lake in the world.",
    "neighbours": [
      "Rwanda",
      "Democratic Republic of the Congo",
      "Tanzania"
    ],
    "relatedSlugs": [
      "rwanda",
      "congo",
      "tanzania"
    ]
  },
  {
    "id": "cv",
    "name": "Cabo Verde",
    "slug": "cabo-verde",
    "iso2": "CV",
    "iso3": "CPV",
    "capital": "Praia",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 16.5388,
      "lng": -23.0418
    },
    "population": "590,000",
    "areaKm2": 4033,
    "currency": "Cape Verdean Escudo (CVE)",
    "languages": "Portuguese, Cape Verdean Creole",
    "flag": "🇨🇻",
    "majorCities": [
      "Praia",
      "Mindelo",
      "Espargos",
      "Assomada"
    ],
    "geography": "Volcanic archipelago of ten islands and five islets situated in the central Atlantic Ocean.",
    "landmark": "Pico do Fogo Volcano",
    "climate": "Subtropical dry semi-desert climate moderated by the ocean",
    "funFact": "Pico do Fogo is an active stratovolcano rising 2,829 meters above sea level on Fogo island.",
    "neighbours": [
      "Senegal",
      "Mauritania",
      "The Gambia"
    ],
    "relatedSlugs": [
      "senegal",
      "mauritania",
      "gambia"
    ]
  },
  {
    "id": "kh",
    "name": "Cambodia",
    "slug": "cambodia",
    "iso2": "KH",
    "iso3": "KHM",
    "capital": "Phnom Penh",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 12.5657,
      "lng": 104.991
    },
    "population": "17 million",
    "areaKm2": 181035,
    "currency": "Cambodian Riel (KHR)",
    "languages": "Khmer",
    "flag": "🇰🇭",
    "majorCities": [
      "Phnom Penh",
      "Siem Reap",
      "Battambang",
      "Sihanoukville"
    ],
    "geography": "Low-lying central plains basin centered on Tonlé Sap Lake and the Mekong River, ringed by mountains.",
    "landmark": "Angkor Wat",
    "climate": "Tropical monsoon with distinct wet and dry seasons",
    "funFact": "Angkor Wat is the largest religious monument in the world by land area, originally built as a Hindu temple.",
    "neighbours": [
      "Thailand",
      "Laos",
      "Vietnam"
    ],
    "relatedSlugs": [
      "thailand",
      "laos",
      "vietnam"
    ]
  },
  {
    "id": "cm",
    "name": "Cameroon",
    "slug": "cameroon",
    "iso2": "CM",
    "iso3": "CMR",
    "capital": "Yaoundé",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": 7.3697,
      "lng": 12.3547
    },
    "population": "28 million",
    "areaKm2": 475442,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "French, English",
    "flag": "🇨🇲",
    "majorCities": [
      "Douala",
      "Yaoundé",
      "Bamenda",
      "Bafoussam",
      "Garoua"
    ],
    "geography": "Diverse terrain from Atlantic coastal plains through equatorial rainforests up to Mount Cameroon and Lake Chad.",
    "landmark": "Mount Cameroon",
    "climate": "Tropical along the coast transitioning to semi-arid in the northern savannah",
    "funFact": "Cameroon is often called \"Africa in Miniature\" because it contains all major African climatic and vegetation zones.",
    "neighbours": [
      "Nigeria",
      "Chad",
      "Central African Republic",
      "Equatorial Guinea",
      "Gabon",
      "Republic of the Congo"
    ],
    "relatedSlugs": [
      "niger",
      "chad",
      "central-african-republic",
      "equatorial-guinea",
      "gabon",
      "congo"
    ]
  },
  {
    "id": "ca",
    "name": "Canada",
    "slug": "canada",
    "iso2": "CA",
    "iso3": "CAN",
    "capital": "Ottawa",
    "region": "Americas",
    "subregion": "Northern America",
    "coordinates": {
      "lat": 56.1304,
      "lng": -106.3468
    },
    "population": "39 million",
    "areaKm2": 9984670,
    "currency": "Canadian Dollar (CAD)",
    "languages": "English, French",
    "flag": "🇨🇦",
    "majorCities": [
      "Toronto",
      "Montreal",
      "Vancouver",
      "Calgary",
      "Ottawa"
    ],
    "geography": "Second-largest country by landmass, spanning Atlantic to Pacific to Arctic oceans with massive boreal forests and lakes.",
    "landmark": "CN Tower & Banff National Park",
    "climate": "Temperate in the south to subarctic and arctic tundra in the north",
    "funFact": "Canada has the longest coastline of any country in the world at 243,042 kilometers.",
    "neighbours": [
      "United States",
      "Greenland"
    ],
    "relatedSlugs": [
      "united-states"
    ]
  },
  {
    "id": "cf",
    "name": "Central African Republic",
    "slug": "central-african-republic",
    "iso2": "CF",
    "iso3": "CAF",
    "capital": "Bangui",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": 6.6111,
      "lng": 20.9394
    },
    "population": "5.5 million",
    "areaKm2": 622984,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "French, Sango",
    "flag": "🇨🇫",
    "majorCities": [
      "Bangui",
      "Bimbo",
      "Berbérati",
      "Carnot"
    ],
    "geography": "Landlocked plateau country forming the watershed between the Chad and Congo river basins.",
    "landmark": "Dzanga-Sangha Special Reserve",
    "climate": "Tropical with dry winters and heavy monsoon summers",
    "funFact": "The Dzanga-Sangha Reserve is world-renowned for its clearing where forest elephants gather daily.",
    "neighbours": [
      "Chad",
      "Sudan",
      "South Sudan",
      "Democratic Republic of the Congo",
      "Republic of the Congo",
      "Cameroon"
    ],
    "relatedSlugs": [
      "chad",
      "sudan",
      "south-sudan",
      "congo",
      "cameroon"
    ]
  },
  {
    "id": "td",
    "name": "Chad",
    "slug": "chad",
    "iso2": "TD",
    "iso3": "TCD",
    "capital": "N'Djamena",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": 15.4542,
      "lng": 18.7322
    },
    "population": "18 million",
    "areaKm2": 1284000,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "French, Arabic",
    "flag": "🇹🇩",
    "majorCities": [
      "N'Djamena",
      "Moundou",
      "Sarh",
      "Abéché"
    ],
    "geography": "Landlocked country stretching from the northern Sahara desert through the Sahel down to the fertile Sudanian savanna.",
    "landmark": "Tibesti Mountains & Lake Chad",
    "climate": "Desert in the north, semi-arid Sahel in the center, tropical savanna in the south",
    "funFact": "Lake Chad was historically one of the largest lakes in Africa, but has shrunk by over 90% since the 1960s.",
    "neighbours": [
      "Libya",
      "Sudan",
      "Central African Republic",
      "Cameroon",
      "Nigeria",
      "Niger"
    ],
    "relatedSlugs": [
      "libya",
      "sudan",
      "central-african-republic",
      "cameroon",
      "niger"
    ]
  },
  {
    "id": "cl",
    "name": "Chile",
    "slug": "chile",
    "iso2": "CL",
    "iso3": "CHL",
    "capital": "Santiago",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -35.6751,
      "lng": -71.543
    },
    "population": "19.5 million",
    "areaKm2": 756102,
    "currency": "Chilean Peso (CLP)",
    "languages": "Spanish",
    "flag": "🇨🇱",
    "majorCities": [
      "Santiago",
      "Valparaíso",
      "Concepción",
      "La Serena"
    ],
    "geography": "Extremely long, narrow ribbon of land between the Andes Mountains and Pacific Ocean, from the Atacama to Cape Horn.",
    "landmark": "Torres del Paine & Easter Island (Rapa Nui)",
    "climate": "Desert in the north, Mediterranean in central valley, oceanic subpolar in the south",
    "funFact": "The Atacama Desert in northern Chile is the driest non-polar desert on Earth.",
    "neighbours": [
      "Peru",
      "Bolivia",
      "Argentina"
    ],
    "relatedSlugs": [
      "peru",
      "bolivia",
      "argentina"
    ]
  },
  {
    "id": "cn",
    "name": "China",
    "slug": "china",
    "iso2": "CN",
    "iso3": "CHN",
    "capital": "Beijing",
    "region": "Asia",
    "subregion": "Eastern Asia",
    "coordinates": {
      "lat": 35.8617,
      "lng": 104.1954
    },
    "population": "1.41 billion",
    "areaKm2": 9596961,
    "currency": "Chinese Yuan (CNY)",
    "languages": "Mandarin Chinese",
    "flag": "🇨🇳",
    "majorCities": [
      "Shanghai",
      "Beijing",
      "Guangzhou",
      "Shenzhen",
      "Chengdu"
    ],
    "geography": "Immense East Asian country encompassing Himalayan peaks, the Tibetan Plateau, Gobi Desert, and fertile eastern river valleys.",
    "landmark": "Great Wall of China & Forbidden City",
    "climate": "Subarctic in the north to tropical in the south, with monsoonal rhythms",
    "funFact": "China spans five geographic time zones but officially uses a single unified time zone: Beijing Time (UTC+8).",
    "neighbours": [
      "Russia",
      "Mongolia",
      "India",
      "Kazakhstan",
      "Nepal",
      "Myanmar",
      "Vietnam",
      "North Korea"
    ],
    "relatedSlugs": [
      "russia",
      "mongolia",
      "india",
      "kazakhstan",
      "nepal",
      "myanmar"
    ]
  },
  {
    "id": "co",
    "name": "Colombia",
    "slug": "colombia",
    "iso2": "CO",
    "iso3": "COL",
    "capital": "Bogotá",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": 4.5709,
      "lng": -74.2973
    },
    "population": "52 million",
    "areaKm2": 1141748,
    "currency": "Colombian Peso (COP)",
    "languages": "Spanish",
    "flag": "🇨🇴",
    "majorCities": [
      "Bogotá",
      "Medellín",
      "Cali",
      "Barranquilla",
      "Cartagena"
    ],
    "geography": "The only South American nation with coastlines on both the Pacific Ocean and Caribbean Sea, crossed by the Andes ranges.",
    "landmark": "Sanctuary of Las Lajas & Tayrona National Park",
    "climate": "Tropical along coasts and eastern plains; cool temperate in the Andean highlands",
    "funFact": "Colombia is the second most biodiverse country on Earth and home to the world’s greatest variety of bird and orchid species.",
    "neighbours": [
      "Venezuela",
      "Brazil",
      "Peru",
      "Ecuador",
      "Panama"
    ],
    "relatedSlugs": [
      "venezuela",
      "brazil",
      "peru",
      "ecuador",
      "panama"
    ]
  },
  {
    "id": "km",
    "name": "Comoros",
    "slug": "comoros",
    "iso2": "KM",
    "iso3": "COM",
    "capital": "Moroni",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -11.8753,
      "lng": 43.8722
    },
    "population": "850,000",
    "areaKm2": 1862,
    "currency": "Comorian Franc (KMF)",
    "languages": "Comorian, French, Arabic",
    "flag": "🇰🇲",
    "majorCities": [
      "Moroni",
      "Mutsamudu",
      "Fomboni",
      "Domoni"
    ],
    "geography": "Volcanic island archipelago situated at the northern end of the Mozambique Channel between Madagascar and mainland Africa.",
    "landmark": "Mount Karthala Volcano",
    "climate": "Tropical maritime with cyclone activity between December and April",
    "funFact": "Comoros is nicknamed the \"Perfumed Islands\" due to its extensive production of fragrant ylang-ylang oil.",
    "neighbours": [
      "Madagascar",
      "Mozambique",
      "Tanzania",
      "Seychelles"
    ],
    "relatedSlugs": [
      "madagascar",
      "mozambique",
      "tanzania",
      "seychelles"
    ]
  },
  {
    "id": "cg",
    "name": "Congo",
    "slug": "congo",
    "iso2": "CG",
    "iso3": "COG",
    "capital": "Brazzaville",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": -0.228,
      "lng": 15.8277
    },
    "population": "6 million",
    "areaKm2": 342000,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "French, Lingala, Kituba",
    "flag": "🇨🇬",
    "majorCities": [
      "Brazzaville",
      "Pointe-Noire",
      "Dolisie",
      "Nkayi"
    ],
    "geography": "Dense tropical rainforests, coastal Atlantic plains, and the Batéké Plateau bounded by the Congo and Ubangi rivers.",
    "landmark": "Odzala-Kokoua National Park",
    "climate": "Equatorial hot and humid year-round",
    "funFact": "Brazzaville and Kinshasa are the closest capital cities in the world after Vatican City and Rome, separated by the Congo River.",
    "neighbours": [
      "Democratic Republic of the Congo",
      "Gabon",
      "Cameroon",
      "Central African Republic",
      "Angola"
    ],
    "relatedSlugs": [
      "gabon",
      "cameroon",
      "central-african-republic",
      "angola"
    ]
  },
  {
    "id": "cr",
    "name": "Costa Rica",
    "slug": "costa-rica",
    "iso2": "CR",
    "iso3": "CRI",
    "capital": "San José",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 9.7489,
      "lng": -83.7534
    },
    "population": "5.2 million",
    "areaKm2": 51100,
    "currency": "Costa Rican Colón (CRC)",
    "languages": "Spanish",
    "flag": "🇨🇷",
    "majorCities": [
      "San José",
      "Alajuela",
      "Cartago",
      "Heredia",
      "Liberia"
    ],
    "geography": "Central American isthmus bordered by the Pacific and Caribbean, dominated by volcanic cordilleras and cloud forests.",
    "landmark": "Arenal Volcano & Manuel Antonio National Park",
    "climate": "Tropical and subtropical with rainy and dry seasons",
    "funFact": "Costa Rica abolished its standing military in 1948 and generates over 98% of its electricity from renewable sources.",
    "neighbours": [
      "Nicaragua",
      "Panama"
    ],
    "relatedSlugs": [
      "nicaragua",
      "panama"
    ]
  },
  {
    "id": "hr",
    "name": "Croatia",
    "slug": "croatia",
    "iso2": "HR",
    "iso3": "HRV",
    "capital": "Zagreb",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 45.1,
      "lng": 15.2
    },
    "population": "3.9 million",
    "areaKm2": 56594,
    "currency": "Euro (EUR)",
    "languages": "Croatian",
    "flag": "🇭🇷",
    "majorCities": [
      "Zagreb",
      "Split",
      "Rijeka",
      "Osijek",
      "Dubrovnik"
    ],
    "geography": "Crescent-shaped nation featuring over 1,000 Adriatic islands, karst mountains, and the fertile Pannonian Plain.",
    "landmark": "Plitvice Lakes & Dubrovnik Old Town Walls",
    "climate": "Mediterranean along the Dalmatian coast, continental inland",
    "funFact": "The necktie (cravat) originated in Croatia during the 17th century among Croatian cavalrymen.",
    "neighbours": [
      "Slovenia",
      "Hungary",
      "Serbia",
      "Bosnia and Herzegovina",
      "Montenegro"
    ],
    "relatedSlugs": [
      "slovenia",
      "hungary",
      "serbia",
      "bosnia-and-herzegovina",
      "montenegro"
    ]
  },
  {
    "id": "cu",
    "name": "Cuba",
    "slug": "cuba",
    "iso2": "CU",
    "iso3": "CUB",
    "capital": "Havana",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 21.5218,
      "lng": -77.7812
    },
    "population": "11.2 million",
    "areaKm2": 109884,
    "currency": "Cuban Peso (CUP)",
    "languages": "Spanish",
    "flag": "🇨🇺",
    "majorCities": [
      "Havana",
      "Santiago de Cuba",
      "Camagüey",
      "Holguín",
      "Santa Clara"
    ],
    "geography": "The largest island in the Caribbean, featuring fertile plains, rolling hills, and the Sierra Maestra mountains.",
    "landmark": "Old Havana (Habana Vieja) & Viñales Valley",
    "climate": "Tropical semitropical moderated by northeast trade winds",
    "funFact": "Cuba is home to the bee hummingbird, the smallest living bird species on Earth measuring just 5.5 cm.",
    "neighbours": [
      "United States",
      "Bahamas",
      "Haiti",
      "Jamaica",
      "Mexico"
    ],
    "relatedSlugs": [
      "united-states",
      "bahamas",
      "haiti",
      "jamaica",
      "mexico"
    ]
  },
  {
    "id": "cy",
    "name": "Cyprus",
    "slug": "cyprus",
    "iso2": "CY",
    "iso3": "CYP",
    "capital": "Nicosia",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 35.1264,
      "lng": 33.4299
    },
    "population": "1.25 million",
    "areaKm2": 9251,
    "currency": "Euro (EUR)",
    "languages": "Greek, Turkish",
    "flag": "🇨🇾",
    "majorCities": [
      "Nicosia",
      "Limassol",
      "Larnaca",
      "Paphos"
    ],
    "geography": "Eastern Mediterranean island dominated by the Troodos Mountains and Kyrenia range surrounding the central Mesaoria plain.",
    "landmark": "Tombs of the Kings & Paphos Mosaics",
    "climate": "Subtropical Mediterranean with long hot summers and mild winters",
    "funFact": "Nicosia is the world’s last divided capital city, split between the Republic of Cyprus and Turkish-controlled northern territory.",
    "neighbours": [
      "Greece",
      "Turkey",
      "Syria",
      "Lebanon",
      "Israel",
      "Egypt"
    ],
    "relatedSlugs": [
      "greece",
      "turkey",
      "syria",
      "lebanon",
      "israel",
      "egypt"
    ]
  },
  {
    "id": "cz",
    "name": "Czech Republic",
    "slug": "czech-republic",
    "iso2": "CZ",
    "iso3": "CZE",
    "capital": "Prague",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 49.8175,
      "lng": 15.473
    },
    "population": "10.8 million",
    "areaKm2": 78866,
    "currency": "Czech Koruna (CZK)",
    "languages": "Czech",
    "flag": "🇨🇿",
    "majorCities": [
      "Prague",
      "Brno",
      "Ostrava",
      "Plzeň",
      "Liberec"
    ],
    "geography": "Landlocked Central European basin encircled by low mountain ranges, dividing Bohemia in the west and Moravia in the east.",
    "landmark": "Charles Bridge & Prague Castle",
    "climate": "Temperate continental with warm summers and cold, cloudy winters",
    "funFact": "Prague Castle is the largest ancient castle complex in the world according to the Guinness World Records.",
    "neighbours": [
      "Germany",
      "Poland",
      "Slovakia",
      "Austria"
    ],
    "relatedSlugs": [
      "germany",
      "poland",
      "slovakia",
      "austria"
    ]
  },
  {
    "id": "cd",
    "name": "Democratic Republic of the Congo",
    "slug": "democratic-republic-of-the-congo",
    "iso2": "CD",
    "iso3": "COD",
    "capital": "Kinshasa",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": -4.0383,
      "lng": 21.7587
    },
    "population": "102 million",
    "areaKm2": 2344858,
    "currency": "Congolese Franc (CDF)",
    "languages": "French, Lingala, Swahili, Kikongo, Tshiluba",
    "flag": "🇨🇩",
    "majorCities": [
      "Kinshasa",
      "Lubumbashi",
      "Mbuji-Mayi",
      "Kananga",
      "Kisangani"
    ],
    "geography": "Enormous central African basin dominated by the Congo River and the world’s second-largest tropical rainforest.",
    "landmark": "Virunga National Park & Mount Nyiragongo",
    "climate": "Equatorial hot and humid with equatorial rain cycles",
    "funFact": "The Congo River is the deepest recorded river in the world, reaching depths of over 220 meters.",
    "neighbours": [
      "Republic of the Congo",
      "Central African Republic",
      "South Sudan",
      "Uganda",
      "Rwanda",
      "Burundi",
      "Tanzania",
      "Zambia",
      "Angola"
    ],
    "relatedSlugs": [
      "congo",
      "central-african-republic",
      "south-sudan",
      "uganda",
      "rwanda",
      "burundi"
    ]
  },
  {
    "id": "dk",
    "name": "Denmark",
    "slug": "denmark",
    "iso2": "DK",
    "iso3": "DNK",
    "capital": "Copenhagen",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 56.2639,
      "lng": 9.5018
    },
    "population": "5.9 million",
    "areaKm2": 43094,
    "currency": "Danish Krone (DKK)",
    "languages": "Danish",
    "flag": "🇩🇰",
    "majorCities": [
      "Copenhagen",
      "Aarhus",
      "Odense",
      "Aalborg"
    ],
    "geography": "Low-lying Scandinavian archipelago and Jutland peninsula surrounded by the Baltic and North Seas.",
    "landmark": "Nyhavn & Tivoli Gardens",
    "climate": "Temperate coastal climate with mild winters and cool summers",
    "funFact": "Denmark has no point higher than 171 meters above sea level, making it one of the flattest nations in Europe.",
    "neighbours": [
      "Germany",
      "Sweden",
      "Norway"
    ],
    "relatedSlugs": [
      "germany",
      "sweden",
      "norway"
    ]
  },
  {
    "id": "dj",
    "name": "Djibouti",
    "slug": "djibouti",
    "iso2": "DJ",
    "iso3": "DJI",
    "capital": "Djibouti City",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 11.8251,
      "lng": 42.5903
    },
    "population": "1.1 million",
    "areaKm2": 23200,
    "currency": "Djiboutian Franc (DJF)",
    "languages": "Arabic, French, Somali, Afar",
    "flag": "🇩🇯",
    "majorCities": [
      "Djibouti City",
      "Ali Sabieh",
      "Tadjoura",
      "Dikhil"
    ],
    "geography": "Strategic Horn of Africa nation on the Bab-el-Mandeb strait, characterized by volcanic plateaus and salt lakes.",
    "landmark": "Lake Assal",
    "climate": "Extremely hot and arid desert climate",
    "funFact": "Lake Assal in Djibouti is the lowest point on land in Africa at 155 meters below sea level and is ten times saltier than the ocean.",
    "neighbours": [
      "Eritrea",
      "Ethiopia",
      "Somalia"
    ],
    "relatedSlugs": [
      "eritrea",
      "ethiopia",
      "mali"
    ]
  },
  {
    "id": "dm",
    "name": "Dominica",
    "slug": "dominica",
    "iso2": "DM",
    "iso3": "DMA",
    "capital": "Roseau",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 15.415,
      "lng": -61.371
    },
    "population": "72,000",
    "areaKm2": 751,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English, Dominican Creole French",
    "flag": "🇩🇲",
    "majorCities": [
      "Roseau",
      "Portsmouth",
      "Marigot",
      "Berekua"
    ],
    "geography": "Mountainous volcanic Caribbean island covered in lush tropical rainforests with numerous thermal hot springs.",
    "landmark": "Boiling Lake & Morne Trois Pitons",
    "climate": "Tropical rainforest climate with heavy mountain rainfall",
    "funFact": "Dominica is home to Boiling Lake, the second-largest active natural hot spring in the world.",
    "neighbours": [
      "Guadeloupe",
      "Martinique"
    ],
    "relatedSlugs": [
      "antigua-and-barbuda",
      "bahamas",
      "barbados",
      "cuba"
    ]
  },
  {
    "id": "do",
    "name": "Dominican Republic",
    "slug": "dominican-republic",
    "iso2": "DO",
    "iso3": "DOM",
    "capital": "Santo Domingo",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 18.7357,
      "lng": -70.1627
    },
    "population": "11.3 million",
    "areaKm2": 48671,
    "currency": "Dominican Peso (DOP)",
    "languages": "Spanish",
    "flag": "🇩🇴",
    "majorCities": [
      "Santo Domingo",
      "Santiago de los Caballeros",
      "La Romana",
      "San Pedro de Macorís"
    ],
    "geography": "Shares the island of Hispaniola with Haiti, featuring the highest mountain in the Caribbean (Pico Duarte) and fertile valleys.",
    "landmark": "Zona Colonial of Santo Domingo",
    "climate": "Tropical maritime with cooling trade winds",
    "funFact": "Santo Domingo is the oldest continuously inhabited European settlement in the Americas, founded in 1496.",
    "neighbours": [
      "Haiti",
      "Puerto Rico"
    ],
    "relatedSlugs": [
      "haiti"
    ]
  },
  {
    "id": "ec",
    "name": "Ecuador",
    "slug": "ecuador",
    "iso2": "EC",
    "iso3": "ECU",
    "capital": "Quito",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -1.8312,
      "lng": -78.1834
    },
    "population": "18 million",
    "areaKm2": 283561,
    "currency": "US Dollar (USD)",
    "languages": "Spanish, Kichwa, Shuar",
    "flag": "🇪🇨",
    "majorCities": [
      "Guayaquil",
      "Quito",
      "Cuenca",
      "Santo Domingo",
      "Ambato"
    ],
    "geography": "Straddles the Equator across Andean volcanic highlands, the Pacific coastal plains, the Amazon, and the Galápagos Islands.",
    "landmark": "Galápagos Islands & Cotopaxi Volcano",
    "climate": "Varies dramatically from tropical coast to alpine highland and equatorial rainforest",
    "funFact": "Due to Earth’s equatorial bulge, the summit of Mount Chimborazo in Ecuador is the closest point on Earth to the Sun.",
    "neighbours": [
      "Colombia",
      "Peru"
    ],
    "relatedSlugs": [
      "colombia",
      "peru"
    ]
  },
  {
    "id": "eg",
    "name": "Egypt",
    "slug": "egypt",
    "iso2": "EG",
    "iso3": "EGY",
    "capital": "Cairo",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 26.8206,
      "lng": 30.8025
    },
    "population": "110 million",
    "areaKm2": 1002450,
    "currency": "Egyptian Pound (EGP)",
    "languages": "Arabic",
    "flag": "🇪🇬",
    "majorCities": [
      "Cairo",
      "Alexandria",
      "Giza",
      "Shubra El Kheima",
      "Port Said"
    ],
    "geography": "Transcontinental nation linked by the Sinai Peninsula, dominated by the Sahara Desert and the fertile Nile River valley and delta.",
    "landmark": "Great Pyramids of Giza & Karnak Temple",
    "climate": "Hot desert climate with almost no rainfall outside the Mediterranean coast",
    "funFact": "Over 95% of Egypt’s population lives along the narrow green corridor of the Nile River and its delta.",
    "neighbours": [
      "Libya",
      "Sudan",
      "Israel",
      "Palestine"
    ],
    "relatedSlugs": [
      "libya",
      "sudan",
      "israel",
      "palestine"
    ]
  },
  {
    "id": "sv",
    "name": "El Salvador",
    "slug": "el-salvador",
    "iso2": "SV",
    "iso3": "SLV",
    "capital": "San Salvador",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 13.7942,
      "lng": -88.8965
    },
    "population": "6.3 million",
    "areaKm2": 21041,
    "currency": "US Dollar (USD)",
    "languages": "Spanish",
    "flag": "🇸🇻",
    "majorCities": [
      "San Salvador",
      "Santa Ana",
      "San Miguel",
      "Soyapango"
    ],
    "geography": "Smallest and most densely populated Central American nation, known as the \"Land of Volcanoes\" along the Pacific Ring of Fire.",
    "landmark": "Santa Ana Volcano & Joya de Cerén",
    "climate": "Tropical with pronounced wet (May to October) and dry seasons",
    "funFact": "El Salvador is the only Central American country that does not have a coastline on the Caribbean Sea.",
    "neighbours": [
      "Guatemala",
      "Honduras"
    ],
    "relatedSlugs": [
      "guatemala",
      "honduras"
    ]
  },
  {
    "id": "gq",
    "name": "Equatorial Guinea",
    "slug": "equatorial-guinea",
    "iso2": "GQ",
    "iso3": "GNQ",
    "capital": "Malabo (current), Ciudad de la Paz (future)",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": 1.6508,
      "lng": 10.2679
    },
    "population": "1.6 million",
    "areaKm2": 28051,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "Spanish, French, Portuguese",
    "flag": "🇬🇶",
    "majorCities": [
      "Malabo",
      "Bata",
      "Ebebiyin",
      "Aconibe"
    ],
    "geography": "Comprises mainland Río Muni between Cameroon and Gabon, and volcanic islands including Bioko in the Gulf of Guinea.",
    "landmark": "Malabo Cathedral & Pico Basilé",
    "climate": "Tropical wet with abundant rainfall and high temperatures",
    "funFact": "Equatorial Guinea is the only sovereign African nation where Spanish is an official language.",
    "neighbours": [
      "Cameroon",
      "Gabon"
    ],
    "relatedSlugs": [
      "cameroon",
      "gabon"
    ]
  },
  {
    "id": "er",
    "name": "Eritrea",
    "slug": "eritrea",
    "iso2": "ER",
    "iso3": "ERI",
    "capital": "Asmara",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 15.1794,
      "lng": 39.7823
    },
    "population": "3.6 million",
    "areaKm2": 117600,
    "currency": "Eritrean Nakfa (ERN)",
    "languages": "Tigrinya, Arabic, English",
    "flag": "🇪🇷",
    "majorCities": [
      "Asmara",
      "Keren",
      "Massawa",
      "Assab"
    ],
    "geography": "Red Sea coastal nation featuring the Danakil Depression, central highlands, and western lowlands.",
    "landmark": "Asmara Modernist Architecture (UNESCO)",
    "climate": "Hot and dry along the Red Sea coast, cooler and semi-arid in the central highlands",
    "funFact": "Asmara is famous for its remarkably preserved 1930s Italian Futurist and Art Deco architecture.",
    "neighbours": [
      "Sudan",
      "Ethiopia",
      "Djibouti"
    ],
    "relatedSlugs": [
      "sudan",
      "ethiopia",
      "djibouti"
    ]
  },
  {
    "id": "ee",
    "name": "Estonia",
    "slug": "estonia",
    "iso2": "EE",
    "iso3": "EST",
    "capital": "Tallinn",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 58.5953,
      "lng": 25.0136
    },
    "population": "1.35 million",
    "areaKm2": 45228,
    "currency": "Euro (EUR)",
    "languages": "Estonian",
    "flag": "🇪🇪",
    "majorCities": [
      "Tallinn",
      "Tartu",
      "Narva",
      "Pärnu"
    ],
    "geography": "Baltic nation characterized by flat lowlands, dense forests, expansive bogs, and over 2,200 islands.",
    "landmark": "Tallinn Old Town",
    "climate": "Maritime to continental with moderate summers and cold, snowy winters",
    "funFact": "Estonia is recognized globally as one of the most advanced digital societies, pioneering e-residency and online voting.",
    "neighbours": [
      "Russia",
      "Latvia",
      "Finland",
      "Sweden"
    ],
    "relatedSlugs": [
      "russia",
      "latvia",
      "finland",
      "sweden"
    ]
  },
  {
    "id": "sz",
    "name": "Eswatini",
    "slug": "eswatini",
    "iso2": "SZ",
    "iso3": "SWZ",
    "capital": "Mbabane (administrative), Lobamba (royal/legislative)",
    "region": "Africa",
    "subregion": "Southern Africa",
    "coordinates": {
      "lat": -26.5225,
      "lng": 31.4659
    },
    "population": "1.2 million",
    "areaKm2": 17364,
    "currency": "Swazi Lilangeni (SZL), South African Rand",
    "languages": "siSwati, English",
    "flag": "🇸🇿",
    "majorCities": [
      "Mbabane",
      "Manzini",
      "Big Bend",
      "Mhlume"
    ],
    "geography": "Landlocked monarchy in southern Africa transitioning from mountainous highveld down to subtropical lowveld savannahs.",
    "landmark": "Mlilwane Wildlife Sanctuary",
    "climate": "Near temperate in the highveld to subtropical and humid in the lowveld",
    "funFact": "Eswatini (formerly Swaziland) is one of Africa’s last absolute monarchies.",
    "neighbours": [
      "South Africa",
      "Mozambique"
    ],
    "relatedSlugs": [
      "south-africa",
      "mozambique"
    ]
  },
  {
    "id": "et",
    "name": "Ethiopia",
    "slug": "ethiopia",
    "iso2": "ET",
    "iso3": "ETH",
    "capital": "Addis Ababa",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 9.145,
      "lng": 40.4897
    },
    "population": "125 million",
    "areaKm2": 1104300,
    "currency": "Ethiopian Birr (ETB)",
    "languages": "Amharic, Afaan Oromoo, Tigrinya",
    "flag": "🇪🇹",
    "majorCities": [
      "Addis Ababa",
      "Dire Dawa",
      "Mekelle",
      "Gondar",
      "Hawassa"
    ],
    "geography": "Rugged landlocked Horn of Africa nation divided by the Great Rift Valley, with high volcanic plateaus and deep gorges.",
    "landmark": "Rock-Hewn Churches of Lalibela",
    "climate": "Tropical monsoon with wide variations determined by altitude",
    "funFact": "Ethiopia operates on its own 13-month calendar which is approximately seven to eight years behind the Gregorian calendar.",
    "neighbours": [
      "Eritrea",
      "Djibouti",
      "Somalia",
      "Kenya",
      "South Sudan",
      "Sudan"
    ],
    "relatedSlugs": [
      "eritrea",
      "djibouti",
      "mali",
      "kenya",
      "south-sudan",
      "sudan"
    ]
  },
  {
    "id": "fj",
    "name": "Fiji",
    "slug": "fiji",
    "iso2": "FJ",
    "iso3": "FJI",
    "capital": "Suva",
    "region": "Oceania",
    "subregion": "Melanesia",
    "coordinates": {
      "lat": -17.7134,
      "lng": 178.065
    },
    "population": "920,000",
    "areaKm2": 18274,
    "currency": "Fijian Dollar (FJD)",
    "languages": "English, Fijian, Fiji Hindi",
    "flag": "🇫🇯",
    "majorCities": [
      "Suva",
      "Lautoka",
      "Nadi",
      "Labasa"
    ],
    "geography": "South Pacific archipelago of more than 330 islands and 500 islets, dominated by volcanic peaks on Viti Levu and Vanua Levu.",
    "landmark": "Sri Siva Subramaniya Temple & Coral Coast",
    "climate": "Tropical marine with warm temperatures and occasional cyclones",
    "funFact": "Fiji is one of the closest countries to the International Date Line and straddles the 180th meridian.",
    "neighbours": [
      "Vanuatu",
      "Tonga",
      "Tuvalu",
      "Samoa"
    ],
    "relatedSlugs": [
      "vanuatu",
      "tonga",
      "tuvalu",
      "samoa"
    ]
  },
  {
    "id": "fi",
    "name": "Finland",
    "slug": "finland",
    "iso2": "FI",
    "iso3": "FIN",
    "capital": "Helsinki",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 61.9241,
      "lng": 25.7482
    },
    "population": "5.5 million",
    "areaKm2": 338424,
    "currency": "Euro (EUR)",
    "languages": "Finnish, Swedish",
    "flag": "🇫🇮",
    "majorCities": [
      "Helsinki",
      "Espoo",
      "Tampere",
      "Vantaa",
      "Oulu",
      "Turku"
    ],
    "geography": "Known as the \"Land of a Thousand Lakes\" with over 187,000 lakes, vast taiga forests, and Arctic Lapland in the north.",
    "landmark": "Suomenlinna Sea Fortress & Santa Claus Village",
    "climate": "Cold temperate with warm summers and subarctic freezing winters",
    "funFact": "Finland has an estimated 3 million saunas for a population of 5.5 million people.",
    "neighbours": [
      "Sweden",
      "Norway",
      "Russia"
    ],
    "relatedSlugs": [
      "sweden",
      "norway",
      "russia"
    ]
  },
  {
    "id": "fr",
    "name": "France",
    "slug": "france",
    "iso2": "FR",
    "iso3": "FRA",
    "capital": "Paris",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 46.2276,
      "lng": 2.2137
    },
    "population": "68 million",
    "areaKm2": 551695,
    "currency": "Euro (EUR)",
    "languages": "French",
    "flag": "🇫🇷",
    "majorCities": [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes"
    ],
    "geography": "Hexagonal territory spanning Atlantic, Channel, and Mediterranean coastlines with the Alps and Pyrenees on its borders.",
    "landmark": "Eiffel Tower & Louvre Museum",
    "climate": "Temperate oceanic in the west, Mediterranean in the south, continental inland",
    "funFact": "France is the most visited country in the world, receiving over 90 million international tourists annually.",
    "neighbours": [
      "Belgium",
      "Luxembourg",
      "Germany",
      "Switzerland",
      "Italy",
      "Monaco",
      "Spain",
      "Andorra"
    ],
    "relatedSlugs": [
      "belgium",
      "luxembourg",
      "germany",
      "switzerland",
      "italy",
      "monaco"
    ]
  },
  {
    "id": "ga",
    "name": "Gabon",
    "slug": "gabon",
    "iso2": "GA",
    "iso3": "GAB",
    "capital": "Libreville",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": -0.8037,
      "lng": 11.6094
    },
    "population": "2.4 million",
    "areaKm2": 267668,
    "currency": "Central African CFA Franc (XAF)",
    "languages": "French",
    "flag": "🇬🇦",
    "majorCities": [
      "Libreville",
      "Port-Gentil",
      "Franceville",
      "Oyem"
    ],
    "geography": "Equatorial country on the Atlantic coast with more than 85% of its land covered by dense tropical rainforest.",
    "landmark": "Loango National Park",
    "climate": "Equatorial with high temperatures and torrential seasonal rainfall",
    "funFact": "Loango National Park in Gabon is famous for its \"surfing hippos\" and elephants walking directly on Atlantic beaches.",
    "neighbours": [
      "Equatorial Guinea",
      "Cameroon",
      "Republic of the Congo"
    ],
    "relatedSlugs": [
      "equatorial-guinea",
      "cameroon",
      "congo"
    ]
  },
  {
    "id": "gm",
    "name": "Gambia",
    "slug": "gambia",
    "iso2": "GM",
    "iso3": "GMB",
    "capital": "Banjul",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 13.4432,
      "lng": -15.3101
    },
    "population": "2.7 million",
    "areaKm2": 10689,
    "currency": "Gambian Dalasi (GMD)",
    "languages": "English",
    "flag": "🇬🇲",
    "majorCities": [
      "Banjul",
      "Serekunda",
      "Brikama",
      "Bakau"
    ],
    "geography": "Smallest country in mainland Africa, forming a narrow corridor along both banks of the navigable Gambia River.",
    "landmark": "Kunta Kinteh Island & Stone Circles of Senegambia",
    "climate": "Tropical with a hot rainy season (June to November) and dry cooler period",
    "funFact": "The Gambia is almost entirely surrounded by Senegal, except for its short western Atlantic coastline.",
    "neighbours": [
      "Senegal"
    ],
    "relatedSlugs": [
      "senegal"
    ]
  },
  {
    "id": "ge",
    "name": "Georgia",
    "slug": "georgia",
    "iso2": "GE",
    "iso3": "GEO",
    "capital": "Tbilisi",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 42.3154,
      "lng": 43.3569
    },
    "population": "3.7 million",
    "areaKm2": 69700,
    "currency": "Georgian Lari (GEL)",
    "languages": "Georgian",
    "flag": "🇬🇪",
    "majorCities": [
      "Tbilisi",
      "Batumi",
      "Kutaisi",
      "Rustavi"
    ],
    "geography": "South Caucasus nation situated at the crossroads of Europe and Asia, framed by the Greater and Lesser Caucasus mountains.",
    "landmark": "Narikala Fortress & Gergeti Trinity Church",
    "climate": "Subtropical along the Black Sea coast to alpine in the high Caucasus",
    "funFact": "Archaeological evidence shows Georgia is the birthplace of winemaking, dating back more than 8,000 years.",
    "neighbours": [
      "Russia",
      "Azerbaijan",
      "Armenia",
      "Turkey"
    ],
    "relatedSlugs": [
      "russia",
      "azerbaijan",
      "armenia",
      "turkey"
    ]
  },
  {
    "id": "de",
    "name": "Germany",
    "slug": "germany",
    "iso2": "DE",
    "iso3": "DEU",
    "capital": "Berlin",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 51.1657,
      "lng": 10.4515
    },
    "population": "84 million",
    "areaKm2": 357022,
    "currency": "Euro (EUR)",
    "languages": "German",
    "flag": "🇩🇪",
    "majorCities": [
      "Berlin",
      "Hamburg",
      "Munich",
      "Cologne",
      "Frankfurt"
    ],
    "geography": "Central European country stretching from the North and Baltic Sea coasts through forested central uplands to the Bavarian Alps.",
    "landmark": "Brandenburg Gate & Neuschwanstein Castle",
    "climate": "Temperate oceanic with warm summers and cool, damp winters",
    "funFact": "Germany has over 20,000 castles and palaces scattered across its countryside.",
    "neighbours": [
      "Denmark",
      "Poland",
      "Czech Republic",
      "Austria",
      "Switzerland",
      "France",
      "Luxembourg",
      "Belgium",
      "Netherlands"
    ],
    "relatedSlugs": [
      "denmark",
      "poland",
      "czech-republic",
      "austria",
      "switzerland",
      "france"
    ]
  },
  {
    "id": "gh",
    "name": "Ghana",
    "slug": "ghana",
    "iso2": "GH",
    "iso3": "GHA",
    "capital": "Accra",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 7.9465,
      "lng": -1.0232
    },
    "population": "33 million",
    "areaKm2": 238533,
    "currency": "Ghanaian Cedi (GHS)",
    "languages": "English",
    "flag": "🇬🇭",
    "majorCities": [
      "Accra",
      "Kumasi",
      "Tamale",
      "Takoradi"
    ],
    "geography": "West African nation on the Gulf of Guinea containing Lake Volta, the world’s largest artificial reservoir by surface area.",
    "landmark": "Cape Coast Castle & Kakum National Park",
    "climate": "Tropical with warm humid coastal zones and dry northern savannahs",
    "funFact": "Ghana was the first sub-Saharan African country to achieve independence from colonial rule in 1957.",
    "neighbours": [
      "Ivory Coast",
      "Burkina Faso",
      "Togo"
    ],
    "relatedSlugs": [
      "ivory-coast",
      "burkina-faso",
      "togo"
    ]
  },
  {
    "id": "gr",
    "name": "Greece",
    "slug": "greece",
    "iso2": "GR",
    "iso3": "GRC",
    "capital": "Athens",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 39.0742,
      "lng": 21.8243
    },
    "population": "10.4 million",
    "areaKm2": 131957,
    "currency": "Euro (EUR)",
    "languages": "Greek",
    "flag": "🇬🇷",
    "majorCities": [
      "Athens",
      "Thessaloniki",
      "Patras",
      "Heraklion",
      "Larissa"
    ],
    "geography": "Mountainous Mediterranean peninsula with thousands of islands in the Aegean and Ionian seas.",
    "landmark": "Parthenon on the Acropolis & Meteora",
    "climate": "Mediterranean with hot, dry summers and mild, rainy winters",
    "funFact": "Greece has the longest coastline in the Mediterranean Basin at over 13,600 kilometers.",
    "neighbours": [
      "Albania",
      "North Macedonia",
      "Bulgaria",
      "Turkey"
    ],
    "relatedSlugs": [
      "albania",
      "north-macedonia",
      "bulgaria",
      "turkey"
    ]
  },
  {
    "id": "gd",
    "name": "Grenada",
    "slug": "grenada",
    "iso2": "GD",
    "iso3": "GRD",
    "capital": "St. George's",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 12.1165,
      "lng": -61.679
    },
    "population": "125,000",
    "areaKm2": 344,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English, Grenadian Creole English",
    "flag": "🇬🇩",
    "majorCities": [
      "St. George's",
      "Gouyave",
      "Grenville",
      "Victoria"
    ],
    "geography": "Volcanic Caribbean island nation in the southern Grenadines with crater lakes, waterfalls, and white sand beaches.",
    "landmark": "Grand Anse Beach & Fort George",
    "climate": "Tropical marine climate tempered by northeast trade winds",
    "funFact": "Grenada is widely known as the \"Spice Isle\" because it is a leading global exporter of nutmeg and mace.",
    "neighbours": [
      "Trinidad and Tobago",
      "Saint Vincent and the Grenadines",
      "Venezuela"
    ],
    "relatedSlugs": [
      "trinidad-and-tobago",
      "saint-vincent-and-the-grenadines",
      "venezuela"
    ]
  },
  {
    "id": "gt",
    "name": "Guatemala",
    "slug": "guatemala",
    "iso2": "GT",
    "iso3": "GTM",
    "capital": "Guatemala City",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 15.7835,
      "lng": -90.2308
    },
    "population": "18 million",
    "areaKm2": 108889,
    "currency": "Guatemalan Quetzal (GTQ)",
    "languages": "Spanish, 22 Mayan languages",
    "flag": "🇬🇹",
    "majorCities": [
      "Guatemala City",
      "Mixco",
      "Villa Nueva",
      "Quetzaltenango"
    ],
    "geography": "Central American heart of the ancient Maya civilization, filled with active volcanoes, cloud forests, and Lake Atitlán.",
    "landmark": "Tikal Mayan Ruins & Lake Atitlán",
    "climate": "Tropical in lowlands to temperate in the high volcanic interior",
    "funFact": "Tajumulco Volcano in western Guatemala is the highest peak in Central America at 4,220 meters.",
    "neighbours": [
      "Mexico",
      "Belize",
      "Honduras",
      "El Salvador"
    ],
    "relatedSlugs": [
      "mexico",
      "belize",
      "honduras",
      "el-salvador"
    ]
  },
  {
    "id": "gn",
    "name": "Guinea",
    "slug": "guinea",
    "iso2": "GN",
    "iso3": "GIN",
    "capital": "Conakry",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 9.9456,
      "lng": -9.6966
    },
    "population": "14 million",
    "areaKm2": 245857,
    "currency": "Guinean Franc (GNF)",
    "languages": "French",
    "flag": "🇬🇳",
    "majorCities": [
      "Conakry",
      "Nzérékoré",
      "Kankan",
      "Kindia"
    ],
    "geography": "Atlantic coast nation that gives rise to the Niger, Senegal, and Gambia rivers in the Fouta Djallon highlands.",
    "landmark": "Fouta Djallon Plateau & Mount Nimba",
    "climate": "Tropical with a monsoon wet season from June to November",
    "funFact": "Guinea holds approximately one-third of the world’s known bauxite (aluminum ore) reserves.",
    "neighbours": [
      "Senegal",
      "Mali",
      "Ivory Coast",
      "Liberia",
      "Sierra Leone",
      "Guinea-Bissau"
    ],
    "relatedSlugs": [
      "senegal",
      "mali",
      "ivory-coast",
      "liberia",
      "sierra-leone"
    ]
  },
  {
    "id": "gw",
    "name": "Guinea-Bissau",
    "slug": "guinea-bissau",
    "iso2": "GW",
    "iso3": "GNB",
    "capital": "Bissau",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 11.8037,
      "lng": -15.1804
    },
    "population": "2.1 million",
    "areaKm2": 36125,
    "currency": "West African CFA Franc (XOF)",
    "languages": "Portuguese, Crioulo",
    "flag": "🇬🇼",
    "majorCities": [
      "Bissau",
      "Bafatá",
      "Gabú",
      "Bissorã"
    ],
    "geography": "Low-lying coastal tropical country featuring meandering tidal estuaries, mangrove swamps, and the Bijagós Archipelago.",
    "landmark": "Bijagós Archipelago Biosphere Reserve",
    "climate": "Tropical savanna climate with hot, humid wet and dry seasons",
    "funFact": "The Bijagós Archipelago consists of 88 islands recognized by UNESCO as a pristine biosphere reserve.",
    "neighbours": [
      "Senegal",
      "Guinea"
    ],
    "relatedSlugs": [
      "senegal",
      "guinea"
    ]
  },
  {
    "id": "gy",
    "name": "Guyana",
    "slug": "guyana",
    "iso2": "GY",
    "iso3": "GUY",
    "capital": "Georgetown",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": 4.8604,
      "lng": -58.9302
    },
    "population": "800,000",
    "areaKm2": 214969,
    "currency": "Guyanese Dollar (GYD)",
    "languages": "English",
    "flag": "🇬🇾",
    "majorCities": [
      "Georgetown",
      "Linden",
      "New Amsterdam",
      "Bartica"
    ],
    "geography": "Atlantic coast country in northern South America, densely blanketed by Amazonian rainforests and tepui plateaus.",
    "landmark": "Kaieteur Falls",
    "climate": "Tropical with high rainfall and warm equatorial temperatures",
    "funFact": "Kaieteur Falls in Guyana is the world’s largest single-drop waterfall by volume of water flowing over it.",
    "neighbours": [
      "Venezuela",
      "Brazil",
      "Suriname"
    ],
    "relatedSlugs": [
      "venezuela",
      "brazil",
      "suriname"
    ]
  },
  {
    "id": "ht",
    "name": "Haiti",
    "slug": "haiti",
    "iso2": "HT",
    "iso3": "HTI",
    "capital": "Port-au-Prince",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 18.9712,
      "lng": -72.2852
    },
    "population": "11.5 million",
    "areaKm2": 27750,
    "currency": "Haitian Gourde (HTG)",
    "languages": "French, Haitian Creole",
    "flag": "🇭🇹",
    "majorCities": [
      "Port-au-Prince",
      "Carrefour",
      "Delmas",
      "Cap-Haïtien"
    ],
    "geography": "Occupies the western third of Hispaniola, characterized by rugged mountain ranges and Caribbean bays.",
    "landmark": "Citadelle Laferrière",
    "climate": "Tropical semi-arid with two distinct rainy seasons",
    "funFact": "Haiti became the world’s first independent Black republic in 1804 following a successful slave revolution.",
    "neighbours": [
      "Dominican Republic",
      "Cuba",
      "Jamaica"
    ],
    "relatedSlugs": [
      "dominica",
      "cuba",
      "jamaica"
    ]
  },
  {
    "id": "va",
    "name": "Holy See",
    "slug": "vatican-city",
    "iso2": "VA",
    "iso3": "VAT",
    "capital": "Vatican City",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 41.9029,
      "lng": 12.4534
    },
    "population": "800",
    "areaKm2": 0.49,
    "currency": "Euro (EUR)",
    "languages": "Italian, Latin",
    "flag": "🇻🇦",
    "majorCities": [
      "Vatican City"
    ],
    "geography": "Landlocked sovereign city-state enclave entirely surrounded by Rome, Italy on Vatican Hill.",
    "landmark": "St. Peter’s Basilica & Sistine Chapel",
    "climate": "Mediterranean with mild, rainy winters and hot, dry summers",
    "funFact": "Vatican City is the smallest independent sovereign state in the world by both area and population.",
    "neighbours": [
      "Italy"
    ],
    "relatedSlugs": [
      "italy"
    ]
  },
  {
    "id": "hn",
    "name": "Honduras",
    "slug": "honduras",
    "iso2": "HN",
    "iso3": "HND",
    "capital": "Tegucigalpa",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 15.2,
      "lng": -86.2419
    },
    "population": "10.5 million",
    "areaKm2": 112492,
    "currency": "Honduran Lempira (HNL)",
    "languages": "Spanish",
    "flag": "🇭🇳",
    "majorCities": [
      "Tegucigalpa",
      "San Pedro Sula",
      "Choloma",
      "La Ceiba"
    ],
    "geography": "Central American country with Caribbean and Pacific shorelines, filled with forested interior highlands.",
    "landmark": "Copán Mayan Ruins",
    "climate": "Subtropical in lowlands to temperate in higher elevations",
    "funFact": "The ancient Mayan city of Copán in western Honduras is celebrated for its intricate hieroglyphic stairway.",
    "neighbours": [
      "Guatemala",
      "El Salvador",
      "Nicaragua"
    ],
    "relatedSlugs": [
      "guatemala",
      "el-salvador",
      "nicaragua"
    ]
  },
  {
    "id": "hu",
    "name": "Hungary",
    "slug": "hungary",
    "iso2": "HU",
    "iso3": "HUN",
    "capital": "Budapest",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 47.1625,
      "lng": 19.5033
    },
    "population": "9.6 million",
    "areaKm2": 93028,
    "currency": "Hungarian Forint (HUF)",
    "languages": "Hungarian",
    "flag": "🇭🇺",
    "majorCities": [
      "Budapest",
      "Debrecen",
      "Szeged",
      "Miskolc",
      "Pécs"
    ],
    "geography": "Landlocked Central European basin bisected by the Danube River, dominated by the Great Hungarian Plain.",
    "landmark": "Hungarian Parliament Building & Lake Balaton",
    "climate": "Continental with hot summers and cold snowy winters",
    "funFact": "Lake Balaton in Hungary is the largest freshwater lake in Central Europe.",
    "neighbours": [
      "Austria",
      "Slovakia",
      "Ukraine",
      "Romania",
      "Serbia",
      "Croatia",
      "Slovenia"
    ],
    "relatedSlugs": [
      "austria",
      "slovakia",
      "ukraine",
      "oman",
      "serbia",
      "croatia"
    ]
  },
  {
    "id": "is",
    "name": "Iceland",
    "slug": "iceland",
    "iso2": "IS",
    "iso3": "ISL",
    "capital": "Reykjavik",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 64.9631,
      "lng": -19.0208
    },
    "population": "380,000",
    "areaKm2": 103000,
    "currency": "Icelandic Króna (ISK)",
    "languages": "Icelandic",
    "flag": "🇮🇸",
    "majorCities": [
      "Reykjavik",
      "Kópavogur",
      "Hafnarfjörður",
      "Akureyri"
    ],
    "geography": "Volcanic island in the North Atlantic characterized by active geysers, glaciers, fjords, and black basalt sand beaches.",
    "landmark": "Blue Lagoon & Gullfoss Waterfall",
    "climate": "Subpolar oceanic tempered by the warm North Atlantic Current",
    "funFact": "Iceland generates almost 100% of its electricity and heating through geothermal and hydroelectric sources.",
    "neighbours": [
      "Greenland",
      "Faroe Islands",
      "United Kingdom",
      "Norway"
    ],
    "relatedSlugs": [
      "united-kingdom",
      "norway"
    ]
  },
  {
    "id": "in",
    "name": "India",
    "slug": "india",
    "iso2": "IN",
    "iso3": "IND",
    "capital": "New Delhi",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 20.5937,
      "lng": 78.9629
    },
    "population": "1.43 billion",
    "areaKm2": 3287263,
    "currency": "Indian Rupee (INR)",
    "languages": "Hindi, English, 22 constitutional languages",
    "flag": "🇮🇳",
    "majorCities": [
      "Mumbai",
      "Delhi",
      "Bengaluru",
      "Kolkata",
      "Chennai",
      "Hyderabad"
    ],
    "geography": "Subcontinent extending from the Himalayan summits across the Indo-Gangetic Plain down to the Indian Ocean.",
    "landmark": "Taj Mahal",
    "climate": "Ranges from tropical monsoon in the south to temperate and alpine in the north",
    "funFact": "India is the world’s most populous democracy and the birthplace of yoga, chess, and the decimal numeral system.",
    "neighbours": [
      "Pakistan",
      "China",
      "Nepal",
      "Bhutan",
      "Bangladesh",
      "Myanmar",
      "Sri Lanka"
    ],
    "relatedSlugs": [
      "pakistan",
      "china",
      "nepal",
      "bhutan",
      "bangladesh",
      "myanmar"
    ]
  },
  {
    "id": "id",
    "name": "Indonesia",
    "slug": "indonesia",
    "iso2": "ID",
    "iso3": "IDN",
    "capital": "Jakarta",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": -0.7893,
      "lng": 113.9213
    },
    "population": "277 million",
    "areaKm2": 1904569,
    "currency": "Indonesian Rupiah (IDR)",
    "languages": "Indonesian",
    "flag": "🇮🇩",
    "majorCities": [
      "Jakarta",
      "Surabaya",
      "Bandung",
      "Medan",
      "Semarang"
    ],
    "geography": "World’s largest archipelago nation, comprising over 17,000 volcanic islands straddling the Equator.",
    "landmark": "Borobudur Temple & Komodo National Park",
    "climate": "Tropical rainforest and monsoon climate year-round",
    "funFact": "Indonesia is home to the Komodo dragon, the largest living lizard species in the world.",
    "neighbours": [
      "Malaysia",
      "Papua New Guinea",
      "Timor-Leste",
      "Australia",
      "Singapore"
    ],
    "relatedSlugs": [
      "malaysia",
      "guinea",
      "timor-leste",
      "australia",
      "singapore"
    ]
  },
  {
    "id": "ir",
    "name": "Iran",
    "slug": "iran",
    "iso2": "IR",
    "iso3": "IRN",
    "capital": "Tehran",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 32.4279,
      "lng": 53.688
    },
    "population": "88 million",
    "areaKm2": 1648195,
    "currency": "Iranian Rial (IRR)",
    "languages": "Persian (Farsi)",
    "flag": "🇮🇷",
    "majorCities": [
      "Tehran",
      "Mashhad",
      "Isfahan",
      "Karaj",
      "Shiraz",
      "Tabriz"
    ],
    "geography": "Mountainous plateau between the Caspian Sea and Persian Gulf, framed by the Zagros and Alborz ranges.",
    "landmark": "Persepolis & Naqsh-e Jahan Square",
    "climate": "Mostly arid or semi-arid with subtropical zones along the Caspian",
    "funFact": "Persia (modern Iran) is home to one of the world’s oldest continuous major civilizations, dating to 4000 BC.",
    "neighbours": [
      "Iraq",
      "Turkey",
      "Armenia",
      "Azerbaijan",
      "Turkmenistan",
      "Afghanistan",
      "Pakistan"
    ],
    "relatedSlugs": [
      "iraq",
      "turkey",
      "armenia",
      "azerbaijan",
      "turkmenistan",
      "afghanistan"
    ]
  },
  {
    "id": "iq",
    "name": "Iraq",
    "slug": "iraq",
    "iso2": "IQ",
    "iso3": "IRQ",
    "capital": "Baghdad",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 33.2232,
      "lng": 43.6793
    },
    "population": "44 million",
    "areaKm2": 438317,
    "currency": "Iraqi Dinar (IQD)",
    "languages": "Arabic, Kurdish",
    "flag": "🇮🇶",
    "majorCities": [
      "Baghdad",
      "Basra",
      "Mosul",
      "Erbil",
      "Sulaymaniyah"
    ],
    "geography": "Mesopotamian floodplain centered on the Tigris and Euphrates rivers, bounded by western desert and Zagros mountains.",
    "landmark": "Ziggurat of Ur & Babylon",
    "climate": "Mostly arid desert with hot, cloudless summers and mild winters",
    "funFact": "Ancient Mesopotamia in modern Iraq is celebrated as the \"Cradle of Civilization\" where writing was invented.",
    "neighbours": [
      "Turkey",
      "Iran",
      "Kuwait",
      "Saudi Arabia",
      "Jordan",
      "Syria"
    ],
    "relatedSlugs": [
      "turkey",
      "iran",
      "kuwait",
      "saudi-arabia",
      "jordan",
      "syria"
    ]
  },
  {
    "id": "ie",
    "name": "Ireland",
    "slug": "ireland",
    "iso2": "IE",
    "iso3": "IRL",
    "capital": "Dublin",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 53.1424,
      "lng": -7.6921
    },
    "population": "5.1 million",
    "areaKm2": 70273,
    "currency": "Euro (EUR)",
    "languages": "Irish, English",
    "flag": "🇮🇪",
    "majorCities": [
      "Dublin",
      "Cork",
      "Limerick",
      "Galway",
      "Waterford"
    ],
    "geography": "The \"Emerald Isle\" featuring low central plains ringed by coastal highlands and dramatic Atlantic sea cliffs.",
    "landmark": "Cliffs of Moher",
    "climate": "Temperate oceanic climate with abundant soft rainfall and mild winters",
    "funFact": "The Cliffs of Moher rise over 214 meters straight out of the Atlantic Ocean along Ireland’s western coast.",
    "neighbours": [
      "United Kingdom"
    ],
    "relatedSlugs": [
      "united-kingdom"
    ]
  },
  {
    "id": "il",
    "name": "Israel",
    "slug": "israel",
    "iso2": "IL",
    "iso3": "ISR",
    "capital": "Jerusalem",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 31.0461,
      "lng": 34.8516
    },
    "population": "9.8 million",
    "areaKm2": 22072,
    "currency": "Israeli New Shekel (ILS)",
    "languages": "Hebrew",
    "flag": "🇮🇱",
    "majorCities": [
      "Jerusalem",
      "Tel Aviv",
      "Haifa",
      "Rishon LeZion",
      "Petah Tikva"
    ],
    "geography": "Eastern Mediterranean coastal nation extending from the Galilee hills south into the Negev Desert.",
    "landmark": "Western Wall & Masada",
    "climate": "Mediterranean along the coast to arid in the southern Negev",
    "funFact": "The Dead Sea on Israel’s eastern border is the lowest land elevation on Earth at 430 meters below sea level.",
    "neighbours": [
      "Lebanon",
      "Syria",
      "Jordan",
      "Egypt",
      "Palestine"
    ],
    "relatedSlugs": [
      "lebanon",
      "syria",
      "jordan",
      "egypt",
      "palestine"
    ]
  },
  {
    "id": "it",
    "name": "Italy",
    "slug": "italy",
    "iso2": "IT",
    "iso3": "ITA",
    "capital": "Rome",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 41.8719,
      "lng": 12.5674
    },
    "population": "59 million",
    "areaKm2": 301340,
    "currency": "Euro (EUR)",
    "languages": "Italian",
    "flag": "🇮🇹",
    "majorCities": [
      "Rome",
      "Milan",
      "Naples",
      "Turin",
      "Palermo",
      "Florence"
    ],
    "geography": "Boot-shaped peninsula extending into the Mediterranean Sea, framed by the Alps and bisected by the Apennines.",
    "landmark": "Colosseum & Leaning Tower of Pisa",
    "climate": "Predominantly Mediterranean with continental alpine climate in the north",
    "funFact": "Italy contains 59 UNESCO World Heritage Sites, more than any other sovereign nation.",
    "neighbours": [
      "France",
      "Switzerland",
      "Austria",
      "Slovenia",
      "San Marino",
      "Holy See"
    ],
    "relatedSlugs": [
      "france",
      "switzerland",
      "austria",
      "slovenia",
      "san-marino",
      "vatican-city"
    ]
  },
  {
    "id": "ci",
    "name": "Ivory Coast",
    "slug": "ivory-coast",
    "iso2": "CI",
    "iso3": "CIV",
    "capital": "Yamoussoukro (political), Abidjan (economic)",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 7.54,
      "lng": -5.5471
    },
    "population": "29 million",
    "areaKm2": 322463,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French",
    "flag": "🇨🇮",
    "majorCities": [
      "Abidjan",
      "Bouaké",
      "Daloa",
      "Yamoussoukro",
      "San-Pédro"
    ],
    "geography": "West African coastal country transitioning from Atlantic lagoons and rainforests up to northern savannahs.",
    "landmark": "Basilica of Our Lady of Peace",
    "climate": "Tropical hot and humid along coast, semi-arid in the northern interior",
    "funFact": "Ivory Coast is the world’s leading producer and exporter of cocoa beans, supplying over 40% of global chocolate.",
    "neighbours": [
      "Liberia",
      "Guinea",
      "Mali",
      "Burkina Faso",
      "Ghana"
    ],
    "relatedSlugs": [
      "liberia",
      "guinea",
      "mali",
      "burkina-faso",
      "ghana"
    ]
  },
  {
    "id": "jm",
    "name": "Jamaica",
    "slug": "jamaica",
    "iso2": "JM",
    "iso3": "JAM",
    "capital": "Kingston",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 18.1096,
      "lng": -77.2975
    },
    "population": "2.8 million",
    "areaKm2": 10991,
    "currency": "Jamaican Dollar (JMD)",
    "languages": "English, Jamaican Patois",
    "flag": "🇯🇲",
    "majorCities": [
      "Kingston",
      "Montego Bay",
      "Spanish Town",
      "Portmore"
    ],
    "geography": "Mountainous Caribbean island dominated by the Blue Mountains and surrounded by white coral beaches.",
    "landmark": "Dunn’s River Falls & Blue Mountain Peak",
    "climate": "Tropical with warm temperatures moderated by Caribbean sea breezes",
    "funFact": "Jamaica’s Blue Mountain Coffee is one of the most prized and expensive gourmet coffees in the world.",
    "neighbours": [
      "Cuba",
      "Haiti",
      "Cayman Islands"
    ],
    "relatedSlugs": [
      "cuba",
      "haiti"
    ]
  },
  {
    "id": "jp",
    "name": "Japan",
    "slug": "japan",
    "iso2": "JP",
    "iso3": "JPN",
    "capital": "Tokyo",
    "region": "Asia",
    "subregion": "Eastern Asia",
    "coordinates": {
      "lat": 36.2048,
      "lng": 138.2529
    },
    "population": "124 million",
    "areaKm2": 377975,
    "currency": "Japanese Yen (JPY)",
    "languages": "Japanese",
    "flag": "🇯🇵",
    "majorCities": [
      "Tokyo",
      "Yokohama",
      "Osaka",
      "Nagoya",
      "Sapporo",
      "Kyoto"
    ],
    "geography": "Stratovolcanic archipelago of 6,852 islands along the Pacific Ring of Fire, dominated by mountains and forests.",
    "landmark": "Mount Fuji & Fushimi Inari Shrine",
    "climate": "Cool temperate in Hokkaido to subtropical in Okinawa",
    "funFact": "Greater Tokyo is the most populous metropolitan area in the world with over 37 million residents.",
    "neighbours": [
      "South Korea",
      "China",
      "Russia",
      "Taiwan"
    ],
    "relatedSlugs": [
      "south-korea",
      "china",
      "russia"
    ]
  },
  {
    "id": "jo",
    "name": "Jordan",
    "slug": "jordan",
    "iso2": "JO",
    "iso3": "JOR",
    "capital": "Amman",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 30.5852,
      "lng": 36.2384
    },
    "population": "11.3 million",
    "areaKm2": 89342,
    "currency": "Jordanian Dinar (JOD)",
    "languages": "Arabic",
    "flag": "🇯🇴",
    "majorCities": [
      "Amman",
      "Zarqa",
      "Irbid",
      "Russeifa",
      "Aqaba"
    ],
    "geography": "Mostly arid desert plateau in the east, bounded by the Great Rift Valley, Jordan River, and Dead Sea in the west.",
    "landmark": "Petra (The Rose City)",
    "climate": "Arid desert climate with mild Mediterranean weather in the western highlands",
    "funFact": "Petra was carved directly into vibrant pink sandstone cliffs by the Nabataeans over 2,000 years ago.",
    "neighbours": [
      "Israel",
      "Palestine",
      "Syria",
      "Iraq",
      "Saudi Arabia"
    ],
    "relatedSlugs": [
      "israel",
      "palestine",
      "syria",
      "iraq",
      "saudi-arabia"
    ]
  },
  {
    "id": "kz",
    "name": "Kazakhstan",
    "slug": "kazakhstan",
    "iso2": "KZ",
    "iso3": "KAZ",
    "capital": "Astana",
    "region": "Asia",
    "subregion": "Central Asia",
    "coordinates": {
      "lat": 48.0196,
      "lng": 66.9237
    },
    "population": "20 million",
    "areaKm2": 2724900,
    "currency": "Kazakhstani Tenge (KZT)",
    "languages": "Kazakh, Russian",
    "flag": "🇰🇿",
    "majorCities": [
      "Almaty",
      "Astana",
      "Shymkent",
      "Karaganda",
      "Aktobe"
    ],
    "geography": "World’s largest landlocked country, spanning vast Eurasian steppes from the Caspian Sea to the Altai Mountains.",
    "landmark": "Baiterek Tower & Charyn Canyon",
    "climate": "Extreme continental with warm summers and bitterly cold winters",
    "funFact": "The Baikonur Cosmodrome in Kazakhstan is the world’s first and largest operational space launch facility.",
    "neighbours": [
      "Russia",
      "China",
      "Kyrgyzstan",
      "Uzbekistan",
      "Turkmenistan"
    ],
    "relatedSlugs": [
      "russia",
      "china",
      "kyrgyzstan",
      "uzbekistan",
      "turkmenistan"
    ]
  },
  {
    "id": "ke",
    "name": "Kenya",
    "slug": "kenya",
    "iso2": "KE",
    "iso3": "KEN",
    "capital": "Nairobi",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -0.0236,
      "lng": 37.9062
    },
    "population": "54 million",
    "areaKm2": 580367,
    "currency": "Kenyan Shilling (KES)",
    "languages": "Swahili, English",
    "flag": "🇰🇪",
    "majorCities": [
      "Nairobi",
      "Mombasa",
      "Kisumu",
      "Nakuru",
      "Eldoret"
    ],
    "geography": "Indian Ocean coast rising to the central highlands, Mount Kenya, and the Great Rift Valley savannahs.",
    "landmark": "Maasai Mara & Mount Kenya",
    "climate": "Tropical along the coast to arid in the north and temperate in highlands",
    "funFact": "The Maasai Mara in Kenya hosts the annual Great Migration of over 1.5 million wildebeest and zebras.",
    "neighbours": [
      "Tanzania",
      "Uganda",
      "South Sudan",
      "Ethiopia",
      "Somalia"
    ],
    "relatedSlugs": [
      "tanzania",
      "uganda",
      "south-sudan",
      "ethiopia",
      "mali"
    ]
  },
  {
    "id": "ki",
    "name": "Kiribati",
    "slug": "kiribati",
    "iso2": "KI",
    "iso3": "KIR",
    "capital": "South Tarawa",
    "region": "Oceania",
    "subregion": "Micronesia",
    "coordinates": {
      "lat": -3.3704,
      "lng": -168.734
    },
    "population": "130,000",
    "areaKm2": 811,
    "currency": "Australian Dollar (AUD)",
    "languages": "Gilbertese, English",
    "flag": "🇰🇮",
    "majorCities": [
      "South Tarawa",
      "Betio",
      "Bikenibeu",
      "Kiritimati"
    ],
    "geography": "Spans 33 low-lying coral atolls and reef islands dispersed across 3.5 million square kilometers of the central Pacific.",
    "landmark": "Kiritimati (Christmas Island atoll)",
    "climate": "Tropical maritime with steady easterly trade winds",
    "funFact": "Kiribati is the only country in the world situated in all four hemispheres (Northern, Southern, Eastern, Western).",
    "neighbours": [
      "Tuvalu",
      "Nauru",
      "Marshall Islands",
      "Fiji"
    ],
    "relatedSlugs": [
      "tuvalu",
      "nauru",
      "marshall-islands",
      "fiji"
    ]
  },
  {
    "id": "kw",
    "name": "Kuwait",
    "slug": "kuwait",
    "iso2": "KW",
    "iso3": "KWT",
    "capital": "Kuwait City",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 29.3117,
      "lng": 47.4818
    },
    "population": "4.3 million",
    "areaKm2": 17818,
    "currency": "Kuwaiti Dinar (KWD)",
    "languages": "Arabic",
    "flag": "🇰🇼",
    "majorCities": [
      "Kuwait City",
      "Al Ahmadi",
      "Hawalli",
      "Salmiya"
    ],
    "geography": "Low, dry Arabian desert nation situated at the northwestern tip of the Persian Gulf.",
    "landmark": "Kuwait Towers",
    "climate": "Hyper-arid desert with blistering summers and mild, cool winters",
    "funFact": "The Kuwaiti Dinar (KWD) is the highest-valued sovereign currency unit in the world.",
    "neighbours": [
      "Iraq",
      "Saudi Arabia",
      "Iran"
    ],
    "relatedSlugs": [
      "iraq",
      "saudi-arabia",
      "iran"
    ]
  },
  {
    "id": "kg",
    "name": "Kyrgyzstan",
    "slug": "kyrgyzstan",
    "iso2": "KG",
    "iso3": "KGZ",
    "capital": "Bishkek",
    "region": "Asia",
    "subregion": "Central Asia",
    "coordinates": {
      "lat": 41.2044,
      "lng": 74.7661
    },
    "population": "7 million",
    "areaKm2": 199951,
    "currency": "Kyrgyzstani Som (KGS)",
    "languages": "Kyrgyz, Russian",
    "flag": "🇰🇬",
    "majorCities": [
      "Bishkek",
      "Osh",
      "Jalal-Abad",
      "Karakol"
    ],
    "geography": "Mountainous Central Asian nation where over 80% of territory lies in the Tian Shan mountain range.",
    "landmark": "Lake Issyk-Kul & Ala Archa Gorge",
    "climate": "Continental with sharp elevation differences from alpine to valley dry",
    "funFact": "Lake Issyk-Kul is the second-largest high-altitude alpine lake in the world, never freezing despite snow.",
    "neighbours": [
      "Kazakhstan",
      "Uzbekistan",
      "Tajikistan",
      "China"
    ],
    "relatedSlugs": [
      "kazakhstan",
      "uzbekistan",
      "tajikistan",
      "china"
    ]
  },
  {
    "id": "la",
    "name": "Laos",
    "slug": "laos",
    "iso2": "LA",
    "iso3": "LAO",
    "capital": "Vientiane",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 19.8563,
      "lng": 102.4955
    },
    "population": "7.5 million",
    "areaKm2": 236800,
    "currency": "Lao Kip (LAK)",
    "languages": "Lao",
    "flag": "🇱🇦",
    "majorCities": [
      "Vientiane",
      "Pakse",
      "Savannakhet",
      "Luang Prabang"
    ],
    "geography": "Only landlocked country in Southeast Asia, dominated by rugged forested mountains and the Mekong River valley.",
    "landmark": "Pha That Luang & Luang Prabang",
    "climate": "Tropical monsoon with wet summer and dry winter periods",
    "funFact": "Laos is often referred to as the \"Land of a Million Elephants\" (Lane Xang).",
    "neighbours": [
      "Myanmar",
      "China",
      "Vietnam",
      "Cambodia",
      "Thailand"
    ],
    "relatedSlugs": [
      "myanmar",
      "china",
      "vietnam",
      "cambodia",
      "thailand"
    ]
  },
  {
    "id": "lv",
    "name": "Latvia",
    "slug": "latvia",
    "iso2": "LV",
    "iso3": "LVA",
    "capital": "Riga",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 56.8796,
      "lng": 24.6032
    },
    "population": "1.9 million",
    "areaKm2": 64589,
    "currency": "Euro (EUR)",
    "languages": "Latvian",
    "flag": "🇱🇻",
    "majorCities": [
      "Riga",
      "Daugavpils",
      "Liepāja",
      "Jelgava",
      "Jūrmala"
    ],
    "geography": "Baltic coastal nation composed of low plains, extensive forests, peat bogs, and the Daugava River.",
    "landmark": "Riga Old Town & Art Nouveau District",
    "climate": "Temperate maritime to continental with moderate rainfall",
    "funFact": "Riga has one of the highest concentrations of Art Nouveau architecture in Europe, designated a UNESCO World Heritage site.",
    "neighbours": [
      "Estonia",
      "Lithuania",
      "Russia",
      "Belarus"
    ],
    "relatedSlugs": [
      "estonia",
      "lithuania",
      "russia",
      "belarus"
    ]
  },
  {
    "id": "lb",
    "name": "Lebanon",
    "slug": "lebanon",
    "iso2": "LB",
    "iso3": "LBN",
    "capital": "Beirut",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 33.8547,
      "lng": 35.8623
    },
    "population": "5.5 million",
    "areaKm2": 10452,
    "currency": "Lebanese Pound (LBP)",
    "languages": "Arabic",
    "flag": "🇱🇧",
    "majorCities": [
      "Beirut",
      "Tripoli",
      "Sidon",
      "Tyre",
      "Jounieh"
    ],
    "geography": "Eastern Mediterranean coastal nation bisected by Mount Lebanon and Anti-Lebanon mountain ranges framing the Beqaa Valley.",
    "landmark": "Ruins of Baalbek & Jeita Grotto",
    "climate": "Mediterranean on the coast; cold and snowy on mountain peaks",
    "funFact": "Lebanon’s national emblem is the Cedar of Lebanon, referenced repeatedly in ancient classical and biblical texts.",
    "neighbours": [
      "Syria",
      "Israel",
      "Cyprus"
    ],
    "relatedSlugs": [
      "syria",
      "israel",
      "cyprus"
    ]
  },
  {
    "id": "ls",
    "name": "Lesotho",
    "slug": "lesotho",
    "iso2": "LS",
    "iso3": "LSO",
    "capital": "Maseru",
    "region": "Africa",
    "subregion": "Southern Africa",
    "coordinates": {
      "lat": -29.6099,
      "lng": 28.2336
    },
    "population": "2.3 million",
    "areaKm2": 30355,
    "currency": "Lesotho Loti (LSL), South African Rand",
    "languages": "Sesotho, English",
    "flag": "🇱🇸",
    "majorCities": [
      "Maseru",
      "Teyateyaneng",
      "Mafeteng",
      "Hlotse"
    ],
    "geography": "High-altitude kingdom entirely surrounded by South Africa, dominated by the Maloti and Drakensberg mountain ranges.",
    "landmark": "Maletsunyane Falls",
    "climate": "Temperate continental with cold alpine winters and snow in the mountains",
    "funFact": "Lesotho is the only independent state in the world whose entire territory lies completely above 1,000 meters in elevation.",
    "neighbours": [
      "South Africa"
    ],
    "relatedSlugs": [
      "south-africa"
    ]
  },
  {
    "id": "lr",
    "name": "Liberia",
    "slug": "liberia",
    "iso2": "LR",
    "iso3": "LBR",
    "capital": "Monrovia",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 6.4281,
      "lng": -9.4295
    },
    "population": "5.3 million",
    "areaKm2": 111369,
    "currency": "Liberian Dollar (LRD)",
    "languages": "English",
    "flag": "🇱🇷",
    "majorCities": [
      "Monrovia",
      "Gbarnga",
      "Kakata",
      "Buchanan"
    ],
    "geography": "West African coastal plain rising to rolling plateaus and dense tropical rainforests containing high biodiversity.",
    "landmark": "Sapo National Park & Providence Island",
    "climate": "Equatorial tropical with heavy rainfall between May and October",
    "funFact": "Liberia is Africa’s oldest modern republic, declaring its independence in 1847.",
    "neighbours": [
      "Sierra Leone",
      "Guinea",
      "Ivory Coast"
    ],
    "relatedSlugs": [
      "sierra-leone",
      "guinea",
      "ivory-coast"
    ]
  },
  {
    "id": "ly",
    "name": "Libya",
    "slug": "libya",
    "iso2": "LY",
    "iso3": "LBY",
    "capital": "Tripoli",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 26.3351,
      "lng": 17.2283
    },
    "population": "6.9 million",
    "areaKm2": 1759540,
    "currency": "Libyan Dinar (LYD)",
    "languages": "Arabic",
    "flag": "🇱🇾",
    "majorCities": [
      "Tripoli",
      "Benghazi",
      "Misrata",
      "Bayda"
    ],
    "geography": "North African Mediterranean nation with vast Sahara desert expanses covering over 90% of its landmass.",
    "landmark": "Leptis Magna Roman Ruins",
    "climate": "Mediterranean along the coast; hyper-arid desert in the interior",
    "funFact": "Leptis Magna in Libya is one of the most prominent and intact preserved Roman cities in the Mediterranean.",
    "neighbours": [
      "Egypt",
      "Sudan",
      "Chad",
      "Niger",
      "Algeria",
      "Tunisia"
    ],
    "relatedSlugs": [
      "egypt",
      "sudan",
      "chad",
      "niger",
      "algeria",
      "tunisia"
    ]
  },
  {
    "id": "li",
    "name": "Liechtenstein",
    "slug": "liechtenstein",
    "iso2": "LI",
    "iso3": "LIE",
    "capital": "Vaduz",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 47.166,
      "lng": 9.5554
    },
    "population": "39,000",
    "areaKm2": 160,
    "currency": "Swiss Franc (CHF)",
    "languages": "German",
    "flag": "🇱🇮",
    "majorCities": [
      "Vaduz",
      "Schaan",
      "Balzers",
      "Triesen"
    ],
    "geography": "Doubly landlocked alpine principality situated in the Upper Rhine Valley between Switzerland and Austria.",
    "landmark": "Vaduz Castle",
    "climate": "Continental alpine with cold winters and mild summers",
    "funFact": "Liechtenstein and Uzbekistan are the only two \"doubly landlocked\" countries in the world (surrounded solely by landlocked nations).",
    "neighbours": [
      "Switzerland",
      "Austria"
    ],
    "relatedSlugs": [
      "switzerland",
      "austria"
    ]
  },
  {
    "id": "lt",
    "name": "Lithuania",
    "slug": "lithuania",
    "iso2": "LT",
    "iso3": "LTU",
    "capital": "Vilnius",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 55.1694,
      "lng": 23.8813
    },
    "population": "2.8 million",
    "areaKm2": 65300,
    "currency": "Euro (EUR)",
    "languages": "Lithuanian",
    "flag": "🇱🇹",
    "majorCities": [
      "Vilnius",
      "Kaunas",
      "Klaipėda",
      "Šiauliai",
      "Panevėžys"
    ],
    "geography": "Southernmost Baltic country, featuring gentle lowlands, glacial moraines, extensive forests, and the Curonian Spit sand dunes.",
    "landmark": "Trakai Island Castle & Hill of Crosses",
    "climate": "Transitional between maritime and continental",
    "funFact": "The Lithuanian language is one of the oldest living Indo-European languages, closely preserving ancient Sanskrit grammatical forms.",
    "neighbours": [
      "Latvia",
      "Belarus",
      "Poland",
      "Russia"
    ],
    "relatedSlugs": [
      "latvia",
      "belarus",
      "poland",
      "russia"
    ]
  },
  {
    "id": "lu",
    "name": "Luxembourg",
    "slug": "luxembourg",
    "iso2": "LU",
    "iso3": "LUX",
    "capital": "Luxembourg City",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 49.8153,
      "lng": 6.1296
    },
    "population": "660,000",
    "areaKm2": 2586,
    "currency": "Euro (EUR)",
    "languages": "Luxembourgish, French, German",
    "flag": "🇱🇺",
    "majorCities": [
      "Luxembourg City",
      "Esch-sur-Alzette",
      "Differdange",
      "Dudelange"
    ],
    "geography": "Landlocked Grand Duchy divided into the forested Ardennes highlands (Oesling) in the north and fertile Gutland in the south.",
    "landmark": "Bock Casemates & Vianden Castle",
    "climate": "Temperate oceanic with mild winters and cool summers",
    "funFact": "Luxembourg is the world’s only remaining sovereign Grand Duchy.",
    "neighbours": [
      "Belgium",
      "Germany",
      "France"
    ],
    "relatedSlugs": [
      "belgium",
      "germany",
      "france"
    ]
  },
  {
    "id": "mg",
    "name": "Madagascar",
    "slug": "madagascar",
    "iso2": "MG",
    "iso3": "MDG",
    "capital": "Antananarivo",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -18.7669,
      "lng": 46.8691
    },
    "population": "29 million",
    "areaKm2": 587041,
    "currency": "Malagasy Ariary (MGA)",
    "languages": "Malagasy, French",
    "flag": "🇲🇬",
    "majorCities": [
      "Antananarivo",
      "Toamasina",
      "Antsirabe",
      "Mahajanga"
    ],
    "geography": "Fourth-largest island on Earth, isolated in the Indian Ocean with rainforests, high central plateaus, and spiny deserts.",
    "landmark": "Avenue of the Baobabs & Tsingy de Bemaraha",
    "climate": "Tropical along the coast, temperate inland, and arid in the south",
    "funFact": "Over 90% of Madagascar’s wildlife and plant species, including all lemurs, are found nowhere else on Earth.",
    "neighbours": [
      "Mozambique",
      "Comoros",
      "Seychelles",
      "Mauritius"
    ],
    "relatedSlugs": [
      "mozambique",
      "comoros",
      "seychelles",
      "mauritius"
    ]
  },
  {
    "id": "mw",
    "name": "Malawi",
    "slug": "malawi",
    "iso2": "MW",
    "iso3": "MWI",
    "capital": "Lilongwe",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -13.2543,
      "lng": 34.3015
    },
    "population": "20 million",
    "areaKm2": 118484,
    "currency": "Malawian Kwacha (MWK)",
    "languages": "English, Chichewa",
    "flag": "🇲🇼",
    "majorCities": [
      "Lilongwe",
      "Blantyre",
      "Mzuzu",
      "Zomba"
    ],
    "geography": "Landlocked nation running along the Great Rift Valley, dominated by freshwater Lake Malawi spanning a fifth of its area.",
    "landmark": "Lake Malawi National Park",
    "climate": "Subtropical with a warm rainy season and cool dry winter",
    "funFact": "Lake Malawi is home to more species of fish, especially endemic cichlids, than any other lake on the planet.",
    "neighbours": [
      "Zambia",
      "Tanzania",
      "Mozambique"
    ],
    "relatedSlugs": [
      "zambia",
      "tanzania",
      "mozambique"
    ]
  },
  {
    "id": "my",
    "name": "Malaysia",
    "slug": "malaysia",
    "iso2": "MY",
    "iso3": "MYS",
    "capital": "Kuala Lumpur (federal), Putrajaya (administrative)",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 4.2105,
      "lng": 101.9758
    },
    "population": "34 million",
    "areaKm2": 329847,
    "currency": "Malaysian Ringgit (MYR)",
    "languages": "Malay",
    "flag": "🇲🇾",
    "majorCities": [
      "Kuala Lumpur",
      "George Town",
      "Johor Bahru",
      "Ipoh",
      "Kuching"
    ],
    "geography": "Split between Peninsular Malaysia and Malaysian Borneo (Sabah and Sarawak), covered in ancient equatorial rainforests.",
    "landmark": "Petronas Twin Towers & Mount Kinabalu",
    "climate": "Tropical equatorial with year-round warmth and monsoonal rainfall",
    "funFact": "The Taman Negara rainforest in Malaysia is estimated to be over 130 million years old, older than the Amazon.",
    "neighbours": [
      "Thailand",
      "Singapore",
      "Indonesia",
      "Brunei",
      "Philippines"
    ],
    "relatedSlugs": [
      "thailand",
      "singapore",
      "indonesia",
      "brunei",
      "philippines"
    ]
  },
  {
    "id": "mv",
    "name": "Maldives",
    "slug": "maldives",
    "iso2": "MV",
    "iso3": "MDV",
    "capital": "Malé",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 3.2028,
      "lng": 73.2207
    },
    "population": "520,000",
    "areaKm2": 298,
    "currency": "Maldivian Rufiyaa (MVR)",
    "languages": "Dhivehi",
    "flag": "🇲🇻",
    "majorCities": [
      "Malé",
      "Addu City",
      "Fuvahmulah",
      "Kulhudhuffushi"
    ],
    "geography": "Archipelago nation of 26 natural atolls containing 1,192 coral islands dispersed across the central Indian Ocean.",
    "landmark": "Old Friday Mosque (Hukuru Miskiy)",
    "climate": "Warm tropical monsoon with high year-round humidity",
    "funFact": "The Maldives is the lowest-lying nation on Earth, with an average ground elevation of just 1.5 meters above sea level.",
    "neighbours": [
      "India",
      "Sri Lanka"
    ],
    "relatedSlugs": [
      "india",
      "sri-lanka"
    ]
  },
  {
    "id": "ml",
    "name": "Mali",
    "slug": "mali",
    "iso2": "ML",
    "iso3": "MLI",
    "capital": "Bamako",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 17.5707,
      "lng": -3.9962
    },
    "population": "22 million",
    "areaKm2": 1240192,
    "currency": "West African CFA Franc (XOF)",
    "languages": "Bambara, French",
    "flag": "🇲🇱",
    "majorCities": [
      "Bamako",
      "Sikasso",
      "Mopti",
      "Koutiala",
      "Timbuktu"
    ],
    "geography": "Landlocked West African nation dominated by the Sahara Desert in the north, the Sahel in the center, and the Niger River basin.",
    "landmark": "Great Mosque of Djenné",
    "climate": "Hot and dry desert in the north to tropical savannah in the south",
    "funFact": "The Great Mosque of Djenné in Mali is the largest mud-brick (adobe) building in the world.",
    "neighbours": [
      "Algeria",
      "Niger",
      "Burkina Faso",
      "Ivory Coast",
      "Guinea",
      "Senegal",
      "Mauritania"
    ],
    "relatedSlugs": [
      "algeria",
      "niger",
      "burkina-faso",
      "ivory-coast",
      "guinea",
      "senegal"
    ]
  },
  {
    "id": "mt",
    "name": "Malta",
    "slug": "malta",
    "iso2": "MT",
    "iso3": "MLT",
    "capital": "Valletta",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 35.9375,
      "lng": 14.3754
    },
    "population": "530,000",
    "areaKm2": 316,
    "currency": "Euro (EUR)",
    "languages": "Maltese, English",
    "flag": "🇲🇹",
    "majorCities": [
      "Valletta",
      "Birkirkara",
      "Mosta",
      "Sliema",
      "St. Paul’s Bay"
    ],
    "geography": "Rocky limestone archipelago situated in the central Mediterranean Sea south of Sicily.",
    "landmark": "St. John’s Co-Cathedral & Ħaġar Qim Megalithic Temples",
    "climate": "Subtropical Mediterranean with mild winters and warm summers",
    "funFact": "Malta’s megalithic temples are among the oldest free-standing stone structures on Earth, pre-dating Stonehenge and the Pyramids.",
    "neighbours": [
      "Italy",
      "Tunisia",
      "Libya"
    ],
    "relatedSlugs": [
      "italy",
      "tunisia",
      "libya"
    ]
  },
  {
    "id": "mh",
    "name": "Marshall Islands",
    "slug": "marshall-islands",
    "iso2": "MH",
    "iso3": "MHL",
    "capital": "Majuro",
    "region": "Oceania",
    "subregion": "Micronesia",
    "coordinates": {
      "lat": 7.1315,
      "lng": 171.1845
    },
    "population": "42,000",
    "areaKm2": 181,
    "currency": "US Dollar (USD)",
    "languages": "Marshallese, English",
    "flag": "🇲🇭",
    "majorCities": [
      "Majuro",
      "Ebeye",
      "Arno",
      "Jabor"
    ],
    "geography": "Pacific atoll nation consisting of 29 coral atolls and 5 isolated islands grouped into the Ratak and Ralik chains.",
    "landmark": "Bikini Atoll (UNESCO)",
    "climate": "Tropical hot and humid with cooling trade winds",
    "funFact": "The Marshall Islands consists of more than 1,150 individual low-lying coral islands spread across 750,000 sq km of ocean.",
    "neighbours": [
      "Micronesia",
      "Kiribati",
      "Nauru"
    ],
    "relatedSlugs": [
      "micronesia",
      "kiribati",
      "nauru"
    ]
  },
  {
    "id": "mr",
    "name": "Mauritania",
    "slug": "mauritania",
    "iso2": "MR",
    "iso3": "MRT",
    "capital": "Nouakchott",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 21.0079,
      "lng": -10.9408
    },
    "population": "4.8 million",
    "areaKm2": 1030700,
    "currency": "Mauritanian Ouguiya (MRU)",
    "languages": "Arabic",
    "flag": "🇲🇷",
    "majorCities": [
      "Nouakchott",
      "Nouadhibou",
      "Kiffa",
      "Kaédi"
    ],
    "geography": "Northwest African country dominated by the Sahara Desert and flat arid plains with an Atlantic coastline.",
    "landmark": "Richat Structure (Eye of the Sahara) & Chinguetti",
    "climate": "Desert climate with dry, hot, and dust-laden winds",
    "funFact": "The Richat Structure in central Mauritania is a prominent 40-kilometer circular geological dome visible from outer space.",
    "neighbours": [
      "Western Sahara",
      "Algeria",
      "Mali",
      "Senegal"
    ],
    "relatedSlugs": [
      "algeria",
      "mali",
      "senegal"
    ]
  },
  {
    "id": "mu",
    "name": "Mauritius",
    "slug": "mauritius",
    "iso2": "MU",
    "iso3": "MUS",
    "capital": "Port Louis",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -20.3484,
      "lng": 57.5522
    },
    "population": "1.26 million",
    "areaKm2": 2040,
    "currency": "Mauritian Rupee (MUR)",
    "languages": "English, French, Mauritian Creole",
    "flag": "🇲🇺",
    "majorCities": [
      "Port Louis",
      "Beau Bassin-Rose Hill",
      "Vacoas-Phoenix",
      "Curepipe"
    ],
    "geography": "Volcanic Indian Ocean island east of Madagascar, encircled by coral reefs and mountainous coastal peaks.",
    "landmark": "Le Morne Brabant & Seven Coloured Earths",
    "climate": "Tropical maritime with mild temperatures throughout the year",
    "funFact": "Mauritius was the only known natural habitat of the extinct flightless dodo bird.",
    "neighbours": [
      "Madagascar",
      "Reunion",
      "Seychelles"
    ],
    "relatedSlugs": [
      "madagascar",
      "seychelles"
    ]
  },
  {
    "id": "mx",
    "name": "Mexico",
    "slug": "mexico",
    "iso2": "MX",
    "iso3": "MEX",
    "capital": "Mexico City",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 23.6345,
      "lng": -102.5528
    },
    "population": "128 million",
    "areaKm2": 1964375,
    "currency": "Mexican Peso (MXN)",
    "languages": "Spanish, 68 indigenous national languages",
    "flag": "🇲🇽",
    "majorCities": [
      "Mexico City",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana"
    ],
    "geography": "Borders Pacific and Gulf coasts, with high central plateaus flanked by the Sierra Madre mountain ranges.",
    "landmark": "Chichen Itza & Teotihuacan",
    "climate": "Varies from arid desert in the north to tropical rainforest in the south and temperate highlands",
    "funFact": "Mexico City is built on the ruins of the ancient Aztec capital Tenochtitlan on top of Lake Texcoco.",
    "neighbours": [
      "United States",
      "Guatemala",
      "Belize"
    ],
    "relatedSlugs": [
      "united-states",
      "guatemala",
      "belize"
    ]
  },
  {
    "id": "fm",
    "name": "Micronesia",
    "slug": "micronesia",
    "iso2": "FM",
    "iso3": "FSM",
    "capital": "Palikir",
    "region": "Oceania",
    "subregion": "Micronesia",
    "coordinates": {
      "lat": 7.4256,
      "lng": 150.5508
    },
    "population": "115,000",
    "areaKm2": 702,
    "currency": "US Dollar (USD)",
    "languages": "English",
    "flag": "🇫🇲",
    "majorCities": [
      "Weno",
      "Palikir",
      "Kolonia",
      "Tofol"
    ],
    "geography": "Western Pacific archipelago comprising 607 islands across four states: Yap, Chuuk, Pohnpei, and Kosrae.",
    "landmark": "Nan Madol Ruins",
    "climate": "Tropical oceanic with heavy year-round rainfall",
    "funFact": "Nan Madol in Pohnpei is an ancient ruined city built entirely on artificial islets interconnected by tidal canals.",
    "neighbours": [
      "Marshall Islands",
      "Palau",
      "Papua New Guinea",
      "Guam"
    ],
    "relatedSlugs": [
      "marshall-islands",
      "palau",
      "guinea"
    ]
  },
  {
    "id": "md",
    "name": "Moldova",
    "slug": "moldova",
    "iso2": "MD",
    "iso3": "MDA",
    "capital": "Chisinau",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 47.4116,
      "lng": 28.3699
    },
    "population": "2.5 million",
    "areaKm2": 33846,
    "currency": "Moldovan Leu (MDL)",
    "languages": "Romanian",
    "flag": "🇲🇩",
    "majorCities": [
      "Chisinau",
      "Tiraspol",
      "Bălți",
      "Bender"
    ],
    "geography": "Landlocked Eastern European country situated between the Dniester and Prut rivers, covered in rolling hills and vineyards.",
    "landmark": "Mileștii Mici Underground Wine Cellars",
    "climate": "Moderately continental with warm summers and mild winters",
    "funFact": "Mileștii Mici holds the Guinness World Record for the largest wine collection in the world, stored in 200 km of limestone caves.",
    "neighbours": [
      "Romania",
      "Ukraine"
    ],
    "relatedSlugs": [
      "oman",
      "ukraine"
    ]
  },
  {
    "id": "mc",
    "name": "Monaco",
    "slug": "monaco",
    "iso2": "MC",
    "iso3": "MCO",
    "capital": "Monaco",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 43.7384,
      "lng": 7.4246
    },
    "population": "39,000",
    "areaKm2": 2.08,
    "currency": "Euro (EUR)",
    "languages": "French",
    "flag": "🇲🇨",
    "majorCities": [
      "Monte Carlo",
      "Monaco-Ville",
      "La Condamine",
      "Fontvieille"
    ],
    "geography": "Mediterranean coastal city-state on the French Riviera, surrounded on three land sides by France.",
    "landmark": "Monte Carlo Casino & Prince’s Palace",
    "climate": "Mediterranean with warm dry summers and mild winters",
    "funFact": "Monaco is the most densely populated sovereign state in the world, with over 18,000 residents per square kilometer.",
    "neighbours": [
      "France",
      "Italy"
    ],
    "relatedSlugs": [
      "france",
      "italy"
    ]
  },
  {
    "id": "mn",
    "name": "Mongolia",
    "slug": "mongolia",
    "iso2": "MN",
    "iso3": "MNG",
    "capital": "Ulaanbaatar",
    "region": "Asia",
    "subregion": "Eastern Asia",
    "coordinates": {
      "lat": 46.8625,
      "lng": 103.8467
    },
    "population": "3.4 million",
    "areaKm2": 1564116,
    "currency": "Mongolian Tögrög (MNT)",
    "languages": "Mongolian",
    "flag": "🇲🇳",
    "majorCities": [
      "Ulaanbaatar",
      "Erdenet",
      "Darkhan",
      "Choibalsan"
    ],
    "geography": "Vast East Asian highland plateau dominated by the Gobi Desert in the south and open grassy steppes and Altai mountains.",
    "landmark": "Genghis Khan Equestrian Statue",
    "climate": "Extreme continental with harsh freezing winters and short warm summers",
    "funFact": "Mongolia is the most sparsely populated sovereign country in the world, with only ~2 people per square kilometer.",
    "neighbours": [
      "Russia",
      "China"
    ],
    "relatedSlugs": [
      "russia",
      "china"
    ]
  },
  {
    "id": "me",
    "name": "Montenegro",
    "slug": "montenegro",
    "iso2": "ME",
    "iso3": "MNE",
    "capital": "Podgorica",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 42.7087,
      "lng": 19.3744
    },
    "population": "620,000",
    "areaKm2": 13812,
    "currency": "Euro (EUR)",
    "languages": "Montenegrin",
    "flag": "🇲🇪",
    "majorCities": [
      "Podgorica",
      "Nikšić",
      "Herceg Novi",
      "Budva",
      "Kotor"
    ],
    "geography": "Rugged Adriatic Balkan nation featuring steep limestone mountains, the Bay of Kotor fjord, and Lake Skadar.",
    "landmark": "Bay of Kotor & Ostrog Monastery",
    "climate": "Mediterranean along the coast, alpine continental in the high mountains",
    "funFact": "The Bay of Kotor is considered southern Europe’s southernmost fjord-like marine canyon.",
    "neighbours": [
      "Croatia",
      "Bosnia and Herzegovina",
      "Serbia",
      "Kosovo",
      "Albania"
    ],
    "relatedSlugs": [
      "croatia",
      "bosnia-and-herzegovina",
      "serbia",
      "albania"
    ]
  },
  {
    "id": "ma",
    "name": "Morocco",
    "slug": "morocco",
    "iso2": "MA",
    "iso3": "MAR",
    "capital": "Rabat",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 31.7917,
      "lng": -7.0926
    },
    "population": "37 million",
    "areaKm2": 446550,
    "currency": "Moroccan Dirham (MAD)",
    "languages": "Arabic, Berber",
    "flag": "🇲🇦",
    "majorCities": [
      "Casablanca",
      "Fez",
      "Tangier",
      "Marrakech",
      "Rabat"
    ],
    "geography": "Northwest African country with Atlantic and Mediterranean coastlines, bisected by the High Atlas mountain ranges.",
    "landmark": "Hassan II Mosque & Jemaa el-Fnaa",
    "climate": "Mediterranean along the coasts to arid Saharan inland",
    "funFact": "The University of al-Qarawiyyin in Fez, founded in 859 AD, is recognized by UNESCO as the oldest continuously operating university.",
    "neighbours": [
      "Algeria",
      "Mauritania",
      "Spain"
    ],
    "relatedSlugs": [
      "algeria",
      "mauritania",
      "spain"
    ]
  },
  {
    "id": "mz",
    "name": "Mozambique",
    "slug": "mozambique",
    "iso2": "MZ",
    "iso3": "MOZ",
    "capital": "Maputo",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -18.6657,
      "lng": 35.5296
    },
    "population": "33 million",
    "areaKm2": 801590,
    "currency": "Mozambican Metical (MZN)",
    "languages": "Portuguese",
    "flag": "🇲🇿",
    "majorCities": [
      "Maputo",
      "Matola",
      "Nampula",
      "Beira",
      "Chimoio"
    ],
    "geography": "Southeastern African country featuring a 2,500-kilometer Indian Ocean coastline, coastal lowlands, and interior plateaus.",
    "landmark": "Bazaruto Archipelago & Gorongosa National Park",
    "climate": "Tropical to subtropical with wet summer and dry winter seasons",
    "funFact": "Mozambique’s national flag is the only one in the world that features a modern firearm (an AK-47 assault rifle).",
    "neighbours": [
      "Tanzania",
      "Malawi",
      "Zambia",
      "Zimbabwe",
      "South Africa",
      "Eswatini"
    ],
    "relatedSlugs": [
      "tanzania",
      "malawi",
      "zambia",
      "zimbabwe",
      "south-africa",
      "eswatini"
    ]
  },
  {
    "id": "mm",
    "name": "Myanmar",
    "slug": "myanmar",
    "iso2": "MM",
    "iso3": "MMR",
    "capital": "Naypyidaw",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 21.9162,
      "lng": 95.956
    },
    "population": "54 million",
    "areaKm2": 676578,
    "currency": "Myanmar Kyat (MMK)",
    "languages": "Burmese",
    "flag": "🇲🇲",
    "majorCities": [
      "Yangon",
      "Mandalay",
      "Naypyidaw",
      "Taunggyi",
      "Mawlamyine"
    ],
    "geography": "Southeast Asian nation on the Bay of Bengal, centered on the fertile Irrawaddy River basin encircled by mountain ranges.",
    "landmark": "Shwedagon Pagoda & Ancient City of Bagan",
    "climate": "Tropical monsoon with heavy summer rains and cooler dry winters",
    "funFact": "The ancient plains of Bagan in Myanmar contain over 2,200 Buddhist temples, pagodas, and monasteries dating from the 11th century.",
    "neighbours": [
      "Bangladesh",
      "India",
      "China",
      "Laos",
      "Thailand"
    ],
    "relatedSlugs": [
      "bangladesh",
      "india",
      "china",
      "laos",
      "thailand"
    ]
  },
  {
    "id": "na",
    "name": "Namibia",
    "slug": "namibia",
    "iso2": "NA",
    "iso3": "NAM",
    "capital": "Windhoek",
    "region": "Africa",
    "subregion": "Southern Africa",
    "coordinates": {
      "lat": -22.9576,
      "lng": 18.4904
    },
    "population": "2.6 million",
    "areaKm2": 825615,
    "currency": "Namibian Dollar (NAD), South African Rand",
    "languages": "English",
    "flag": "🇳🇦",
    "majorCities": [
      "Windhoek",
      "Rundu",
      "Walvis Bay",
      "Swakopmund"
    ],
    "geography": "Southwest African nation bounded by the Atlantic Ocean, home to the ancient Namib Desert and the Kalahari sands.",
    "landmark": "Sossusvlei Red Dunes & Etosha Pan",
    "climate": "Arid and semi-arid with hot days and cool nights",
    "funFact": "The Namib Desert is considered the oldest desert on Earth, having existed in arid conditions for at least 55 million years.",
    "neighbours": [
      "Angola",
      "Zambia",
      "Botswana",
      "South Africa"
    ],
    "relatedSlugs": [
      "angola",
      "zambia",
      "botswana",
      "south-africa"
    ]
  },
  {
    "id": "nr",
    "name": "Nauru",
    "slug": "nauru",
    "iso2": "NR",
    "iso3": "NRU",
    "capital": "Yaren (de facto district)",
    "region": "Oceania",
    "subregion": "Micronesia",
    "coordinates": {
      "lat": -0.5228,
      "lng": 166.9315
    },
    "population": "12,500",
    "areaKm2": 21,
    "currency": "Australian Dollar (AUD)",
    "languages": "Nauruan, English",
    "flag": "🇳🇷",
    "majorCities": [
      "Yaren",
      "Denigomodu",
      "Meneng",
      "Aiwo"
    ],
    "geography": "Isolated oval-shaped raised phosphate-rock coral island situated just south of the Equator in Micronesia.",
    "landmark": "Command Ridge & Buada Lagoon",
    "climate": "Tropical marine climate moderated by sea breezes",
    "funFact": "Nauru is the smallest island nation and smallest independent republic in the world, with an area of just 21 square kilometers.",
    "neighbours": [
      "Kiribati",
      "Marshall Islands",
      "Solomon Islands"
    ],
    "relatedSlugs": [
      "kiribati",
      "marshall-islands",
      "solomon-islands"
    ]
  },
  {
    "id": "np",
    "name": "Nepal",
    "slug": "nepal",
    "iso2": "NP",
    "iso3": "NPL",
    "capital": "Kathmandu",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 28.3949,
      "lng": 84.124
    },
    "population": "30 million",
    "areaKm2": 147516,
    "currency": "Nepalese Rupee (NPR)",
    "languages": "Nepali",
    "flag": "🇳🇵",
    "majorCities": [
      "Kathmandu",
      "Pokhara",
      "Lalitpur",
      "Bharatpur",
      "Biratnagar"
    ],
    "geography": "Landlocked Himalayan nation spanning from the tropical southern Terai plains up to the highest mountain peaks on Earth.",
    "landmark": "Mount Everest (Sagarmatha) & Boudhanath Stupa",
    "climate": "Subtropical in lowlands to alpine tundra and eternal ice in the high Himalayas",
    "funFact": "Nepal is home to 8 of the world’s 14 mountain peaks exceeding 8,000 meters in elevation, including Mount Everest.",
    "neighbours": [
      "China",
      "India"
    ],
    "relatedSlugs": [
      "china",
      "india"
    ]
  },
  {
    "id": "nl",
    "name": "Netherlands",
    "slug": "netherlands",
    "iso2": "NL",
    "iso3": "NLD",
    "capital": "Amsterdam (official), The Hague (seat of government)",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 52.1326,
      "lng": 5.2913
    },
    "population": "17.8 million",
    "areaKm2": 41850,
    "currency": "Euro (EUR)",
    "languages": "Dutch",
    "flag": "🇳🇱",
    "majorCities": [
      "Amsterdam",
      "Rotterdam",
      "The Hague",
      "Utrecht",
      "Eindhoven"
    ],
    "geography": "Low-lying coastal European country with roughly a third of its land area reclaimed from the sea below sea level.",
    "landmark": "Kinderdijk Windmills & Rijksmuseum",
    "climate": "Temperate oceanic with cool summers and moderate winters",
    "funFact": "The Netherlands has more bicycles (over 23 million) than human residents.",
    "neighbours": [
      "Germany",
      "Belgium",
      "United Kingdom"
    ],
    "relatedSlugs": [
      "germany",
      "belgium",
      "united-kingdom"
    ]
  },
  {
    "id": "nz",
    "name": "New Zealand",
    "slug": "new-zealand",
    "iso2": "NZ",
    "iso3": "NZL",
    "capital": "Wellington",
    "region": "Oceania",
    "subregion": "Australia and New Zealand",
    "coordinates": {
      "lat": -40.9006,
      "lng": 174.886
    },
    "population": "5.2 million",
    "areaKm2": 268021,
    "currency": "New Zealand Dollar (NZD)",
    "languages": "English, Māori, NZ Sign Language",
    "flag": "🇳🇿",
    "majorCities": [
      "Auckland",
      "Christchurch",
      "Wellington",
      "Hamilton",
      "Tauranga"
    ],
    "geography": "Comprises two main landmasses (North and South Islands) featuring volcanic geothermal regions, Southern Alps, and fjords.",
    "landmark": "Milford Sound & Mount Cook (Aoraki)",
    "climate": "Maritime temperate with regional microclimates from subtropical to subantarctic",
    "funFact": "New Zealand was the first self-governing country in the world to grant all women the right to vote in 1893.",
    "neighbours": [
      "Australia",
      "Fiji",
      "Tonga"
    ],
    "relatedSlugs": [
      "australia",
      "fiji",
      "tonga"
    ]
  },
  {
    "id": "ni",
    "name": "Nicaragua",
    "slug": "nicaragua",
    "iso2": "NI",
    "iso3": "NIC",
    "capital": "Managua",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 12.8654,
      "lng": -85.2072
    },
    "population": "7 million",
    "areaKm2": 130373,
    "currency": "Nicaraguan Córdoba (NIO)",
    "languages": "Spanish",
    "flag": "🇳🇮",
    "majorCities": [
      "Managua",
      "León",
      "Masaya",
      "Matagalpa",
      "Chinandega"
    ],
    "geography": "Largest country in Central America, characterized by the Pacific volcanic chain, massive Lake Nicaragua, and Caribbean plains.",
    "landmark": "Ometepe Island & Masaya Volcano",
    "climate": "Tropical in the lowlands, cooler in the central highland plateau",
    "funFact": "Lake Nicaragua is the largest lake in Central America and the only freshwater lake in the world inhabited by freshwater bull sharks.",
    "neighbours": [
      "Honduras",
      "Costa Rica"
    ],
    "relatedSlugs": [
      "honduras",
      "costa-rica"
    ]
  },
  {
    "id": "ne",
    "name": "Niger",
    "slug": "niger",
    "iso2": "NE",
    "iso3": "NER",
    "capital": "Niamey",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 17.6078,
      "lng": 8.0817
    },
    "population": "26 million",
    "areaKm2": 1267000,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French, Hausa",
    "flag": "🇳🇪",
    "majorCities": [
      "Niamey",
      "Maradi",
      "Zinder",
      "Tahoua",
      "Agadez"
    ],
    "geography": "Landlocked Sahelian country with over 80% of its territory covered by the Sahara Desert, bounded by the Niger River basin.",
    "landmark": "Historic Centre of Agadez",
    "climate": "Predominantly hot desert, semi-arid Sahel in the extreme south",
    "funFact": "The historic mud-brick Grand Mosque of Agadez stands at 27 meters, making it the tallest mud-brick structure in the world.",
    "neighbours": [
      "Libya",
      "Chad",
      "Nigeria",
      "Benin",
      "Burkina Faso",
      "Mali",
      "Algeria"
    ],
    "relatedSlugs": [
      "libya",
      "chad",
      "benin",
      "burkina-faso",
      "mali",
      "algeria"
    ]
  },
  {
    "id": "ng",
    "name": "Nigeria",
    "slug": "nigeria",
    "iso2": "NG",
    "iso3": "NGA",
    "capital": "Abuja",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 9.082,
      "lng": 8.6753
    },
    "population": "220 million",
    "areaKm2": 923768,
    "currency": "Nigerian Naira (NGN)",
    "languages": "English, Hausa, Yoruba, Igbo",
    "flag": "🇳🇬",
    "majorCities": [
      "Lagos",
      "Kano",
      "Ibadan",
      "Abuja",
      "Port Harcourt",
      "Benin City"
    ],
    "geography": "Most populous country in Africa, spanning Gulf of Guinea mangrove swamps through rainforests up to Jos Plateau and northern savannah.",
    "landmark": "Zuma Rock & Olumo Rock",
    "climate": "Equatorial in south, tropical central, and semi-arid Sahelian in north",
    "funFact": "Nigeria’s film industry, Nollywood, is one of the largest film producers in the world by volume of movies produced.",
    "neighbours": [
      "Benin",
      "Niger",
      "Chad",
      "Cameroon"
    ],
    "relatedSlugs": [
      "benin",
      "niger",
      "chad",
      "cameroon"
    ]
  },
  {
    "id": "kp",
    "name": "North Korea",
    "slug": "north-korea",
    "iso2": "KP",
    "iso3": "PRK",
    "capital": "Pyongyang",
    "region": "Asia",
    "subregion": "Eastern Asia",
    "coordinates": {
      "lat": 40.3399,
      "lng": 127.5101
    },
    "population": "26 million",
    "areaKm2": 120538,
    "currency": "North Korean Won (KPW)",
    "languages": "Korean",
    "flag": "🇰🇵",
    "majorCities": [
      "Pyongyang",
      "Hamhung",
      "Chongjin",
      "Nampo",
      "Wonsan"
    ],
    "geography": "Occupies the northern half of the Korean Peninsula, dominated by rugged mountain ranges separated by deep river valleys.",
    "landmark": "Mount Paektu & Juche Tower",
    "climate": "Continental climate with warm summers and cold, snowy winters",
    "funFact": "Mount Paektu, an active stratovolcano on the Chinese-North Korean border, is considered the spiritual sacred origin of the Korean people.",
    "neighbours": [
      "China",
      "Russia",
      "South Korea"
    ],
    "relatedSlugs": [
      "china",
      "russia",
      "south-korea"
    ]
  },
  {
    "id": "mk",
    "name": "North Macedonia",
    "slug": "north-macedonia",
    "iso2": "MK",
    "iso3": "MKD",
    "capital": "Skopje",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 41.6086,
      "lng": 21.7453
    },
    "population": "1.8 million",
    "areaKm2": 25713,
    "currency": "Macedonian Denar (MKD)",
    "languages": "Macedonian, Albanian",
    "flag": "🇲🇰",
    "majorCities": [
      "Skopje",
      "Bitola",
      "Kumanovo",
      "Prilep",
      "Tetovo"
    ],
    "geography": "Landlocked Balkan nation characterized by deep valleys, rugged mountain massifs, and Lake Ohrid on the Albanian border.",
    "landmark": "Lake Ohrid & Stone Bridge of Skopje",
    "climate": "Transitional Mediterranean to continental with hot summers and snowy winters",
    "funFact": "Lake Ohrid is one of Europe’s deepest and oldest lakes, preserving a unique aquatic ecosystem with over 200 endemic species.",
    "neighbours": [
      "Kosovo",
      "Serbia",
      "Bulgaria",
      "Greece",
      "Albania"
    ],
    "relatedSlugs": [
      "serbia",
      "bulgaria",
      "greece",
      "albania"
    ]
  },
  {
    "id": "no",
    "name": "Norway",
    "slug": "norway",
    "iso2": "NO",
    "iso3": "NOR",
    "capital": "Oslo",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 60.472,
      "lng": 8.4689
    },
    "population": "5.5 million",
    "areaKm2": 385207,
    "currency": "Norwegian Krone (NOK)",
    "languages": "Norwegian (Bokmål & Nynorsk)",
    "flag": "🇳🇴",
    "majorCities": [
      "Oslo",
      "Bergen",
      "Trondheim",
      "Stavanger",
      "Drammen"
    ],
    "geography": "Narrow Scandinavian nation renowned for dramatic glacial fjords, high alpine plateaus, and Arctic islands including Svalbard.",
    "landmark": "Geirangerfjord & Preikestolen (Pulpit Rock)",
    "climate": "Marine temperate along the coast due to the Gulf Stream; subarctic in the interior",
    "funFact": "Norway has over 1,190 distinct fjords along its deeply indented continental coastline.",
    "neighbours": [
      "Sweden",
      "Finland",
      "Russia"
    ],
    "relatedSlugs": [
      "sweden",
      "finland",
      "russia"
    ]
  },
  {
    "id": "om",
    "name": "Oman",
    "slug": "oman",
    "iso2": "OM",
    "iso3": "OMN",
    "capital": "Muscat",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 21.5126,
      "lng": 55.9233
    },
    "population": "4.6 million",
    "areaKm2": 309500,
    "currency": "Omani Rial (OMR)",
    "languages": "Arabic",
    "flag": "🇴🇲",
    "majorCities": [
      "Muscat",
      "Seeb",
      "Salalah",
      "Bawshar",
      "Sohar"
    ],
    "geography": "Situated on the southeastern coast of the Arabian Peninsula, featuring the Al Hajar Mountains and the Rub' al Khali desert.",
    "landmark": "Sultan Qaboos Grand Mosque & Nizwa Fort",
    "climate": "Hot desert climate with monsoonal (Khareef) greenery in southern Dhofar",
    "funFact": "During the summer monsoon (Khareef), southern Oman transforms into a lush green sub-tropical landscape of misty waterfalls.",
    "neighbours": [
      "United Arab Emirates",
      "Saudi Arabia",
      "Yemen"
    ],
    "relatedSlugs": [
      "united-arab-emirates",
      "saudi-arabia",
      "yemen"
    ]
  },
  {
    "id": "pk",
    "name": "Pakistan",
    "slug": "pakistan",
    "iso2": "PK",
    "iso3": "PAK",
    "capital": "Islamabad",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 30.3753,
      "lng": 69.3451
    },
    "population": "240 million",
    "areaKm2": 881913,
    "currency": "Pakistani Rupee (PKR)",
    "languages": "Urdu, English",
    "flag": "🇵🇰",
    "majorCities": [
      "Karachi",
      "Lahore",
      "Faisalabad",
      "Rawalpindi",
      "Islamabad"
    ],
    "geography": "Stretches from the Arabian Sea north through the fertile Indus River basin to the Karakoram and Himalayan peaks.",
    "landmark": "Badshahi Mosque & K2 Summit",
    "climate": "Arid to semi-arid, with alpine highland climates in the northern mountains",
    "funFact": "K2 in northern Pakistan is the second-highest mountain on Earth at 8,611 meters and widely considered the most challenging climb.",
    "neighbours": [
      "India",
      "Afghanistan",
      "Iran",
      "China"
    ],
    "relatedSlugs": [
      "india",
      "afghanistan",
      "iran",
      "china"
    ]
  },
  {
    "id": "pw",
    "name": "Palau",
    "slug": "palau",
    "iso2": "PW",
    "iso3": "PLW",
    "capital": "Ngerulmud",
    "region": "Oceania",
    "subregion": "Micronesia",
    "coordinates": {
      "lat": 7.515,
      "lng": 134.5825
    },
    "population": "18,000",
    "areaKm2": 459,
    "currency": "US Dollar (USD)",
    "languages": "Palauan, English",
    "flag": "🇵🇼",
    "majorCities": [
      "Koror",
      "Airai",
      "Meyuns",
      "Ngerulmud"
    ],
    "geography": "Western Pacific archipelago of over 340 coral and volcanic islands, world-famous for the verdant mushroom-shaped Rock Islands.",
    "landmark": "Rock Islands Southern Lagoon & Jellyfish Lake",
    "climate": "Tropical rainforest climate with warm year-round ocean temperatures",
    "funFact": "Palau created the world’s first national shark sanctuary in 2009, banning commercial shark fishing across its entire territorial waters.",
    "neighbours": [
      "Micronesia",
      "Philippines",
      "Indonesia"
    ],
    "relatedSlugs": [
      "micronesia",
      "philippines",
      "indonesia"
    ]
  },
  {
    "id": "ps",
    "name": "Palestine",
    "slug": "palestine",
    "iso2": "PS",
    "iso3": "PSE",
    "capital": "Jerusalem (proclaimed), Ramallah (administrative)",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 31.9522,
      "lng": 35.2332
    },
    "population": "5.2 million",
    "areaKm2": 6020,
    "currency": "Israeli New Shekel, Jordanian Dinar",
    "languages": "Arabic",
    "flag": "🇵🇸",
    "majorCities": [
      "Gaza City",
      "East Jerusalem",
      "Ramallah",
      "Hebron",
      "Nablus"
    ],
    "geography": "Encompasses the West Bank hills bordering the Jordan River and Dead Sea, and the coastal Gaza Strip along the Mediterranean.",
    "landmark": "Dome of the Rock & Church of the Nativity (Bethlehem)",
    "climate": "Mediterranean with warm dry summers and mild rainy winters",
    "funFact": "Jericho in the West Bank is considered by archaeologists to be one of the oldest continuously inhabited cities on Earth, dating back over 11,000 years.",
    "neighbours": [
      "Israel",
      "Jordan",
      "Egypt"
    ],
    "relatedSlugs": [
      "israel",
      "jordan",
      "egypt"
    ]
  },
  {
    "id": "pa",
    "name": "Panama",
    "slug": "panama",
    "iso2": "PA",
    "iso3": "PAN",
    "capital": "Panama City",
    "region": "Americas",
    "subregion": "Central America",
    "coordinates": {
      "lat": 8.5379,
      "lng": -80.7821
    },
    "population": "4.4 million",
    "areaKm2": 75417,
    "currency": "Panamanian Balboa (PAB), US Dollar (USD)",
    "languages": "Spanish",
    "flag": "🇵🇦",
    "majorCities": [
      "Panama City",
      "San Miguelito",
      "Tocumen",
      "David",
      "Colón"
    ],
    "geography": "Narrow isthmus bridging North and South America, bisected by the Panama Canal and flanked by Caribbean and Pacific shores.",
    "landmark": "Panama Canal & Casco Viejo",
    "climate": "Tropical maritime with high humidity and rainy season from May to December",
    "funFact": "The Panama Canal is an artificial 82-kilometer waterway that connects the Atlantic and Pacific oceans, saving ships an 8,000-mile detour around South America.",
    "neighbours": [
      "Costa Rica",
      "Colombia"
    ],
    "relatedSlugs": [
      "costa-rica",
      "colombia"
    ]
  },
  {
    "id": "pg",
    "name": "Papua New Guinea",
    "slug": "papua-new-guinea",
    "iso2": "PG",
    "iso3": "PNG",
    "capital": "Port Moresby",
    "region": "Oceania",
    "subregion": "Melanesia",
    "coordinates": {
      "lat": -6.315,
      "lng": 143.9555
    },
    "population": "10 million",
    "areaKm2": 462840,
    "currency": "Papua New Guinean Kina (PGK)",
    "languages": "Tok Pisin, English, Hiri Motu",
    "flag": "🇵🇬",
    "majorCities": [
      "Port Moresby",
      "Lae",
      "Arawa",
      "Mount Hagen",
      "Madang"
    ],
    "geography": "Eastern half of New Guinea island plus offshore archipelagos, dominated by rugged mountain spines and untouched rainforests.",
    "landmark": "Kokoda Track & Mount Wilhelm",
    "climate": "Tropical with seasonal monsoons and cool alpine highland interior",
    "funFact": "Papua New Guinea is the most linguistically diverse nation in the world, with over 840 distinct living languages spoken.",
    "neighbours": [
      "Indonesia",
      "Australia",
      "Solomon Islands"
    ],
    "relatedSlugs": [
      "indonesia",
      "australia",
      "solomon-islands"
    ]
  },
  {
    "id": "py",
    "name": "Paraguay",
    "slug": "paraguay",
    "iso2": "PY",
    "iso3": "PRY",
    "capital": "Asunción",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -23.4425,
      "lng": -58.4438
    },
    "population": "6.8 million",
    "areaKm2": 406752,
    "currency": "Paraguayan Guaraní (PYG)",
    "languages": "Spanish, Guaraní",
    "flag": "🇵🇾",
    "majorCities": [
      "Asunción",
      "Ciudad del Este",
      "San Lorenzo",
      "Luque"
    ],
    "geography": "Landlocked South American nation bisected by the Paraguay River into the arid Gran Chaco scrubland and fertile eastern region.",
    "landmark": "Itaipu Dam & Jesuit Missions of La Santísima Trinidad",
    "climate": "Subtropical to tropical with hot humid summers and mild winters",
    "funFact": "Over 90% of Paraguay’s population speaks the indigenous language Guaraní, making it one of the few Latin American nations where an indigenous tongue is spoken by the majority.",
    "neighbours": [
      "Argentina",
      "Brazil",
      "Bolivia"
    ],
    "relatedSlugs": [
      "argentina",
      "brazil",
      "bolivia"
    ]
  },
  {
    "id": "pe",
    "name": "Peru",
    "slug": "peru",
    "iso2": "PE",
    "iso3": "PER",
    "capital": "Lima",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -9.19,
      "lng": -75.0152
    },
    "population": "34 million",
    "areaKm2": 1285216,
    "currency": "Peruvian Sol (PEN)",
    "languages": "Spanish, Quechua, Aymara",
    "flag": "🇵🇪",
    "majorCities": [
      "Lima",
      "Arequipa",
      "Trujillo",
      "Chiclayo",
      "Cusco"
    ],
    "geography": "Spans arid Pacific coastal desert, the high glaciated Andes mountains, and the deep tropical Amazon River headwaters.",
    "landmark": "Machu Picchu & Nazca Lines",
    "climate": "Dry coastal desert, cold alpine in the Andes, and humid tropical in the Amazon basin",
    "funFact": "Machu Picchu, the 15th-century Inca citadel built 2,430 meters up in the Andes, was never discovered by the Spanish conquistadors.",
    "neighbours": [
      "Ecuador",
      "Colombia",
      "Brazil",
      "Bolivia",
      "Chile"
    ],
    "relatedSlugs": [
      "ecuador",
      "colombia",
      "brazil",
      "bolivia",
      "chile"
    ]
  },
  {
    "id": "ph",
    "name": "Philippines",
    "slug": "philippines",
    "iso2": "PH",
    "iso3": "PHL",
    "capital": "Manila",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 12.8797,
      "lng": 121.774
    },
    "population": "115 million",
    "areaKm2": 300000,
    "currency": "Philippine Peso (PHP)",
    "languages": "Filipino (Tagalog), English",
    "flag": "🇵🇭",
    "majorCities": [
      "Quezon City",
      "Manila",
      "Davao City",
      "Caloocan",
      "Cebu City"
    ],
    "geography": "Archipelago of over 7,600 tropical islands divided into three main geographic groups: Luzon, Visayas, and Mindanao.",
    "landmark": "Banaue Rice Terraces & Mayon Volcano",
    "climate": "Tropical marine climate characterized by wet monsoons and typhoons",
    "funFact": "Mayon Volcano in the Philippines is renowned worldwide as having the most symmetrically perfect conical shape of any volcano.",
    "neighbours": [
      "Taiwan",
      "Vietnam",
      "Malaysia",
      "Indonesia",
      "Palau"
    ],
    "relatedSlugs": [
      "vietnam",
      "malaysia",
      "indonesia",
      "palau"
    ]
  },
  {
    "id": "pl",
    "name": "Poland",
    "slug": "poland",
    "iso2": "PL",
    "iso3": "POL",
    "capital": "Warsaw",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 51.9194,
      "lng": 19.1451
    },
    "population": "38 million",
    "areaKm2": 312696,
    "currency": "Polish Złoty (PLN)",
    "languages": "Polish",
    "flag": "🇵🇱",
    "majorCities": [
      "Warsaw",
      "Kraków",
      "Łódź",
      "Wrocław",
      "Poznań",
      "Gdańsk"
    ],
    "geography": "Central European country extending from Baltic Sea sandy beaches south across broad plains to the Carpathian and Tatra mountains.",
    "landmark": "Wawel Royal Castle & Wieliczka Salt Mine",
    "climate": "Temperate transitional continental with cold winters and warm summers",
    "funFact": "Poland’s Wieliczka Salt Mine contains subterranean chapels, chandeliers, and statues carved entirely out of rock salt.",
    "neighbours": [
      "Germany",
      "Czech Republic",
      "Slovakia",
      "Ukraine",
      "Belarus",
      "Lithuania",
      "Russia"
    ],
    "relatedSlugs": [
      "germany",
      "czech-republic",
      "slovakia",
      "ukraine",
      "belarus",
      "lithuania"
    ]
  },
  {
    "id": "pt",
    "name": "Portugal",
    "slug": "portugal",
    "iso2": "PT",
    "iso3": "PRT",
    "capital": "Lisbon",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 39.3999,
      "lng": -8.2245
    },
    "population": "10.3 million",
    "areaKm2": 92212,
    "currency": "Euro (EUR)",
    "languages": "Portuguese",
    "flag": "🇵🇹",
    "majorCities": [
      "Lisbon",
      "Porto",
      "Vila Nova de Gaia",
      "Amadora",
      "Braga"
    ],
    "geography": "Westernmost sovereign state of mainland Europe on the Iberian Peninsula, plus the Atlantic archipelagos of Madeira and Azores.",
    "landmark": "Belém Tower & Pena Palace",
    "climate": "Mediterranean climate with warm summers and mild, rainy Atlantic winters",
    "funFact": "Portugal is the oldest nation-state in Europe, with its borders essentially unchanged since the Treaty of Alcañices in 1297.",
    "neighbours": [
      "Spain"
    ],
    "relatedSlugs": [
      "spain"
    ]
  },
  {
    "id": "qa",
    "name": "Qatar",
    "slug": "qatar",
    "iso2": "QA",
    "iso3": "QAT",
    "capital": "Doha",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 25.3548,
      "lng": 51.1839
    },
    "population": "2.9 million",
    "areaKm2": 11586,
    "currency": "Qatari Riyal (QAR)",
    "languages": "Arabic",
    "flag": "🇶🇦",
    "majorCities": [
      "Doha",
      "Al Rayyan",
      "Al Wakrah",
      "Al Khor"
    ],
    "geography": "Peninsula jutting into the Persian Gulf, featuring flat gravel and sand deserts and the inland sea of Khor Al Adaid.",
    "landmark": "Museum of Islamic Art & Souq Waqif",
    "climate": "Arid desert climate with very mild winters and intensely hot summers",
    "funFact": "Qatar hosted the 2022 FIFA World Cup, becoming the first Middle Eastern nation to host the tournament.",
    "neighbours": [
      "Saudi Arabia",
      "United Arab Emirates",
      "Bahrain"
    ],
    "relatedSlugs": [
      "saudi-arabia",
      "united-arab-emirates",
      "bahrain"
    ]
  },
  {
    "id": "ro",
    "name": "Romania",
    "slug": "romania",
    "iso2": "RO",
    "iso3": "ROU",
    "capital": "Bucharest",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 45.9432,
      "lng": 24.9668
    },
    "population": "19 million",
    "areaKm2": 238397,
    "currency": "Romanian Leu (RON)",
    "languages": "Romanian",
    "flag": "🇷🇴",
    "majorCities": [
      "Bucharest",
      "Cluj-Napoca",
      "Timișoara",
      "Iași",
      "Constanța"
    ],
    "geography": "Carpathian Mountains encircle the Transylvanian plateau, descending to the Walachian plains and Danube Delta on the Black Sea.",
    "landmark": "Bran Castle & Palace of the Parliament",
    "climate": "Temperate continental with four distinct seasons",
    "funFact": "The Palace of the Parliament in Bucharest is the second-largest administrative building in the world after the US Pentagon.",
    "neighbours": [
      "Ukraine",
      "Moldova",
      "Bulgaria",
      "Serbia",
      "Hungary"
    ],
    "relatedSlugs": [
      "ukraine",
      "moldova",
      "bulgaria",
      "serbia",
      "hungary"
    ]
  },
  {
    "id": "ru",
    "name": "Russia",
    "slug": "russia",
    "iso2": "RU",
    "iso3": "RUS",
    "capital": "Moscow",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 61.524,
      "lng": 105.3188
    },
    "population": "144 million",
    "areaKm2": 17098242,
    "currency": "Russian Ruble (RUB)",
    "languages": "Russian",
    "flag": "🇷🇺",
    "majorCities": [
      "Moscow",
      "Saint Petersburg",
      "Novosibirsk",
      "Yekaterinburg",
      "Kazan"
    ],
    "geography": "Largest country on Earth spanning 11 time zones across Eastern Europe and Northern Asia, from the Baltic to the Pacific.",
    "landmark": "Red Square & Saint Basil’s Cathedral",
    "climate": "Ranges from subarctic taiga and tundra to humid continental and subtropical zones",
    "funFact": "Lake Baikal in southern Russia is the world’s deepest and oldest freshwater lake, containing over 20% of Earth’s unfrozen surface fresh water.",
    "neighbours": [
      "Norway",
      "Finland",
      "Estonia",
      "Latvia",
      "Lithuania",
      "Poland",
      "Belarus",
      "Ukraine",
      "Georgia",
      "Azerbaijan",
      "Kazakhstan",
      "China",
      "Mongolia",
      "North Korea"
    ],
    "relatedSlugs": [
      "norway",
      "finland",
      "estonia",
      "latvia",
      "lithuania",
      "poland"
    ]
  },
  {
    "id": "rw",
    "name": "Rwanda",
    "slug": "rwanda",
    "iso2": "RW",
    "iso3": "RWA",
    "capital": "Kigali",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -1.9403,
      "lng": 29.8739
    },
    "population": "13.8 million",
    "areaKm2": 26338,
    "currency": "Rwandan Franc (RWF)",
    "languages": "Kinyarwanda, French, English, Swahili",
    "flag": "🇷🇼",
    "majorCities": [
      "Kigali",
      "Gisenyi",
      "Ruhengeri",
      "Butare"
    ],
    "geography": "Known as the \"Land of a Thousand Hills\", a lush highland nation in East Africa featuring the Virunga volcanic chain.",
    "landmark": "Volcanoes National Park",
    "climate": "Subtropical highland climate with mild temperatures year-round",
    "funFact": "Volcanoes National Park in Rwanda is one of the few remaining natural habitats of endangered mountain gorillas.",
    "neighbours": [
      "Uganda",
      "Tanzania",
      "Burundi",
      "Democratic Republic of the Congo"
    ],
    "relatedSlugs": [
      "uganda",
      "tanzania",
      "burundi",
      "congo"
    ]
  },
  {
    "id": "kn",
    "name": "Saint Kitts and Nevis",
    "slug": "saint-kitts-and-nevis",
    "iso2": "KN",
    "iso3": "KNA",
    "capital": "Basseterre",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 17.3578,
      "lng": -62.783
    },
    "population": "48,000",
    "areaKm2": 261,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English",
    "flag": "🇰🇳",
    "majorCities": [
      "Basseterre",
      "Charlestown",
      "Sandy Point Town",
      "Cayon"
    ],
    "geography": "Two-island volcanic Caribbean nation featuring lush volcanic peaks, coral reefs, and sandy beaches.",
    "landmark": "Brimstone Hill Fortress",
    "climate": "Tropical marine climate moderated by prevailing northeast trade winds",
    "funFact": "Saint Kitts and Nevis is the smallest sovereign state in the Western Hemisphere by both area and population.",
    "neighbours": [
      "Antigua and Barbuda",
      "Saint Martin",
      "Montserrat"
    ],
    "relatedSlugs": [
      "antigua-and-barbuda"
    ]
  },
  {
    "id": "lc",
    "name": "Saint Lucia",
    "slug": "saint-lucia",
    "iso2": "LC",
    "iso3": "LCA",
    "capital": "Castries",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 13.9094,
      "lng": -60.9789
    },
    "population": "180,000",
    "areaKm2": 616,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English, Saint Lucian French Creole",
    "flag": "🇱🇨",
    "majorCities": [
      "Castries",
      "Bexon",
      "Vieux Fort",
      "Gros Islet"
    ],
    "geography": "Volcanic Windward island in the eastern Caribbean, famous for the twin forested volcanic plugs known as the Pitons.",
    "landmark": "The Pitons (Gros Piton & Petit Piton)",
    "climate": "Tropical with warm sea breezes and a wet summer season",
    "funFact": "Saint Lucia is the only country in the world named after an actual historical woman (Saint Lucy of Syracuse).",
    "neighbours": [
      "Saint Vincent and the Grenadines",
      "Martinique",
      "Barbados"
    ],
    "relatedSlugs": [
      "saint-vincent-and-the-grenadines",
      "barbados"
    ]
  },
  {
    "id": "vc",
    "name": "Saint Vincent and the Grenadines",
    "slug": "saint-vincent-and-the-grenadines",
    "iso2": "VC",
    "iso3": "VCT",
    "capital": "Kingstown",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 13.2528,
      "lng": -61.1971
    },
    "population": "104,000",
    "areaKm2": 389,
    "currency": "East Caribbean Dollar (XCD)",
    "languages": "English",
    "flag": "🇻🇨",
    "majorCities": [
      "Kingstown",
      "Georgetown",
      "Byera Village",
      "Barrouallie"
    ],
    "geography": "Main volcanic island of Saint Vincent plus an archipelago chain of 32 smaller Grenadine islands and cays.",
    "landmark": "La Soufrière Volcano & Tobago Cays",
    "climate": "Tropical marine with warm, humid weather throughout the year",
    "funFact": "The Tobago Cays marine park is a world-class protected haven for wild sea turtles and coral reef life.",
    "neighbours": [
      "Saint Lucia",
      "Grenada",
      "Barbados"
    ],
    "relatedSlugs": [
      "saint-lucia",
      "grenada",
      "barbados"
    ]
  },
  {
    "id": "ws",
    "name": "Samoa",
    "slug": "samoa",
    "iso2": "WS",
    "iso3": "WSM",
    "capital": "Apia",
    "region": "Oceania",
    "subregion": "Polynesia",
    "coordinates": {
      "lat": -13.759,
      "lng": -172.1046
    },
    "population": "220,000",
    "areaKm2": 2842,
    "currency": "Samoan Tālā (WST)",
    "languages": "Samoan, English",
    "flag": "🇼🇸",
    "majorCities": [
      "Apia",
      "Vaitele",
      "Faleasiu",
      "Vailele"
    ],
    "geography": "South Pacific Polynesian archipelago dominated by the two large volcanic islands of Upolu and Savai'i.",
    "landmark": "To-Sua Ocean Trench",
    "climate": "Tropical maritime with a wet cyclone season between November and April",
    "funFact": "To-Sua Ocean Trench in Samoa is a breathtaking natural tidal swimming hole surrounded by lush volcanic cliffs.",
    "neighbours": [
      "American Samoa",
      "Tonga",
      "Fiji",
      "Tuvalu"
    ],
    "relatedSlugs": [
      "tonga",
      "fiji",
      "tuvalu"
    ]
  },
  {
    "id": "sm",
    "name": "San Marino",
    "slug": "san-marino",
    "iso2": "SM",
    "iso3": "SMR",
    "capital": "City of San Marino",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 43.9424,
      "lng": 12.4578
    },
    "population": "34,000",
    "areaKm2": 61.2,
    "currency": "Euro (EUR)",
    "languages": "Italian",
    "flag": "🇸🇲",
    "majorCities": [
      "City of San Marino",
      "Serravalle",
      "Borgo Maggiore",
      "Domagnano"
    ],
    "geography": "Landlocked microstate enclave perched atop the slopes of Mount Titano in central-eastern Italy.",
    "landmark": "Three Towers of San Marino (Guaita, Cesta, Montale)",
    "climate": "Mediterranean with mild winters and warm sunny summers",
    "funFact": "San Marino claims to be the world’s oldest surviving constitutional republic, founded in 301 AD by Saint Marinus.",
    "neighbours": [
      "Italy"
    ],
    "relatedSlugs": [
      "italy"
    ]
  },
  {
    "id": "st",
    "name": "Sao Tome and Principe",
    "slug": "sao-tome-and-principe",
    "iso2": "ST",
    "iso3": "STP",
    "capital": "São Tomé",
    "region": "Africa",
    "subregion": "Middle Africa",
    "coordinates": {
      "lat": 0.1864,
      "lng": 6.6131
    },
    "population": "225,000",
    "areaKm2": 964,
    "currency": "São Tomé and Príncipe Dobra (STN)",
    "languages": "Portuguese",
    "flag": "🇸🇹",
    "majorCities": [
      "São Tomé",
      "Trindade",
      "Santana",
      "Santo António"
    ],
    "geography": "Two volcanic islands in the Gulf of Guinea off the western equatorial coast of Central Africa.",
    "landmark": "Pico Cão Grande (Great Dog Peak)",
    "climate": "Tropical wet with high humidity and heavy rainfall",
    "funFact": "Pico Cão Grande is a dramatic needle-shaped volcanic plug rising over 300 meters above the surrounding rainforest.",
    "neighbours": [
      "Equatorial Guinea",
      "Gabon",
      "Nigeria"
    ],
    "relatedSlugs": [
      "equatorial-guinea",
      "gabon",
      "niger"
    ]
  },
  {
    "id": "sa",
    "name": "Saudi Arabia",
    "slug": "saudi-arabia",
    "iso2": "SA",
    "iso3": "SAU",
    "capital": "Riyadh",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 23.8859,
      "lng": 45.0792
    },
    "population": "36 million",
    "areaKm2": 2149690,
    "currency": "Saudi Riyal (SAR)",
    "languages": "Arabic",
    "flag": "🇸🇦",
    "majorCities": [
      "Riyadh",
      "Jeddah",
      "Mecca",
      "Medina",
      "Dammam"
    ],
    "geography": "Occupies the majority of the Arabian Peninsula, dominated by the Rub' al Khali (Empty Quarter) desert and western Sarawat Mountains.",
    "landmark": "Al-Masjid al-Haram & Hegra (Mada'in Salih)",
    "climate": "Harsh, dry desert with high temperatures and low rainfall",
    "funFact": "Saudi Arabia is the birthplace of Islam, home to Mecca and Medina, the two holiest cities in the Islamic world.",
    "neighbours": [
      "Jordan",
      "Iraq",
      "Kuwait",
      "Qatar",
      "Bahrain",
      "United Arab Emirates",
      "Oman",
      "Yemen"
    ],
    "relatedSlugs": [
      "jordan",
      "iraq",
      "kuwait",
      "qatar",
      "bahrain",
      "united-arab-emirates"
    ]
  },
  {
    "id": "sn",
    "name": "Senegal",
    "slug": "senegal",
    "iso2": "SN",
    "iso3": "SEN",
    "capital": "Dakar",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 14.4974,
      "lng": -14.4524
    },
    "population": "17 million",
    "areaKm2": 196722,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French, Wolof",
    "flag": "🇸🇳",
    "majorCities": [
      "Dakar",
      "Touba",
      "Thiès",
      "Rufisque",
      "Kaolack"
    ],
    "geography": "Westernmost country of mainland Africa, consisting of rolling Sahelian sandy plains that meet the Atlantic Ocean.",
    "landmark": "Gorée Island & African Renaissance Monument",
    "climate": "Tropical with a well-defined dry season and hot monsoonal rains",
    "funFact": "Lake Retba (Lac Rose) north of Dakar is famous for its striking pink color caused by Dunaliella salina algae.",
    "neighbours": [
      "Mauritania",
      "Mali",
      "Guinea",
      "Guinea-Bissau",
      "The Gambia"
    ],
    "relatedSlugs": [
      "mauritania",
      "mali",
      "guinea",
      "gambia"
    ]
  },
  {
    "id": "rs",
    "name": "Serbia",
    "slug": "serbia",
    "iso2": "RS",
    "iso3": "SRB",
    "capital": "Belgrade",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 44.0165,
      "lng": 21.0059
    },
    "population": "6.6 million",
    "areaKm2": 88361,
    "currency": "Serbian Dinar (RSD)",
    "languages": "Serbian",
    "flag": "🇷🇸",
    "majorCities": [
      "Belgrade",
      "Novi Sad",
      "Niš",
      "Kragujevac",
      "Subotica"
    ],
    "geography": "Landlocked Balkan crossroads nation with the fertile Pannonian Plain in the north and mountainous terrain in the south.",
    "landmark": "Belgrade Fortress & Church of Saint Sava",
    "climate": "Moderate continental with cold winters and warm, humid summers",
    "funFact": "Belgrade Fortress stands at the confluence of the Danube and Sava rivers, contested in over 115 battles throughout history.",
    "neighbours": [
      "Hungary",
      "Romania",
      "Bulgaria",
      "North Macedonia",
      "Kosovo",
      "Montenegro",
      "Bosnia and Herzegovina",
      "Croatia"
    ],
    "relatedSlugs": [
      "hungary",
      "oman",
      "bulgaria",
      "north-macedonia",
      "montenegro",
      "bosnia-and-herzegovina"
    ]
  },
  {
    "id": "sc",
    "name": "Seychelles",
    "slug": "seychelles",
    "iso2": "SC",
    "iso3": "SYC",
    "capital": "Victoria",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -4.6796,
      "lng": 55.492
    },
    "population": "100,000",
    "areaKm2": 459,
    "currency": "Seychellois Rupee (SCR)",
    "languages": "Seychellois Creole, English, French",
    "flag": "🇸🇨",
    "majorCities": [
      "Victoria",
      "Anse Etoile",
      "Beau Vallon",
      "Cascade"
    ],
    "geography": "Western Indian Ocean archipelago of 115 granite and coral islands, famous for granite boulder-strewn beaches.",
    "landmark": "Vallée de Mai & Anse Source d'Argent",
    "climate": "Tropical oceanic with warm temperatures and high humidity",
    "funFact": "Seychelles is home to the Aldabra giant tortoise and the rare coco de mer, the world’s heaviest plant seed.",
    "neighbours": [
      "Madagascar",
      "Mauritius",
      "Comoros",
      "Kenya"
    ],
    "relatedSlugs": [
      "madagascar",
      "mauritius",
      "comoros",
      "kenya"
    ]
  },
  {
    "id": "sl",
    "name": "Sierra Leone",
    "slug": "sierra-leone",
    "iso2": "SL",
    "iso3": "SLE",
    "capital": "Freetown",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 8.4606,
      "lng": -11.7799
    },
    "population": "8.6 million",
    "areaKm2": 71740,
    "currency": "Sierra Leonean Leone (SLL)",
    "languages": "English, Krio",
    "flag": "🇸🇱",
    "majorCities": [
      "Freetown",
      "Bo",
      "Kenema",
      "Makeni",
      "Koidu"
    ],
    "geography": "West African coastal country featuring coastal mangrove swamps, wooded interior hills, and eastern mountain peaks.",
    "landmark": "Freetown Cotton Tree & Bunce Island",
    "climate": "Tropical monsoon with heavy summer rains from May to November",
    "funFact": "Freetown has one of the largest natural deepwater harbors in the world, founded by freed former slaves in 1792.",
    "neighbours": [
      "Guinea",
      "Liberia"
    ],
    "relatedSlugs": [
      "guinea",
      "liberia"
    ]
  },
  {
    "id": "sg",
    "name": "Singapore",
    "slug": "singapore",
    "iso2": "SG",
    "iso3": "SGP",
    "capital": "Singapore",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 1.3521,
      "lng": 103.8198
    },
    "population": "5.9 million",
    "areaKm2": 728,
    "currency": "Singapore Dollar (SGD)",
    "languages": "English, Malay, Mandarin, Tamil",
    "flag": "🇸🇬",
    "majorCities": [
      "Singapore"
    ],
    "geography": "High-density island city-state off the southern tip of the Malay Peninsula, separated by the Straits of Johor.",
    "landmark": "Marina Bay Sands & Gardens by the Bay",
    "climate": "Tropical rainforest climate with uniform temperature, pressure, and high humidity",
    "funFact": "Singapore is one of only three surviving sovereign city-states in the world, alongside Monaco and Vatican City.",
    "neighbours": [
      "Malaysia",
      "Indonesia"
    ],
    "relatedSlugs": [
      "malaysia",
      "indonesia"
    ]
  },
  {
    "id": "sk",
    "name": "Slovakia",
    "slug": "slovakia",
    "iso2": "SK",
    "iso3": "SVK",
    "capital": "Bratislava",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 48.669,
      "lng": 19.699
    },
    "population": "5.4 million",
    "areaKm2": 49035,
    "currency": "Euro (EUR)",
    "languages": "Slovak",
    "flag": "🇸🇰",
    "majorCities": [
      "Bratislava",
      "Košice",
      "Prešov",
      "Žilina",
      "Banská Bystrica"
    ],
    "geography": "Landlocked Central European country dominated by the dramatic peaks and glacial valleys of the High Tatras mountains.",
    "landmark": "Spiš Castle & High Tatras",
    "climate": "Temperate continental with warm summers and cold, cloudy winters",
    "funFact": "Slovakia has the highest concentration of castles and châteaux per capita in the world, with over 180 castles.",
    "neighbours": [
      "Czech Republic",
      "Poland",
      "Ukraine",
      "Hungary",
      "Austria"
    ],
    "relatedSlugs": [
      "czech-republic",
      "poland",
      "ukraine",
      "hungary",
      "austria"
    ]
  },
  {
    "id": "si",
    "name": "Slovenia",
    "slug": "slovenia",
    "iso2": "SI",
    "iso3": "SVN",
    "capital": "Ljubljana",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 46.1512,
      "lng": 14.9955
    },
    "population": "2.1 million",
    "areaKm2": 20273,
    "currency": "Euro (EUR)",
    "languages": "Slovene",
    "flag": "🇸🇮",
    "majorCities": [
      "Ljubljana",
      "Maribor",
      "Kranj",
      "Celje",
      "Koper"
    ],
    "geography": "Alpine-Mediterranean transition nation featuring the Julian Alps, emerald lakes, dense forests, and Adriatic coastline.",
    "landmark": "Lake Bled & Postojna Cave",
    "climate": "Sub-Mediterranean on the coast, alpine in the mountains, continental in the east",
    "funFact": "More than 60% of Slovenia is blanketed by forests, making it the third most forested country in Europe.",
    "neighbours": [
      "Italy",
      "Austria",
      "Hungary",
      "Croatia"
    ],
    "relatedSlugs": [
      "italy",
      "austria",
      "hungary",
      "croatia"
    ]
  },
  {
    "id": "sb",
    "name": "Solomon Islands",
    "slug": "solomon-islands",
    "iso2": "SB",
    "iso3": "SLB",
    "capital": "Honiara",
    "region": "Oceania",
    "subregion": "Melanesia",
    "coordinates": {
      "lat": -9.6457,
      "lng": 160.1562
    },
    "population": "720,000",
    "areaKm2": 28896,
    "currency": "Solomon Islands Dollar (SBD)",
    "languages": "English, Pijin",
    "flag": "🇸🇧",
    "majorCities": [
      "Honiara",
      "Gizo",
      "Auki",
      "Noro"
    ],
    "geography": "Scattered archipelago of six major volcanic islands and over 900 smaller coral atolls east of Papua New Guinea.",
    "landmark": "Marovo Lagoon & Guadalcanal Battlefields",
    "climate": "Tropical rainforest climate with year-round warmth and monsoonal rainfall",
    "funFact": "Marovo Lagoon in the Solomon Islands is the largest saltwater lagoon in the world, surrounded by coral barrier reefs.",
    "neighbours": [
      "Papua New Guinea",
      "Vanuatu",
      "Australia"
    ],
    "relatedSlugs": [
      "guinea",
      "vanuatu",
      "australia"
    ]
  },
  {
    "id": "so",
    "name": "Somalia",
    "slug": "somalia",
    "iso2": "SO",
    "iso3": "SOM",
    "capital": "Mogadishu",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 5.1521,
      "lng": 46.1996
    },
    "population": "18 million",
    "areaKm2": 637657,
    "currency": "Somali Shilling (SOS)",
    "languages": "Somali, Arabic",
    "flag": "🇸🇴",
    "majorCities": [
      "Mogadishu",
      "Hargeisa",
      "Kismayo",
      "Berbera",
      "Bosaso"
    ],
    "geography": "Occupies the tip of the Horn of Africa, with the longest coastline on mainland Africa, mostly arid plateaus and plains.",
    "landmark": "Laas Geel Cave Paintings & Mogadishu Old City",
    "climate": "Principally desert with hot conditions year-round and periodic monsoon winds",
    "funFact": "The Laas Geel rock art sites in Somalia contain some of the oldest and best-preserved prehistoric rock paintings in Africa.",
    "neighbours": [
      "Djibouti",
      "Ethiopia",
      "Kenya"
    ],
    "relatedSlugs": [
      "djibouti",
      "ethiopia",
      "kenya"
    ]
  },
  {
    "id": "za",
    "name": "South Africa",
    "slug": "south-africa",
    "iso2": "ZA",
    "iso3": "ZAF",
    "capital": "Pretoria (executive), Cape Town (legislative), Bloemfontein (judicial)",
    "region": "Africa",
    "subregion": "Southern Africa",
    "coordinates": {
      "lat": -30.5595,
      "lng": 22.9375
    },
    "population": "60 million",
    "areaKm2": 1221037,
    "currency": "South African Rand (ZAR)",
    "languages": "12 official languages including Zulu, Xhosa, Afrikaans, English",
    "flag": "🇿🇦",
    "majorCities": [
      "Johannesburg",
      "Cape Town",
      "Durban",
      "Pretoria",
      "Gqeberha"
    ],
    "geography": "Southernmost point of the African continent, with a high interior plateau framed by the Great Escarpment and oceans.",
    "landmark": "Table Mountain & Kruger National Park",
    "climate": "Mostly semi-arid, Mediterranean in the southwest, subtropical in the east",
    "funFact": "South Africa is the only nation in the world with three official designated capital cities.",
    "neighbours": [
      "Namibia",
      "Botswana",
      "Zimbabwe",
      "Mozambique",
      "Eswatini",
      "Lesotho"
    ],
    "relatedSlugs": [
      "namibia",
      "botswana",
      "zimbabwe",
      "mozambique",
      "eswatini",
      "lesotho"
    ]
  },
  {
    "id": "kr",
    "name": "South Korea",
    "slug": "south-korea",
    "iso2": "KR",
    "iso3": "KOR",
    "capital": "Seoul",
    "region": "Asia",
    "subregion": "Eastern Asia",
    "coordinates": {
      "lat": 35.9078,
      "lng": 127.7669
    },
    "population": "51.7 million",
    "areaKm2": 100210,
    "currency": "South Korean Won (KRW)",
    "languages": "Korean",
    "flag": "🇰🇷",
    "majorCities": [
      "Seoul",
      "Busan",
      "Incheon",
      "Daegu",
      "Daejeon",
      "Gwangju"
    ],
    "geography": "Southern portion of the Korean Peninsula, characterized by rugged mountain ranges in the east and coastal plains in the west.",
    "landmark": "Gyeongbokgung Palace & N Seoul Tower",
    "climate": "Humid continental and subtropical with four distinct seasons",
    "funFact": "South Korea has the fastest average internet connection speeds and highest optical fiber broadband penetration in the world.",
    "neighbours": [
      "North Korea",
      "Japan",
      "China"
    ],
    "relatedSlugs": [
      "north-korea",
      "japan",
      "china"
    ]
  },
  {
    "id": "ss",
    "name": "South Sudan",
    "slug": "south-sudan",
    "iso2": "SS",
    "iso3": "SSD",
    "capital": "Juba",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 6.877,
      "lng": 31.307
    },
    "population": "11 million",
    "areaKm2": 644329,
    "currency": "South Sudanese Pound (SSP)",
    "languages": "English",
    "flag": "🇸🇸",
    "majorCities": [
      "Juba",
      "Malakal",
      "Wau",
      "Yei",
      "Rumbek"
    ],
    "geography": "Landlocked East-Central African nation covered by tropical forests, savannah grasslands, and the vast Sudd wetland swamp.",
    "landmark": "The Sudd Wetland & Boma National Park",
    "climate": "Tropical wet and dry with heavy summer rainfall and hot dry winters",
    "funFact": "South Sudan is the youngest internationally recognized sovereign state in the world, gaining independence in July 2011.",
    "neighbours": [
      "Sudan",
      "Ethiopia",
      "Kenya",
      "Uganda",
      "Democratic Republic of the Congo",
      "Central African Republic"
    ],
    "relatedSlugs": [
      "sudan",
      "ethiopia",
      "kenya",
      "uganda",
      "congo",
      "central-african-republic"
    ]
  },
  {
    "id": "es",
    "name": "Spain",
    "slug": "spain",
    "iso2": "ES",
    "iso3": "ESP",
    "capital": "Madrid",
    "region": "Europe",
    "subregion": "Southern Europe",
    "coordinates": {
      "lat": 40.4637,
      "lng": -3.7492
    },
    "population": "47 million",
    "areaKm2": 505990,
    "currency": "Euro (EUR)",
    "languages": "Spanish (Castilian), Catalan, Galician, Basque",
    "flag": "🇪🇸",
    "majorCities": [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Seville",
      "Zaragoza",
      "Málaga"
    ],
    "geography": "Occupies the majority of the Iberian Peninsula, plus the Balearic and Canary islands, dominated by the central Meseta plateau.",
    "landmark": "Sagrada Família & Alhambra Palace",
    "climate": "Mediterranean coastal, semi-arid in the southeast, and oceanic in the north",
    "funFact": "Spain is the world’s leading producer of olive oil, accounting for nearly half of the entire global supply.",
    "neighbours": [
      "Portugal",
      "France",
      "Andorra",
      "Gibraltar",
      "Morocco"
    ],
    "relatedSlugs": [
      "portugal",
      "france",
      "andorra",
      "morocco"
    ]
  },
  {
    "id": "lk",
    "name": "Sri Lanka",
    "slug": "sri-lanka",
    "iso2": "LK",
    "iso3": "LKA",
    "capital": "Sri Jayawardenepura Kotte (legislative), Colombo (commercial)",
    "region": "Asia",
    "subregion": "Southern Asia",
    "coordinates": {
      "lat": 7.8731,
      "lng": 80.7718
    },
    "population": "22 million",
    "areaKm2": 65610,
    "currency": "Sri Lankan Rupee (LKR)",
    "languages": "Sinhala, Tamil",
    "flag": "🇱🇰",
    "majorCities": [
      "Colombo",
      "Kandy",
      "Galle",
      "Jaffna",
      "Negombo"
    ],
    "geography": "Teardrop-shaped island in the northern Indian Ocean, featuring central misty tea-covered highlands and coastal palm beaches.",
    "landmark": "Sigiriya Rock Fortress & Temple of the Tooth",
    "climate": "Tropical monsoon with distinct rainfall patterns across regions",
    "funFact": "Sigiriya in Sri Lanka is an ancient rock fortress perched atop a 200-meter sheer granite column, often called the Eighth Wonder of the World.",
    "neighbours": [
      "India",
      "Maldives"
    ],
    "relatedSlugs": [
      "india",
      "maldives"
    ]
  },
  {
    "id": "sd",
    "name": "Sudan",
    "slug": "sudan",
    "iso2": "SD",
    "iso3": "SDN",
    "capital": "Khartoum",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 12.8628,
      "lng": 30.2176
    },
    "population": "48 million",
    "areaKm2": 1861484,
    "currency": "Sudanese Pound (SDG)",
    "languages": "Arabic, English",
    "flag": "🇸🇩",
    "majorCities": [
      "Khartoum",
      "Omdurman",
      "Khartoum North",
      "Port Sudan",
      "Kassala"
    ],
    "geography": "Northeast African nation centered on the confluence of the Blue and White Nile rivers, transitioning from desert to savanna.",
    "landmark": "Pyramids of Meroë",
    "climate": "Arid desert in the north, semi-arid Sahel in the south with extreme heat",
    "funFact": "Sudan is home to more ancient pyramids than Egypt, with over 200 Nubian pyramids at Meroë.",
    "neighbours": [
      "Egypt",
      "Libya",
      "Chad",
      "Central African Republic",
      "South Sudan",
      "Ethiopia",
      "Eritrea"
    ],
    "relatedSlugs": [
      "egypt",
      "libya",
      "chad",
      "central-african-republic",
      "south-sudan",
      "ethiopia"
    ]
  },
  {
    "id": "sr",
    "name": "Suriname",
    "slug": "suriname",
    "iso2": "SR",
    "iso3": "SUR",
    "capital": "Paramaribo",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": 3.9193,
      "lng": -56.0278
    },
    "population": "620,000",
    "areaKm2": 163820,
    "currency": "Surinamese Dollar (SRD)",
    "languages": "Dutch, Sranan Tongo",
    "flag": "🇸🇷",
    "majorCities": [
      "Paramaribo",
      "Lelydorp",
      "Nieuw Nickerie",
      "Moengo"
    ],
    "geography": "Northeastern South American Atlantic country covered over 90% by dense Amazonian and Guianan shield tropical rainforest.",
    "landmark": "Central Suriname Nature Reserve & Historic Paramaribo",
    "climate": "Equatorial tropical with high humidity and year-round rainfall",
    "funFact": "Suriname is the only independent country in South America where Dutch is the sole official language.",
    "neighbours": [
      "Guyana",
      "Brazil",
      "French Guiana"
    ],
    "relatedSlugs": [
      "guyana",
      "brazil"
    ]
  },
  {
    "id": "se",
    "name": "Sweden",
    "slug": "sweden",
    "iso2": "SE",
    "iso3": "SWE",
    "capital": "Stockholm",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 60.1282,
      "lng": 18.6435
    },
    "population": "10.5 million",
    "areaKm2": 450295,
    "currency": "Swedish Krona (SEK)",
    "languages": "Swedish",
    "flag": "🇸🇪",
    "majorCities": [
      "Stockholm",
      "Gothenburg",
      "Malmö",
      "Uppsala",
      "Västerås"
    ],
    "geography": "Scandinavian nation of thousands of coastal islands, glacial lakes, vast boreal forests, and glaciated arctic mountains.",
    "landmark": "Vasa Museum & Stockholm Old Town (Gamla Stan)",
    "climate": "Temperate in the south, subarctic in the north with midnight sun in summer",
    "funFact": "Stockholm is built across 14 islands connected by 57 bridges in Lake Mälaren where it meets the Baltic Sea.",
    "neighbours": [
      "Norway",
      "Finland",
      "Denmark"
    ],
    "relatedSlugs": [
      "norway",
      "finland",
      "denmark"
    ]
  },
  {
    "id": "ch",
    "name": "Switzerland",
    "slug": "switzerland",
    "iso2": "CH",
    "iso3": "CHE",
    "capital": "Bern (federal city)",
    "region": "Europe",
    "subregion": "Western Europe",
    "coordinates": {
      "lat": 46.8182,
      "lng": 8.2275
    },
    "population": "8.8 million",
    "areaKm2": 41285,
    "currency": "Swiss Franc (CHF)",
    "languages": "German, French, Italian, Romansh",
    "flag": "🇨🇭",
    "majorCities": [
      "Zurich",
      "Geneva",
      "Basel",
      "Lausanne",
      "Bern"
    ],
    "geography": "Landlocked alpine nation dominated by the Swiss Alps and Jura mountains, surrounding the central Swiss Plateau.",
    "landmark": "Matterhorn & Chillon Castle",
    "climate": "Moderate continental with alpine conditions in higher elevations",
    "funFact": "The Matterhorn on the Swiss-Italian border is one of the most recognizable and photographed mountain peaks in the world.",
    "neighbours": [
      "Germany",
      "France",
      "Italy",
      "Austria",
      "Liechtenstein"
    ],
    "relatedSlugs": [
      "germany",
      "france",
      "italy",
      "austria",
      "liechtenstein"
    ]
  },
  {
    "id": "sy",
    "name": "Syria",
    "slug": "syria",
    "iso2": "SY",
    "iso3": "SYR",
    "capital": "Damascus",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 34.8021,
      "lng": 38.9968
    },
    "population": "22 million",
    "areaKm2": 185180,
    "currency": "Syrian Pound (SYP)",
    "languages": "Arabic",
    "flag": "🇸🇾",
    "majorCities": [
      "Damascus",
      "Aleppo",
      "Homs",
      "Latakia",
      "Hama"
    ],
    "geography": "Levantine Mediterranean coast rising to mountain ranges that slope east toward the Syrian Desert and Euphrates River.",
    "landmark": "Ancient City of Palmyra & Umayyad Mosque",
    "climate": "Mediterranean along the coast; dry and arid in the interior desert",
    "funFact": "Damascus is widely recognized as one of the oldest continuously inhabited cities on Earth, dating back to at least 3000 BC.",
    "neighbours": [
      "Turkey",
      "Iraq",
      "Jordan",
      "Israel",
      "Lebanon"
    ],
    "relatedSlugs": [
      "turkey",
      "iraq",
      "jordan",
      "israel",
      "lebanon"
    ]
  },
  {
    "id": "tj",
    "name": "Tajikistan",
    "slug": "tajikistan",
    "iso2": "TJ",
    "iso3": "TJK",
    "capital": "Dushanbe",
    "region": "Asia",
    "subregion": "Central Asia",
    "coordinates": {
      "lat": 38.861,
      "lng": 71.2761
    },
    "population": "10 million",
    "areaKm2": 143100,
    "currency": "Tajikistani Somoni (TJS)",
    "languages": "Tajik",
    "flag": "🇹🇯",
    "majorCities": [
      "Dushanbe",
      "Khujand",
      "Bokhtar",
      "Kulob"
    ],
    "geography": "Landlocked Central Asian country where over 90% of land is covered by the Pamir and Alay mountain ranges.",
    "landmark": "Pamir Highway & Ismoil Somoni Peak",
    "climate": "Continental, semi-arid and polar in the high mountain elevations",
    "funFact": "The Pamir Mountains in Tajikistan are traditionally called the \"Roof of the World\" (Bam-i-Dunya).",
    "neighbours": [
      "Afghanistan",
      "Uzbekistan",
      "Kyrgyzstan",
      "China"
    ],
    "relatedSlugs": [
      "afghanistan",
      "uzbekistan",
      "kyrgyzstan",
      "china"
    ]
  },
  {
    "id": "tz",
    "name": "Tanzania",
    "slug": "tanzania",
    "iso2": "TZ",
    "iso3": "TZA",
    "capital": "Dodoma (official), Dar es Salaam (commercial)",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -6.369,
      "lng": 34.8888
    },
    "population": "65 million",
    "areaKm2": 947303,
    "currency": "Tanzanian Shilling (TZS)",
    "languages": "Swahili, English",
    "flag": "🇹🇿",
    "majorCities": [
      "Dar es Salaam",
      "Mwanza",
      "Arusha",
      "Dodoma",
      "Zanzibar City"
    ],
    "geography": "East African nation featuring Mount Kilimanjaro (highest peak in Africa), the Serengeti Plains, and Zanzibar island.",
    "landmark": "Mount Kilimanjaro & Serengeti National Park",
    "climate": "Tropical along the coast to semi-arid in the interior plateau",
    "funFact": "Mount Kilimanjaro in Tanzania is the highest free-standing mountain in the world at 5,895 meters above sea level.",
    "neighbours": [
      "Kenya",
      "Uganda",
      "Rwanda",
      "Burundi",
      "Democratic Republic of the Congo",
      "Zambia",
      "Malawi",
      "Mozambique"
    ],
    "relatedSlugs": [
      "kenya",
      "uganda",
      "rwanda",
      "burundi",
      "congo",
      "zambia"
    ]
  },
  {
    "id": "th",
    "name": "Thailand",
    "slug": "thailand",
    "iso2": "TH",
    "iso3": "THA",
    "capital": "Bangkok",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 15.87,
      "lng": 100.9925
    },
    "population": "71 million",
    "areaKm2": 513120,
    "currency": "Thai Baht (THB)",
    "languages": "Thai",
    "flag": "🇹🇭",
    "majorCities": [
      "Bangkok",
      "Nonthaburi",
      "Nakhon Ratchasima",
      "Chiang Mai",
      "Phuket"
    ],
    "geography": "Central Chao Phraya river plain surrounded by northern mountains, the Khorat Plateau, and the southern Malay Peninsula.",
    "landmark": "Grand Palace of Bangkok & Wat Arun",
    "climate": "Tropical wet and dry with monsoon seasons",
    "funFact": "Thailand is the only Southeast Asian nation that was never colonized by a European power.",
    "neighbours": [
      "Myanmar",
      "Laos",
      "Cambodia",
      "Malaysia"
    ],
    "relatedSlugs": [
      "myanmar",
      "laos",
      "cambodia",
      "malaysia"
    ]
  },
  {
    "id": "tl",
    "name": "Timor-Leste",
    "slug": "timor-leste",
    "iso2": "TL",
    "iso3": "TLS",
    "capital": "Dili",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": -8.8742,
      "lng": 125.7275
    },
    "population": "1.35 million",
    "areaKm2": 14874,
    "currency": "US Dollar (USD)",
    "languages": "Tetum, Portuguese",
    "flag": "🇹🇱",
    "majorCities": [
      "Dili",
      "Baucau",
      "Maliana",
      "Suai"
    ],
    "geography": "Occupies the eastern half of Timor island in the Lesser Sunda Islands, characterized by a rugged central mountain ridge.",
    "landmark": "Cristo Rei of Dili & Mount Ramelau",
    "climate": "Tropical with high temperatures and distinct wet and dry monsoonal periods",
    "funFact": "Timor-Leste was the first new sovereign state of the 21st century, gaining independence in May 2002.",
    "neighbours": [
      "Indonesia",
      "Australia"
    ],
    "relatedSlugs": [
      "indonesia",
      "australia"
    ]
  },
  {
    "id": "tg",
    "name": "Togo",
    "slug": "togo",
    "iso2": "TG",
    "iso3": "TGO",
    "capital": "Lomé",
    "region": "Africa",
    "subregion": "Western Africa",
    "coordinates": {
      "lat": 8.6195,
      "lng": 0.8248
    },
    "population": "9 million",
    "areaKm2": 56785,
    "currency": "West African CFA Franc (XOF)",
    "languages": "French",
    "flag": "🇹🇬",
    "majorCities": [
      "Lomé",
      "Sokodé",
      "Kara",
      "Kpalimé"
    ],
    "geography": "Narrow strip of land stretching north from the Gulf of Guinea through hills and savannahs to Burkina Faso.",
    "landmark": "Koutammakou Cultural Landscape",
    "climate": "Tropical with two rainy seasons in the south and one in the north",
    "funFact": "The Koutammakou landscape in northern Togo is famed for its mud tower-houses (Takienta), symbols of Batammariba culture.",
    "neighbours": [
      "Ghana",
      "Benin",
      "Burkina Faso"
    ],
    "relatedSlugs": [
      "ghana",
      "benin",
      "burkina-faso"
    ]
  },
  {
    "id": "to",
    "name": "Tonga",
    "slug": "tonga",
    "iso2": "TO",
    "iso3": "TON",
    "capital": "Nuku'alofa",
    "region": "Oceania",
    "subregion": "Polynesia",
    "coordinates": {
      "lat": -21.1789,
      "lng": -175.1982
    },
    "population": "106,000",
    "areaKm2": 747,
    "currency": "Tongan Paʻanga (TOP)",
    "languages": "Tongan, English",
    "flag": "🇹🇴",
    "majorCities": [
      "Nuku'alofa",
      "Neiafu",
      "Haveluloto",
      "Vaini"
    ],
    "geography": "Polynesian kingdom of 171 islands (45 inhabited) stretching north-south across the South Pacific.",
    "landmark": "Haʻamonga ʻa Maui Trilithon",
    "climate": "Subtropical marine climate with warm temperatures throughout the year",
    "funFact": "Tonga is the only sovereign monarchy in the Pacific and was never colonized by a foreign power.",
    "neighbours": [
      "Fiji",
      "Samoa",
      "Niue"
    ],
    "relatedSlugs": [
      "fiji",
      "samoa"
    ]
  },
  {
    "id": "tt",
    "name": "Trinidad and Tobago",
    "slug": "trinidad-and-tobago",
    "iso2": "TT",
    "iso3": "TTO",
    "capital": "Port of Spain",
    "region": "Americas",
    "subregion": "Caribbean",
    "coordinates": {
      "lat": 10.6918,
      "lng": -61.2225
    },
    "population": "1.4 million",
    "areaKm2": 5128,
    "currency": "Trinidad and Tobago Dollar (TTD)",
    "languages": "English",
    "flag": "🇹🇹",
    "majorCities": [
      "Chaguanas",
      "San Fernando",
      "Port of Spain",
      "Arima"
    ],
    "geography": "Southernmost island nation of the West Indies, situated just 11 kilometers off the northeastern coast of Venezuela.",
    "landmark": "Pitch Lake & Pigeon Point",
    "climate": "Tropical with warm rainy summers and cooler trade-wind breezes",
    "funFact": "Pitch Lake in Trinidad is the largest natural deposit of asphalt in the world, spanning about 100 acres.",
    "neighbours": [
      "Venezuela",
      "Grenada",
      "Barbados"
    ],
    "relatedSlugs": [
      "venezuela",
      "grenada",
      "barbados"
    ]
  },
  {
    "id": "tn",
    "name": "Tunisia",
    "slug": "tunisia",
    "iso2": "TN",
    "iso3": "TUN",
    "capital": "Tunis",
    "region": "Africa",
    "subregion": "Northern Africa",
    "coordinates": {
      "lat": 33.8869,
      "lng": 9.5375
    },
    "population": "12 million",
    "areaKm2": 163610,
    "currency": "Tunisian Dinar (TND)",
    "languages": "Arabic",
    "flag": "🇹🇳",
    "majorCities": [
      "Tunis",
      "Sfax",
      "Sousse",
      "Kairouan",
      "Bizerte"
    ],
    "geography": "Northernmost country in Africa, situated between the Atlas Mountains and the Mediterranean, transitioning to the Sahara.",
    "landmark": "Amphitheatre of El Jem & Ruins of Carthage",
    "climate": "Mediterranean in the north; hot arid desert in the south",
    "funFact": "The historic Phoenician maritime empire of Carthage was centered near modern-day Tunis.",
    "neighbours": [
      "Algeria",
      "Libya",
      "Italy"
    ],
    "relatedSlugs": [
      "algeria",
      "libya",
      "italy"
    ]
  },
  {
    "id": "tr",
    "name": "Turkey",
    "slug": "turkey",
    "iso2": "TR",
    "iso3": "TUR",
    "capital": "Ankara",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 38.9637,
      "lng": 35.2433
    },
    "population": "85 million",
    "areaKm2": 783562,
    "currency": "Turkish Lira (TRY)",
    "languages": "Turkish",
    "flag": "🇹🇷",
    "majorCities": [
      "Istanbul",
      "Ankara",
      "Izmir",
      "Bursa",
      "Antalya"
    ],
    "geography": "Transcontinental nation bridging Southeastern Europe and Western Asia across the Bosphorus and Dardanelles straits.",
    "landmark": "Hagia Sophia & Cappadocia Fairy Chimneys",
    "climate": "Mediterranean along Aegean/Mediterranean; continental interior plateau",
    "funFact": "Istanbul is the only major metropolis in the world located across two continents simultaneously (Europe and Asia).",
    "neighbours": [
      "Greece",
      "Bulgaria",
      "Georgia",
      "Armenia",
      "Azerbaijan",
      "Iran",
      "Iraq",
      "Syria"
    ],
    "relatedSlugs": [
      "greece",
      "bulgaria",
      "georgia",
      "armenia",
      "azerbaijan",
      "iran"
    ]
  },
  {
    "id": "tm",
    "name": "Turkmenistan",
    "slug": "turkmenistan",
    "iso2": "TM",
    "iso3": "TKM",
    "capital": "Ashgabat",
    "region": "Asia",
    "subregion": "Central Asia",
    "coordinates": {
      "lat": 38.9697,
      "lng": 59.5563
    },
    "population": "6.4 million",
    "areaKm2": 488100,
    "currency": "Turkmenistan Manat (TMT)",
    "languages": "Turkmen",
    "flag": "🇹🇲",
    "majorCities": [
      "Ashgabat",
      "Türkmenabat",
      "Daşoguz",
      "Mary"
    ],
    "geography": "Central Asian country bordered by the Caspian Sea, with over 70% of its territory covered by the Karakum Desert.",
    "landmark": "Darvaza Gas Crater (Door to Hell)",
    "climate": "Subtropical desert with hot summers and freezing continental winters",
    "funFact": "The Darvaza Gas Crater, a natural subterranean methane pit, has been burning continuously in the desert since 1971.",
    "neighbours": [
      "Kazakhstan",
      "Uzbekistan",
      "Afghanistan",
      "Iran"
    ],
    "relatedSlugs": [
      "kazakhstan",
      "uzbekistan",
      "afghanistan",
      "iran"
    ]
  },
  {
    "id": "tv",
    "name": "Tuvalu",
    "slug": "tuvalu",
    "iso2": "TV",
    "iso3": "TUV",
    "capital": "Funafuti",
    "region": "Oceania",
    "subregion": "Polynesia",
    "coordinates": {
      "lat": -7.1095,
      "lng": 177.6493
    },
    "population": "11,200",
    "areaKm2": 26,
    "currency": "Tuvaluan Dollar, Australian Dollar",
    "languages": "Tuvaluan, English",
    "flag": "🇹🇻",
    "majorCities": [
      "Funafuti",
      "Asau",
      "Togataloto"
    ],
    "geography": "Pacific atoll nation consisting of three reef islands and six coral atolls midway between Hawaii and Australia.",
    "landmark": "Funafuti Marine Conservation Area",
    "climate": "Tropical maritime with consistent temperatures around 30°C",
    "funFact": "Tuvalu earned millions of dollars by licensing its top-level internet country domain name, \".tv\", to international tech companies.",
    "neighbours": [
      "Kiribati",
      "Fiji",
      "Samoa",
      "Wallis and Futuna"
    ],
    "relatedSlugs": [
      "kiribati",
      "fiji",
      "samoa"
    ]
  },
  {
    "id": "ug",
    "name": "Uganda",
    "slug": "uganda",
    "iso2": "UG",
    "iso3": "UGA",
    "capital": "Kampala",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": 1.3733,
      "lng": 32.2903
    },
    "population": "47 million",
    "areaKm2": 241550,
    "currency": "Ugandan Shilling (UGX)",
    "languages": "English, Swahili",
    "flag": "🇺🇬",
    "majorCities": [
      "Kampala",
      "Nansana",
      "Kira",
      "Mbarara",
      "Jinja"
    ],
    "geography": "Landlocked East African nation located on the East African plateau, bordering Lake Victoria and the Rwenzori Mountains.",
    "landmark": "Bwindi Impenetrable Forest & Murchison Falls",
    "climate": "Tropical equatorial moderated by altitude with two rainy seasons",
    "funFact": "Winston Churchill famously dubbed Uganda the \"Pearl of Africa\" in 1908 due to its vibrant landscape and climate.",
    "neighbours": [
      "South Sudan",
      "Kenya",
      "Tanzania",
      "Rwanda",
      "Democratic Republic of the Congo"
    ],
    "relatedSlugs": [
      "south-sudan",
      "kenya",
      "tanzania",
      "rwanda",
      "congo"
    ]
  },
  {
    "id": "ua",
    "name": "Ukraine",
    "slug": "ukraine",
    "iso2": "UA",
    "iso3": "UKR",
    "capital": "Kyiv",
    "region": "Europe",
    "subregion": "Eastern Europe",
    "coordinates": {
      "lat": 48.3794,
      "lng": 31.1656
    },
    "population": "38 million",
    "areaKm2": 603500,
    "currency": "Ukrainian Hryvnia (UAH)",
    "languages": "Ukrainian",
    "flag": "🇺🇦",
    "majorCities": [
      "Kyiv",
      "Kharkiv",
      "Odesa",
      "Dnipro",
      "Lviv"
    ],
    "geography": "Largest country entirely within Europe, dominated by fertile agricultural plains, the Dnieper River, and Black Sea coast.",
    "landmark": "Saint Sophia Cathedral & Kyiv Pechersk Lavra",
    "climate": "Mostly temperate continental with Mediterranean conditions on southern coast",
    "funFact": "Ukraine is known as the \"Breadbasket of Europe\" due to having roughly 25% of the world’s most fertile black soil (chernozem).",
    "neighbours": [
      "Poland",
      "Slovakia",
      "Hungary",
      "Romania",
      "Moldova",
      "Russia",
      "Belarus"
    ],
    "relatedSlugs": [
      "poland",
      "slovakia",
      "hungary",
      "oman",
      "moldova",
      "russia"
    ]
  },
  {
    "id": "ae",
    "name": "United Arab Emirates",
    "slug": "united-arab-emirates",
    "iso2": "AE",
    "iso3": "ARE",
    "capital": "Abu Dhabi",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 23.4241,
      "lng": 53.8478
    },
    "population": "9.9 million",
    "areaKm2": 83600,
    "currency": "UAE Dirham (AED)",
    "languages": "Arabic",
    "flag": "🇦🇪",
    "majorCities": [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Al Ain",
      "Ajman"
    ],
    "geography": "Federation of seven emirates on the Arabian Peninsula, fronting the Persian Gulf with desert plains and coastal salt flats.",
    "landmark": "Burj Khalifa & Sheikh Zayed Grand Mosque",
    "climate": "Hot desert climate with sunny skies year-round and very mild winters",
    "funFact": "The Burj Khalifa in Dubai is the world’s tallest human-made structure, soaring 828 meters into the sky.",
    "neighbours": [
      "Saudi Arabia",
      "Oman",
      "Qatar"
    ],
    "relatedSlugs": [
      "saudi-arabia",
      "oman",
      "qatar"
    ]
  },
  {
    "id": "gb",
    "name": "United Kingdom",
    "slug": "united-kingdom",
    "iso2": "GB",
    "iso3": "GBR",
    "capital": "London",
    "region": "Europe",
    "subregion": "Northern Europe",
    "coordinates": {
      "lat": 55.3781,
      "lng": -3.436
    },
    "population": "67 million",
    "areaKm2": 242495,
    "currency": "British Pound (GBP)",
    "languages": "English",
    "flag": "🇬🇧",
    "majorCities": [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Edinburgh",
      "Liverpool"
    ],
    "geography": "Island nation in northwestern Europe comprising England, Scotland, Wales, and Northern Ireland.",
    "landmark": "Big Ben & Stonehenge",
    "climate": "Temperate maritime with frequent rainfall and mild seasonal variations",
    "funFact": "Stonehenge on Salisbury Plain is an iconic prehistoric monument constructed in stages between 3000 and 2000 BC.",
    "neighbours": [
      "Ireland",
      "France"
    ],
    "relatedSlugs": [
      "ireland",
      "france"
    ]
  },
  {
    "id": "us",
    "name": "United States",
    "slug": "united-states",
    "iso2": "US",
    "iso3": "USA",
    "capital": "Washington D.C.",
    "region": "Americas",
    "subregion": "Northern America",
    "coordinates": {
      "lat": 37.0902,
      "lng": -95.7129
    },
    "population": "333 million",
    "areaKm2": 9833517,
    "currency": "US Dollar (USD)",
    "languages": "English",
    "flag": "🇺🇸",
    "majorCities": [
      "New York City",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia"
    ],
    "geography": "Spans 50 states from the Atlantic to Pacific, from Arctic Alaska to tropical Hawaii, with vast central plains and mountain ranges.",
    "landmark": "Statue of Liberty & Grand Canyon",
    "climate": "Varies from humid continental to subtropical, arid desert, Mediterranean, and polar",
    "funFact": "The Grand Canyon in Arizona is over 446 kilometers long and up to 1.8 kilometers deep, carved by the Colorado River.",
    "neighbours": [
      "Canada",
      "Mexico",
      "Bahamas",
      "Cuba",
      "Russia"
    ],
    "relatedSlugs": [
      "canada",
      "mexico",
      "bahamas",
      "cuba",
      "russia"
    ]
  },
  {
    "id": "uy",
    "name": "Uruguay",
    "slug": "uruguay",
    "iso2": "UY",
    "iso3": "URY",
    "capital": "Montevideo",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": -32.5228,
      "lng": -55.7658
    },
    "population": "3.4 million",
    "areaKm2": 176215,
    "currency": "Uruguayan Peso (UYU)",
    "languages": "Spanish",
    "flag": "🇺🇾",
    "majorCities": [
      "Montevideo",
      "Salto",
      "Ciudad de la Costa",
      "Paysandú"
    ],
    "geography": "South American Atlantic nation dominated by rolling plains (pampas) and low hill ranges along the Río de la Plata estuary.",
    "landmark": "Casapueblo & Punta del Este",
    "climate": "Temperate with uniform rainfall throughout the year and warm summers",
    "funFact": "Uruguay hosted and won the very first FIFA World Cup tournament in 1930 in Montevideo.",
    "neighbours": [
      "Argentina",
      "Brazil"
    ],
    "relatedSlugs": [
      "argentina",
      "brazil"
    ]
  },
  {
    "id": "uz",
    "name": "Uzbekistan",
    "slug": "uzbekistan",
    "iso2": "UZ",
    "iso3": "UZB",
    "capital": "Tashkent",
    "region": "Asia",
    "subregion": "Central Asia",
    "coordinates": {
      "lat": 41.3775,
      "lng": 64.5853
    },
    "population": "36 million",
    "areaKm2": 447400,
    "currency": "Uzbekistani Som (UZS)",
    "languages": "Uzbek",
    "flag": "🇺🇿",
    "majorCities": [
      "Tashkent",
      "Samarkand",
      "Namangan",
      "Andijan",
      "Bukhara"
    ],
    "geography": "Doubly landlocked Central Asian nation featuring the Kyzylkum Desert, fertile Fergana Valley, and shrinking Aral Sea basin.",
    "landmark": "Registan Square in Samarkand",
    "climate": "Extreme continental with hot cloudless summers and chilly winters",
    "funFact": "Samarkand on the ancient Silk Road was an imperial capital renowned for its turquoise domes and Islamic architecture.",
    "neighbours": [
      "Kazakhstan",
      "Kyrgyzstan",
      "Tajikistan",
      "Afghanistan",
      "Turkmenistan"
    ],
    "relatedSlugs": [
      "kazakhstan",
      "kyrgyzstan",
      "tajikistan",
      "afghanistan",
      "turkmenistan"
    ]
  },
  {
    "id": "vu",
    "name": "Vanuatu",
    "slug": "vanuatu",
    "iso2": "VU",
    "iso3": "VUT",
    "capital": "Port Vila",
    "region": "Oceania",
    "subregion": "Melanesia",
    "coordinates": {
      "lat": -15.3767,
      "lng": 166.9592
    },
    "population": "320,000",
    "areaKm2": 12189,
    "currency": "Vanuatu Vatu (VUV)",
    "languages": "Bislama, English, French",
    "flag": "🇻🇺",
    "majorCities": [
      "Port Vila",
      "Luganville",
      "Norsup",
      "Isangel"
    ],
    "geography": "South Pacific volcanic archipelago of roughly 80 islands forming a Y-shape across 1,300 kilometers.",
    "landmark": "Mount Yasur Active Volcano",
    "climate": "Tropical maritime with high humidity and cyclones in summer months",
    "funFact": "Land diving (Naghol) on Pentecost Island in Vanuatu is the ancient ancestral origin of modern bungee jumping.",
    "neighbours": [
      "Fiji",
      "Solomon Islands",
      "New Caledonia"
    ],
    "relatedSlugs": [
      "fiji",
      "solomon-islands"
    ]
  },
  {
    "id": "ve",
    "name": "Venezuela",
    "slug": "venezuela",
    "iso2": "VE",
    "iso3": "VEN",
    "capital": "Caracas",
    "region": "Americas",
    "subregion": "South America",
    "coordinates": {
      "lat": 6.4238,
      "lng": -66.5897
    },
    "population": "29 million",
    "areaKm2": 916445,
    "currency": "Venezuelan Bolívar (VES)",
    "languages": "Spanish",
    "flag": "🇻🇪",
    "majorCities": [
      "Caracas",
      "Maracaibo",
      "Valencia",
      "Barquisimeto",
      "Ciudad Guayana"
    ],
    "geography": "Northern South American nation with Caribbean coastlines, the northern Andes, Orinoco river basin, and Guiana Highlands.",
    "landmark": "Angel Falls (Salto Ángel)",
    "climate": "Tropical, ranging from humid lowlands to alpine cool in the Andes",
    "funFact": "Angel Falls in southeastern Venezuela is the world’s highest uninterrupted waterfall, falling 979 meters from Auyán-tepui.",
    "neighbours": [
      "Colombia",
      "Brazil",
      "Guyana",
      "Trinidad and Tobago"
    ],
    "relatedSlugs": [
      "colombia",
      "brazil",
      "guyana",
      "trinidad-and-tobago"
    ]
  },
  {
    "id": "vn",
    "name": "Vietnam",
    "slug": "vietnam",
    "iso2": "VN",
    "iso3": "VNM",
    "capital": "Hanoi",
    "region": "Asia",
    "subregion": "South-Eastern Asia",
    "coordinates": {
      "lat": 14.0583,
      "lng": 108.2772
    },
    "population": "98 million",
    "areaKm2": 331212,
    "currency": "Vietnamese Dong (VND)",
    "languages": "Vietnamese",
    "flag": "🇻🇳",
    "majorCities": [
      "Ho Chi Minh City",
      "Hanoi",
      "Da Nang",
      "Hai Phong",
      "Can Tho"
    ],
    "geography": "S-shaped Southeast Asian nation along the South China Sea, centered on the Red River and Mekong deltas and Annamite Range.",
    "landmark": "Hạ Long Bay & Hội An Ancient Town",
    "climate": "Tropical in the south, humid subtropical in the north with seasonal monsoons",
    "funFact": "Hạ Long Bay in northern Vietnam features thousands of towering limestone karsts and islets rising dramatically from emerald waters.",
    "neighbours": [
      "China",
      "Laos",
      "Cambodia"
    ],
    "relatedSlugs": [
      "china",
      "laos",
      "cambodia"
    ]
  },
  {
    "id": "ye",
    "name": "Yemen",
    "slug": "yemen",
    "iso2": "YE",
    "iso3": "YEM",
    "capital": "Sana'a (constitutional), Aden (temporary)",
    "region": "Asia",
    "subregion": "Western Asia",
    "coordinates": {
      "lat": 15.5527,
      "lng": 48.5164
    },
    "population": "33 million",
    "areaKm2": 527968,
    "currency": "Yemeni Rial (YER)",
    "languages": "Arabic",
    "flag": "🇾🇪",
    "majorCities": [
      "Sana'a",
      "Aden",
      "Taiz",
      "Al Hudaydah",
      "Ibb"
    ],
    "geography": "Occupies the southwestern tip of the Arabian Peninsula, fronting the Red Sea and Gulf of Aden, with steep terraced highlands.",
    "landmark": "Old City of Sana'a & Socotra Island",
    "climate": "Mostly desert with hot arid conditions; temperate in the western highlands",
    "funFact": "The isolated Yemeni island of Socotra is famous for its alien-like Dragon’s Blood trees found nowhere else on Earth.",
    "neighbours": [
      "Saudi Arabia",
      "Oman",
      "Djibouti",
      "Eritrea",
      "Somalia"
    ],
    "relatedSlugs": [
      "saudi-arabia",
      "oman",
      "djibouti",
      "eritrea",
      "mali"
    ]
  },
  {
    "id": "zm",
    "name": "Zambia",
    "slug": "zambia",
    "iso2": "ZM",
    "iso3": "ZMB",
    "capital": "Lusaka",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -13.1339,
      "lng": 27.8493
    },
    "population": "20 million",
    "areaKm2": 752618,
    "currency": "Zambian Kwacha (ZMW)",
    "languages": "English",
    "flag": "🇿🇲",
    "majorCities": [
      "Lusaka",
      "Kitwe",
      "Ndola",
      "Kabwe",
      "Chingola"
    ],
    "geography": "Landlocked southern African plateau country bisected by the Zambezi and Kafue rivers, home to Victoria Falls.",
    "landmark": "Victoria Falls (Mosi-oa-Tunya)",
    "climate": "Humid subtropical or tropical savanna climate with three seasons",
    "funFact": "Victoria Falls on the Zambezi River between Zambia and Zimbabwe forms the largest curtain of falling water in the world.",
    "neighbours": [
      "Democratic Republic of the Congo",
      "Tanzania",
      "Malawi",
      "Mozambique",
      "Zimbabwe",
      "Botswana",
      "Namibia",
      "Angola"
    ],
    "relatedSlugs": [
      "congo",
      "tanzania",
      "malawi",
      "mozambique",
      "zimbabwe",
      "botswana"
    ]
  },
  {
    "id": "zw",
    "name": "Zimbabwe",
    "slug": "zimbabwe",
    "iso2": "ZW",
    "iso3": "ZWE",
    "capital": "Harare",
    "region": "Africa",
    "subregion": "Eastern Africa",
    "coordinates": {
      "lat": -19.0154,
      "lng": 29.1549
    },
    "population": "16 million",
    "areaKm2": 390757,
    "currency": "Zimbabwe Gold (ZiG), US Dollar",
    "languages": "16 official languages including Shona, Ndebele, English",
    "flag": "🇿🇼",
    "majorCities": [
      "Harare",
      "Bulawayo",
      "Chitungwiza",
      "Mutare",
      "Gweru"
    ],
    "geography": "Landlocked high-plateau country in southern Africa bounded by the Zambezi and Limpopo river valleys.",
    "landmark": "Great Zimbabwe Ruins & Victoria Falls",
    "climate": "Subtropical climate moderated by high altitude elevation",
    "funFact": "The Great Zimbabwe stone ruins are the largest collection of ancient stone structures in sub-Saharan Africa.",
    "neighbours": [
      "Zambia",
      "Mozambique",
      "South Africa",
      "Botswana"
    ],
    "relatedSlugs": [
      "zambia",
      "mozambique",
      "south-africa",
      "botswana"
    ]
  }
];
