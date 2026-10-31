// The captain (js/heroes.js): a jolly ship's captain, a girl or a boy. Her
// own body is a navy double-breasted coat with gold buttons, gold
// epaulettes on her shoulders and a white sailor collar with a red tie;
// the girl wears her hair to her chin and in a low side braid, the boy's
// is swept by the sea wind. Her things are a sailor's: a captain's cap, an
// admiral's hat and rain hats, coats, sailor dresses, striped shirts and a
// life jacket, a spyglass, a ship's wheel, a toy boat, a compass and a map,
// a sea cape, a life ring, a big anchor and a parrot friend. The old
// sailor suit, pirate hat and flag are the boy captain's too.
(() => {
  const name = key => I18n.t(`heroes.captain.${key}`);
  // A row and its mirror image (the left half given).
  const m = left => left + [...left].reverse().join('');

  // Her head, hair and face (rows 0-12): the same face as every hero.
  const GIRL_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHHhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '.ohhhHhhhhhsshhho.',
    '.ohhhhhhsssssshho.',
    '.ohhhsskssskssho..',
    '.ohhhsskssskssho..',
    '.ohhhspssssspsho..',
    '.ohhhssssmsssshho.',
    '..ohhossssssohho..',
    '...ooooossooooo...',
  ];
  const BOY_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '..ohhhhhhhhsshho..',
    '...ohhhsssssssho..',
    '...ohsskssskssho..',
    '...ohsskssskssho..',
    '....ospssssspso...',
    '....ossssmsssso...',
    '.....ossssssso....',
    '......oossoo......',
  ];
  // Her coat (rows 13-17): gold epaulettes, a white sailor collar and a red
  // tie, two rows of gold buttons, gold cuffs, her hands.
  const COAT = [
    m('..oyyyowe'),
    m('.oyYyodwe'),
    m('.oDdodydd'),
    m('.oyyodddd'),
    m('.ossodydd'),
  ];

  // Her skirts end on white tights and red shoes.
  const TIGHTS = '......ow..wo......';
  const TIGHTS_B = '.....ow....wo.....';
  const SHOES = '......ee..ee......';
  const SHOES_B = '.....ee....ee.....';
  const GIRL_WALK = { 6: TIGHTS_B, 7: TIGHTS_B, 8: TIGHTS_B, 9: SHOES_B };

  addHeroKit('captain', {
    looks: ['girl', 'boy'],
    base: {
      girl: { top: GIRL_HEAD.concat(COAT) },
      boy: { top: BOY_HEAD.concat(COAT) },
    },
    items: {
      shape: {
        // Her coat as a dress: it flares to her knees, a gold hem.
        'captain-coatdress': { name: name('coatdress'), icon: '🧥', girl: true, art: {
          bottom: [
            '....oLdyddydDo....',
            '...oLddddddddDo...',
            '...oLddddddddDo...',
            '..oLdddddddddDDo..',
            '..oLdddddddddDDo..',
            '..otttttttttttto..',
            TIGHTS,
            TIGHTS,
            TIGHTS,
            SHOES,
          ],
          walk: GIRL_WALK,
          ride: 'skirt',
        } },
        // A white sailor dress: a big collar in her colour with a white
        // stripe, a red tie, a pleated skirt with a stripe round it.
        'captain-sailordress': { name: name('sailordress'), icon: '⛵', girl: true, art: {
          top: [
            m('.owwoddde'),
            m('.owwodwde'),
            m('.ossowwde'),
            m('.ossowwww'),
            m('.ossodddd'),
          ],
          bottom: [
            '....oLdLdLdLdo....',
            '....oddLdLdLDo....',
            '...odLdLdLdLdDo...',
            '...owwwwwwwwwwo...',
            '..odLdLdLdLdLdDo..',
            '..oDdDdDdDdDdDDo..',
            TIGHTS,
            TIGHTS,
            TIGHTS,
            SHOES,
          ],
          walk: GIRL_WALK,
          ride: 'skirt',
        } },
        // The captain's long coat over white trousers and black boots.
        'captain-coat': { name: name('coat'), icon: '🧥', boy: true, art: {
          bottom: [
            '...oLdyddddydDo...',
            '...oLdddddddDDo...',
            '..oLdddddddddDDo..',
            '..otttttttttttto..',
            '.....owwWWwwo.....',
            '.....owWoowWo.....',
            '.....owWoowWo.....',
            '.....oxxooxxo.....',
            '.....oxXooxXo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 4, cloth: 'dD', hem: 't', leg: 'w', boot: 'x' },
        } },
        // An admiral's white uniform: big gold epaulettes, gold buttons and
        // a medal, trousers in her colour with a gold stripe.
        'captain-admiral': { name: name('admiral'), icon: '🎖️', art: {
          top: [
            m('.oyyyyowy'),
            m('.oyoyoWww'),
            '.oWwoeBwyywwWowWo.',
            '.oyyoyYwwwwwWoyyo.',
            '.ossoWwwyywwWosso.',
          ],
          bottom: [
            '....oWwwyywwWo....',
            '....oWwwwwwwWo....',
            '....oyyyyyyyyo....',
            '.....oydoodyo.....',
            '.....oydoodyo.....',
            '.....oydoodyo.....',
            '.....oydoodyo.....',
            '.....oxxooxxo.....',
            '.....oxXooxXo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 2, cloth: 'wW', hem: 'W', leg: 'd', boot: 'x' },
        } },
        // A striped sailor's shirt, short trousers and red canvas shoes.
        'captain-marine': { name: name('marine'), icon: '👕', art: {
          top: [
            '..owwwwwwwwwwwwo..',
            '..odddddddddddDo..',
            '..owowwwwwwwwowo..',
            '..ododdddddddodo..',
            '..osowwwwwwwwoso..',
          ],
          bottom: [
            '....odddddddddo...',
            '....oDDDDDDDDDo...',
            '....oDDDooDDDDo...',
            '.....oDDooDDDo....',
            '.....oLLooLLLo....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....owwooWwo.....',
            '.....oeeooeeo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 3, cloth: 'DD', hem: 'L', leg: 's', boot: 'e' },
        } },
        // A yellow raincoat with toggles, rain boots in her colour.
        'captain-raincoat': { name: name('raincoat'), icon: '🌧️', art: {
          top: [
            m('..oyyyYYw'),
            m('.oyyoyzJy'),
            m('.oyyoyzyy'),
            m('.oYYoyzJy'),
            m('.ossoyyyy'),
          ],
          bottom: [
            '....oyzJyyJzyo....',
            '...ozyyyyyyyyYo...',
            '...ozyyJyyJyyYo...',
            '..ozyyyyyyyyyYYo..',
            '..oYYYYYYYYYYYYo..',
            '.....oLdooLdo.....',
            '.....oddooddo.....',
            '.....oddooddo.....',
            '.....oDDooDDo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 4, cloth: 'yY', hem: 'Y', leg: 'd', boot: 'D' },
        } },
        // An orange life jacket over a striped shirt, shorts in her colour.
        'captain-lifejacket': { name: name('lifejacket'), icon: '🦺', art: {
          top: [
            m('..owwoOOw'),
            m('.oddoOOOw'),
            m('.owwoOwOO'),
            m('.oddoxxxa'),
            m('.ossoOOOO'),
          ],
          bottom: [
            '....oOOOOOOOOo....',
            '....oddddddddo....',
            '....oLddooddDo....',
            '.....oddooddo.....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....owwoowwo.....',
            '.....oBBooBBo.....',
            '.....oNNooNNo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 2, cloth: 'dD', hem: 'D', leg: 's', boot: 'B' },
        } },
      },
      head: {
        // A captain's cap: a white top, a band in her colour with a gold
        // anchor badge, a gold cord and a black peak.
        'captain-cap': { name: name('cap'), icon: '⚓', art: { x: 1, y: -4, rows: [
          '...oooooooooo...',
          '.oowwwwwwwwwwoo.',
          'owwwwwwwwwwwwWWo',
          'oWWWWWWWWWWWWWWo',
          '.odddddyyddddddo',
          '.oddddyYYyddddo.',
          '.oyyyyyyyyyyyyo.',
          '..oxxxxxxxxxxo..',
          '...oooooooooo...',
        ] } },
        // An admiral's hat worn side to side, gold along its edge and a
        // cockade in the middle.
        'captain-bicorne': { name: name('bicorne'), icon: '🎩', art: { x: -1, y: -5, rows: [
          '........oooo........',
          '......ooddddoo......',
          '....oodddwedddoo....',
          '..ooddddweewddddoo..',
          '.oddddddwweddddddDo.',
          'oDdddddddyyddddddDDo',
          'oyyyyyyyyyyyyyyyyyyo',
          '.oooo..........oooo.',
        ] } },
        // A round sailor's hat with a red pompom and ribbons at the back.
        'captain-sailorhat': { name: name('sailorhat'), icon: '🔴', art: { x: 1, y: -5, rows: [
          '.......oo.......',
          '......oeEo......',
          '...ooooeeoooo...',
          '.ooddddddddddoo.',
          'oddddddddddddDDo',
          '.oDDDDDDDDDDDDo.',
          '..owwwwwwwwwwoo.',
          '..oNwNwNwNwNwo.N',
          '...oooooooooo..N',
        ] } },
        // A yellow sou'wester: its brim slopes down over her ears.
        'captain-souwester': { name: name('souwester'), icon: '☔', art: { x: 1, y: -4, rows: [
          '.....oooooo.....',
          '....ozyyyyyo....',
          '...ozyyyyyyYo...',
          '..ozyyyyyyyyYo..',
          '.oyyyyyyyyyyyYo.',
          'oyYYYYYYYYYYYYYo',
          'oYYooooooooooYYo',
          'oYo..........oYo',
          '.o............o.',
        ] } },
        // A red knitted cap with a turned-up cuff.
        'captain-beanie': { name: name('beanie'), icon: '🧶', art: { x: 2, y: -4, rows: [
          '......oo......',
          '.....oeeo.....',
          '...ooeEeeoo...',
          '..oeEeeeeeeo..',
          '.oeEeeeeeeeeo.',
          '.oeeeeeeeeeeo.',
          'ovEvEvEvEvEvvo',
          'ovEvEvEvEvEvvo',
          '.oooooooooooo.',
        ] } },
        // A straw boater with a ribbon in her colour and a bow.
        'captain-boater': { name: name('boater'), icon: '👒', girl: true, art: { x: 0, y: -4, rows: [
          '....oooooooooo....',
          '....oIIIIIIIISo...',
          '....oIIIIIIIISo...',
          '....oddddddddDodo.',
          '.oooIIIIIIIIIIoddo',
          'oIIIIIIIIIIIIIIIdo',
          '.ooooooooooooooodo',
          '................o.',
        ] } },
      },
      hand: {
        // A brass spyglass, pulled out long, a lens that glints.
        'captain-spyglass': { name: name('spyglass'), icon: '🔭', art: { x: 12, y: 8, rows: [
          '.....ooo',
          '....oczo',
          '...oyYYo',
          '...oYYo.',
          '..oyYo..',
          '..oJJo..',
          '.oyYo...',
          '.oJJo...',
          'oJJo....',
          'oJo.....',
          '.o......',
        ] } },
        // A little ship's wheel: a wooden rim and handles, a gold hub.
        'captain-wheel': { name: name('wheel'), icon: '☸️', art: { x: 11, y: 12, rows: [
          '....J....',
          '..oKKKo..',
          '.oK.J.Ko.',
          '.K.oJo.K.',
          'JKJJyJJKJ',
          '.K.oJo.K.',
          '.oK.J.Ko.',
          '..oKKKo..',
          '....J....',
        ] } },
        // A toy sailing boat: a white sail and a red hull.
        'captain-boat': { name: name('boat'), icon: '⛵', art: { x: 11, y: 9, rows: [
          '...oeo...',
          '....Jo...',
          '...oJwo..',
          '..owJwwo.',
          '.owwJwwwo',
          'owwwJwWWo',
          'ooooooooo',
          'oeeeeeeeo',
          '.oeEeEeo.',
          '..ooooo..',
        ] } },
        // A round brass compass, its needle pointing north.
        'captain-compass': { name: name('compass'), icon: '🧭', art: { x: 11, y: 13, rows: [
          '...oyo..',
          '..ooooo.',
          '.oyyyyyo',
          'oyYwwweYo',
          'oyYwwewYo',
          'oyYwewwYo',
          'oyYxwwwYo',
          '.oyYYYYo',
          '..ooooo.',
        ].map(r => r.padEnd(9, '.')) } },
        // A treasure map, a dotted path to a red cross.
        'captain-map': { name: name('map'), icon: '🗺️', art: { x: 12, y: 12, rows: [
          '.oooooo.',
          'oSIIIISo',
          'oiiiiKIo',
          'oiKiiiIo',
          'oiiKeieo',
          'oiiiieIo',
          'oiiieieo',
          'oSIIIISo',
          '.oooooo.',
        ] } },
        // A rainbow pennant on a pole (the Unicorn Village's).
        'captain-pennant': { name: name('pennant'), icon: '🏳️‍🌈', unicorn: true, art: { x: 13, y: -1, rows: [
          '.y.....',
          'oJooooo',
          'oJeeeeo',
          'oJOOOo.',
          'oJyyyo.',
          'oJqqo..',
          'oJBo...',
          'oJuo...',
          'oJo....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
          'oJ.....',
        ] } },
      },
      back: {
        // A cape like the night sea, with stars on it (the forest's).
        'captain-seacape': { name: name('seacape'), icon: '🌊', forest: true, art: { cape: {
          cloth: y => (y < 17 ? '#3a64c0' : y < 22 ? '#2e50a0' : '#243e84'),
          edge: '#e8f6ff',
          stars: true,
        } } },
        // A red and white life ring on her back.
        'captain-lifering': { name: name('lifering'), icon: '🛟', art: { x: -2, y: 9, pal: { o: '#4a2c4f', w: '#ffffff' }, rows: [
          '.......oooooooo.......',
          '.....ooeeeeeeeeoo.....',
          '...ooeeeoooooooeeoo...',
          '..owwwoo......ooeeeo..',
          '.owwwo..........owwwo.',
          '.owwo............owwo.',
          'oeeeo............oeeeo',
          'oeeo..............oeeo',
          'oeeo..............oeeo',
          'oeeeo............oeeeo',
          '.owwo............owwo.',
          '.owwwo..........owwwo.',
          '..oeeeoo......oowwwo..',
          '...ooeeoooooooowwoo...',
          '.....ooeeeeeeeeoo.....',
          '.......oooooooo.......',
        ] } },
        // A big silver anchor on her back.
        'captain-biganchor': { name: name('biganchor'), icon: '⚓', art: { x: -2, y: 9, pal: { o: '#4a2c4f' }, rows: [
          m('ooooooooooo'),
          m('oMaaaaaaaaa'),
          m('oAAAAAAAAAA'),
          m('ooooooooooo'),
          m('.........oa'),
          m('.........oa'),
          m('.........oa'),
          m('.........oa'),
          m('.........oa'),
          m('.........oa'),
          m('.o.......oa'),
          m('oao......oa'),
          m('oaao.....oa'),
          m('.oao.....oa'),
          m('.oao.....oa'),
          m('..oao....oa'),
          m('..oaaoo..oa'),
          m('...ooaaaooa'),
          m('.....oooooo'),
        ] } },
        // A parrot friend on her shoulder (the Fairy Village's).
        'captain-parrot': { name: name('parrot'), icon: '🦜', fairy: true, art: { x: 15, y: 3, pal: { o: '#4a2c4f', w: '#ffffff', y: '#ffd34d', k: '#3a2340' }, rows: [
          '..ooo',
          '.oeeo',
          'oeewo',
          'oeekY',
          'oeeyo',
          'oqeeo',
          'oqqQo',
          'oqQBo',
          'oqQBo',
          '.oBBo',
          '.oeBo',
          '..oeo',
          '...o.',
        ] } },
      },
      style: {
        // A low braid over her shoulder, tied with a red ribbon.
        'captain-sidebraid': { name: name('sidebraid'), icon: '🎀', girl: true, art: {
          front: [[1, 10, [
            'ohhho..',
            'ohHho..',
            '.ohHo..',
            '.oHhho.',
            '..ohHo.',
            '..oHho.',
            '..ohHo.',
            '..oHho.',
            '..ohHo.',
            '.eeEee.',
            '..e.e..',
            '..ohho.',
            '..oHho.',
            '...oo..',
          ]]],
        } },
        // Long waves down her back, a starfish clip at her side.
        'captain-wavy': { name: name('wavy'), icon: '🌊', girl: true, art: {
          back: [
            [-1, 10, ['.oh', 'ohh', 'ohH', 'hho', 'hh.', 'ohh', 'ohH', 'hho', 'hho', 'ohh', '.oo']],
            [16, 10, ['ho.', 'hho', 'Hho', 'ohh', '.hh', 'hho', 'Hho', 'ohh', 'ohh', 'hho', 'oo.']],
          ],
          front: [[13, 5, ['.O.', 'OyO', '.O.']]],
        } },
        // Two round buns low at the back of her neck, with ribbons.
        'captain-buns': { name: name('buns'), icon: '🍡', girl: true, art: {
          back: [
            [-1, 8, ['.ooo..', 'ohhHo.', 'ohhhho', 'oHhhho', '.ohhhoe', '..oooEe', '.....e.'].map(r => r.padEnd(7, '.'))],
            [13, 8, ['..ooo.', '.oHhho', 'ohhhho', 'ohhHho', 'eohhho.', 'eEooo..', '.e.....'].map(r => r.padStart(6, '.').padEnd(7, '.'))],
          ],
        } },
        // Swept by the sea wind, a big swoop over his forehead.
        'captain-windswept': { name: name('windswept'), icon: '💨', boy: true, art: {
          rows: {
            5: '..ohhhhhhhhhhhho..',
            6: '...ohHhhhhssssho..',
          },
        } },
        // Neat and parted at the side, like a smart officer's.
        'captain-sidepart': { name: name('sidepart'), icon: '💇', boy: true, art: {
          rows: {
            5: '..ohhhhhhhHhhhho..',
            6: '...ohssssshhhhho..',
          },
        } },
        // Fluffy curls all round, like sea foam.
        'captain-fluffy': { name: name('fluffy'), icon: '☁️', boy: true, art: {
          back: [
            [0, 3, ['.oo', 'ohh', 'ohH', '.oh', 'ohh', 'ohH', '.oh', 'ohh', '.oo']],
            [15, 3, ['oo.', 'hho', 'Hho', 'ho.', 'hho', 'Hho', 'ho.', 'hho', 'oo.']],
          ],
          rows: {
            5: '..ohHhhHhhHhhHho..',
          },
        } },
      },
    },
    // The old sailor suit, pirate hat and flag are the boy captain's now.
    uses: {
      shape: ['sailor'],
      head: ['pirate'],
      hand: ['flag'],
    },
    defaults: {
      girl: { shape: 'captain-coatdress', head: 'captain-cap', hand: 'none', back: 'none', style: 'captain-sidebraid', dress: 'navy', hair: 'brown' },
      boy: { shape: 'captain-coat', head: 'captain-cap', hand: 'none', back: 'none', style: 'captain-windswept', dress: 'navy', hair: 'brown' },
    },
  });
})();
