import { sceneById } from './lingo-scenes.js';

// Lingo Café vocabulary and sentence building for Spanish, French and German.
// Every item has: the noun with its article (what you learn), the form used when ordering one of it,
// and the plural noun used after a number. Forms are written out by hand so the grammar is right.

export const LANGS = [
  { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
];

export const NUMS = {
  es: { 2: 'dos', 3: 'tres' },
  fr: { 2: 'deux', 3: 'trois' },
  de: { 2: 'zwei', 3: 'drei' },
};

const it = (id, emoji, en, enPl, es, fr, de) => ({
  id,
  emoji,
  en,
  enPl,
  es: { noun: es[0], one: es[1], pl: es[2] },
  fr: { noun: fr[0], one: fr[1], pl: fr[2] },
  de: { noun: de[0], one: de[1], pl: de[2] },
});

// Listed in the order they are introduced.
export const ITEMS = [
  it('coffee', '☕', 'coffee', 'coffees', ['el café', 'un café', 'cafés'], ['le café', 'un café', 'cafés'], ['der Kaffee', 'einen Kaffee', 'Kaffee']),
  it('tea', '🍵', 'tea', 'teas', ['el té', 'un té', 'tés'], ['le thé', 'un thé', 'thés'], ['der Tee', 'einen Tee', 'Tees']),
  it('water', '💧', 'water', 'waters', ['el agua', 'un agua', 'aguas'], ["l'eau", 'une eau', 'eaux'], ['das Wasser', 'ein Wasser', 'Wasser']),
  it('bread', '🍞', 'bread', 'breads', ['el pan', 'un pan', 'panes'], ['le pain', 'un pain', 'pains'], ['das Brot', 'ein Brot', 'Brote']),
  it('croissant', '🥐', 'croissant', 'croissants', ['el cruasán', 'un cruasán', 'cruasanes'], ['le croissant', 'un croissant', 'croissants'], ['das Croissant', 'ein Croissant', 'Croissants']),
  it('cake', '🍰', 'cake', 'cakes', ['la tarta', 'una tarta', 'tartas'], ['le gâteau', 'un gâteau', 'gâteaux'], ['der Kuchen', 'einen Kuchen', 'Kuchen']),
  it('juice', '🧃', 'juice', 'juices', ['el zumo', 'un zumo', 'zumos'], ['le jus', 'un jus', 'jus'], ['der Saft', 'einen Saft', 'Säfte']),
  it('milkshake', '🥛', 'milkshake', 'milkshakes', ['el batido', 'un batido', 'batidos'], ['le milk-shake', 'un milk-shake', 'milk-shakes'], ['der Milchshake', 'einen Milchshake', 'Milchshakes']),
  it('sandwich', '🥪', 'sandwich', 'sandwiches', ['el bocadillo', 'un bocadillo', 'bocadillos'], ['le sandwich', 'un sandwich', 'sandwichs'], ['das Sandwich', 'ein Sandwich', 'Sandwiches']),
  it('salad', '🥗', 'salad', 'salads', ['la ensalada', 'una ensalada', 'ensaladas'], ['la salade', 'une salade', 'salades'], ['der Salat', 'einen Salat', 'Salate']),
  it('soup', '🍲', 'soup', 'soups', ['la sopa', 'una sopa', 'sopas'], ['la soupe', 'une soupe', 'soupes'], ['die Suppe', 'eine Suppe', 'Suppen']),
  it('pizza', '🍕', 'pizza', 'pizzas', ['la pizza', 'una pizza', 'pizzas'], ['la pizza', 'une pizza', 'pizzas'], ['die Pizza', 'eine Pizza', 'Pizzas']),
  it('burger', '🍔', 'burger', 'burgers', ['la hamburguesa', 'una hamburguesa', 'hamburguesas'], ['le hamburger', 'un hamburger', 'hamburgers'], ['der Burger', 'einen Burger', 'Burger']),
  it('cheese', '🧀', 'cheese', 'cheeses', ['el queso', 'un queso', 'quesos'], ['le fromage', 'un fromage', 'fromages'], ['der Käse', 'einen Käse', 'Käse']),
  it('apple', '🍎', 'apple', 'apples', ['la manzana', 'una manzana', 'manzanas'], ['la pomme', 'une pomme', 'pommes'], ['der Apfel', 'einen Apfel', 'Äpfel']),
  it('banana', '🍌', 'banana', 'bananas', ['el plátano', 'un plátano', 'plátanos'], ['la banane', 'une banane', 'bananes'], ['die Banane', 'eine Banane', 'Bananen']),
  it('orange', '🍊', 'orange', 'oranges', ['la naranja', 'una naranja', 'naranjas'], ["l'orange", 'une orange', 'oranges'], ['die Orange', 'eine Orange', 'Orangen']),
  it('icecream', '🍦', 'ice cream', 'ice creams', ['el helado', 'un helado', 'helados'], ['la glace', 'une glace', 'glaces'], ['das Eis', 'ein Eis', 'Eis']),
  it('cookie', '🍪', 'cookie', 'cookies', ['la galleta', 'una galleta', 'galletas'], ['le biscuit', 'un biscuit', 'biscuits'], ['der Keks', 'einen Keks', 'Kekse']),
  it('chocolate', '🍫', 'chocolate bar', 'chocolate bars', ['el chocolate', 'un chocolate', 'chocolates'], ['le chocolat', 'un chocolat', 'chocolats'], ['die Schokolade', 'eine Schokolade', 'Schokoladen']),
  it('beer', '🍺', 'beer', 'beers', ['la cerveza', 'una cerveza', 'cervezas'], ['la bière', 'une bière', 'bières'], ['das Bier', 'ein Bier', 'Biere']),
  it('wine', '🍷', 'glass of wine', 'glasses of wine', ['el vino', 'un vino', 'vinos'], ['le vin', 'un vin', 'vins'], ['der Wein', 'einen Wein', 'Weine']),
  it('cola', '🥤', 'cola', 'colas', ['la cola', 'una cola', 'colas'], ['le coca', 'un coca', 'cocas'], ['die Cola', 'eine Cola', 'Colas']),
  it('lemonade', '🍋', 'lemonade', 'lemonades', ['la limonada', 'una limonada', 'limonadas'], ['la limonade', 'une limonade', 'limonades'], ['die Limonade', 'eine Limonade', 'Limonaden']),
  it('fish', '🐟', 'fish', 'fish dishes', ['el pescado', 'un pescado', 'pescados'], ['le poisson', 'un poisson', 'poissons'], ['der Fisch', 'einen Fisch', 'Fische']),
  it('chicken', '🍗', 'chicken', 'chicken dishes', ['el pollo', 'un pollo', 'pollos'], ['le poulet', 'un poulet', 'poulets'], ['das Hähnchen', 'ein Hähnchen', 'Hähnchen']),
  it('tomato', '🍅', 'tomato', 'tomatoes', ['el tomate', 'un tomate', 'tomates'], ['la tomate', 'une tomate', 'tomates'], ['die Tomate', 'eine Tomate', 'Tomaten']),
  it('potato', '🥔', 'potato', 'potatoes', ['la patata', 'una patata', 'patatas'], ['la pomme de terre', 'une pomme de terre', 'pommes de terre'], ['die Kartoffel', 'eine Kartoffel', 'Kartoffeln']),
  // ----- shop -----
  it('shirt', '👕', 'shirt', 'shirts', ['la camisa', 'una camisa', 'camisas'], ['la chemise', 'une chemise', 'chemises'], ['das Hemd', 'ein Hemd', 'Hemden']),
  it('pants', '👖', 'pair of pants', 'pairs of pants', ['el pantalón', 'un pantalón', 'pantalones'], ['le pantalon', 'un pantalon', 'pantalons'], ['die Hose', 'eine Hose', 'Hosen']),
  it('dress', '👗', 'dress', 'dresses', ['el vestido', 'un vestido', 'vestidos'], ['la robe', 'une robe', 'robes'], ['das Kleid', 'ein Kleid', 'Kleider']),
  it('cap', '🧢', 'cap', 'caps', ['la gorra', 'una gorra', 'gorras'], ['la casquette', 'une casquette', 'casquettes'], ['die Kappe', 'eine Kappe', 'Kappen']),
  it('hat', '👒', 'hat', 'hats', ['el sombrero', 'un sombrero', 'sombreros'], ['le chapeau', 'un chapeau', 'chapeaux'], ['der Hut', 'einen Hut', 'Hüte']),
  it('coat', '🧥', 'coat', 'coats', ['el abrigo', 'un abrigo', 'abrigos'], ['le manteau', 'un manteau', 'manteaux'], ['der Mantel', 'einen Mantel', 'Mäntel']),
  it('scarf', '🧣', 'scarf', 'scarves', ['la bufanda', 'una bufanda', 'bufandas'], ["l'écharpe", 'une écharpe', 'écharpes'], ['der Schal', 'einen Schal', 'Schals']),
  it('bag', '👜', 'bag', 'bags', ['el bolso', 'un bolso', 'bolsos'], ['le sac', 'un sac', 'sacs'], ['die Tasche', 'eine Tasche', 'Taschen']),
  it('backpack', '🎒', 'backpack', 'backpacks', ['la mochila', 'una mochila', 'mochilas'], ['le sac à dos', 'un sac à dos', 'sacs à dos'], ['der Rucksack', 'einen Rucksack', 'Rucksäcke']),
  it('umbrella', '☂️', 'umbrella', 'umbrellas', ['el paraguas', 'un paraguas', 'paraguas'], ['le parapluie', 'un parapluie', 'parapluies'], ['der Regenschirm', 'einen Regenschirm', 'Regenschirme']),
  it('watch', '⌚', 'watch', 'watches', ['el reloj', 'un reloj', 'relojes'], ['la montre', 'une montre', 'montres'], ['die Uhr', 'eine Uhr', 'Uhren']),
  it('ring', '💍', 'ring', 'rings', ['el anillo', 'un anillo', 'anillos'], ['la bague', 'une bague', 'bagues'], ['der Ring', 'einen Ring', 'Ringe']),
  it('tie', '👔', 'tie', 'ties', ['la corbata', 'una corbata', 'corbatas'], ['la cravate', 'une cravate', 'cravates'], ['die Krawatte', 'eine Krawatte', 'Krawatten']),
  it('shoe', '👞', 'shoe', 'shoes', ['el zapato', 'un zapato', 'zapatos'], ['la chaussure', 'une chaussure', 'chaussures'], ['der Schuh', 'einen Schuh', 'Schuhe']),
  it('swimsuit', '🩱', 'swimsuit', 'swimsuits', ['el bañador', 'un bañador', 'bañadores'], ['le maillot de bain', 'un maillot de bain', 'maillots de bain'], ['der Badeanzug', 'einen Badeanzug', 'Badeanzüge']),
  it('book', '📖', 'book', 'books', ['el libro', 'un libro', 'libros'], ['le livre', 'un livre', 'livres'], ['das Buch', 'ein Buch', 'Bücher']),
  // ----- home -----
  it('spoon', '🥄', 'spoon', 'spoons', ['la cuchara', 'una cuchara', 'cucharas'], ['la cuillère', 'une cuillère', 'cuillères'], ['der Löffel', 'einen Löffel', 'Löffel']),
  it('knife', '🔪', 'knife', 'knives', ['el cuchillo', 'un cuchillo', 'cuchillos'], ['le couteau', 'un couteau', 'couteaux'], ['das Messer', 'ein Messer', 'Messer']),
  it('plate', '🍽️', 'plate', 'plates', ['el plato', 'un plato', 'platos'], ["l'assiette", 'une assiette', 'assiettes'], ['der Teller', 'einen Teller', 'Teller']),
  it('glass', '🥃', 'glass', 'glasses', ['el vaso', 'un vaso', 'vasos'], ['le verre', 'un verre', 'verres'], ['das Glas', 'ein Glas', 'Gläser']),
  it('key', '🔑', 'key', 'keys', ['la llave', 'una llave', 'llaves'], ['la clé', 'une clé', 'clés'], ['der Schlüssel', 'einen Schlüssel', 'Schlüssel']),
  it('broom', '🧹', 'broom', 'brooms', ['la escoba', 'una escoba', 'escobas'], ['le balai', 'un balai', 'balais'], ['der Besen', 'einen Besen', 'Besen']),
  it('sponge', '🧽', 'sponge', 'sponges', ['la esponja', 'una esponja', 'esponjas'], ["l'éponge", 'une éponge', 'éponges'], ['der Schwamm', 'einen Schwamm', 'Schwämme']),
  it('soap', '🧼', 'bar of soap', 'bars of soap', ['el jabón', 'un jabón', 'jabones'], ['le savon', 'un savon', 'savons'], ['die Seife', 'eine Seife', 'Seifen']),
  it('toothbrush', '🪥', 'toothbrush', 'toothbrushes', ['el cepillo de dientes', 'un cepillo de dientes', 'cepillos de dientes'], ['la brosse à dents', 'une brosse à dents', 'brosses à dents'], ['die Zahnbürste', 'eine Zahnbürste', 'Zahnbürsten']),
  it('bulb', '💡', 'light bulb', 'light bulbs', ['la bombilla', 'una bombilla', 'bombillas'], ["l'ampoule", 'une ampoule', 'ampoules'], ['die Glühbirne', 'eine Glühbirne', 'Glühbirnen']),
  it('candle', '🕯️', 'candle', 'candles', ['la vela', 'una vela', 'velas'], ['la bougie', 'une bougie', 'bougies'], ['die Kerze', 'eine Kerze', 'Kerzen']),
  it('phone', '📱', 'phone', 'phones', ['el móvil', 'un móvil', 'móviles'], ['le portable', 'un portable', 'portables'], ['das Handy', 'ein Handy', 'Handys']),
  it('chair', '🪑', 'chair', 'chairs', ['la silla', 'una silla', 'sillas'], ['la chaise', 'une chaise', 'chaises'], ['der Stuhl', 'einen Stuhl', 'Stühle']),
  it('bucket', '🪣', 'bucket', 'buckets', ['el cubo', 'un cubo', 'cubos'], ['le seau', 'un seau', 'seaux'], ['der Eimer', 'einen Eimer', 'Eimer']),
  it('plant', '🪴', 'plant', 'plants', ['la planta', 'una planta', 'plantas'], ['la plante', 'une plante', 'plantes'], ['die Pflanze', 'eine Pflanze', 'Pflanzen']),
  // ----- travel -----
  it('ticket', '🎫', 'ticket', 'tickets', ['el billete', 'un billete', 'billetes'], ['le billet', 'un billet', 'billets'], ['die Fahrkarte', 'eine Fahrkarte', 'Fahrkarten']),
  it('citymap', '🗺️', 'city map', 'city maps', ['el mapa', 'un mapa', 'mapas'], ['le plan', 'un plan', 'plans'], ['der Stadtplan', 'einen Stadtplan', 'Stadtpläne']),
  it('suitcase', '🧳', 'suitcase', 'suitcases', ['la maleta', 'una maleta', 'maletas'], ['la valise', 'une valise', 'valises'], ['der Koffer', 'einen Koffer', 'Koffer']),
  it('taxi', '🚕', 'taxi', 'taxis', ['el taxi', 'un taxi', 'taxis'], ['le taxi', 'un taxi', 'taxis'], ['das Taxi', 'ein Taxi', 'Taxis']),
  it('timetable', '📅', 'timetable', 'timetables', ['el horario', 'un horario', 'horarios'], ["l'horaire", 'un horaire', 'horaires'], ['der Fahrplan', 'einen Fahrplan', 'Fahrpläne']),
  it('guidebook', '📘', 'guidebook', 'guidebooks', ['la guía', 'una guía', 'guías'], ['le guide', 'un guide', 'guides'], ['der Reiseführer', 'einen Reiseführer', 'Reiseführer']),
  it('bike', '🚲', 'bike', 'bikes', ['la bicicleta', 'una bicicleta', 'bicicletas'], ['le vélo', 'un vélo', 'vélos'], ['das Fahrrad', 'ein Fahrrad', 'Fahrräder']),
  it('car', '🚗', 'car', 'cars', ['el coche', 'un coche', 'coches'], ['la voiture', 'une voiture', 'voitures'], ['das Auto', 'ein Auto', 'Autos']),
  it('postcard', '🏞️', 'postcard', 'postcards', ['la postal', 'una postal', 'postales'], ['la carte postale', 'une carte postale', 'cartes postales'], ['die Postkarte', 'eine Postkarte', 'Postkarten']),
  it('camera', '📷', 'camera', 'cameras', ['la cámara', 'una cámara', 'cámaras'], ["l'appareil photo", 'un appareil photo', 'appareils photo'], ['die Kamera', 'eine Kamera', 'Kameras']),
  it('sunscreen', '🧴', 'sunscreen', 'tubes of sunscreen', ['la crema solar', 'una crema solar', 'cremas solares'], ['la crème solaire', 'une crème solaire', 'crèmes solaires'], ['die Sonnencreme', 'eine Sonnencreme', 'Sonnencremes']),
  // ----- flight -----
  it('blanket', '🛌', 'blanket', 'blankets', ['la manta', 'una manta', 'mantas'], ['la couverture', 'une couverture', 'couvertures'], ['die Decke', 'eine Decke', 'Decken']),
  it('newspaper', '📰', 'newspaper', 'newspapers', ['el periódico', 'un periódico', 'periódicos'], ['le journal', 'un journal', 'journaux'], ['die Zeitung', 'eine Zeitung', 'Zeitungen']),
  it('pen', '🖊️', 'pen', 'pens', ['el bolígrafo', 'un bolígrafo', 'bolígrafos'], ['le stylo', 'un stylo', 'stylos'], ['der Stift', 'einen Stift', 'Stifte']),
  it('magazine', '📔', 'magazine', 'magazines', ['la revista', 'una revista', 'revistas'], ['le magazine', 'un magazine', 'magazines'], ['die Zeitschrift', 'eine Zeitschrift', 'Zeitschriften']),
  // ----- hotel -----
  it('room', '🛏️', 'room', 'rooms', ['la habitación', 'una habitación', 'habitaciones'], ['la chambre', 'une chambre', 'chambres'], ['das Zimmer', 'ein Zimmer', 'Zimmer']),
  it('breakfast', '🍳', 'breakfast', 'breakfasts', ['el desayuno', 'un desayuno', 'desayunos'], ['le petit-déjeuner', 'un petit-déjeuner', 'petits-déjeuners'], ['das Frühstück', 'ein Frühstück', 'Frühstücke']),
  it('shampoo', '🧴', 'shampoo', 'bottles of shampoo', ['el champú', 'un champú', 'champús'], ['le shampooing', 'un shampooing', 'shampooings'], ['das Shampoo', 'ein Shampoo', 'Shampoos']),
  it('alarm', '⏰', 'alarm clock', 'alarm clocks', ['el despertador', 'un despertador', 'despertadores'], ['le réveil', 'un réveil', 'réveils'], ['der Wecker', 'einen Wecker', 'Wecker']),
  it('password', '🔐', 'Wi-Fi password', 'Wi-Fi passwords', ['la contraseña', 'una contraseña', 'contraseñas'], ['le mot de passe', 'un mot de passe', 'mots de passe'], ['das Passwort', 'ein Passwort', 'Passwörter']),
  it('bill', '🧾', 'bill', 'bills', ['la factura', 'una factura', 'facturas'], ['la facture', 'une facture', 'factures'], ['die Rechnung', 'eine Rechnung', 'Rechnungen']),
];

export const itemById = (id) => ITEMS.find((x) => x.id === id);

const AND = { es: 'y', fr: 'et', de: 'und' };

export const FRAME_COUNT = 4; // the café's pattern count, kept for older callers

// order: [{id, qty}], frame: 0..3
export function itemPhrase(lang, id, qty) {
  const x = itemById(id)[lang];
  return qty <= 1 ? x.one : `${NUMS[lang][qty]} ${x.pl}`;
}

export function joinList(lang, parts) {
  if (parts.length <= 1) return parts[0] || '';
  return parts.slice(0, -1).join(', ') + ` ${AND[lang]} ` + parts[parts.length - 1];
}

export const frameCount = (sceneId, lang) => sceneById(sceneId).frames[lang].length;

export function sentence(lang, order, frame = 0, sceneId = 'cafe') {
  const list = joinList(lang, order.map((o) => itemPhrase(lang, o.id, o.qty)));
  const frames = sceneById(sceneId).frames[lang];
  const [pre, post] = frames[frame % frames.length];
  let text = pre + list + post;
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

const aAn = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
export function english(order) {
  const parts = order.map((o) => {
    const x = itemById(o.id);
    return o.qty <= 1 ? aAn(x.en) : `${o.qty} ${x.enPl}`;
  });
  if (parts.length <= 1) return parts[0] || '';
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

// The English meaning of a whole request, using the same pattern the customer used.
export function englishLine(order, frame = 0, sceneId = 'cafe') {
  const en = sceneById(sceneId).en;
  const [pre, post] = en[frame % en.length];
  const t = pre + english(order) + post;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// A few useful phrases shown after each shift and on happy customers.
export const PHRASES = {
  es: [
    ['¡Buenos días!', 'Good morning!'],
    ['Gracias', 'Thank you'],
    ['De nada', "You're welcome"],
    ['Por favor', 'Please'],
    ['La cuenta, por favor', 'The check, please'],
    ['¡Que aproveche!', 'Enjoy your meal!'],
    ['¿Algo más?', 'Anything else?'],
    ['Está delicioso', "It's delicious"],
  ],
  fr: [
    ['Bonjour !', 'Hello!'],
    ['Merci beaucoup', 'Thank you very much'],
    ['De rien', "You're welcome"],
    ["S'il vous plaît", 'Please'],
    ["L'addition, s'il vous plaît", 'The check, please'],
    ['Bon appétit !', 'Enjoy your meal!'],
    ['Autre chose ?', 'Anything else?'],
    ["C'est délicieux", "It's delicious"],
  ],
  de: [
    ['Guten Morgen!', 'Good morning!'],
    ['Danke schön', 'Thank you very much'],
    ['Bitte schön', "You're welcome"],
    ['Bitte', 'Please'],
    ['Die Rechnung, bitte', 'The check, please'],
    ['Guten Appetit!', 'Enjoy your meal!'],
    ['Noch etwas?', 'Anything else?'],
    ['Das schmeckt lecker', 'It tastes great'],
  ],
};
export const THANKS = { es: ['Gracias', '¡Perfecto!', '¡Genial!'], fr: ['Merci', 'Parfait !', 'Super !'], de: ['Danke', 'Perfekt!', 'Super!'] };
