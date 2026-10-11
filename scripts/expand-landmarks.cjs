const fs = require('fs');

const catContent = fs.readFileSync('src/data/countryCatalog.ts', 'utf8');
const idMatches = [...catContent.matchAll(/"id":\s*"([A-Z]{2})",\s*"name":\s*"([^"]+)",\s*"continent":\s*"([^"]+)"/g)];
const countries = idMatches.map(m => ({ id: m[1], name: m[2], continent: m[3] }));

// Extract existing curated landmarks exactly as written in src/data/countryLandmarks.ts
const originalTs = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const entryRegex = /["']?([A-Z]{2})["']?:\s*\{([^}]+)\}/g;
const existingCurated = {};

let match;
while ((match = entryRegex.exec(originalTs)) !== null) {
  const code = match[1];
  const body = match[2];
  const lmName = (body.match(/landmarkName:\s*"([^"]+)"/) || [])[1];
  const loc = (body.match(/location:\s*"([^"]+)"/) || [])[1];
  const cap = (body.match(/caption:\s*"([^"]+)"/) || [])[1];
  const img = (body.match(/imagePath:\s*"([^"]+)"/) || [])[1];
  if (lmName && loc && cap) {
    existingCurated[code] = {
      landmarkName: lmName,
      location: loc,
      caption: cap,
      imagePath: img
    };
  }
}

console.log('Original curated landmarks parsed:', Object.keys(existingCurated).length);

// Additional rich landmarks for countries not in original curated list
const additionalLandmarks = {
  // Asia
  AF: { landmarkName: "Blue Mosque & Band-e Amir", location: "Mazar-i-Sharif", caption: "Turquoise-tiled minarets and lapis lazuli lakes.", imagePath: "/images/postcards/af-blue-mosque.webp" },
  AM: { landmarkName: "Khor Virap & Mount Ararat", location: "Ararat Plain", caption: "Ancient stone monastery framing snow-capped Mount Ararat.", imagePath: "/images/postcards/am-khor-virap.webp" },
  AZ: { landmarkName: "Flame Towers & Old City", location: "Baku", caption: "Futuristic illuminated towers rising over Caspian stone ramparts.", imagePath: "/images/postcards/az-flame-towers.webp" },
  BH: { landmarkName: "Qal'at al-Bahrain", location: "Northern Governorate", caption: "Ancient Portuguese sandstone fortress along the Arabian Gulf.", imagePath: "/images/postcards/bh-bahrain-fort.webp" },
  BD: { landmarkName: "Sundarbans Mangrove Forest", location: "Khulna Division", caption: "Emerald tidal mangrove rivers and Royal Bengal tigers.", imagePath: "/images/postcards/bd-sundarbans.webp" },
  BT: { landmarkName: "Paro Taktsang (Tiger's Nest)", location: "Paro Valley", caption: "Himalayan Buddhist monastery clinging to sheer cliffside.", imagePath: "/images/postcards/bt-tigers-nest.webp" },
  BN: { landmarkName: "Sultan Omar Ali Saifuddien Mosque", location: "Bandar Seri Begawan", caption: "Gleaming golden dome and lagoon ceremonial stone barge.", imagePath: "/images/postcards/bn-saifuddien-mosque.webp" },
  CY: { landmarkName: "Aphrodite's Rock & Paphos Harbor", location: "Kouklia", caption: "Mythical sea stacks and crystal Mediterranean waters.", imagePath: "/images/postcards/cy-aphrodites-rock.webp" },
  GE: { landmarkName: "Gergeti Trinity Church", location: "Kazbegi, Stepantsminda", caption: "Solitary stone church beneath Mount Kazbek glaciers.", imagePath: "/images/postcards/ge-gergeti-trinity.webp" },
  IQ: { landmarkName: "Ishtar Gate & Ziggurat of Ur", location: "Babylon & Dhi Qar", caption: "Lapis-glazed brick reliefs and ancient Mesopotamian ziggurat.", imagePath: "/images/postcards/iq-ziggurat-ur.webp" },
  IL: { landmarkName: "Old City of Jerusalem & Dome of the Rock", location: "Jerusalem", caption: "Golden dome and ancient limestone walls bathed in sunset.", imagePath: "/images/postcards/il-jerusalem.webp" },
  KZ: { landmarkName: "Charyn Canyon & Baiterek Tower", location: "Almaty & Astana", caption: "Ochre sandstone canyons and soaring steppes.", imagePath: "/images/postcards/kz-charyn-canyon.webp" },
  KW: { landmarkName: "Kuwait Towers", location: "Kuwait City", caption: "Iconic blue-green tiled spires over the Persian Gulf.", imagePath: "/images/postcards/kw-kuwait-towers.webp" },
  KG: { landmarkName: "Lake Issyk-Kul & Tian Shan Peaks", location: "Tian Shan", caption: "Endless alpine lake ringed by snowcapped mountain ranges.", imagePath: "/images/postcards/kg-lake-issyk-kul.webp" },
  LA: { landmarkName: "Kuang Si Falls & Luang Prabang", location: "Luang Prabang", caption: "Multi-tiered turquoise jungle waterfalls and Buddhist wats.", imagePath: "/images/postcards/la-kuang-si-falls.webp" },
  LB: { landmarkName: "Baalbek Roman Temples & Pigeon Rocks", location: "Beqaa & Beirut", caption: "Towering Roman granite colonnades and coastal sea arches.", imagePath: "/images/postcards/lb-baalbek.webp" },
  MN: { landmarkName: "Genghis Khan Statue & Gobi Dunes", location: "Tsonjin Boldog & Gobi", caption: "Colossal stainless steel equestrian statue on the steppe.", imagePath: "/images/postcards/mn-genghis-khan.webp" },
  KP: { landmarkName: "Mount Paektu & Heaven Lake", location: "Samjiyon", caption: "Sacred volcanic crater lake encircled by jagged granite crags.", imagePath: "/images/postcards/kp-mount-paektu.webp" },
  PK: { landmarkName: "Badshahi Mosque & K2", location: "Lahore & Karakoram", caption: "Grand Mughal red sandstone arches and Karakoram giants.", imagePath: "/images/postcards/pk-badshahi-mosque.webp" },
  PS: { landmarkName: "Church of the Nativity & Mar Saba", location: "Bethlehem & Judean Desert", caption: "Ancient cliff-hanging monastery over desert canyons.", imagePath: "/images/postcards/ps-mar-saba.webp" },
  PH: { landmarkName: "Chocolate Hills & El Nido", location: "Bohol & Palawan", caption: "Rolling emerald karst mounds and crystal limestone lagoons.", imagePath: "/images/postcards/ph-chocolate-hills.webp" },
  SY: { landmarkName: "Palmyra Colonnade & Krak des Chevaliers", location: "Tadmur & Homs", caption: "Ancient desert oasis arches and crusader castles.", imagePath: "/images/postcards/sy-palmyra.webp" },
  TJ: { landmarkName: "Pamir Highway & Iskanderkul", location: "Fann Mountains", caption: "Glacial alpine lakes in the roof of the world.", imagePath: "/images/postcards/tj-pamir-highway.webp" },
  TL: { landmarkName: "Cristo Rei & Atauro Coral Reefs", location: "Dili", caption: "Panoramic coastal statue and pristine underwater biodiversity.", imagePath: "/images/postcards/tl-cristo-rei.webp" },
  TM: { landmarkName: "Darvaza Gas Crater & Ashgabat Marble", location: "Karakum Desert", caption: "The blazing 'Door to Hell' glowing in desert night.", imagePath: "/images/postcards/tm-darvaza-crater.webp" },
  UZ: { landmarkName: "Registan Square", location: "Samarkand", caption: "Majestic blue-tiled madrasahs and mosaic courtyards of the Silk Road.", imagePath: "/images/postcards/uz-registan-square.webp" },
  YE: { landmarkName: "Old Walled City of Shibam & Socotra", location: "Hadramawt & Socotra", caption: "Ancient mudbrick skyscrapers and dragon blood trees.", imagePath: "/images/postcards/ye-shibam-socotra.webp" },

  // Europe
  AD: { landmarkName: "Casa de la Vall & Madriu-Perafita", location: "Andorra la Vella", caption: "Stone heritage parliament tucked in high Pyrenean valleys.", imagePath: "/images/postcards/ad-casa-de-la-vall.webp" },
  AL: { landmarkName: "Berat Ottoman Castle & Ksamil", location: "Berat & Vlorë", caption: "The city of a thousand windows overlooking turquoise Ionian bays.", imagePath: "/images/postcards/al-berat-castle.webp" },
  BA: { landmarkName: "Stari Most (Old Bridge)", location: "Mostar", caption: "Suleiman the Magnificent's arching stone bridge over the Neretva.", imagePath: "/images/postcards/ba-stari-most.webp" },
  BG: { landmarkName: "Rila Monastery & Alexander Nevsky", location: "Rila & Sofia", caption: "Striped Byzantine arcades nestled in high pine mountains.", imagePath: "/images/postcards/bg-rila-monastery.webp" },
  BY: { landmarkName: "Mir Castle Complex", location: "Mir, Grodno", caption: "Gothic and Renaissance red-brick turrets mirrored in tranquil lakes.", imagePath: "/images/postcards/by-mir-castle.webp" },
  EE: { landmarkName: "Tallinn Old Town & Alexander Nevsky", location: "Tallinn", caption: "Cobblestone medieval spires and red-tiled ramparts.", imagePath: "/images/postcards/ee-tallinn-old-town.webp" },
  LV: { landmarkName: "Riga Old Town & House of the Black Heads", location: "Riga", caption: "Ornate Hanseatic facades and Art Nouveau boulevards.", imagePath: "/images/postcards/lv-riga-old-town.webp" },
  LT: { landmarkName: "Trakai Island Castle", location: "Trakai", caption: "Red-brick fairy tale fortress situated on a misty lake.", imagePath: "/images/postcards/lt-trakai-castle.webp" },
  LU: { landmarkName: "Bock Casemates & Adolphe Bridge", location: "Luxembourg City", caption: "Cliffside fortress ramparts spanning the deep Alzette gorge.", imagePath: "/images/postcards/lu-bock-casemates.webp" },
  MT: { landmarkName: "Valletta Grand Harbour & Blue Grotto", location: "Valletta", caption: "Golden honey-limestone bastions surrounded by deep blue seas.", imagePath: "/images/postcards/mt-valletta-harbour.webp" },
  MD: { landmarkName: "Orheiul Vechi Monastery", location: "Trebujeni", caption: "Cave monastery carved into limestone ridges above the Răut river.", imagePath: "/images/postcards/md-orheiul-vechi.webp" },
  ME: { landmarkName: "Bay of Kotor & Our Lady of the Rocks", location: "Kotor", caption: "Deep fjord-like Adriatic bay flanked by dramatic limestone cliffs.", imagePath: "/images/postcards/me-bay-of-kotor.webp" },
  MK: { landmarkName: "Church of St. John at Kaneo", location: "Ohrid", caption: "Byzantine church perched high above crystal Lake Ohrid.", imagePath: "/images/postcards/mk-st-john-kaneo.webp" },
  PL: { landmarkName: "Wawel Royal Castle & Main Square", location: "Kraków", caption: "Gothic towers and Renaissance courtyards beside the Vistula.", imagePath: "/images/postcards/pl-wawel-castle.webp" },
  RO: { landmarkName: "Bran Castle (Dracula's Castle)", location: "Transylvania", caption: "Dramatic stone fortress towering over misty Carpathian pine forests.", imagePath: "/images/postcards/ro-bran-castle.webp" },
  RS: { landmarkName: "Kalemegdan Fortress & Saint Sava", location: "Belgrade", caption: "Ancient citadel commanding the confluence of the Danube and Sava.", imagePath: "/images/postcards/rs-kalemegdan.webp" },
  SK: { landmarkName: "Spiš Castle & High Tatras", location: "Žehra & Tatras", caption: "One of Europe's largest castle ruins beneath alpine peaks.", imagePath: "/images/postcards/sk-spis-castle.webp" },
  SI: { landmarkName: "Lake Bled Island & Castle", location: "Upper Carniola", caption: "Emerald glacial lake with a solitary island church and cliffside castle.", imagePath: "/images/postcards/si-lake-bled.webp" },
  SM: { landmarkName: "Three Towers of San Marino", location: "Mount Titano", caption: "Medieval stone fortresses crowning steep mountain peaks.", imagePath: "/images/postcards/sm-three-towers.webp" },
  UA: { landmarkName: "Saint Sophia's Cathedral & Pechersk Lavra", location: "Kyiv", caption: "Golden domes and green roofs shining above the Dnieper.", imagePath: "/images/postcards/ua-saint-sophia.webp" },
  RU: { landmarkName: "Saint Basil's Cathedral & Red Square", location: "Moscow", caption: "Colorful swirling onion domes of Russian fairy-tale legend.", imagePath: "/images/postcards/ru-saint-basils.webp" },
  LI: { landmarkName: "Vaduz Castle", location: "Vaduz", caption: "Princely fortress overlooking alpine Rhine river valleys.", imagePath: "/images/postcards/li-vaduz-castle.webp" },

  // Americas
  AG: { landmarkName: "Nelson's Dockyard & Shirley Heights", location: "English Harbour", caption: "Historic Georgian naval dockyard overlooking panoramic turquoise bays.", imagePath: "/images/postcards/ag-nelsons-dockyard.webp" },
  BB: { landmarkName: "Harrison's Cave & Bathsheba Beach", location: "Saint Joseph", caption: "Subterranean limestone crystal caverns and Atlantic surf boulders.", imagePath: "/images/postcards/bb-harrisons-cave.webp" },
  BZ: { landmarkName: "The Great Blue Hole & Barrier Reef", location: "Lighthouse Reef", caption: "Giant submarine sinkhole encircled by living coral atolls.", imagePath: "/images/postcards/bz-blue-hole.webp" },
  BO: { landmarkName: "Salar de Uyuni Salt Flats", location: "Potosí", caption: "Vast white hexagonal salt mirror reflecting boundless blue skies.", imagePath: "/images/postcards/bo-salar-de-uyuni.webp" },
  DM: { landmarkName: "Boiling Lake & Trafalgar Falls", location: "Morne Trois Pitons", caption: "Volcanic steam and twin cascades in lush Caribbean rainforest.", imagePath: "/images/postcards/dm-boiling-lake.webp" },
  DO: { landmarkName: "Zona Colonial & Saona Island", location: "Santo Domingo", caption: "The Americas' oldest cathedral and coconut-fringed white beaches.", imagePath: "/images/postcards/do-zona-colonial.webp" },
  EC: { landmarkName: "Galápagos Islands & Cotopaxi", location: "Galápagos & Andes", caption: "Unique volcanic archipelago and perfect snow-capped Andean cone.", imagePath: "/images/postcards/ec-galapagos.webp" },
  SV: { landmarkName: "Santa Ana Volcano & Joya de Cerén", location: "Santa Ana", caption: "Turquoise sulfur crater lake atop volcanic peaks.", imagePath: "/images/postcards/sv-santa-ana-volcano.webp" },
  GD: { landmarkName: "Grand Anse & Underwater Sculpture Park", location: "Saint George's", caption: "Spice isle turquoise waters and mystical submerged coral statues.", imagePath: "/images/postcards/gd-grand-anse.webp" },
  GT: { landmarkName: "Tikal Pyramids & Lake Atitlán", location: "Petén & Sololá", caption: "Towering Maya temples breaking through lush jungle canopy.", imagePath: "/images/postcards/gt-tikal-pyramids.webp" },
  GY: { landmarkName: "Kaieteur Falls", location: "Potaro-Siparuni", caption: "World's largest single-drop waterfall roaring into misty gorges.", imagePath: "/images/postcards/gy-kaieteur-falls.webp" },
  HT: { landmarkName: "Citadelle Laferrière", location: "Milot", caption: "Mountain fortress of freedom high above Caribbean clouds.", imagePath: "/images/postcards/ht-citadelle.webp" },
  HN: { landmarkName: "Copán Maya Ruins & Roatán", location: "Copán & Bay Islands", caption: "Intricate Maya hieroglyphic stairways and Caribbean barrier reefs.", imagePath: "/images/postcards/hn-copan-ruins.webp" },
  KN: { landmarkName: "Brimstone Hill Fortress", location: "Saint Kitts", caption: "Gibraltar of the Caribbean perched over panoramic blue seas.", imagePath: "/images/postcards/kn-brimstone-hill.webp" },
  LC: { landmarkName: "The Pitons", location: "Soufrière", caption: "Twin emerald volcanic spires rising vertically from the ocean.", imagePath: "/images/postcards/lc-the-pitons.webp" },
  NI: { landmarkName: "Masaya Volcano & Granada", location: "Granada & Masaya", caption: "Colonial pastel plazas and glowing volcanic craters.", imagePath: "/images/postcards/ni-masaya-volcano.webp" },
  PA: { landmarkName: "Panama Canal & Casco Viejo", location: "Panama City", caption: "Engineering marvel connecting two oceans beside colonial cobblestones.", imagePath: "/images/postcards/pa-panama-canal.webp" },
  PY: { landmarkName: "Itaipu Dam & Jesuit Missions", location: "Hernandarias & Itapúa", caption: "Monumental hydro engineering and historic red sandstone ruins.", imagePath: "/images/postcards/py-itaipu-dam.webp" },
  SR: { landmarkName: "Historic Paramaribo & Voltzberg", location: "Paramaribo", caption: "Colonial Dutch wooden architecture alongside Amazonian rainforest.", imagePath: "/images/postcards/sr-paramaribo.webp" },
  TT: { landmarkName: "Pigeon Point & Maracas Bay", location: "Tobago & Trinidad", caption: "Thatch-roofed jetties extending into calm turquoise shallows.", imagePath: "/images/postcards/tt-pigeon-point.webp" },
  UY: { landmarkName: "Casapueblo & Punta del Este", location: "Maldonado", caption: "Sculpted whitewashed cliff citadel catching dramatic Atlantic sunsets.", imagePath: "/images/postcards/uy-casapueblo.webp" },
  VE: { landmarkName: "Angel Falls (Salto Ángel)", location: "Canaima National Park", caption: "The world's highest uninterrupted waterfall plunging from tepui cliffs.", imagePath: "/images/postcards/ve-angel-falls.webp" },
  VC: { landmarkName: "Tobago Cays & La Soufrière", location: "The Grenadines", caption: "Pristine coral cays and sailing sanctuaries in azure seas.", imagePath: "/images/postcards/vc-tobago-cays.webp" },

  // Africa
  DZ: { landmarkName: "Notre Dame d'Afrique & Tassili n'Ajjer", location: "Algiers & Sahara", caption: "Neo-Byzantine basilica overlooking the bay and ancient desert rock art.", imagePath: "/images/postcards/dz-notre-dame-afrique.webp" },
  AO: { landmarkName: "Kalandula Falls & Miradouro da Lua", location: "Malanje & Luanda", caption: "Horseshoe waterfalls roaring over lush tropical greenery.", imagePath: "/images/postcards/ao-kalandula-falls.webp" },
  BJ: { landmarkName: "Ganvié Stilt Village & Abomey Palaces", location: "Lake Nokoué", caption: "The Venice of Africa thriving atop tranquil lake waters.", imagePath: "/images/postcards/bj-ganvie-village.webp" },
  BW: { landmarkName: "Okavango Delta & Chobe Elephants", location: "North-West District", caption: "Lush papyrus water labyrinths teeming with wild elephants.", imagePath: "/images/postcards/bw-okavango-delta.webp" },
  BF: { landmarkName: "Sindou Peaks & Grand Mosque", location: "Cascades & Bobo-Dioulasso", caption: "Mystical eroded sandstone pinnacles sculpted by desert winds.", imagePath: "/images/postcards/bf-sindou-peaks.webp" },
  BI: { landmarkName: "Lake Tanganyika & Karera Falls", location: "Rutana", caption: "Crystal African Great Lake flanked by green mountain ridges.", imagePath: "/images/postcards/bi-lake-tanganyika.webp" },
  CV: { landmarkName: "Pico do Fogo Volcano", location: "Fogo Island", caption: "Dramatic volcanic peak rising from dark black basalt sands.", imagePath: "/images/postcards/cv-pico-do-fogo.webp" },
  CM: { landmarkName: "Mount Cameroon & Waza Park", location: "Southwest Region", caption: "Active coastal volcanic peak rising into tropical cloud forests.", imagePath: "/images/postcards/cm-mount-cameroon.webp" },
  CF: { landmarkName: "Dzanga-Ndoki Rainforest & Bais", location: "Sangha-Mbaéré", caption: "Primeval Congo basin forest salt clearings with forest elephants.", imagePath: "/images/postcards/cf-dzanga-ndoki.webp" },
  TD: { landmarkName: "Ennedi Plateau & Guelta d'Archei", location: "Ennedi", caption: "Monumental sandstone arches and desert oasis camel watering holes.", imagePath: "/images/postcards/td-ennedi-plateau.webp" },
  KM: { landmarkName: "Mount Karthala & Chomoni Beaches", location: "Grande Comore", caption: "Active volcano crater and white sand beaches fringed with palms.", imagePath: "/images/postcards/km-mount-karthala.webp" },
  CG: { landmarkName: "Odzala-Kokoua Canopy & Congo River", location: "Cuvette-Ouest", caption: "Dense equatorial rainforest canopy bordering the mighty Congo.", imagePath: "/images/postcards/cg-odzala-kokoua.webp" },
  CD: { landmarkName: "Virunga Volcanoes & Mount Nyiragongo", location: "North Kivu", caption: "Lush misty volcanic home of majestic mountain gorillas.", imagePath: "/images/postcards/cd-virunga-volcanoes.webp" },
  CI: { landmarkName: "Basilica of Our Lady of Peace", location: "Yamoussoukro", caption: "Colossal marble dome rising above tranquil savanna plains.", imagePath: "/images/postcards/ci-basilica-yamoussoukro.webp" },
  DJ: { landmarkName: "Lake Assal Salt Formations", location: "Danakil Desert", caption: "Bright white salt flats and hyper-saline turquoise crater water.", imagePath: "/images/postcards/dj-lake-assal.webp" },
  GQ: { landmarkName: "Malabo Santa Isabel & Pico Basile", location: "Bioko Island", caption: "Colonial Spanish architecture beneath towering volcanic cloud peaks.", imagePath: "/images/postcards/gq-santa-isabel.webp" },
  ER: { landmarkName: "Asmara Art Deco & Red Sea Dahlak", location: "Asmara", caption: "Modernist Italian futurist architecture in the African horn.", imagePath: "/images/postcards/er-asmara-art-deco.webp" },
  SZ: { landmarkName: "Mlilwane Sanctuary & Mantenga Falls", location: "Ezulwini Valley", caption: "Emerald royal valley with traditional beehive kraals.", imagePath: "/images/postcards/sz-mlilwane-sanctuary.webp" },
  ET: { landmarkName: "Rock-Hewn Churches of Lalibela", location: "Amhara Region", caption: "Monolithic 12th-century cruciform churches carved into living rock.", imagePath: "/images/postcards/et-lalibela-churches.webp" },
  GA: { landmarkName: "Loango National Park", location: "Ogooué-Maritime", caption: "Surfing hippos and elephants roaming wild Atlantic shores.", imagePath: "/images/postcards/ga-loango-park.webp" },
  GM: { landmarkName: "Kunta Kinteh Island & River Gambia", location: "North Bank", caption: "Historic river fortress and vibrant birdlife on winding waterways.", imagePath: "/images/postcards/gm-kunta-kinteh.webp" },
  GN: { landmarkName: "Fouta Djallon Highlands", location: "Labé", caption: "Verdant mountain plateaus, roaring waterfalls, and sandstone canyons.", imagePath: "/images/postcards/gn-fouta-djallon.webp" },
  GW: { landmarkName: "Bijagós Biosphere Archipelago", location: "Bijagós Islands", caption: "Untouched tropical mangrove islands and saltwater hippopotamuses.", imagePath: "/images/postcards/gw-bijagos-islands.webp" },
  LS: { landmarkName: "Maletsunyane Falls & Drakensberg", location: "Semonkong", caption: "Single-drop plume plunging into deep basalt mountain gorges.", imagePath: "/images/postcards/ls-maletsunyane-falls.webp" },
  LR: { landmarkName: "Providence Island & Mount Nimba", location: "Monrovia", caption: "Historic lagoon island and mist-shrouded biodiversity mountains.", imagePath: "/images/postcards/lr-providence-island.webp" },
  LY: { landmarkName: "Leptis Magna Roman Ruins", location: "Al-Khums", caption: "One of the Mediterranean's best preserved Roman imperial cities.", imagePath: "/images/postcards/ly-leptis-magna.webp" },
  MG: { landmarkName: "Avenue of the Baobabs", location: "Menabe", caption: "Ancient giant trees standing tall against brilliant crimson sunsets.", imagePath: "/images/postcards/mg-avenue-of-baobabs.webp" },
  MW: { landmarkName: "Lake Malawi & Cape Maclear", location: "Mangochi", caption: "Golden sandy coves and hundreds of colorful cichlid fishes.", imagePath: "/images/postcards/mw-lake-malawi.webp" },
  ML: { landmarkName: "Great Mosque of Djenné", location: "Mopti Region", caption: "The world's largest adobe mudbrick building rising above floodplains.", imagePath: "/images/postcards/ml-djenne-mosque.webp" },
  MR: { landmarkName: "Eye of the Sahara (Richat Structure)", location: "Ouadane", caption: "Giant concentric circular rock dome visible from outer space.", imagePath: "/images/postcards/mr-eye-of-sahara.webp" },
  MZ: { landmarkName: "Bazaruto Coral Archipelago", location: "Inhambane", caption: "White sand dunes drifting into vivid turquoise Indian Ocean lagoons.", imagePath: "/images/postcards/mz-bazaruto-archipelago.webp" },
  NA: { landmarkName: "Sossusvlei & Deadvlei Dunes", location: "Namib Desert", caption: "Towering terracotta dunes and 900-year-old camel thorn silhouettes.", imagePath: "/images/postcards/na-sossusvlei-dunes.webp" },
  NE: { landmarkName: "Agadez Grand Mosque & Aïr Mountains", location: "Agadez", caption: "Ancient mudbrick minaret with wooden scaffolding over Saharan sands.", imagePath: "/images/postcards/ne-agadez-mosque.webp" },
  RW: { landmarkName: "Volcanoes National Park", location: "Musanze", caption: "Bamboo forests and emerald dormant volcanoes sheltering mountain gorillas.", imagePath: "/images/postcards/rw-volcanoes-park.webp" },
  ST: { landmarkName: "Pico Cão Grande", location: "Caué District", caption: "Dramatic needle-like volcanic plug towering over dense jungle canopy.", imagePath: "/images/postcards/st-pico-cao-grande.webp" },
  SN: { landmarkName: "Gorée Island & Lake Retba", location: "Dakar", caption: "Colonial pastel facades and pink saltwater lagoon waters.", imagePath: "/images/postcards/sn-goree-island.webp" },
  SL: { landmarkName: "Banana Islands & River Number Two", location: "Freetown Peninsula", caption: "Powder white sands and emerald rainforest hills meeting the Atlantic.", imagePath: "/images/postcards/sl-banana-islands.webp" },
  SO: { landmarkName: "Laas Geel Rock Art & Mogadishu Coast", location: "Woqooyi Galbeed", caption: "Neolithic painted cave art and Indian Ocean coastal vistas.", imagePath: "/images/postcards/so-laas-geel.webp" },
  SS: { landmarkName: "The Sudd Wetlands & Nile", location: "Unity State", caption: "Vast papyrus marshes and sweeping Nile floodplains.", imagePath: "/images/postcards/ss-sudd-wetlands.webp" },
  SD: { landmarkName: "Meroë Pyramids", location: "River Nile State", caption: "Steep-sided Nubian sandstone pyramids rising out of desert dunes.", imagePath: "/images/postcards/sd-meroe-pyramids.webp" },
  TG: { landmarkName: "Koutammakou Mud Tower-Houses", location: "Kara Region", caption: "Fortified clay two-story castles of the Batammariba people.", imagePath: "/images/postcards/tg-koutammakou-towers.webp" },
  TN: { landmarkName: "El Jem Amphitheatre & Sidi Bou Said", location: "Mahdia & Tunis", caption: "Roman colosseum and dazzling blue-and-white cliffside village.", imagePath: "/images/postcards/tn-el-jem.webp" },
  UG: { landmarkName: "Murchison Falls & Bwindi Impenetrable", location: "Masindi & Kanungu", caption: "The Nile exploding through narrow rock clefts into thunderous falls.", imagePath: "/images/postcards/ug-murchison-falls.webp" },
  ZM: { landmarkName: "Victoria Falls (Mosi-oa-Tunya)", location: "Livingstone", caption: "The Smoke that Thunders pouring into sheer basalt chasms.", imagePath: "/images/postcards/zm-victoria-falls.webp" },
  ZW: { landmarkName: "Great Zimbabwe Ruins & Victoria Falls", location: "Masvingo", caption: "Monumental medieval drystone city walls of royal Bantu heritage.", imagePath: "/images/postcards/zw-great-zimbabwe.webp" },

  // Oceania
  FM: { landmarkName: "Nan Madol Ancient City", location: "Pohnpei", caption: "Megalithic basalt stone city built on coral reef canals.", imagePath: "/images/postcards/fm-nan-madol.webp" },
  KI: { landmarkName: "Christmas Island (Kiritimati) Lagoons", location: "Line Islands", caption: "Vast coral atoll lagoons and seabird colonies on the equator.", imagePath: "/images/postcards/ki-christmas-island.webp" },
  MH: { landmarkName: "Majuro Atoll & Arno Coral Lagoon", location: "Majuro", caption: "Narrow palm-lined coral ring encircled by vast turquoise Pacific.", imagePath: "/images/postcards/mh-majuro-atoll.webp" },
  NR: { landmarkName: "Anibare Bay & Command Ridge", location: "Anibare District", caption: "Pristine white sand bay framed by jagged coastal coral pinnacles.", imagePath: "/images/postcards/nr-anibare-bay.webp" },
  PW: { landmarkName: "Rock Islands Southern Lagoon", location: "Koror", caption: "Mushroom-shaped emerald limestone islets in luminous turquoise seas.", imagePath: "/images/postcards/pw-rock-islands.webp" },
  PG: { landmarkName: "Tavurvur Volcano & Sepik River", location: "Rabaul & East Sepik", caption: "Smoking active caldera and sacred carved spirit houses.", imagePath: "/images/postcards/pg-tavurvur-volcano.webp" },
  SB: { landmarkName: "Marovo Lagoon", location: "Western Province", caption: "The world's largest saltwater lagoon dotted with hundreds of islets.", imagePath: "/images/postcards/sb-marovo-lagoon.webp" },
  TO: { landmarkName: "Ha'amonga 'a Maui Trilithon", location: "Heketā, Tongatapu", caption: "Ancient Polynesian coral stone megalith known as Stonehenge of the Pacific.", imagePath: "/images/postcards/to-trilithon.webp" },
  TV: { landmarkName: "Funafuti Conservation Marine Lagoon", location: "Funafuti", caption: "Translucent turquoise atoll ribbon and tropical coconut motus.", imagePath: "/images/postcards/tv-funafuti-lagoon.webp" },
  VU: { landmarkName: "Mount Yasur Volcano & Blue Cave", location: "Tanna Island", caption: "One of the world's most accessible living lava firework calderas.", imagePath: "/images/postcards/vu-mount-yasur.webp" },
  AR: { landmarkName: "Iguazu Falls", location: "Misiones Province", caption: "Roaring semicircular cascade through lush subtropical rainforest.", imagePath: "/images/postcards/ar-iguazu-falls.webp" },
  ZA: { landmarkName: "Table Mountain", location: "Cape Town", caption: "Flat-topped sandstone sentinel flanked by the Atlantic and Indian Oceans.", imagePath: "/images/postcards/za-table-mountain.webp" }
};

// Combine existingCurated (takes precedence) with additionalLandmarks
const mergedCurated = {
  ...additionalLandmarks,
  ...existingCurated
};

console.log('Merged curated landmarks total:', Object.keys(mergedCurated).length);

// Generate updated countryLandmarks.ts
let out = `import { COUNTRIES } from "./countryCatalog";

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
 * Follows the 16:9 cartoonish travel illustration aesthetic (WebP format).
 */
export const CURATED_LANDMARKS: Record<string, { landmarkName: string; location: string; caption: string; imagePath?: string }> = {
`;

const continents = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];

for (const cont of continents) {
  out += `  // ${cont}\n`;
  const items = countries.filter(c => c.continent === cont);
  for (const c of items) {
    const data = mergedCurated[c.id];
    if (data) {
      out += `  ${JSON.stringify(c.id)}: {\n`;
      out += `    landmarkName: ${JSON.stringify(data.landmarkName)},\n`;
      out += `    location: ${JSON.stringify(data.location)},\n`;
      out += `    caption: ${JSON.stringify(data.caption)},\n`;
      const slug = (data.landmarkName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const imgPath = data.imagePath || (`/images/postcards/${c.id.toLowerCase()}-${slug}.webp`);
      out += `    imagePath: ${JSON.stringify(imgPath)},\n`;
      out += `  },\n`;
    }
  }
  out += `\n`;
}

out += `};

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
    landmarkName: \`\${countryName} National Wonders\`,
    location: catalogEntry?.continent ?? "World",
    caption: \`Discover the breathtaking sights and unique heritage of \${countryName}.\`,
    imagePath: undefined,
  };
}
`;

fs.writeFileSync('src/data/countryLandmarks.ts', out, 'utf8');
console.log('src/data/countryLandmarks.ts updated successfully!');
