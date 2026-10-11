const fs = require('fs');

const catContent = fs.readFileSync('src/data/countryCatalog.ts', 'utf8');
const idMatches = [...catContent.matchAll(/"id":\s*"([A-Z]{2})",\s*"name":\s*"([^"]+)",\s*"continent":\s*"([^"]+)"/g)];
const countries = idMatches.map(m => ({ id: m[1], name: m[2], continent: m[3] }));

// Read existing curated landmarks
const lmContent = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const lmMatches = [...lmContent.matchAll(/([A-Z]{2}):\s*\{[^}]*landmarkName:\s*"([^"]+)"[^}]*location:\s*"([^"]+)"[^}]*caption:\s*"([^"]+)"[^}]*(?:imagePath:\s*"([^"]+)")?[^}]*\}/gs)];
const existing = {};
for (const m of lmMatches) {
  existing[m[1]] = {
    landmarkName: m[2],
    location: m[3],
    caption: m[4],
    imagePath: m[5] || undefined
  };
}

// Comprehensive landmark database for all 199 countries
const allLandmarksMap = {
  // Existing curated entries take precedence
  ...existing,

  // Asia
  AF: { landmarkName: "Blue Mosque & Band-e Amir", location: "Mazar-i-Sharif", caption: "Turquoise-tiled minarets and lapis lazuli lakes." },
  AM: { landmarkName: "Khor Virap & Mount Ararat", location: "Ararat Plain", caption: "Ancient stone monastery framing snow-capped Mount Ararat." },
  AZ: { landmarkName: "Flame Towers & Old City", location: "Baku", caption: "Futuristic illuminated towers rising over Caspian stone ramparts." },
  BH: { landmarkName: "Qal'at al-Bahrain", location: "Northern Governorate", caption: "Ancient Portuguese sandstone fortress along the Arabian Gulf." },
  BD: { landmarkName: "Sundarbans Mangrove Forest", location: "Khulna Division", caption: "Emerald tidal mangrove rivers and Royal Bengal tigers." },
  BT: { landmarkName: "Paro Taktsang (Tiger's Nest)", location: "Paro Valley", caption: "Himalayan Buddhist monastery clinging to sheer cliffside." },
  BN: { landmarkName: "Sultan Omar Ali Saifuddien Mosque", location: "Bandar Seri Begawan", caption: "Gleaming golden dome and lagoon ceremonial stone barge." },
  CY: { landmarkName: "Aphrodite's Rock & Paphos Harbor", location: "Kouklia", caption: "Mythical sea stacks and crystal Mediterranean waters." },
  GE: { landmarkName: "Gergeti Trinity Church", location: "Kazbegi, Stepantsminda", caption: "Solitary stone church beneath Mount Kazbek glaciers." },
  IQ: { landmarkName: "Ishtar Gate & Ziggurat of Ur", location: "Babylon & Dhi Qar", caption: "Lapis-glazed brick reliefs and ancient Mesopotamian ziggurat." },
  IL: { landmarkName: "Old City of Jerusalem & Dome of the Rock", location: "Jerusalem", caption: "Golden dome and ancient limestone walls bathed in sunset." },
  KZ: { landmarkName: "Charyn Canyon & Baiterek Tower", location: "Almaty & Astana", caption: "Ochre sandstone canyons and soaring steppes." },
  KW: { landmarkName: "Kuwait Towers", location: "Kuwait City", caption: "Iconic blue-green tiled spires over the Persian Gulf." },
  KG: { landmarkName: "Lake Issyk-Kul & Tian Shan Peaks", location: "Tian Shan", caption: "Endless alpine lake ringed by snowcapped mountain ranges." },
  LA: { landmarkName: "Kuang Si Falls & Luang Prabang", location: "Luang Prabang", caption: "Multi-tiered turquoise jungle waterfalls and Buddhist wats." },
  LB: { landmarkName: "Baalbek Roman Temples & Pigeon Rocks", location: "Beqaa & Beirut", caption: "Towering Roman granite colonnades and coastal sea arches." },
  MN: { landmarkName: "Genghis Khan Statue & Gobi Dunes", location: "Tsonjin Boldog & Gobi", caption: "Colossal stainless steel equestrian statue on the steppe." },
  KP: { landmarkName: "Mount Paektu & Heaven Lake", location: "Samjiyon", caption: "Sacred volcanic crater lake encircled by jagged granite crags." },
  PK: { landmarkName: "Badshahi Mosque & K2", location: "Lahore & Karakoram", caption: "Grand Mughal red sandstone arches and Karakoram giants." },
  PS: { landmarkName: "Church of the Nativity & Mar Saba", location: "Bethlehem & Judean Desert", caption: "Ancient cliff-hanging monastery over desert canyons." },
  PH: { landmarkName: "Chocolate Hills & El Nido", location: "Bohol & Palawan", caption: "Rolling emerald karst mounds and crystal limestone lagoons." },
  SY: { landmarkName: "Palmyra Colonnade & Krak des Chevaliers", location: "Tadmur & Homs", caption: "Ancient desert oasis arches and crusader castles." },
  TJ: { landmarkName: "Pamir Highway & Iskanderkul", location: "Fann Mountains", caption: "Glacial alpine lakes in the roof of the world." },
  TL: { landmarkName: "Cristo Rei & Atauro Coral Reefs", location: "Dili", caption: "Panoramic coastal statue and pristine underwater biodiversity." },
  TM: { landmarkName: "Darvaza Gas Crater & Ashgabat Marble", location: "Karakum Desert", caption: "The blazing 'Door to Hell' glowing in desert night." },
  UZ: { landmarkName: "Registan Square", location: "Samarkand", caption: "Majestic blue-tiled madrasahs and mosaic courtyards of the Silk Road." },
  YE: { landmarkName: "Old Walled City of Shibam & Socotra", location: "Hadramawt & Socotra", caption: "Ancient mudbrick skyscrapers and dragon blood trees." },

  // Europe
  AD: { landmarkName: "Casa de la Vall & Madriu-Perafita", location: "Andorra la Vella", caption: "Stone heritage parliament tucked in high Pyrenean valleys." },
  AL: { landmarkName: "Berat Ottoman Castle & Ksamil", location: "Berat & Vlorë", caption: "The city of a thousand windows overlooking turquoise Ionian bays." },
  BA: { landmarkName: "Stari Most (Old Bridge)", location: "Mostar", caption: "Suleiman the Magnificent's arching stone bridge over the Neretva." },
  BG: { landmarkName: "Rila Monastery & Alexander Nevsky", location: "Rila & Sofia", caption: "Striped Byzantine arcades nestled in high pine mountains." },
  BY: { landmarkName: "Mir Castle Complex", location: "Mir, Grodno", caption: "Gothic and Renaissance red-brick turrets mirrored in tranquil lakes." },
  EE: { landmarkName: "Tallinn Old Town & Alexander Nevsky", location: "Tallinn", caption: "Cobblestone medieval spires and red-tiled ramparts." },
  LV: { landmarkName: "Riga Old Town & House of the Black Heads", location: "Riga", caption: "Ornate Hanseatic facades and Art Nouveau boulevards." },
  LT: { landmarkName: "Trakai Island Castle", location: "Trakai", caption: "Red-brick fairy tale fortress situated on a misty lake." },
  LU: { landmarkName: "Bock Casemates & Adolphe Bridge", location: "Luxembourg City", caption: "Cliffside fortress ramparts spanning the deep Alzette gorge." },
  MT: { landmarkName: "Valletta Grand Harbour & Blue Grotto", location: "Valletta", caption: "Golden honey-limestone bastions surrounded by deep blue seas." },
  MD: { landmarkName: "Orheiul Vechi Monastery", location: "Trebujeni", caption: "Cave monastery carved into limestone ridges above the Răut river." },
  ME: { landmarkName: "Bay of Kotor & Our Lady of the Rocks", location: "Kotor", caption: "Deep fjord-like Adriatic bay flanked by dramatic limestone cliffs." },
  MK: { landmarkName: "Church of St. John at Kaneo", location: "Ohrid", caption: "Byzantine church perched high above crystal Lake Ohrid." },
  PL: { landmarkName: "Wawel Royal Castle & Main Square", location: "Kraków", caption: "Gothic towers and Renaissance courtyards beside the Vistula." },
  RO: { landmarkName: "Bran Castle (Dracula's Castle)", location: "Transylvania", caption: "Dramatic stone fortress towering over misty Carpathian pine forests." },
  RS: { landmarkName: "Kalemegdan Fortress & Saint Sava", location: "Belgrade", caption: "Ancient citadel commanding the confluence of the Danube and Sava." },
  SK: { landmarkName: "Spiš Castle & High Tatras", location: "Žehra & Tatras", caption: "One of Europe's largest castle ruins beneath alpine peaks." },
  SI: { landmarkName: "Lake Bled Island & Castle", location: "Upper Carniola", caption: "Emerald glacial lake with a solitary island church and cliffside castle." },
  SM: { landmarkName: "Three Towers of San Marino", location: "Mount Titano", caption: "Medieval stone fortresses crowning steep mountain peaks." },
  UA: { landmarkName: "Saint Sophia's Cathedral & Pechersk Lavra", location: "Kyiv", caption: "Golden domes and green roofs shining above the Dnieper." },
  RU: { landmarkName: "Saint Basil's Cathedral & Red Square", location: "Moscow", caption: "Colorful swirling onion domes of Russian fairy-tale legend." },
  LI: { landmarkName: "Vaduz Castle", location: "Vaduz", caption: "Princely fortress overlooking alpine Rhine river valleys." },

  // Americas
  AG: { landmarkName: "Nelson's Dockyard & Shirley Heights", location: "English Harbour", caption: "Historic Georgian naval dockyard overlooking panoramic turquoise bays." },
  BB: { landmarkName: "Harrison's Cave & Bathsheba Beach", location: "Saint Joseph", caption: "Subterranean limestone crystal caverns and Atlantic surf boulders." },
  BZ: { landmarkName: "The Great Blue Hole & Barrier Reef", location: "Lighthouse Reef", caption: "Giant submarine sinkhole encircled by living coral atolls." },
  BO: { landmarkName: "Salar de Uyuni Salt Flats", location: "Potosí", caption: "Vast white hexagonal salt mirror reflecting boundless blue skies." },
  DM: { landmarkName: "Boiling Lake & Trafalgar Falls", location: "Morne Trois Pitons", caption: "Volcanic steam and twin cascades in lush Caribbean rainforest." },
  DO: { landmarkName: "Zona Colonial & Saona Island", location: "Santo Domingo", caption: "The Americas' oldest cathedral and coconut-fringed white beaches." },
  EC: { landmarkName: "Galápagos Islands & Cotopaxi", location: "Galápagos & Andes", caption: "Unique volcanic archipelago and perfect snow-capped Andean cone." },
  SV: { landmarkName: "Santa Ana Volcano & Joya de Cerén", location: "Santa Ana", caption: "Turquoise sulfur crater lake atop volcanic peaks." },
  GD: { landmarkName: "Grand Anse & Underwater Sculpture Park", location: "Saint George's", caption: "Spice isle turquoise waters and mystical submerged coral statues." },
  GT: { landmarkName: "Tikal Pyramids & Lake Atitlán", location: "Petén & Sololá", caption: "Towering Maya temples breaking through lush jungle canopy." },
  GY: { landmarkName: "Kaieteur Falls", location: "Potaro-Siparuni", caption: "World's largest single-drop waterfall roaring into misty gorges." },
  HT: { landmarkName: "Citadelle Laferrière", location: "Milot", caption: "Mountain fortress of freedom high above Caribbean clouds." },
  HN: { landmarkName: "Copán Maya Ruins & Roatán", location: "Copán & Bay Islands", caption: "Intricate Maya hieroglyphic stairways and Caribbean barrier reefs." },
  KN: { landmarkName: "Brimstone Hill Fortress", location: "Saint Kitts", caption: "Gibraltar of the Caribbean perched over panoramic blue seas." },
  LC: { landmarkName: "The Pitons", location: "Soufrière", caption: "Twin emerald volcanic spires rising vertically from the ocean." },
  NI: { landmarkName: "Masaya Volcano & Granada", location: "Granada & Masaya", caption: "Colonial pastel plazas and glowing volcanic craters." },
  PA: { landmarkName: "Panama Canal & Casco Viejo", location: "Panama City", caption: "Engineering marvel connecting two oceans beside colonial cobblestones." },
  PY: { landmarkName: "Itaipu Dam & Jesuit Missions", location: "Hernandarias & Itapúa", caption: "Monumental hydro engineering and historic red sandstone ruins." },
  SR: { landmarkName: "Historic Paramaribo & Voltzberg", location: "Paramaribo", caption: "Colonial Dutch wooden architecture alongside Amazonian rainforest." },
  TT: { landmarkName: "Pigeon Point & Maracas Bay", location: "Tobago & Trinidad", caption: "Thatch-roofed jetties extending into calm turquoise shallows." },
  UY: { landmarkName: "Casapueblo & Punta del Este", location: "Maldonado", caption: "Sculpted whitewashed cliff citadel catching dramatic Atlantic sunsets." },
  VE: { landmarkName: "Angel Falls (Salto Ángel)", location: "Canaima National Park", caption: "The world's highest uninterrupted waterfall plunging from tepui cliffs." },
  VC: { landmarkName: "Tobago Cays & La Soufrière", location: "The Grenadines", caption: "Pristine coral cays and sailing sanctuaries in azure seas." },

  // Africa
  DZ: { landmarkName: "Notre Dame d'Afrique & Tassili n'Ajjer", location: "Algiers & Sahara", caption: "Neo-Byzantine basilica overlooking the bay and ancient desert rock art." },
  AO: { landmarkName: "Kalandula Falls & Miradouro da Lua", location: "Malanje & Luanda", caption: "Horseshoe waterfalls roaring over lush tropical greenery." },
  BJ: { landmarkName: "Ganvié Stilt Village & Abomey Palaces", location: "Lake Nokoué", caption: "The Venice of Africa thriving atop tranquil lake waters." },
  BW: { landmarkName: "Okavango Delta & Chobe Elephants", location: "North-West District", caption: "Lush papyrus water labyrinths teeming with wild elephants." },
  BF: { landmarkName: "Sindou Peaks & Grand Mosque", location: "Cascades & Bobo-Dioulasso", caption: "Mystical eroded sandstone pinnacles sculpted by desert winds." },
  BI: { landmarkName: "Lake Tanganyika & Karera Falls", location: "Rutana", caption: "Crystal African Great Lake flanked by green mountain ridges." },
  CV: { landmarkName: "Pico do Fogo Volcano", location: "Fogo Island", caption: "Dramatic volcanic peak rising from dark black basalt sands." },
  CM: { landmarkName: "Mount Cameroon & Waza Park", location: "Southwest Region", caption: "Active coastal volcanic peak rising into tropical cloud forests." },
  CF: { landmarkName: "Dzanga-Ndoki Rainforest & Bais", location: "Sangha-Mbaéré", caption: "Primeval Congo basin forest salt clearings with forest elephants." },
  TD: { landmarkName: "Ennedi Plateau & Guelta d'Archei", location: "Ennedi", caption: "Monumental sandstone arches and desert oasis camel watering holes." },
  KM: { landmarkName: "Mount Karthala & Chomoni Beaches", location: "Grande Comore", caption: "Active volcano crater and white sand beaches fringed with palms." },
  CG: { landmarkName: "Odzala-Kokoua Canopy & Congo River", location: "Cuvette-Ouest", caption: "Dense equatorial rainforest canopy bordering the mighty Congo." },
  CD: { landmarkName: "Virunga Volcanoes & Mount Nyiragongo", location: "North Kivu", caption: "Lush misty volcanic home of majestic mountain gorillas." },
  CI: { landmarkName: "Basilica of Our Lady of Peace", location: "Yamoussoukro", caption: "Colossal marble dome rising above tranquil savanna plains." },
  DJ: { landmarkName: "Lake Assal Salt Formations", location: "Danakil Desert", caption: "Bright white salt flats and hyper-saline turquoise crater water." },
  GQ: { landmarkName: "Malabo Santa Isabel & Pico Basile", location: "Bioko Island", caption: "Colonial Spanish architecture beneath towering volcanic cloud peaks." },
  ER: { landmarkName: "Asmara Art Deco & Red Sea Dahlak", location: "Asmara", caption: "Modernist Italian futurist architecture in the African horn." },
  SZ: { landmarkName: "Mlilwane Sanctuary & Mantenga Falls", location: "Ezulwini Valley", caption: "Emerald royal valley with traditional beehive kraals." },
  ET: { landmarkName: "Rock-Hewn Churches of Lalibela", location: "Amhara Region", caption: "Monolithic 12th-century cruciform churches carved into living rock." },
  GA: { landmarkName: "Loango National Park", location: "Ogooué-Maritime", caption: "Surfing hippos and elephants roaming wild Atlantic shores." },
  GM: { landmarkName: "Kunta Kinteh Island & River Gambia", location: "North Bank", caption: "Historic river fortress and vibrant birdlife on winding waterways." },
  GN: { landmarkName: "Fouta Djallon Highlands", location: "Labé", caption: "Verdant mountain plateaus, roaring waterfalls, and sandstone canyons." },
  GW: { landmarkName: "Bijagós Biosphere Archipelago", location: "Bijagós Islands", caption: "Untouched tropical mangrove islands and saltwater hippopotamuses." },
  LS: { landmarkName: "Maletsunyane Falls & Drakensberg", location: "Semonkong", caption: "Single-drop plume plunging into deep basalt mountain gorges." },
  LR: { landmarkName: "Providence Island & Mount Nimba", location: "Monrovia", caption: "Historic lagoon island and mist-shrouded biodiversity mountains." },
  LY: { landmarkName: "Leptis Magna Roman Ruins", location: "Al-Khums", caption: "One of the Mediterranean's best preserved Roman imperial cities." },
  MG: { landmarkName: "Avenue of the Baobabs", location: "Menabe", caption: "Ancient giant trees standing tall against brilliant crimson sunsets." },
  MW: { landmarkName: "Lake Malawi & Cape Maclear", location: "Mangochi", caption: "Golden sandy coves and hundreds of colorful cichlid fishes." },
  ML: { landmarkName: "Great Mosque of Djenné", location: "Mopti Region", caption: "The world's largest adobe mudbrick building rising above floodplains." },
  MR: { landmarkName: "Eye of the Sahara (Richat Structure)", location: "Ouadane", caption: "Giant concentric circular rock dome visible from outer space." },
  MZ: { landmarkName: "Bazaruto Coral Archipelago", location: "Inhambane", caption: "White sand dunes drifting into vivid turquoise Indian Ocean lagoons." },
  NA: { landmarkName: "Sossusvlei & Deadvlei Dunes", location: "Namib Desert", caption: "Towering terracotta dunes and 900-year-old camel thorn silhouettes." },
  NE: { landmarkName: "Agadez Grand Mosque & Aïr Mountains", location: "Agadez", caption: "Ancient mudbrick minaret with wooden scaffolding over Saharan sands." },
  RW: { landmarkName: "Volcanoes National Park", location: "Musanze", caption: "Bamboo forests and emerald dormant volcanoes sheltering mountain gorillas." },
  ST: { landmarkName: "Pico Cão Grande", location: "Caué District", caption: "Dramatic needle-like volcanic plug towering over dense jungle canopy." },
  SN: { landmarkName: "Gorée Island & Lake Retba", location: "Dakar", caption: "Colonial pastel facades and pink saltwater lagoon waters." },
  SL: { landmarkName: "Banana Islands & River Number Two", location: "Freetown Peninsula", caption: "Powder white sands and emerald rainforest hills meeting the Atlantic." },
  SO: { landmarkName: "Laas Geel Rock Art & Mogadishu Coast", location: "Woqooyi Galbeed", caption: "Neolithic painted cave art and Indian Ocean coastal vistas." },
  SS: { landmarkName: "The Sudd Wetlands & Nile", location: "Unity State", caption: "Vast papyrus marshes and sweeping Nile floodplains." },
  SD: { landmarkName: "Meroë Pyramids", location: "River Nile State", caption: "Steep-sided Nubian sandstone pyramids rising out of desert dunes." },
  TG: { landmarkName: "Koutammakou Mud Tower-Houses", location: "Kara Region", caption: "Fortified clay two-story castles of the Batammariba people." },
  TN: { landmarkName: "El Jem Amphitheatre & Sidi Bou Said", location: "Mahdia & Tunis", caption: "Roman colosseum and dazzling blue-and-white cliffside village." },
  UG: { landmarkName: "Murchison Falls & Bwindi Impenetrable", location: "Masindi & Kanungu", caption: "The Nile exploding through narrow rock clefts into thunderous falls." },
  ZM: { landmarkName: "Victoria Falls (Mosi-oa-Tunya)", location: "Livingstone", caption: "The Smoke that Thunders pouring into sheer basalt chasms." },
  ZW: { landmarkName: "Great Zimbabwe Ruins & Victoria Falls", location: "Masvingo", caption: "Monumental medieval drystone city walls of royal Bantu heritage." },

  // Oceania
  FM: { landmarkName: "Nan Madol Ancient City", location: "Pohnpei", caption: "Megalithic basalt stone city built on coral reef canals." },
  KI: { landmarkName: "Christmas Island (Kiritimati) Lagoons", location: "Line Islands", caption: "Vast coral atoll lagoons and seabird colonies on the equator." },
  MH: { landmarkName: "Majuro Atoll & Arno Coral Lagoon", location: "Majuro", caption: "Narrow palm-lined coral ring encircled by vast turquoise Pacific." },
  NR: { landmarkName: "Anibare Bay & Command Ridge", location: "Anibare District", caption: "Pristine white sand bay framed by jagged coastal coral pinnacles." },
  PW: { landmarkName: "Rock Islands Southern Lagoon", location: "Koror", caption: "Mushroom-shaped emerald limestone islets in luminous turquoise seas." },
  PG: { landmarkName: "Tavurvur Volcano & Sepik River", location: "Rabaul & East Sepik", caption: "Smoking active caldera and sacred carved spirit houses." },
  SB: { landmarkName: "Marovo Lagoon", location: "Western Province", caption: "The world's largest saltwater lagoon dotted with hundreds of islets." },
  TO: { landmarkName: "Ha'amonga 'a Maui Trilithon", location: "Heketā, Tongatapu", caption: "Ancient Polynesian coral stone megalith known as Stonehenge of the Pacific." },
  TV: { landmarkName: "Funafuti Conservation Marine Lagoon", location: "Funafuti", caption: "Translucent turquoise atoll ribbon and tropical coconut motus." },
  VU: { landmarkName: "Mount Yasur Volcano & Blue Cave", location: "Tanna Island", caption: "One of the world's most accessible living lava firework calderas." }
};

// Generate full list for 199 countries
const catalogWithLandmarks = countries.map(c => {
  const lm = allLandmarksMap[c.id] || {
    landmarkName: `${c.name} Heritage & Landscapes`,
    location: c.continent,
    caption: `Discover the breathtaking sights and unique heritage of ${c.name}.`
  };
  const cleanName = (lm.landmarkName || c.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: c.id,
    name: c.name,
    continent: c.continent,
    landmarkName: lm.landmarkName,
    location: lm.location,
    caption: lm.caption,
    imagePath: `/images/postcards/${c.id.toLowerCase()}-${slug}.png`,
    imageFilename: `${c.id.toLowerCase()}-${slug}.png`
  };
});

fs.writeFileSync('src/data/allLandmarksCatalog.json', JSON.stringify(catalogWithLandmarks, null, 2), 'utf8');
console.log('Saved src/data/allLandmarksCatalog.json with exactly ' + catalogWithLandmarks.length + ' countries!');
