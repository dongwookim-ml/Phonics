// The explorer (js/heroes.js): a jungle adventurer, a girl or a boy, in a
// khaki shirt with pockets, rolled-up sleeves and a neckerchief, shorts and
// chunky boots, freckles from the sun. The girl wears a high ponytail, the
// boy messy hair; both start in a pith helmet or a bush hat with a
// backpack on.
(() => {
  // Her head and body (rows 0-17): a girl's face framed by her hair, the
  // ponytail is a hairstyle (STYLES); freckles (F) over her nose.
  const SHIRT = [
    '...oIIiddddiIIo...',
    '..oIIIIidDiIIISo..',
    '..oioSSIiIISSoio..',
    '..osoIIIiIIISoso..',
    '..osoJJJyyJJJoso..',
  ];
  const GIRL_TOP = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '.ohhhhhhhhhsshhho.',
    '.ohhhhhhsssssshho.',
    '.ohhhsskssskssho..',
    '.ohhhsskssskssho..',
    '.ohhhspsFsFspsho..',
    '.ohhhssssmsssshho.',
    '..ohhossssssohho..',
    '...ooooossooooo...',
  ].concat(SHIRT);
  const BOY_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '..ohhhshhhhshhho..',
    '...ohsssssssssho..',
    '...ohsskssskssho..',
    '...ohsskssskssho..',
    '....ospsFsFspso...',
    '....ossssmsssso...',
    '.....ossssssso....',
    '......oossoo......',
  ];
  const BOY_TOP_ROWS = BOY_HEAD.concat(SHIRT);

  // Below: knees, socks and chunky boots; the boots step apart as she walks.
  const BOOTS = [
    '.....ossoosso.....',
    '.....owwoowwo.....',
    '.....oKKooKKo.....',
    '.....oJJooJJo.....',
    '....oJJJooJJJo....',
    '....oooooooooo....',
  ];
  const step = (c, C) => ({ 7: `....o${c}${c}o..o${c}${c}o....`, 8: `...o${c}${c}${C}o..o${c}${c}${C}o...`, 9: '...ooooo..ooooo...' });
  const STEP = step('J', 'J');

  const SHAPES = {
    // Khaki shirt (her body), shorts in her colour with rolled cuffs.
    'explorer-safari': { icon: '🩳', art: {
      bottom: [
        '....oLdddddDDo....',
        '...oLddddddDDDo...',
        '...oLdddooddDDo...',
        '...oLLLLooLLLLo...',
      ].concat(BOOTS),
      walk: STEP,
      ride: { flap: 2, cloth: 'dD', hem: 'L', leg: 's', sock: 'w', boot: 'J' },
    } },
    // Dungarees in her colour over the shirt, to the shin, gold buttons.
    'explorer-overalls': { icon: '👖', art: {
      top: {
        13: '...oIdiddddidIo...',
        14: '..oIIdIidDiIdISo..',
        15: '..oioydddddydoio..',
        16: '..osoddoDDoddoso..',
        17: '..osoddddddDDoso..',
      },
      bottom: [
        '....oLdddddDDo....',
        '....oLdddddDDo....',
        '....oLddooddDo....',
        '....oLddooddDo....',
        '....oLddooddDo....',
        '....oLLLooLLLo....',
        '.....oKKooKKo.....',
        '.....oJJooJJo.....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: STEP,
      ride: { flap: 4, cloth: 'dD', hem: 'L', leg: 'd', boot: 'J' },
    } },
    // A rain poncho in her colour over everything, yellow rain boots.
    'explorer-poncho': { icon: '🌧️', art: {
      top: {
        13: '....oLDDDDDDDo....',
        14: '...oLddwddwddDo...',
        15: '...oLLdwddwdDDo...',
        16: '..oLdLddddddDDDo..',
        17: '..oLddLdddddDDDo..',
      },
      bottom: [
        '.oLdddLddddddDDDo.',
        '.oLdddoDDDDoddDDo.',
        'oLddddoDDDDoddDDDo',
        'otttttttttttttttto',
        '.....ossoosso.....',
        '.....oyyooyyo.....',
        '.....oyyooyyo.....',
        '.....oyyooyyo.....',
        '....oyyYooyyYo....',
        '....oooooooooo....',
      ],
      walk: step('y', 'Y'),
      ride: { flap: 3, cloth: 'dD', hem: 't', leg: 's', boot: 'y' },
    } },
    // A long coat in her colour, open over the shirt and a white scarf,
    // khaki trousers in tall boots.
    'explorer-coat': { icon: '🧥', art: {
      top: {
        13: '...oLdiwwwwidDo...',
        14: '..oLddiiwWiiddDo..',
        15: '..oLodiiIiiddoDo..',
        16: '..oLoddiiiiddoDo..',
        17: '..osodJJyyJJdoso..',
      },
      bottom: [
        '...oLddddddddDo...',
        '...oLddoIIoddDo...',
        '..oLdddoIIodddDo..',
        '..oLddoIooIoddDo..',
        '..oLddoIooIoddDo..',
        '..otttoIooIottto..',
        '.....oJJooJJo.....',
        '.....oJJooJJo.....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: STEP,
      ride: { flap: 5, cloth: 'dD', hem: 't', leg: 'I', boot: 'J' },
    } },
    // Leafy green camouflage from the Fairy Village.
    'explorer-camo': { icon: '🌿', fairy: true, art: {
      top: {
        13: '...oqQiddddiqqo...',
        14: '..oQqqqidDiqQqQo..',
        15: '..oqoQqqiqQqqoqo..',
        16: '..osoqQqiqqQqoso..',
        17: '..osoJJJyyJJJoso..',
      },
      bottom: [
        '....oqQqqqQqQo....',
        '...oQqqQqqqQqQo...',
        '...oqqQoooqQqQo...',
        '...oQQQQooQQQQo...',
      ].concat(BOOTS),
      walk: STEP,
      ride: { flap: 2, cloth: 'qQ', hem: 'Q', leg: 's', sock: 'w', boot: 'J' },
    } },
    // A girl's knee-length skirt in her colour with big pockets.
    'explorer-skirt': { icon: '👗', girl: true, art: {
      bottom: [
        '....oLdddddDDo....',
        '...oLddddddDDDo...',
        '...oLoDDoddoDDo...',
        '..oLdoDDoddoDDDo..',
        '..oLddddddddDDDo..',
        '..oLLLLLLLLLLLLo..',
        '.....owwoowwo.....',
        '.....oJJooJJo.....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: STEP,
      ride: { flap: 4, cloth: 'dD', hem: 'L', leg: 's', sock: 'w', boot: 'J' },
    } },
  };

  const HEADS = {
    // A round sun helmet with a band in her colour.
    'explorer-pith': { icon: '👒', art: { x: 1, y: -5, rows: [
      '......oooo......',
      '....ooiiiIoo....',
      '...oiiiiiIIIo...',
      '..oiiiiiIIIISo..',
      '..oiiiIIIIIISo..',
      '..oddddddddDDo..',
      '.oiiIIIIIIIISSo.',
      'oiIIIIIIIIIIISSo',
      '.oooooooooooooo.',
    ] } },
    // A brown felt hat with a dent and a band in his colour.
    'explorer-bushhat': { icon: '🤠', art: { x: 1, y: -4, rows: [
      '.....oooooo.....',
      '....oKKJJKKo....',
      '....oKKKKKJo....',
      '...oddddddDDo...',
      '.ooKKKKKKKKKJoo.',
      'oKKKKKKKKKKKKJJo',
      '.oooooooooooooo.',
    ] } },
    // Round goggles pushed up on the forehead.
    'explorer-goggles': { icon: '🥽', art: { x: 2, y: 2, rows: [
      '.ooooo..ooooo.',
      'KoZccooooZccoK',
      'Koccco..occcoK',
      '.ooooo..ooooo.',
    ] } },
    // A bandana in her colour with white dots, knotted at the side.
    'explorer-bandana': { icon: '🧣', art: { x: 1, y: -1, rows: [
      '.....oooooo.......',
      '...oodwdddwdoo....',
      '..odddddwddddDo...',
      '.odwddddddddwDDo..',
      '.oddddwddddddDDoo.',
      '.oooooooooooooodDo',
      '...............odo',
      '................o.',
    ] } },
    // A little lamp on a strap that shines in the Starlight Forest.
    'explorer-headlamp': { icon: '🔦', forest: true, art: { x: 2, y: -2, rows: [
      '......yy......',
      '...y..zz..y...',
      '.....oooo.....',
      '....oAaaAo....',
      '....oazzao....',
      'eeeeoazwaoeeee',
      '....oAaaAo....',
      '.....oooo.....',
    ] } },
  };

  const HANDS = {
    // An old treasure map with a red X.
    'explorer-map': { icon: '🗺️', art: { x: 12, y: 9, rows: [
      '.oooooo.',
      'oKKKKKJo',
      '.oiKiIo.',
      '.oiiKio.',
      '.oIiiKo.',
      '.oeieio.',
      '.oieiIo.',
      '.oeieio.',
      'oKKKKKJo',
      '.oooooo.',
    ] } },
    // A magnifying glass to look at bugs.
    'explorer-magnifier': { icon: '🔍', art: { x: 12, y: 7, rows: [
      '..oooo..',
      '.oyyyyo.',
      'oywcccyo',
      'oyccccyo',
      'oycccZyo',
      'oyccZZyo',
      '.oyyyyo.',
      '..oJJo..',
      '...oJo..',
      '...oKo..',
      '...oJo..',
      '....o...',
    ] } },
    // A gold compass, its red needle pointing north.
    'explorer-compass': { icon: '🧭', art: { x: 12, y: 11, rows: [
      '...o...',
      '..oyo..',
      '.oyyyo.',
      'oywewyo',
      'oywxwyo',
      'oywAwyo',
      '.oyyyo.',
      '..ooo..',
    ] } },
    // A net on a long stick for butterflies, from the Fairy Village.
    'explorer-net': { icon: '🦋', fairy: true, art: { x: 13, y: -4, rows: [
      '..ooo..',
      '.owWwo.',
      'owWwWwo',
      'oWwWwWo',
      'owWwWwo',
      '.owWwo.',
      '..oJo..',
      'PoPKo..',
      '.u.Jo..',
      'PoPKo..',
      '...J...',
      '...K...',
      '...J...',
      '...K...',
      '...J...',
      '...K...',
      '...J...',
      '...K...',
      '...J...',
      '...K...',
      '...J...',
    ] } },
    // Rainbow binoculars for spotting unicorns far away.
    'explorer-binoculars': { icon: '🌈', unicorn: true, art: { x: 11, y: 12, rows: [
      '.ooo.ooo.',
      'oeOyoyOeo',
      'oZccxZcco',
      'occcxccco',
      'oqBuoqBuo',
      '.ooo.ooo.',
    ] } },
  };

  // Things on her back, behind her (in their own colours, so the wardrobe
  // can show them without her).
  const INK = { o: '#4a2c4f' };
  const BACKS = {
    // A big brown rucksack peeking out on both sides, a green flap on top.
    'explorer-backpack': { icon: '🎒', art: { x: -2, y: 10, pal: INK, rows: [
      '...oooooooooooooooo...',
      '..oqqqqqqqqqqqqqqqqo..',
      '.oqqqqqqqqqqqqqqqqqQo.',
      '.oQyQQQQQQQQQQQQQQyQo.',
      '.oKJKKKKKKKKKKKKKKJJo.',
      '.oKJKKKKKKKKKKKKKKJJo.',
      '.oKKKKKKKKKKKKKKKKKJo.',
      '.oKKKKKKKKKKKKKKKKKJo.',
      '.oKKKKoooooooooKKKKJo.',
      '.oKKKoqqqqqqqqqoKKJJo.',
      '.oKKKoQyQQQQQyQoKKJJo.',
      '..oKKoKKKKKKKKKoKJJo..',
      '...oooooooooooooooo...',
    ] } },
    // A rolled-up blanket strapped behind her, across her back.
    'explorer-bedroll': { icon: '🏕️', art: { x: -2, y: 16, pal: INK, rows: [
      '..oooooooooooooooooo..',
      '.oeeeJeeeeeeeeeeJeeeo.',
      'oeiiiJiiiiiiiiiiJiiieo',
      'oeeeeJeeeeeeeeeeJeeeeo',
      'oevvvJvvvvvvvvvvJvvveo',
      '.oeeeJeeeeeeeeeeJeeeo.',
      '..oooooooooooooooooo..',
    ] } },
    // A canteen on a strap at her side and a coil of rope at the other.
    'explorer-canteen': { icon: '💧', art: { x: -2, y: 11, pal: INK, rows: [
      '...oJo................',
      '...oJo................',
      '...oJo................',
      '...oJo................',
      '..oaao................',
      '.oAAAAo...........oo..',
      'oAaaaaAo.........oKKo.',
      'oAaWaaAo........oKooKo',
      'oAaaaaAo........oKooKo',
      'oAAAAAAo.........oKKo.',
      '.oAAAAo...........oo..',
      '..oooo................',
    ] } },
  };

  const STYLES = {
    // A girl's high ponytail, tied with a band in her colour.
    'explorer-ponytail': { icon: '🐴', girl: true, art: { back: [[12, -4, [
      '..oooo..',
      '.ohhhHo.',
      'ohhhhhHo',
      'oddohhHo',
      'oddo.ohHo',
      '.oo..ohho',
      '.....oHho',
      '.....ohho',
      '......oho',
      '......oho',
      '......oHo',
      '.......o.',
    ]]] } },
    // One braid over her shoulder.
    'explorer-braid': { icon: '🌾', girl: true, art: { front: [[1, 9, [
      'ohho',
      'oHho',
      'ohHo',
      'oHho',
      'ohHo',
      'oHho',
      'ohHo',
      'oddo',
      'ohho',
      '.oo.',
    ]]] } },
    // Two round buns at her ears.
    'explorer-buns': { icon: '🐻', girl: true, art: { front: [
      [-1, 2, ['.oo.', 'ohho', 'oHhho', 'ohhho', '.odo', '..o']],
      [15, 2, ['.oo.', 'ohho', 'ohhHo', 'ohhho', 'odo.', 'o..']],
    ] } },
    // A boy's messy hair, tufts sticking out everywhere.
    'explorer-messy': { icon: '🌪️', boy: true, art: { front: [
      [3, -2, ['.o...o...o..', 'oho.oho.oho.', '.hho.hhohhh.']],
      [0, 3, ['.o.', 'ohh', '.oh', 'ohh', '.o.']],
      [15, 3, ['.o.', 'hho', 'ho.', 'hho', '.o.']],
    ] } },
    // A boy's quiff: his fringe brushed up in one big wave.
    'explorer-quiff': { icon: '🌊', boy: true, art: {
      rows: { 5: '..ohhssssssshhho..', 6: '...ohsssssssssho..' },
      front: [[6, -3, ['..oo..', '.ohho.', 'ohHhho', '.oohho']]],
    } },
    // A boy's curly mop down to his ears.
    'explorer-mop': { icon: '🐑', boy: true, art: {
      rows: { 5: '..ohhhhhhhhhhhho..' },
      back: [[0, 3, ['.oo', 'ohh', 'ohh', '.oh', 'ohh', 'ohh', '.oh', 'ohh', '.oo']], [15, 3, ['oo.', 'hho', 'hho', 'ho.', 'hho', 'hho', 'ho.', 'hho', 'oo.']]],
      front: [[3, 4, ['.oo.oo.oo.oo', 'ohhohhohhohh']]],
    } },
  };

  // Each thing's name: heroes.explorer.<its key without 'explorer-'>
  // (js/heroes/locales/explorer.js).
  const named = table => Object.fromEntries(Object.entries(table).map(([key, item]) => [key, Object.assign({ name: I18n.t(`heroes.explorer.${key.slice(9)}`) }, item)]));

  addHeroKit('explorer', {
    base: {
      girl: { top: GIRL_TOP },
      boy: { top: BOY_TOP_ROWS },
    },
    // Freckles from the sun.
    palette: (outfit, look, base) => Object.assign({}, base, { F: '#e39272' }),
    items: { shape: named(SHAPES), head: named(HEADS), hand: named(HANDS), back: named(BACKS), style: named(STYLES) },
    // The old explorer's outfit, sun helmet and telescope (js/sprites.js; a boy's only).
    uses: { shape: ['explorer'], head: ['safari'], hand: ['telescope'] },
    defaults: {
      girl: { shape: 'explorer-safari', head: 'explorer-pith', hand: 'none', back: 'explorer-backpack', style: 'explorer-ponytail', dress: 'green', hair: 'brown' },
      boy: { shape: 'explorer-safari', head: 'explorer-bushhat', hand: 'none', back: 'explorer-backpack', style: 'explorer-messy', dress: 'green', hair: 'brown' },
    },
  });
})();
