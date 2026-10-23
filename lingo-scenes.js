// Lingo scenarios: everything that makes the café, the shop or the plane different is data in this file.
// The engine (cafe-core.js), lesson (cafe-lesson.js) and screen (cafe.js) read it and never branch on a scenario id.
//
// A scenario has:
//   items     ids from the vocabulary bank in cafe-data.js, in the order they are taught
//   frames    request patterns per language: [before, after] around the list of things asked for.
//             Every pattern takes its object with an indefinite article ("un café", "einen Hut"),
//             so the noun forms in the bank work in all of them.
//   en        the English meaning of each frame, same order
//   stations  where requests come from (tables, rooms, seats), named in each language and in English
//   phrases   useful lines shown after a round
//   people/role/place text, and look: the visual setting the screen applies

const seats = (word) => ['12A', '12C', '14A', '14D'].map((n) => `${word} ${n}`);

export const SCENES = [
  {
    id: 'cafe',
    name: 'Café',
    role: 'Server',
    people: 'customers',
    blurb: 'Take orders at the tables and bring the right food and drinks.',
    look: { icon: '☕', a: '#c58bff', b: '#7c5cff', tray: 'Counter' },
    items: [
      'coffee', 'tea', 'water', 'bread', 'croissant', 'cake', 'juice', 'milkshake', 'sandwich', 'salad', 'soup', 'pizza', 'burger', 'cheese',
      'apple', 'banana', 'orange', 'icecream', 'cookie', 'chocolate', 'beer', 'wine', 'cola', 'lemonade', 'fish', 'chicken', 'tomato', 'potato',
    ],
    frames: {
      es: [['Quisiera ', ', por favor.'], ['Para mí, ', ', por favor.'], ['¿Me pone ', '?'], ['Hola, ', ', por favor.']],
      fr: [['Je voudrais ', ", s'il vous plaît."], ['Pour moi, ', ", s'il vous plaît."], ['Je prends ', ", s'il vous plaît."], ['Bonjour, ', ", s'il vous plaît."]],
      de: [['Ich hätte gern ', ', bitte.'], ['Für mich ', ', bitte.'], ['', ', bitte.'], ['Hallo! Ich nehme ', ', bitte.']],
    },
    en: [['I would like ', ', please.'], ['For me, ', ', please.'], ['Could I have ', '?'], ['Hello, ', ', please.']],
    stations: {
      es: ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4'],
      fr: ['Table 1', 'Table 2', 'Table 3', 'Table 4'],
      de: ['Tisch 1', 'Tisch 2', 'Tisch 3', 'Tisch 4'],
      en: ['Table 1', 'Table 2', 'Table 3', 'Table 4'],
    },
    phrases: {
      es: [['¡Buenos días!', 'Good morning!'], ['La cuenta, por favor', 'The check, please'], ['¡Que aproveche!', 'Enjoy your meal!'], ['¿Algo más?', 'Anything else?'], ['Está delicioso', "It's delicious"], ['De nada', "You're welcome"]],
      fr: [['Bonjour !', 'Hello!'], ["L'addition, s'il vous plaît", 'The check, please'], ['Bon appétit !', 'Enjoy your meal!'], ['Autre chose ?', 'Anything else?'], ["C'est délicieux", "It's delicious"], ['De rien', "You're welcome"]],
      de: [['Guten Morgen!', 'Good morning!'], ['Die Rechnung, bitte', 'The check, please'], ['Guten Appetit!', 'Enjoy your meal!'], ['Noch etwas?', 'Anything else?'], ['Das schmeckt lecker', 'It tastes great'], ['Bitte schön', "You're welcome"]],
    },
  },
  {
    id: 'shop',
    name: 'Clothes shop',
    role: 'Shop assistant',
    people: 'shoppers',
    blurb: 'Shoppers ask for clothes and accessories. Find the right item fast.',
    look: { icon: '🛍️', a: '#ff8fb3', b: '#e0457b', tray: 'Shelves' },
    items: ['shirt', 'pants', 'dress', 'hat', 'coat', 'scarf', 'bag', 'shoe', 'cap', 'watch', 'tie', 'backpack', 'umbrella', 'ring', 'swimsuit', 'book'],
    frames: {
      es: [['Busco ', '.'], ['¿Tiene ', '?'], ['Quiero comprar ', '.']],
      fr: [['Je cherche ', '.'], ['Vous avez ', ' ?'], ['Je voudrais acheter ', '.']],
      de: [['Ich suche ', '.'], ['Haben Sie ', '?'], ['Ich möchte ', ' kaufen.']],
    },
    en: [['I am looking for ', '.'], ['Do you have ', '?'], ['I would like to buy ', '.']],
    stations: {
      es: ['Caja 1', 'Caja 2', 'Probador', 'Mostrador'],
      fr: ['Caisse 1', 'Caisse 2', 'Cabine', 'Comptoir'],
      de: ['Kasse 1', 'Kasse 2', 'Umkleide', 'Theke'],
      en: ['Till 1', 'Till 2', 'Fitting room', 'Counter'],
    },
    phrases: {
      es: [['¿Cuánto cuesta?', 'How much is it?'], ['¿Puedo probármelo?', 'Can I try it on?'], ['Es demasiado grande', "It's too big"], ['Quiero devolver esto', 'I want to return this'], ['¿Aceptan tarjeta?', 'Do you take cards?']],
      fr: [['Combien ça coûte ?', 'How much is it?'], ['Je peux l’essayer ?', 'Can I try it on?'], ["C'est trop grand", "It's too big"], ['Je voudrais rendre ceci', 'I would like to return this'], ['Vous acceptez la carte ?', 'Do you take cards?']],
      de: [['Wie viel kostet das?', 'How much is it?'], ['Kann ich das anprobieren?', 'Can I try it on?'], ['Das ist zu groß', "It's too big"], ['Ich möchte das zurückgeben', 'I want to return this'], ['Kann ich mit Karte zahlen?', 'Can I pay by card?']],
    },
  },
  {
    id: 'home',
    name: 'Home',
    role: 'Family helper',
    people: 'family members',
    blurb: 'Everyone at home needs something from another room. Hand it over.',
    look: { icon: '🏠', a: '#ffc83d', b: '#ff9a3d', tray: 'Around the house' },
    items: ['spoon', 'plate', 'glass', 'knife', 'key', 'book', 'phone', 'chair', 'soap', 'toothbrush', 'broom', 'sponge', 'bulb', 'candle', 'bucket', 'plant'],
    frames: {
      es: [['¿Me pasas ', '?'], ['¿Me traes ', ', por favor?'], ['Necesito ', '.']],
      fr: [['Tu me passes ', ' ?'], ["Tu peux m'apporter ", ' ?'], ['Il me faut ', '.']],
      de: [['Gibst du mir ', '?'], ['Kannst du mir ', ' bringen?'], ['Ich brauche ', '.']],
    },
    en: [['Can you pass me ', '?'], ['Can you bring me ', ', please?'], ['I need ', '.']],
    stations: {
      es: ['La cocina', 'El salón', 'El baño', 'El dormitorio'],
      fr: ['La cuisine', 'Le salon', 'La salle de bain', 'La chambre'],
      de: ['Die Küche', 'Das Wohnzimmer', 'Das Bad', 'Das Schlafzimmer'],
      en: ['Kitchen', 'Living room', 'Bathroom', 'Bedroom'],
    },
    phrases: {
      es: [['Pon la mesa', 'Set the table'], ['Friega los platos', 'Wash the dishes'], ['Haz la cama', 'Make the bed'], ['Apaga la luz', 'Turn off the light'], ['¿Me ayudas?', 'Can you help me?']],
      fr: [['Mets la table', 'Set the table'], ['Fais la vaisselle', 'Wash the dishes'], ['Fais ton lit', 'Make your bed'], ['Éteins la lumière', 'Turn off the light'], ['Tu peux m’aider ?', 'Can you help me?']],
      de: [['Deck den Tisch', 'Set the table'], ['Spül das Geschirr', 'Wash the dishes'], ['Mach dein Bett', 'Make your bed'], ['Mach das Licht aus', 'Turn off the light'], ['Kannst du mir helfen?', 'Can you help me?']],
    },
  },
  {
    id: 'travel',
    name: 'Train station',
    role: 'Travel desk',
    people: 'travelers',
    blurb: 'Travelers need tickets, maps and rides. Help them on their way.',
    look: { icon: '🚆', a: '#35e6a0', b: '#16a3a8', tray: 'Desk' },
    items: ['ticket', 'citymap', 'taxi', 'suitcase', 'timetable', 'guidebook', 'bike', 'car', 'water', 'umbrella', 'camera', 'backpack', 'postcard', 'sunscreen'],
    frames: {
      es: [['Necesito ', ', por favor.'], ['¿Me da ', '?'], ['Busco ', '.']],
      fr: [['Il me faut ', ", s'il vous plaît."], ['Vous pouvez me donner ', ' ?'], ['Je cherche ', '.']],
      de: [['Ich brauche ', ', bitte.'], ['Können Sie mir ', ' geben?'], ['Ich suche ', '.']],
    },
    en: [['I need ', ', please.'], ['Could you give me ', '?'], ['I am looking for ', '.']],
    stations: {
      es: ['Taquilla', 'Información', 'Andén 2', 'Parada de taxis'],
      fr: ['Guichet', 'Information', 'Quai 2', 'Station de taxis'],
      de: ['Schalter', 'Information', 'Gleis 2', 'Taxistand'],
      en: ['Ticket desk', 'Information', 'Platform 2', 'Taxi rank'],
    },
    phrases: {
      es: [['¿Dónde está la estación?', 'Where is the station?'], ['Gire a la izquierda', 'Turn left'], ['Siga recto', 'Go straight on'], ['Un billete de ida y vuelta', 'A return ticket'], ['¿A qué hora sale el tren?', 'What time does the train leave?']],
      fr: [['Où est la gare ?', 'Where is the station?'], ['Tournez à gauche', 'Turn left'], ['Allez tout droit', 'Go straight on'], ['Un billet aller-retour', 'A return ticket'], ['À quelle heure part le train ?', 'What time does the train leave?']],
      de: [['Wo ist der Bahnhof?', 'Where is the station?'], ['Biegen Sie links ab', 'Turn left'], ['Gehen Sie geradeaus', 'Go straight on'], ['Eine Rückfahrkarte', 'A return ticket'], ['Wann fährt der Zug ab?', 'When does the train leave?']],
    },
  },
  {
    id: 'flight',
    name: 'Flight',
    role: 'Flight attendant',
    people: 'passengers',
    blurb: 'Work the aisle with the service cart. Passengers call from their seats.',
    look: { icon: '✈️', a: '#4db4ff', b: '#2a7dff', tray: 'Service cart' },
    items: ['water', 'coffee', 'tea', 'juice', 'blanket', 'newspaper', 'sandwich', 'cookie', 'cola', 'wine', 'pen', 'magazine', 'chocolate', 'beer'],
    frames: {
      es: [['¿Me puede traer ', ', por favor?'], ['Perdone, ¿tiene ', '?'], ['Quisiera ', ', por favor.']],
      fr: [["Pourriez-vous m'apporter ", ", s'il vous plaît ?"], ['Excusez-moi, vous avez ', ' ?'], ['Je voudrais ', ", s'il vous plaît."]],
      de: [['Könnten Sie mir ', ' bringen?'], ['Entschuldigung, haben Sie ', '?'], ['Ich hätte gern ', ', bitte.']],
    },
    en: [['Could you bring me ', ', please?'], ['Excuse me, do you have ', '?'], ['I would like ', ', please.']],
    stations: { es: seats('Asiento'), fr: seats('Siège'), de: seats('Platz'), en: seats('Seat') },
    phrases: {
      es: [['Bienvenidos a bordo', 'Welcome aboard'], ['Abróchense el cinturón', 'Fasten your seatbelts'], ['Su tarjeta de embarque, por favor', 'Your boarding pass, please'], ['¿Pasillo o ventanilla?', 'Aisle or window?'], ['El equipaje va arriba', 'Bags go in the overhead bin']],
      fr: [['Bienvenue à bord', 'Welcome aboard'], ['Attachez vos ceintures', 'Fasten your seatbelts'], ["Votre carte d'embarquement, s'il vous plaît", 'Your boarding pass, please'], ['Couloir ou hublot ?', 'Aisle or window?'], ['Les bagages vont en haut', 'Bags go up above']],
      de: [['Willkommen an Bord', 'Welcome aboard'], ['Bitte schnallen Sie sich an', 'Please fasten your seatbelt'], ['Ihre Bordkarte, bitte', 'Your boarding pass, please'], ['Gang oder Fenster?', 'Aisle or window?'], ['Das Gepäck kommt ins Gepäckfach', 'Bags go in the overhead bin']],
    },
  },
  {
    id: 'hotel',
    name: 'Hotel',
    role: 'Receptionist',
    people: 'guests',
    blurb: 'Guests come to the front desk for keys, rooms and help.',
    look: { icon: '🛎️', a: '#ffd36b', b: '#c9962b', tray: 'Front desk' },
    items: ['key', 'room', 'breakfast', 'citymap', 'taxi', 'umbrella', 'password', 'bill', 'newspaper', 'shampoo', 'toothbrush', 'soap', 'alarm', 'blanket', 'water'],
    frames: {
      es: [['Necesito ', ', por favor.'], ['¿Me puede dar ', '?'], ['¿Tiene ', '?']],
      fr: [['Il me faudrait ', ", s'il vous plaît."], ['Pouvez-vous me donner ', ' ?'], ['Vous avez ', ' ?']],
      de: [['Ich bräuchte ', ', bitte.'], ['Können Sie mir ', ' geben?'], ['Haben Sie ', '?']],
    },
    en: [['I need ', ', please.'], ['Can you give me ', '?'], ['Do you have ', '?']],
    stations: {
      es: ['Habitación 101', 'Habitación 204', 'Habitación 312', 'Habitación 415'],
      fr: ['Chambre 101', 'Chambre 204', 'Chambre 312', 'Chambre 415'],
      de: ['Zimmer 101', 'Zimmer 204', 'Zimmer 312', 'Zimmer 415'],
      en: ['Room 101', 'Room 204', 'Room 312', 'Room 415'],
    },
    phrases: {
      es: [['Tengo una reserva', 'I have a reservation'], ['¿A qué hora es el desayuno?', 'What time is breakfast?'], ['Su habitación está en el segundo piso', 'Your room is on the second floor'], ['El ascensor está allí', 'The elevator is over there'], ['¿Puedo dejar las maletas?', 'Can I leave my bags?']],
      fr: [["J'ai une réservation", 'I have a reservation'], ['Le petit-déjeuner est à quelle heure ?', 'What time is breakfast?'], ['Votre chambre est au deuxième étage', 'Your room is on the second floor'], ["L'ascenseur est là-bas", 'The elevator is over there'], ['Je peux laisser mes bagages ?', 'Can I leave my bags?']],
      de: [['Ich habe eine Reservierung', 'I have a reservation'], ['Wann gibt es Frühstück?', 'When is breakfast?'], ['Ihr Zimmer ist im zweiten Stock', 'Your room is on the second floor'], ['Der Aufzug ist dort drüben', 'The elevator is over there'], ['Kann ich mein Gepäck hier lassen?', 'Can I leave my bags here?']],
    },
  },
];

export const sceneById = (id) => SCENES.find((x) => x.id === id) || SCENES[0];

// Difficulty changes patience and pace only, never the words.
export const PACES = [
  { id: 'relaxed', name: 'Relaxed', patience: 1.4, gap: 1.25, points: 0.8, text: 'People wait longer. Good for brand-new words.' },
  { id: 'normal', name: 'Normal', patience: 1, gap: 1, points: 1, text: 'The usual pace.' },
  { id: 'rush', name: 'Rush', patience: 0.75, gap: 0.8, points: 1.5, text: 'Short patience and more arrivals, worth 50% more points.' },
  { id: 'practice', name: 'Untimed', patience: 1, gap: 1.5, points: .5, text: 'No patience countdown. Take all the time you need to understand each request.' },
];
