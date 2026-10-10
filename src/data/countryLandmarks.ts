import { COUNTRIES } from "./countryCatalog";

export interface CountryLandmark {
  readonly countryId: string;
  readonly countryName: string;
  readonly landmarkName: string;
  readonly location: string;
  readonly caption: string;
  readonly imagePath?: string;
}

/**
 * Curated iconic landmark registry for countries worldwide.
 * Follows the 16:9 cartoonish travel illustration aesthetic.
 */
export const CURATED_LANDMARKS: Record<string, { landmarkName: string; location: string; caption: string; imagePath?: string }> = {
  // Asia
  IN: {
    landmarkName: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    caption: "The timeless ivory-white marble mausoleum on the Yamuna river.",
  },
  JP: {
    landmarkName: "Mount Fuji & Chureito Pagoda",
    location: "Fujiyoshida, Yamanashi",
    caption: "Snow-capped peak framed by cherry blossoms and vermilion wood.",
  },
  CN: {
    landmarkName: "The Great Wall of China",
    location: "Mutianyu, Beijing",
    caption: "Ancient serpentine stone ramparts winding through green ridge peaks.",
  },
  SG: {
    landmarkName: "Marina Bay Sands & Supertrees",
    location: "Marina Bay, Singapore",
    caption: "Futuristic vertical gardens and illuminated skyline by the bay.",
  },
  TH: {
    landmarkName: "Wat Arun & Grand Palace",
    location: "Bangkok",
    caption: "The Temple of Dawn standing proud beside the Chao Phraya river.",
  },
  VN: {
    landmarkName: "Ha Long Bay",
    location: "Quảng Ninh",
    caption: "Emerald waters and thousands of towering limestone islands.",
  },
  ID: {
    landmarkName: "Borobudur Temple",
    location: "Magelang, Central Java",
    caption: "Ancient 9th-century Buddhist stupas greeting misty volcanic dawns.",
  },
  MY: {
    landmarkName: "Petronas Twin Towers",
    location: "Kuala Lumpur",
    caption: "Twin spire architecture glowing brilliantly into the tropical evening.",
  },
  KR: {
    landmarkName: "Gyeongbokgung Palace",
    location: "Seoul",
    caption: "Grand Joseon dynasty pavilions with Bukhansan mountains behind.",
  },
  AE: {
    landmarkName: "Burj Khalifa & The Fountains",
    location: "Downtown Dubai",
    caption: "The world's tallest tower rising over illuminated desert fountains.",
  },
  SA: {
    landmarkName: "Al-Ula & Hegra",
    location: "Madinah Region",
    caption: "Monumental Nabataean tombs carved straight into sandstone cliffs.",
  },
  JO: {
    landmarkName: "The Treasury at Petra",
    location: "Ma'an Governorate",
    caption: "The rose-red carved Hellenistic facade hidden in the desert gorge.",
  },
  LK: {
    landmarkName: "Sigiriya Lion Rock Fortress",
    location: "Matale District",
    caption: "Ancient sky fortress perched atop an sheer 200-meter monolith.",
  },
  NP: {
    landmarkName: "Mount Everest & Swayambhunath",
    location: "Solukhumbu & Kathmandu",
    caption: "The roof of the world beneath fluttering Buddhist prayer flags.",
  },
  MV: {
    landmarkName: "Malé Atoll & Overwater Villas",
    location: "Kaafu Atoll",
    caption: "Crystal turquoise lagoons with vibrant coral rings and palms.",
  },
  TR: {
    landmarkName: "Hagia Sophia & Bosphorus",
    location: "Istanbul",
    caption: "Historic domes and minarets bridging Europe and Asia.",
  },
  KH: {
    landmarkName: "Angkor Wat",
    location: "Siem Reap",
    caption: "The world's largest temple complex emerging at morning sunrise.",
  },
  MM: {
    landmarkName: "Ancient Temples of Bagan",
    location: "Mandalay Region",
    caption: "Thousands of terracotta pagodas under morning hot air balloons.",
  },
  QA: {
    landmarkName: "Museum of Islamic Art",
    location: "Doha",
    caption: "Geometric limestone architecture framing the Arabian Gulf.",
  },
  OM: {
    landmarkName: "Sultan Qaboos Grand Mosque",
    location: "Muscat",
    caption: "Pristine white marble courtyards and grand desert minarets.",
  },
  TW: {
    landmarkName: "Taipei 101 & Elephant Mountain",
    location: "Taipei",
    caption: "Bamboo-inspired skyscraper towering over lush subtropical hills.",
  },
  HK: {
    landmarkName: "Victoria Peak & Harbour",
    location: "Hong Kong",
    caption: "Spectacular harbour panoramas with iconic green Star Ferries.",
  },

  // Europe
  FR: {
    landmarkName: "The Eiffel Tower",
    location: "Paris",
    caption: "Iron lattice monument watching over the Seine and Parisian boulevards.",
  },
  DE: {
    landmarkName: "Neuschwanstein Castle",
    location: "Schwangau, Bavaria",
    caption: "Fairy-tale Romanesque revival castle among Bavarian alpine pines.",
  },
  IT: {
    landmarkName: "The Colosseum",
    location: "Rome",
    caption: "Iconic flavian amphitheatre holding two millennia of history.",
  },
  GB: {
    landmarkName: "Big Ben & Westminster",
    location: "London, England",
    caption: "The Great Bell of the clock tower above the River Thames.",
  },
  ES: {
    landmarkName: "Basílica de la Sagrada Família",
    location: "Barcelona, Catalonia",
    caption: "Gaudí’s magnificent organic masterwork reaching toward the sky.",
  },
  NL: {
    landmarkName: "Zaanse Schans Windmills",
    location: "Zaandam, North Holland",
    caption: "Historic green wooden windmills and colorful tulip meadows.",
  },
  CH: {
    landmarkName: "The Matterhorn",
    location: "Zermatt, Valais",
    caption: "The pyramid peak of the Swiss Alps mirrored in alpine lakes.",
  },
  GR: {
    landmarkName: "The Parthenon on the Acropolis",
    location: "Athens",
    caption: "Classical marble columns standing proud over the Aegean sea.",
  },
  PT: {
    landmarkName: "Belém Tower & Sintra",
    location: "Lisbon & Sintra",
    caption: "Maritime Manueline fortress on the Tagus and pastel mountain palaces.",
  },
  AT: {
    landmarkName: "Hallstatt & Schönbrunn",
    location: "Salzkammergut & Vienna",
    caption: "Fairytale lakeside village tucked beneath soaring Dachstein peaks.",
  },
  BE: {
    landmarkName: "The Grand-Place",
    location: "Brussels",
    caption: "Ornate guildhalls with golden baroque facades and cobblestone squares.",
  },
  CZ: {
    landmarkName: "Charles Bridge & Prague Castle",
    location: "Prague, Bohemia",
    caption: "Gothic stone bridge with baroque statues across the Vltava river.",
  },
  IE: {
    landmarkName: "Cliffs of Moher",
    location: "County Clare",
    caption: "Towering sea cliffs plunging straight into the wild Atlantic waves.",
  },
  NO: {
    landmarkName: "Geirangerfjord",
    location: "Møre og Romsdal",
    caption: "Deep emerald fjord carved with roaring waterfalls and alpine peaks.",
  },
  SE: {
    landmarkName: "Gamla Stan",
    location: "Stockholm",
    caption: "Ochre and saffron medieval buildings across the Baltic archipelago.",
  },
  DK: {
    landmarkName: "Nyhavn Waterfront",
    location: "Copenhagen",
    caption: "Brightly colored 17th-century townhouses and wooden sailing ships.",
  },
  FI: {
    landmarkName: "Santa Claus Village & Arctic Aurora",
    location: "Rovaniemi, Lapland",
    caption: "Snowy pine forests bathed in shimmering green northern lights.",
  },
  IS: {
    landmarkName: "Kirkjufell & Black Sand Beaches",
    location: "Grundarfjörður",
    caption: "Church Mountain with twin waterfalls and dramatic volcanic shores.",
  },
  HR: {
    landmarkName: "Dubrovnik Old Town Walls",
    location: "Dubrovnik",
    caption: "Terracotta roofs fortified against the sparkling sapphire Adriatic.",
  },
  HU: {
    landmarkName: "Hungarian Parliament Building",
    location: "Budapest",
    caption: "Gothic revival palace reflected along the Danube promenade.",
  },
  VA: {
    landmarkName: "St. Peter's Basilica",
    location: "Vatican City",
    caption: "Renaissance dome and Bernini's sweeping colonnade at the heart of Rome.",
  },
  MC: {
    landmarkName: "Casino de Monte-Carlo & Port",
    location: "Monte Carlo",
    caption: "Beaux-Arts grandeur overlooking superyachts on the Riviera coast.",
  },

  // Americas
  US: {
    landmarkName: "The Golden Gate Bridge",
    location: "San Francisco, California",
    caption: "International orange suspension towers rising above ocean fog.",
  },
  CA: {
    landmarkName: "Banff & Lake Louise",
    location: "Alberta",
    caption: "Turquoise glacier-fed waters framed by rugged Canadian Rockies.",
  },
  BR: {
    landmarkName: "Christ the Redeemer",
    location: "Rio de Janeiro",
    caption: "The open-armed icon atop Corcovado mountain overlooking Copacabana.",
  },
  MX: {
    landmarkName: "El Castillo at Chichén Itzá",
    location: "Yucatán Peninsula",
    caption: "Monumental stepped pyramid of ancient Maya astronomical genius.",
  },
  AR: {
    landmarkName: "Iguazu Falls",
    location: "Misiones Province",
    caption: "Roaring semicircular cascade through lush subtropical rainforest.",
  },
  PE: {
    landmarkName: "Machu Picchu",
    location: "Cusco Region",
    caption: "The Lost Citadel of the Incas nestled in misty Andean peaks.",
  },
  CL: {
    landmarkName: "Moai of Easter Island",
    location: "Rapa Nui",
    caption: "Enigmatic megalithic stone statues gazing inward across the Pacific.",
  },
  CO: {
    landmarkName: "The Rock of Guatapé & Salento",
    location: "Antioquia & Quindío",
    caption: "Giant monolithic rock overlooking a scenic lake labyrinth.",
  },
  CR: {
    landmarkName: "Arenal Volcano",
    location: "Alajuela Province",
    caption: "Perfect stratovolcano cone surrounded by canopy cloud forests.",
  },
  CU: {
    landmarkName: "Old Havana & El Malecón",
    location: "Havana",
    caption: "Colorful vintage cars cruising the seafront boulevard with colonial arcades.",
  },
  JM: {
    landmarkName: "Dunn's River Falls",
    location: "Ocho Rios",
    caption: "Terraced limestone cascades emptying directly into the Caribbean Sea.",
  },
  BS: {
    landmarkName: "Paradise Island & Exuma Cays",
    location: "New Providence",
    caption: "Pristine white sandbars surrounded by crystal aqua shallows.",
  },

  // Africa
  EG: {
    landmarkName: "The Great Pyramids & Sphinx",
    location: "Giza Plateau, Cairo",
    caption: "Ancient wonders of the pharaohs standing timeless under golden sands.",
  },
  ZA: {
    landmarkName: "Table Mountain",
    location: "Cape Town",
    caption: "Flat-topped sandstone sentinel flanked by the Atlantic and Indian Oceans.",
  },
  KE: {
    landmarkName: "Maasai Mara Savanna",
    location: "Narok County",
    caption: "Acacia trees silhouetted against dramatic golden sunsets and wildlife.",
  },
  TZ: {
    landmarkName: "Mount Kilimanjaro",
    location: "Kilimanjaro Region",
    caption: "Africa's highest snow-capped peak rising gracefully above the plains.",
  },
  MA: {
    landmarkName: "Hassan II Mosque & Chefchaouen",
    location: "Casablanca & Rif Mountains",
    caption: "Intricate blue-washed mountain alleys and towering ocean minarets.",
  },
  NG: {
    landmarkName: "Zuma Rock",
    location: "Niger State / Abuja",
    caption: "Monolithic natural granite inselberg towering over Nigerian savanna.",
  },
  GH: {
    landmarkName: "Cape Coast Castle",
    location: "Central Region",
    caption: "Historic whitewashed fort on the Gulf of Guinea palms.",
  },
  MU: {
    landmarkName: "Le Morne Brabant & Seven Colours",
    location: "Black River District",
    caption: "Dramatic basaltic mountain fringed by turquoise underwater waterfalls.",
  },
  SC: {
    landmarkName: "Anse Source d'Argent",
    location: "La Digue Island",
    caption: "Famous sculpted granite boulders and powdery pinkish coral sand.",
  },

  // Oceania
  AU: {
    landmarkName: "Sydney Opera House",
    location: "Sydney, New South Wales",
    caption: "Distinctive sail roofs gleaming against the blue Sydney harbour.",
  },
  NZ: {
    landmarkName: "Milford Sound",
    location: "Fiordland, South Island",
    caption: "Towering Mitre Peak plunging straight into dark fjord waters.",
  },
  FJ: {
    landmarkName: "Mamanuca Coral Islands",
    location: "Fiji",
    caption: "Castaway palm islands encircled by living turquoise barrier reefs.",
  },
  WS: {
    landmarkName: "To Sua Ocean Trench",
    location: "Lotofaga, Upolu",
    caption: "Ancient lava blowhole swimming hole enveloped in lush jungle ferns.",
  },
};

/**
 * Returns the landmark for any country ID.
 * Falls back gracefully to country metadata from catalog if no custom landmark exists.
 */
export function getCountryLandmark(countryId: string): CountryLandmark {
  const code = countryId.toUpperCase();
  const curated = CURATED_LANDMARKS[code];
  const catalogEntry = COUNTRIES.find((c) => c.id === code);
  const countryName = catalogEntry?.name ?? countryId;

  if (curated) {
    return {
      countryId: code,
      countryName,
      landmarkName: curated.landmarkName,
      location: curated.location,
      caption: curated.caption,
      imagePath: curated.imagePath,
    };
  }

  // Graceful fallback for any of the 199 countries
  return {
    countryId: code,
    countryName,
    landmarkName: `${countryName} National Wonders`,
    location: catalogEntry?.continent ?? "World",
    caption: `Discover the breathtaking sights and unique heritage of ${countryName}.`,
    imagePath: undefined,
  };
}
