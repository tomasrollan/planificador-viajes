// Catálogo de restaurantes de servicio de mesa — Universal Orlando Resort (módulo "uor")
// Armado el 11/11/2026 con fuentes públicas (ver CATALOG_UOR_META). Las descripciones son propias (sin copiar textos ni fotos de Universal).
// Modo de contenido: "solo_enlaces" (sin fotos ni menús de Universal; se enlaza a la web oficial).
// Campos: id, name, zone (US/IA/EU/CW/UH), area, cuisine, flags (P personajes), tier (2 $$ · 3 $$$ · 4 $$$$, ESTIMADO por rango de precios publicado),
//   diff (dificultad de mesa 1-3, estimada por guías), hot (1 = destacado por las guías), book (web|resy|opentable|walkup),
//   phone, prio (1 = "priority seating" para huéspedes de Royal Pacific, Hard Rock y Portofino Bay), meals (D = solo cena; vacío = sin dato),
//   note (aclaración), conf (1 = datos de cocina/ambiente a confirmar en la web oficial)
window.CATALOG_UOR_META = {
  verified: 'nov 2026',
  linksCaptured: '2026-11-11',
  contentMode: 'solo_enlaces',
  officialUrl: 'https://www.universalorlando.com/web/en/us/plan-your-visit/dining-experiences/reservations',
  phone: '(407) 224-3663',
  sources: [
    'Orlando Informer — lista de restaurantes de servicio completo y canales de reserva (consultado 11/11/2026)',
    'TouringPlans — índice de restaurantes y menús de Universal Orlando (11/2026)',
    'Universal Orlando — página oficial de reservas (11/2026)',
    'Park Prodigy, Inside the Magic, Kenny the Pirate, Undercover Tourist — plan de comidas, ventanas de reserva y eventos (2025–2026)'
  ],
  note: 'Tiers de precio y dificultad de mesa son ESTIMACIONES a partir de rangos publicados por guías de terceros. Sin valoración (no hay una fuente comparable a la de Disney). Confirmar horarios, menús y disponibilidad en la web oficial.'
};
window.CATALOG_UOR = [
// ---------- UNIVERSAL STUDIOS FLORIDA ----------
{id:'uor-lombards-seafood-grille',name:"Lombard's Seafood Grille",zone:'US',area:'San Francisco',cuisine:'Pescados y mariscos',flags:'',tier:3,diff:2,hot:0,book:'web',phone:'(407) 224-3663',prio:1,desc:'Pescados y mariscos en el parque de los Estudios, con vista a la laguna. Una de las dos opciones de mesa dentro de Universal Studios Florida.'},
{id:'uor-finnegans-bar-and-grill',name:"Finnegan's Bar & Grill",zone:'US',area:'Nueva York',cuisine:'Pub irlandés',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 224-3663',prio:1,desc:'Pub de ambiente animado dentro del parque, con cocina de pub y bebidas. Buena opción informal para el almuerzo o la cena.'},
// ---------- ISLANDS OF ADVENTURE ----------
{id:'uor-mythos-restaurant',name:'Mythos Restaurant',zone:'IA',area:'The Lost Continent',cuisine:'Americana contemporánea',flags:'',tier:3,diff:3,hot:1,book:'web',phone:'(407) 224-3663',prio:1,desc:'El restaurante de mesa más buscado de Islands of Adventure, con ambientación de gruta mitológica. Conviene reservar con tiempo en temporada alta.'},
{id:'uor-confisco-grille',name:'Confisco Grille & Backwater Bar',zone:'IA',area:'Islands of Adventure',cuisine:'Americana a la parrilla',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 224-3663',prio:1,conf:1,desc:'Parrilla y bar dentro de Islands of Adventure, con platos americanos y opciones para compartir. Más relajado que Mythos y más fácil de reservar.'},
{id:'uor-marvel-character-dinner',name:'Marvel Character Dinner',zone:'IA',area:'Islands of Adventure',cuisine:'Cena con personajes de Marvel',flags:'P',tier:4,diff:3,hot:0,book:'web',phone:'(407) 224-3663',prio:0,meals:'D',conf:1,note:'Cena de precio fijo que se paga por persona al reservar (una guía de terceros la ubica en torno a US$ 60,70). Requiere entrada al parque ese día.',desc:'La única comida con personajes que figura hoy en Universal Orlando: cena con héroes de Marvel dentro de Islands of Adventure. Las guías recomiendan reservar con mucha anticipación.'},
// ---------- EPIC UNIVERSE ----------
{id:'uor-atlantic',name:'Atlantic',zone:'EU',area:'Celestial Park',cuisine:'Mariscos y carnes · ambiente submarino',flags:'',tier:3,diff:3,hot:1,book:'web',phone:'',prio:0,desc:'Restaurante de fantasía submarina frente a la pileta Neptune, en el corazón de Epic Universe. Mariscos y carnes. Se reserva online.'},
{id:'uor-blue-dragon',name:'The Blue Dragon Pan-Asian Restaurant',zone:'EU',area:'Celestial Park',cuisine:'Pan-asiática (china, japonesa y tailandesa)',flags:'',tier:3,diff:3,hot:1,book:'web',phone:'',prio:0,desc:'Cocina que mezcla sabores chinos, japoneses y tailandeses en un patio animado de Celestial Park. Se reserva online.'},
// ---------- CITYWALK ----------
{id:'uor-antojitos',name:'Antojitos Authentic Mexican Food',zone:'CW',area:'CityWalk',cuisine:'Mexicana',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 224-3663',prio:1,desc:'Cocina mexicana en CityWalk, con precios razonables para una cena después del parque. Las guías la señalan como buena relación precio-calidad.'},
{id:'uor-bigfire',name:'Bigfire',zone:'CW',area:'CityWalk',cuisine:'Americana contemporánea a la leña',flags:'',tier:3,diff:2,hot:0,book:'web',phone:'(407) 224-2074',prio:1,conf:1,desc:'Restaurante de CityWalk de cocina americana con fuego y brasas. Opción para una cena más cuidada sin salir del complejo.'},
{id:'uor-bob-marley',name:'Bob Marley – A Tribute to Freedom',zone:'CW',area:'CityWalk',cuisine:'Jamaiquina · música en vivo',flags:'S',tier:2,diff:1,hot:0,book:'walkup',phone:'',prio:1,conf:1,desc:'Homenaje a Bob Marley con comida de inspiración jamaiquina y música en vivo. No toma reservas: se llega y se espera mesa.'},
{id:'uor-bubba-gump',name:'Bubba Gump Shrimp Co. Restaurant & Market',zone:'CW',area:'CityWalk',cuisine:'Camarones y mariscos',flags:'',tier:2,diff:1,hot:0,book:'walkup',phone:'(407) 224-3663',prio:0,desc:'Camarones y mariscos con la temática de Forrest Gump. Informal y apto para chicos. No toma reservas.'},
{id:'uor-cowfish',name:'The Cowfish Sushi Burger Bar',zone:'CW',area:'CityWalk',cuisine:'Sushi y hamburguesas',flags:'',tier:3,diff:2,hot:1,book:'web',phone:'(407) 224-3663',prio:1,desc:'Mezcla de sushi y hamburguesas (el "burgushi") en un local colorido. Funciona bien para grupos con gustos distintos.'},
{id:'uor-hard-rock-cafe',name:'Hard Rock Cafe',zone:'CW',area:'CityWalk',cuisine:'Americana · ambiente rockero',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 351-7625',prio:1,desc:'El Hard Rock Cafe de CityWalk: hamburguesas, platos americanos y memorabilia de rock. Se reserva online.'},
{id:'uor-margaritaville',name:"Jimmy Buffett's Margaritaville",zone:'CW',area:'CityWalk',cuisine:'Americana con aire caribeño',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 224-3663',prio:1,desc:'Ambiente playero con platos de inspiración caribeña y bebidas frozen. Informal y animado.'},
{id:'uor-nbc-sports-grill',name:'NBC Sports Grill & Brew',zone:'CW',area:'CityWalk',cuisine:'Sports bar americano',flags:'',tier:2,diff:1,hot:0,book:'web',phone:'(407) 224-3663',prio:0,desc:'Sports bar con muchas pantallas y menú americano. Ideal si hay un partido que no se quieren perder.'},
{id:'uor-pat-obriens',name:"Pat O'Brien's Orlando",zone:'CW',area:'CityWalk',cuisine:'Cajún · bar de Nueva Orleans',flags:'',tier:2,diff:1,hot:0,book:'walkup',phone:'(407) 224-3663',prio:1,conf:1,desc:'Bar estilo Nueva Orleans conocido por su cóctel Hurricane. No toma reservas.'},
{id:'uor-toothsome-chocolate-emporium',name:'Toothsome Chocolate Emporium & Savory Feast Kitchen',zone:'CW',area:'CityWalk',cuisine:'Americana · fábrica de chocolate y postres',flags:'',tier:3,diff:3,hot:1,book:'web',phone:'(407) 224-3663',prio:0,desc:'Salón de ambientación steampunk con cocina americana y postres espectaculares. Las guías lo marcan como la mesa más difícil de conseguir de CityWalk: reservar con semanas de anticipación.'},
{id:'uor-vivo-italian-kitchen',name:'VIVO Italian Kitchen',zone:'CW',area:'CityWalk',cuisine:'Italiana',flags:'',tier:3,diff:2,hot:1,book:'web',phone:'(407) 224-3663',prio:1,desc:'Cocina italiana de CityWalk que las guías ubican entre lo mejor de la zona. Buena para una cena tranquila.'},
// ---------- HOTELES: HELIOS GRAND (EPIC UNIVERSE) ----------
{id:'uor-flora-taverna',name:'Flora Taverna',zone:'UH',area:'Universal Helios Grand Hotel',cuisine:'Restaurante del hotel',flags:'',tier:3,diff:2,hot:0,book:'resy',phone:'',prio:0,conf:1,note:'Hotel nuevo (2025). Confirmar cocina y menú en la web oficial.',desc:'Restaurante del Universal Helios Grand Hotel, junto a Epic Universe. Se reserva por Resy.'},
{id:'uor-bar-helios',name:'Bar Helios',zone:'UH',area:'Universal Helios Grand Hotel',cuisine:'Restaurante y bar del hotel',flags:'',tier:3,diff:2,hot:0,book:'resy',phone:'',prio:0,conf:1,note:'Hotel nuevo (2025). Confirmar cocina y menú en la web oficial.',desc:'Restaurante y bar del Universal Helios Grand Hotel, junto a Epic Universe. Se reserva por Resy.'},
// ---------- HOTELES: PORTOFINO BAY ----------
{id:'uor-bice-ristorante',name:'Bice Ristorante',zone:'UH',area:'Loews Portofino Bay Hotel',cuisine:'Italiana · alta cocina',flags:'',tier:4,diff:2,hot:0,book:'opentable',phone:'(407) 503-1415',prio:1,desc:'El restaurante de alta cocina italiana del Portofino Bay. Las guías recomiendan reservar. Se reserva por OpenTable.'},
{id:'uor-mama-dellas',name:"Mama Della's Ristorante",zone:'UH',area:'Loews Portofino Bay Hotel',cuisine:'Italiana casera',flags:'',tier:3,diff:2,hot:0,book:'resy',phone:'(407) 503-3463',prio:1,desc:'Cocina italiana casera en el Portofino Bay, con ambiente familiar. Recomendado reservar. Se reserva por Resy.'},
{id:'uor-trattoria-del-porto',name:'Trattoria del Porto',zone:'UH',area:'Loews Portofino Bay Hotel',cuisine:'Italiana',flags:'',tier:3,diff:1,hot:0,book:'resy',phone:'(407) 503-3463',prio:1,desc:'Trattoria italiana del Portofino Bay. Se reserva por Resy.'},
{id:'uor-splendido-pizzeria',name:'Splendido Pizzeria',zone:'UH',area:'Loews Portofino Bay Hotel',cuisine:'Pizzería',flags:'',tier:2,diff:1,hot:0,book:'walkup',phone:'',prio:0,conf:1,note:'Figura como servicio de mesa en el índice de TouringPlans; no aparece con reservas en la lista de Orlando Informer.',desc:'Pizzería del Portofino Bay. Informal y sin reserva informada.'},
// ---------- HOTELES: HARD ROCK ----------
{id:'uor-the-kitchen',name:'The Kitchen',zone:'UH',area:'Hard Rock Hotel',cuisine:'Americana',flags:'',tier:3,diff:1,hot:0,book:'resy',phone:'(407) 503-3463',prio:1,desc:'Restaurante del Hard Rock Hotel con carta americana. Reserva opcional por Resy.'},
{id:'uor-the-palm',name:'The Palm Restaurant',zone:'UH',area:'Hard Rock Hotel',cuisine:'Steakhouse y mariscos · alta cocina',flags:'',tier:4,diff:2,hot:0,book:'opentable',phone:'(407) 503-7256',prio:1,desc:'Steakhouse de alta cocina del Hard Rock Hotel, buena para una ocasión especial. Se reserva por OpenTable.'},
// ---------- HOTELES: ROYAL PACIFIC ----------
{id:'uor-islands-dining-room',name:'Islands Dining Room',zone:'UH',area:'Loews Royal Pacific Resort',cuisine:'Restaurante del hotel',flags:'',tier:3,diff:1,hot:0,book:'resy',phone:'',prio:1,conf:1,desc:'Restaurante principal del Royal Pacific Resort (desayuno y cena según las guías). Se reserva por Resy.'},
{id:'uor-jakes-american-bar',name:"Jake's American Bar",zone:'UH',area:'Loews Royal Pacific Resort',cuisine:'Americana',flags:'',tier:3,diff:1,hot:0,book:'resy',phone:'',prio:1,desc:'Bar y restaurante americano del Royal Pacific. Se reserva por Resy.'},
{id:'uor-orchid-court-sushi-bar',name:'Orchid Court Sushi Bar',zone:'UH',area:'Loews Royal Pacific Resort',cuisine:'Sushi',flags:'',tier:3,diff:1,hot:0,book:'walkup',phone:'',prio:0,conf:1,note:'Figura como servicio de mesa en el índice de TouringPlans; no aparece con reservas en la lista de Orlando Informer.',desc:'Barra de sushi del Royal Pacific. Sin reserva informada.'},
// ---------- HOTELES: SAPPHIRE FALLS ----------
{id:'uor-amatista-cookhouse',name:'Amatista Cookhouse',zone:'UH',area:'Loews Sapphire Falls Resort',cuisine:'Americana con aire caribeño',flags:'',tier:3,diff:1,hot:0,book:'resy',phone:'(407) 503-5200',prio:1,conf:1,desc:'Restaurante del Sapphire Falls Resort, con mesas dentro o junto a la pileta. Se reserva por Resy.'},
{id:'uor-strong-water-tavern',name:'Strong Water Tavern',zone:'UH',area:'Loews Sapphire Falls Resort',cuisine:'Taberna caribeña',flags:'',tier:2,diff:1,hot:0,book:'resy',phone:'(407) 503-5200',prio:0,conf:1,desc:'Taberna del Sapphire Falls Resort, con carta de bar y platos para compartir. Se reserva por Resy.'}
];

// Enlaces oficiales por restaurante: capturados el 11/11/2026 desde la página oficial de reservas de Universal (r = reservar, m = menú oficial).
// Los restaurantes que no aparecen no figuran en esa página; para ellos se usa la página general.
window.CATALOG_UOR_LINKS = {
"uor-antojitos": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.antojitos",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/antojitos-authentic-mexican-food/menu.html"
},
"uor-bigfire": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.bigfire",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/bigfire/menu.html"
},
"uor-bob-marley": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.bob_marley",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/bob-marley-a-tribute-to-freedom/menu.html"
},
"uor-cowfish": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.cowfish",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/the-cowfish/menu.html"
},
"uor-margaritaville": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.margaritaville",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/jimmy-buffetts-margaritaville/menu.html"
},
"uor-nbc-sports-grill": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.nbc_sports_grill",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/nbc-sports-grill-brew/menu.html"
},
"uor-pat-obriens": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.pat_o_briens",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/pat-o-briens/menu.html"
},
"uor-toothsome-chocolate-emporium": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.toothsome",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/toothsome-chocolate-emporium-and-savory-feast-kitchen/menu.html"
},
"uor-vivo-italian-kitchen": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.cw.dining.vivo",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/vivo-italian-kitchen/menu.html"
},
"uor-atlantic": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.ueu.dining.atlantic",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/atlantic"
},
"uor-blue-dragon": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.ueu.dining.the_blue_dragon_pan_asian_restaurant",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/the-blue-dragon-pan-asian-restaurant"
},
"uor-confisco-grille": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.ioa.dining.confisco_grille",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/confisco-grille/menu.html"
},
"uor-finnegans-bar-and-grill": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.usf.dining.finnegans_bar_and_grill",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/finnegans-bar-grill/menu.html"
},
"uor-lombards-seafood-grille": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.usf.dining.lombards_seafood_grille",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/lombards-seafood-grille/menu.html"
},
"uor-mythos-restaurant": {
"r": "https://www.universalorlando.com/dining/en/us/login?place_id=uor.ioa.dining.mythos_restaurant",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/mythos-restaurant/menu.html"
},
"uor-amatista-cookhouse": {
"r": "https://resy.com/cities/orl/amatista-cookhouse-at-loews-sapphire-falls-resort"
},
"uor-bice-ristorante": {
"r": "http://www.opentable.com/bice-at-the-loews-portofino-bay-hotel-reservations-orlando?restref=6042"
},
"uor-islands-dining-room": {
"r": "https://resy.com/cities/orl/islands-dining-room-at-loews-royal-pacific",
"m": "https://islands-dining-room.constantcontactsites.com/"
},
"uor-jakes-american-bar": {
"r": "https://resy.com/cities/orl/jakes-american-bar-at-loews-royal-pacific-resort"
},
"uor-mama-dellas": {
"r": "https://resy.com/cities/orl/mama-dellas-ristorante-at-loews-portofino-bay"
},
"uor-strong-water-tavern": {
"r": "https://resy.com/cities/orl/strong-water-tavern-at-loews-sapphire-falls-resort"
},
"uor-the-kitchen": {
"r": "https://resy.com/cities/orl/the-kitchen-at-hard-rock-hotel"
},
"uor-the-palm": {
"r": "https://www.opentable.com/r/the-palm-reservations-orlando?restref=7445",
"m": "https://www.universalorlando.com/web/en/us/things-to-do/dining/the-palm/dinner-menu.html"
},
"uor-trattoria-del-porto": {
"r": "https://resy.com/cities/orl/trattoria-del-porto-at-loews-portofino-bay-hotel"
},
"uor-bar-helios": {
"r": "https://resy.com/cities/orlando-fl/venues/bar-helios-at-universal-helios-grand-hotel-a-loews-hotel"
},
"uor-flora-taverna": {
"r": "https://resy.com/cities/orlando-fl/venues/flora-taverna-at-universal-helios-grand-hotel-a-loews-hotel"
}
};
