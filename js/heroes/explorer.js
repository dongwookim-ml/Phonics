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
    // A puffy snow parka in her colour with fur at the hood, cuffs and hem,
    // red mittens and fur-topped snow boots (sold in the shop).
    'explorer-parka': { icon: '🧤', shop: true, price: 12, art: {
      top: {
        13: '...owWwwwwwwwWo...',
        14: '.oLLdddddaddddDDo.',
        15: '.oLDDDDDDaDDDDDDo.',
        16: '.oLdoddddadddoDDo.',
        17: '.owwoddddadddowwo.',
      },
      bottom: [
        '.oeeoLdddadddoeeo.',
        '..oooLDDDaDDDooo..',
        '....owwwwwwwWo....',
        '.....oDDooDDo.....',
        '.....oDDooDDo.....',
        '....owwWoowwWo....',
        '....oKKKooKKKo....',
        '....oKKKooKKKo....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: { 6: '....oKKKooKKKo....', 7: '...oKKKo..oKKKo...', 8: '...oJJJo..oJJJo...', 9: '...ooooo..ooooo...' },
      ride: { flap: 3, cloth: 'dD', hem: 'w', leg: 'D', sock: 'w', boot: 'K' },
    } },
    // A vest in her colour, all pockets, and long khaki cargo trousers with
    // pockets at the knees.
    'explorer-cargo': { icon: '🦺', art: {
      top: {
        13: '...oIdiddddidIo...',
        14: '..oIIddidDiddISo..',
        15: '..oiodDDiiDDdoio..',
        16: '..osodDDiiDDdoso..',
        17: '..osoJJJyyJJJoso..',
      },
      bottom: [
        '....oIIIIIISSo....',
        '....oIIIIIIISo....',
        '....oIIIooIISo....',
        '....oIIIooIISo....',
        '....oSSIooISSo....',
        '....oSSIooISSo....',
        '....oIIIooIISo....',
        '.....oJJooJJo.....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: STEP,
      ride: { flap: 2, cloth: 'IS', hem: 'S', leg: 'I', boot: 'J' },
    } },
    // A girl's safari shirt-dress in her colour: a white collar, puffed
    // sleeves, a belt and a flared skirt (from the Unicorn Village).
    'explorer-shirtdress': { icon: '👚', girl: true, unicorn: true, art: {
      top: {
        13: '...oLdwwsswwdDo...',
        14: '..oLLddwddwddDDo..',
        15: '..osodddydddDoso..',
        16: '..osoLddydddDoso..',
        17: '..osoJJJyyJJJoso..',
      },
      bottom: [
        '....oLddyddDDo....',
        '...oLdddydddDDo...',
        '..oLddddyddddDDo..',
        '..oLddddddddDDDo..',
        '.otttttttttttttto.',
        '.....ossoosso.....',
        '.....owwoowwo.....',
        '.....oJJooJJo.....',
        '....oJJJooJJJo....',
        '....oooooooooo....',
      ],
      walk: STEP,
      ride: { flap: 4, cloth: 'dD', hem: 't', leg: 's', sock: 'w', boot: 'J' },
    } },
    // A boy's riding breeches in his colour, wide at the thighs, and tall
    // black riding boots (from the Unicorn Village).
    'explorer-jodhpurs': { icon: '🏇', boy: true, unicorn: true, art: {
      bottom: [
        '....oLdddddDDo....',
        '...oLddddddDDDo...',
        '..oLddddooddDDDo..',
        '..oLdddo..oddDDo..',
        '...oLddo..oddDo...',
        '.....oxXooxXo.....',
        '.....oxXooxXo.....',
        '.....oxXooxXo.....',
        '....oxxXooxxXo....',
        '....oooooooooo....',
      ],
      walk: step('x', 'X'),
      ride: { flap: 2, cloth: 'dD', hem: 'D', leg: 'd', boot: 'x' },
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
    // A diving mask over her eyes and a snorkel up beside her head.
    'explorer-snorkel': { icon: '🤿', art: { x: 2, y: -3, rows: [
      '.............ooo',
      '.............oOo',
      '.............oyo',
      '.............oOo',
      '.............oOo',
      '.............oyo',
      '.............oOo',
      '.............oOo',
      '.............oyo',
      '..ooooooooooooOo',
      'xxoBZkccckcBooOo',
      '..oBckccckcBooOo',
      '..oBBBBoBBBBooOo',
      '...ooooooooo.oOo',
      '........oOOOOOOo',
      '.........oooooo',
    ] } },
    // A knitted bobble hat in her colour with earflaps and woolly ties (from
    // the Unicorn Village).
    'explorer-beanie': { icon: '🧶', unicorn: true, art: { x: 1, y: -5, rows: [
      '.......oo',
      '......owWo',
      '......oWwo',
      '.....oooooo',
      '..owdwdwdwdwDo',
      '..oddddddddDDo',
      '.oLDLDLDLDLDLDo',
      'oddo........oddo',
      'owdo........odwo',
      'oddo........oddo',
      '.odo........odo',
      '..o..........o',
      '..w..........w',
      '..w..........w',
      '.oWo........oWo',
      '..o..........o',
    ] } },
    // A khaki desert cap with a leather peak and a cloth flap hanging over
    // her ears and neck against the sun.
    'explorer-desertcap': { icon: '🧢', art: { x: 1, y: -3, rows: [
      '...ooooooooooo',
      '...oiiiiiiiIIo',
      '...oiiiiiiiIIo',
      '...oiiiiiiiIIo',
      '..oddddddddddDo',
      'oIIoJJJJJJJJJoIIo',
      'oIIoooooooooooIIo',
      'oISo.........oSIo',
      'oISo.........oSIo',
      'oISo.........oSIo',
      'oISo.........oSIo',
      'oIIo.........oIIo',
      'oISo.........oSIo',
      '.oSo.........oSo',
      '..o...........o',
    ] } },
    // A girl's big red jungle flower over her ear, with a leaf (from the
    // Fairy Village).
    'explorer-flower': { icon: '🌺', girl: true, fairy: true, art: { x: -1, y: 0, rows: [
      '..oo.oo',
      '.oEeoeEo',
      '.oeeyeeo',
      '..oyzyo',
      '.oeeyeeo',
      'ooEeoeEo',
      'oQoo.oo',
      '.oo',
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
    // A little spade for digging up treasure.
    'explorer-shovel': { icon: '⛏️', art: { x: 14, y: 6, rows: [
      'ooooo',
      'oKJKo',
      '.oJo',
      '.oKo',
      '.oJo',
      '.oKo',
      '.oJo',
      '.oKo',
      '.oJo',
      '.oKo',
      'oaaAo',
      'oMaAo',
      'oaaAo',
      '.oAo',
      '..o',
    ] } },
    // An instant camera with a rainbow stripe (sold in the shop).
    'explorer-camera': { icon: '📷', shop: true, price: 10, art: { x: 10, y: 11, rows: [
      '.ooo',
      'oxxxooooo',
      'owwwwwwyo',
      'owoooowWo',
      'owoZxowWo',
      'owoxxowWo',
      'owoooowWo',
      'oeOyqBuWo',
      'ooooooooo',
    ] } },
    // A jar of glowing fireflies (from the Starlight Forest).
    'explorer-jar': { icon: '🫙', forest: true, art: { x: 13, y: 10, rows: [
      '.oooo',
      'oKJKJo',
      '.oooo',
      'oZcyco',
      'oyczco',
      'oczyco',
      'oZcyzo',
      'occcco',
      '.oooo',
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
    // A rolled-up sleeping bag slung over her shoulder and across her back,
    // tied up with straps.
    'explorer-bedroll': { icon: '🏕️', art: { x: -2, y: 11, front: true, pal: INK, rows: [
      '..o',
      '.ocoo',
      '.oBcJoo',
      '.oNBJccoo',
      '..oNJBBccoo',
      '...ooNNBBcJoo',
      '.....ooNNBJccoo',
      '.......ooNJBBccoo',
      '.........ooNNBBJco',
      '...........ooNNJBco',
      '.............ooJNBo',
      '...............ooNo',
      '.................o',
    ] } },
    // A canteen hanging on a rope across her, from her shoulder to her hip.
    'explorer-canteen': { icon: '💧', art: { x: -2, y: 12, front: true, pal: INK, rows: [
      '...............JK',
      '.............JKoo',
      '..........KJKoo',
      '..oo....KJooo',
      '.oyyo.KJoo',
      '.oaaoJoo',
      'oaaaAo',
      'oaWaAo',
      'oaaaAo',
      'oAaAAo',
      '.oAAo',
      '..oo',
    ] } },
    // A red parrot friend sitting on her shoulder (from the Fairy Village).
    'explorer-parrot': { icon: '🦜', fairy: true, art: { x: -2, y: 4, front: true, pal: INK, rows: [
      '..oooo',
      '.oeeeeo',
      'oWwkeeo',
      'oxoweeo',
      '.ooeeeo',
      '..oeyBo',
      '..oeyBo',
      '..oyBBo',
      '..oKKo',
      '...oBo',
      '...oBo',
      '...oeo',
      '....o',
    ] } },
    // A baby monkey riding on her shoulder, its tail curled (from the
    // Starlight Forest).
    'explorer-monkey': { icon: '🐒', forest: true, art: { x: -2, y: 3, front: true, pal: INK, rows: [
      '.ooooo',
      'oJJJJJo',
      'KJiJiJK',
      'Kikikik',
      'oiiiiio',
      '.oimio',
      '..ooo',
      '.oJJJo',
      'oJJiJJo',
      'oJo.oJo',
      'Jo...o',
      'J',
      'J',
      'Jo',
      'oJ',
      '.oJ',
      'oJo',
      'oo',
    ] } },
    // A little khaki pack with a flap and a flag in her colour flying
    // above her.
    'explorer-flagpack': { icon: '🚩', art: { x: -2, y: -5, pal: INK, rows: [
      '.oooo',
      'oydddoo',
      'oJddyddo',
      'oJdyyyDo',
      'oJddyDDo',
      'oJdDDoo',
      'oJooo',
      'oJo',
      'oJo',
      'oJo',
      'oJo',
      'oJo',
      'oJo',
      'oJo',
      'oJo',
      'oJooooooooooooooooo',
      'oJoddddddddddddddddo',
      '.oddddddddddddddddDDo',
      '.oDyDDDDDDDDDDDDDDyDo',
      '.oSJIIIIIIIIIIIIIIJSo',
      '.oSJIIIIIIIIIIIIIIJSo',
      '.oSIIIIIIIIIIIIIIIISo',
      '.oSIIIIooooooooIIIISo',
      '.oSIIIIoIIIIIIoIIIISo',
      '.oSIIIIoIIyyIIoIIIISo',
      '.oSIIIIooooooooIIIISo',
      '.oSSIIIIIIIIIIIIIISSo',
      '..oSSSSSSSSSSSSSSSSo',
      '...oooooooooooooooo',
    ] } },
  };

  const STYLES = {
    // A girl's high ponytail, tied with a band in her colour.
    'explorer-ponytail': { icon: '🐴', girl: true, art: { back: [[12, -4, [
      '..oooo..',
      '.ohhhHo.',
      'ohhhhhHo',
      'oddohhHo',
      'oddoohHo',
      '.oo.ohho',
      '....oHho',
      '....ohho',
      '.....oho',
      '.....oho',
      '.....oHo',
      '......o.',
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
    // A boy's messy hair: tufts sticking out everywhere, spikes over his
    // forehead.
    'explorer-messy': { icon: '🌪️', boy: true, art: {
      rows: { 6: '...ohhsshssshsho..' },
      front: [
        [3, -2, ['.o...o...o..', 'oho.oho.oho.', '.hho.hhohhh.']],
        [-1, 3, ['o...', 'oho.', '.ohh', 'ohhh', 'oohh', '..oh', '.ohh', 'o.o.']],
        [15, 3, ['...o', '.oho', 'hho.', 'hhho', 'hhoo', 'ho..', 'hho.', '.o.o']],
      ],
    } },
    // A boy's quiff: his fringe brushed up in one big wave, short at the
    // sides so his ears show.
    'explorer-quiff': { icon: '🌊', boy: true, art: {
      rows: { 5: '..ohhssssssshhho..', 6: '...ohsssssssssho..', 7: '..ososskssskssoso.', 8: '..ososskssskssoso.', 9: '...oospsFsFspsoo..' },
      front: [[6, -3, ['..oo..', '.ohho.', 'ohHhho', '.oohho']]],
    } },
    // A boy's curly mop, thick over his forehead and down past his ears.
    'explorer-mop': { icon: '🐑', boy: true, art: {
      rows: { 5: '..ohhhhhhhhhhhho..' },
      back: [
        [-1, 3, ['..oo', '.ohh', 'ohhh', 'oHhh', '.ohh', 'ohhh', 'oHhh', '.ohh', 'ohhh', '.ooh', '..oo']],
        [15, 3, ['oo..', 'hho.', 'hhho', 'hhHo', 'hho.', 'hhho', 'hhHo', 'hho.', 'hhho', 'hoo.', 'oo..']],
      ],
      front: [[3, 5, ['.oo.oo.oo.oo', 'ohhohhohhohh']]],
    } },
    // A girl's two low bunches, tied with bands in her colour.
    'explorer-pigtails': { icon: '🎀', girl: true, art: { front: [[-2, 10, ['.oddo', 'ohhho', 'ohHho', 'ohhho', 'ohHho', 'ohhho', '.oHo.', '.oho.', '..o..']], [15, 10, ['oddo.', 'ohhho', 'ohHho', 'ohhho', 'ohHho', 'ohhho', '.oHo.', '.oho.', '..o..']]] } },
    // A girl's short pixie cut with a star clip in her fringe.
    'explorer-pixie': { icon: '✂️', girl: true, art: {
      rows: { 5: '..ohhhhhhhhsshho..', 6: '..ohhhhhssssssho..', 7: '..ohhsskssskssho..', 8: '..ohhsskssskssho..', 9: '...ohspsFsFspso...', 10: '....ossssmsssso...', 11: '.....ossssssso....', 12: '......oossoo......' },
      front: [[4, 5, ['.y.', 'yzy', '.y.']]],
    } },
    // A girl's long wavy hair, down past her shoulders.
    'explorer-wavy': { icon: '🌊', girl: true, art: { back: [[-1, 9, ['.ohh', 'ohhh', 'ohHh', '.ohh', 'ohhh', 'oHhh', '.ohh', 'ohhh', 'ohHh', '.ohh', 'ohho', '.oo.']], [16, 9, ['hho.', 'hhho', 'hHho', 'hho.', 'hhho', 'hhHo', 'hho.', 'hhho', 'hHho', 'hho.', 'ohho', '.oo.']]] } },
    // A boy's bowl cut: a straight, shiny fringe and straight sides.
    'explorer-bowl': { icon: '🥣', boy: true, art: {
      rows: { 4: '..ohHHHHHHHHHHho..', 5: '..ohhhhhhhhhhhho..', 6: '..ohhhhhhhhhhhho..' },
      front: [[2, 6, ['ohh', 'ohh', 'ohh', 'ooo']], [14, 6, ['hho', 'hho', 'hho', 'ooo']]],
    } },
    // A boy's straight hair, parted in the middle, down to his shoulders.
    'explorer-long': { icon: '🦁', boy: true, art: {
      rows: { 5: '..ohhhhhsshhhhho..' },
      back: [[1, 4, ['.oh', 'ohh', 'ohh', 'ohh', 'ohh', 'ohh', 'ohh', 'ohh', 'ohH', 'ohh', '.oo']], [14, 4, ['ho.', 'hho', 'hho', 'hho', 'hho', 'hho', 'hho', 'hho', 'Hho', 'hho', 'oo.']]],
    } },
    // A boy's fringe swept to one side and a little ponytail at his neck.
    'explorer-tail': { icon: '🐿️', boy: true, art: {
      rows: { 5: '..ohhhhhhhhhhsho..', 6: '...ohhhhhsssssho..' },
      back: [[0, 9, ['...oo', '..odo', '.ohho', 'ohHo.', 'oho..', '.o...']]],
    } },
  };

  // Each thing's name: heroes.explorer.<its key without 'explorer-'>
  // (js/locales).
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
