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
        // A jolly pirate captain: a white shirt with puffed sleeves, a black
        // waistcoat, a red sash, red and white striped trousers, boots.
        'captain-pirate': { name: name('pirate'), icon: '🏴‍☠️', art: {
          top: [
            m('.owwwoxxs'),
            m('.owWwoxxw'),
            m('.owwoxxww'),
            m('.oWWoxXww'),
            m('.ossoeeee'),
          ],
          bottom: [
            '....oeEeeeeeeo....',
            '....oewewewewo....',
            '....oeweooeweo....',
            '.....oewooewo.....',
            '.....oewooewo.....',
            '.....oewooewo.....',
            '.....oxxooxxo.....',
            '.....oxXooxXo.....',
            '.....oxXooxXo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 3, cloth: 'ew', hem: 'e', leg: 'w', boot: 'x', shine: 'w' },
        } },
        // A fisherman's dungarees in her colour over a cream knitted jumper,
        // yellow rubber boots.
        'captain-overalls': { name: name('overalls'), icon: '🎣', art: {
          top: [
            m('..oiiiidI'),
            m('.oiIoidii'),
            m('.oiIoiydd'),
            m('.oIIoidLd'),
            m('.ossodddd'),
          ],
          bottom: [
            '....oddddddddo....',
            '....oLddddddDo....',
            '....oLddooddDo....',
            '.....oddooddo.....',
            '.....oddooddo.....',
            '.....oLdooLdo.....',
            '.....oyyooyyo.....',
            '.....oyyooyyo.....',
            '.....oYYooYYo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 2, cloth: 'dD', hem: 'D', leg: 'd', boot: 'y' },
        } },
        // An old-fashioned striped bathing suit for the beach, sandals.
        'captain-swimsuit': { name: name('swimsuit'), icon: '🩱', art: {
          top: [
            m('..osseess'),
            m('.ossoeeee'),
            m('.ossowwww'),
            m('.ossoeeee'),
            m('.ossowwww'),
          ],
          bottom: [
            '....oeeeeeeeeo....',
            '....owwwwwwwwo....',
            '....oeeeooeeeo....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....ossoosso.....',
            '.....oBBooBBo.....',
            '.....oooooooo.....',
          ],
          walk: 'legs',
          ride: { flap: 2, cloth: 'ew', hem: 'e', leg: 's', boot: 'B', shine: 'w' },
        } },
        // A long gown like the sea, white waves foaming at its hem and a
        // belt of pearls (the Unicorn Village's).
        'captain-wavedress': { name: name('wavedress'), icon: '🌊', girl: true, unicorn: true, art: {
          top: [
            m('..oLLLoss'),
            m('.oLLLoddd'),
            m('.ossodddd'),
            m('.ossodddd'),
            m('.ossowcwc'),
          ],
          bottom: [
            '....oLddddddDo....',
            '....oLddddddDo....',
            '...oLdddddddDDo...',
            '...oLdwwddddDDo...',
            '..oLwddwddwwdDDo..',
            '..odddddwddwdwwo..',
            '.oLwwddwwddwwddDo.',
            'owddwwddwwddwwddwo',
            'owwwwwwwwwwwwwwwwo',
            '......ee..ee......',
          ],
          walk: { 9: SHOES_B },
          ride: 'skirt',
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
        // A pirate's red bandana hugging her head, a white band along its
        // edge, knotted above her ear with two ends flying.
        'captain-bandana': { name: name('bandana'), icon: '🏴‍☠️', art: { x: 0, y: 0, rows: [
          '......oooooo........',
          '....ooevveeeoo......',
          '...oeeeevveevveo....',
          '..owwwwwwwwwwwwoo...',
          '..oooooooooooooeeo..',
          '..............oeEeo.',
          '...............oeoeo',
          '...............oeooe',
          '................o..o',
        ] } },
        // A little crown of seashells and pearls (the Fairy Village's).
        'captain-shellcrown': { name: name('shellcrown'), icon: '🐚', fairy: true, art: { x: 3, y: -4, rows: [
          '.....oo.....',
          '....oPPo....',
          '...oPEPEo...',
          '.o.oEPEPo.o.',
          'oPo.oooo.oOo',
          'wcwcwcwcwcwc',
        ] } },
        // A brass diving helmet with a round window for her face and little
        // windows at its sides (sold in the shop).
        'captain-divinghelmet': { name: name('divinghelmet'), icon: '🤿', shop: true, price: 12, art: { x: -2, y: -4, rows: [
          '.........oooo.........',
          '.........oyYo.........',
          '......oooooooooo......',
          '....ooyyyyyyyyyyoo....',
          '...oyyzzyyyyyyyyyYo...',
          '...oyzyyyyyyyyyyYYo...',
          '..oyzyyyyyyyyyyyyYYo..',
          '..oyyyyyyoooooyyyYYo..',
          '..oyyyyyoaaaaaoyyYYo..',
          '.ooyyyyoaz....aoyYYoo.',
          'oyoyyyoa.......aoYYoyo',
          'ocoyyoa.........aoYoco',
          'ocoyyoa.........aoYoco',
          'ocoyyoa.........aoYoco',
          'ocoyyyoa.......aoYYoco',
          'ocoyyyyoa.....aoyYYoco',
          'oyoyyyyyoaaaaaoyyYYoyo',
          '.o.oYyyyyoooooyyYYo.o.',
          '....ooooooooooooo.....',
        ] } },
        // A seagull friend sitting on her head (the forest's).
        'captain-seagull': { name: name('seagull'), icon: '🕊️', forest: true, art: { x: 3, y: -5, rows: [
          '.........oo...',
          '........owwo..',
          '........owkwyo',
          '.ooo...owwwoo.',
          'oxWWooowwwwo..',
          '.ooWWAWwwwwo..',
          '...oWWWwwwo...',
          '....oOooOo....',
        ] } },
      },
      hand: {
        // A brass spyglass held in her fist, pointing out to sea: black
        // leather bands, a lens that glints.
        'captain-spyglass': { name: name('spyglass'), icon: '🔭', art: { x: 12, y: 11, rows: [
          '.......o',
          '......oo',
          '.....oco',
          '....oyzo',
          '...oyYo.',
          '..oxXo..',
          '.ossso..',
          '.oyYo...',
          '.oxo....',
          '..o.....',
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
        // A rainbow streamer on a gold pole held up beside her (the
        // Unicorn Village's).
        'captain-pennant': { name: name('pennant'), icon: '🏳️‍🌈', unicorn: true, art: { x: 15, y: -5, rows: [
          '.oyo.',
          '..Yoo',
          '..Yee',
          '..Yee',
          '..YOO',
          '..YOO',
          '..Yyy',
          '..Yyy',
          '..Yqq',
          '..Yqq',
          '..YBB',
          '..YBB',
          '..Yuu',
          '..Yuo',
          '..Yo.',
          '..Y..',
          '..Y..',
          '..Y..',
          '..Y..',
          '..Y..',
          '..Y..',
          '.oY..',
          'osso.',
          '.oY..',
          '..Y..',
        ] } },
        // A red fishing rod, its line hanging down to a red and white float
        // (the forest's).
        'captain-fishingrod': { name: name('fishingrod'), icon: '🎣', forest: true, art: { x: 13, y: 0, rows: [
          '.....oo',
          '.....vA',
          '.....vA',
          '.....vA',
          '.....vA',
          '....v.A',
          '....v.A',
          '....v.A',
          '....voA',
          '...v.ee',
          '...vowo',
          '...v.o.',
          '...v...',
          '..v....',
          '..v....',
          '..y....',
          '..v....',
          'osso...',
          '.oxo...',
          '..o....',
        ] } },
        // A message in a glass bottle, a rolled letter inside, a cork on top
        // (the Unicorn Village's).
        'captain-bottle': { name: name('bottle'), icon: '🍾', unicorn: true, art: { x: 13, y: 10, rows: [
          '.oIo.',
          '.oSo.',
          '.oco.',
          'oZcco',
          'oZiIo',
          'ocieo',
          'oZiIo',
          'ossco',
          'occco',
          '.ooo.',
        ] } },
        // A red crab friend sitting on her hand, waving its claws.
        'captain-crab': { name: name('crab'), icon: '🦀', art: { x: 12, y: 10, rows: [
          'oo...oo',
          'eEo.oEe',
          'oeo.oeo',
          '.okoko.',
          'oeeeeeo',
          'eEemeEe',
          'e.e.e.e',
        ] } },
      },
      back: {
        // A cape like the sea under the stars: sea green, white foam at
        // its hem, gold stars on it (the forest's).
        'captain-seacape': { name: name('seacape'), icon: '🌊', forest: true, art: { cape: {
          cloth: y => (y < 17 ? '#5fd8cc' : y < 22 ? '#36bcb4' : y < 26 ? '#22a0a0' : '#c8f6ff'),
          edge: '#1f7a84',
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
        // A pink jellyfish friend floating by her shoulder (the Fairy
        // Village's).
        'captain-jellyfish': { name: name('jellyfish'), icon: '🪼', fairy: true, art: { x: -2, y: 5, front: true, rows: [
          '.oooo.',
          'oPEPPo',
          'oPkPko',
          'oPpPpo',
          'oooooo',
          '.P.u.P',
          'P.u.P.',
          '.P.u.P',
          'P.u.P.',
          '.P...P',
        ] } },
        // A friendly little sea turtle sitting on her shoulder: a round
        // patterned shell, its head poking out, little flippers.
        'captain-turtle': { name: name('turtle'), icon: '🐢', art: { x: 12, y: 10, front: true, pal: { o: '#4a2c4f', k: '#3a2340' }, rows: [
          '..ooo...',
          '.oQqQooo',
          'oQqQqQkq',
          'oqQqQqqq',
          'oQQQQQoo',
          'oIIIIIo.',
          '.qo.qo..',
        ] } },
        // Soap bubbles floating all round her (sold in the shop).
        'captain-bubbles': { name: name('bubbles'), icon: '🫧', shop: true, price: 8, art: { x: -2, y: -5, front: true, pal: { o: '#6aa8d8', w: '#ffffff', c: '#d8f4ff' }, rows: [
          '.ooo..................',
          'owcco.................',
          'occco.................',
          '.ooo..................',
          '......................',
          '......................',
          'oo....................',
          'wco...................',
          'oo................ooo.',
          '.................owcco',
          '.................occco',
          '..................ooo.',
          '.ooo..................',
          'owcco.................',
          'occco.................',
          'occco.................',
          '.ooo..................',
          '....................oo',
          '...................owo',
          '...................oco',
          '....................oo',
          '......................',
          '.oo...................',
          'owco..................',
          'occo..................',
          '.oo...............ooo.',
          '..................owco',
          '..................occo',
          '...................oo.',
        ] } },
      },
      style: {
        // A low braid over her shoulder and down her front (inside her
        // arm), tied with a red bow.
        'captain-sidebraid': { name: name('sidebraid'), icon: '🎀', girl: true, art: {
          front: [[2, 11, [
            'ohho...',
            '.ohHo..',
            '..oHho.',
            '..ohHo.',
            '..oHho.',
            '..ohHo.',
            '..oHho.',
            '..ohHo.',
            '..oHho.',
            '.eeEEee',
            '..e..e.',
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
        // Swept by the sea wind: his fringe blown across, locks flying out
        // at the side.
        'captain-windswept': { name: name('windswept'), icon: '💨', boy: true, art: {
          rows: {
            5: '..ohhhhhhhhhhhho..',
            6: '...ohHhhhhssssho..',
          },
          front: [[14, 4, [
            'hho..',
            'hHhoo',
            'hhHho',
            'ohhoo',
            'hhHo.',
            'ooo..',
          ]]],
        } },
        // Neat and parted at the side, like a smart officer's: combed over
        // to one side, down to his temple, with sideburns.
        'captain-sidepart': { name: name('sidepart'), icon: '💇', boy: true, art: {
          rows: {
            1: '....oohhhhhhoo....',
            2: '...ohhhhhoHhhho...',
            3: '..ohhhhhoHHhhhho..',
            4: '..ohhhhhoHhhhhho..',
            5: '..ohhhhhhHHhhhho..',
            6: '...ohsssshhhhhho..',
            7: '...ohsskssskhhho..',
            8: '...ohsskssskssho..',
            9: '....ohpssssspho...',
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
        // A high ponytail at the side, tied with a navy ribbon.
        'captain-windpony': { name: name('windpony'), icon: '🎐', girl: true, art: {
          back: [[13, 0, [
            '..oNNo.',
            '..ohHho',
            '..ohhHo',
            '...ohho',
            '...ohHo',
            '...ohho',
            '....oho',
            '....oho',
            '.....o.',
          ]]],
        } },
        // Two short braids sticking straight out at the sides, tied with red
        // ribbons, like a famous sea captain's daughter.
        'captain-sticky': { name: name('sticky'), icon: '🎀', girl: true, art: {
          front: [
            [-2, 7, ['e....', 'eoooo', 'EhHhH', 'EHhHh', 'eoooo', 'e....']],
            [15, 7, ['....e', 'ooooe', 'HhHhE', 'hHhHE', 'ooooe', '....e']],
          ],
        } },
        // A very short pixie cut, tucked behind her ears, a red bow clip.
        'captain-pixie': { name: name('pixie'), icon: '✂️', girl: true, art: {
          rows: {
            5: '..ohhhHhhhhsshho..',
            6: '..ohhhhhhsssssho..',
            7: '...ohsskssskssho..',
            8: '...ohsskssskssho..',
            9: '....ospssssspso...',
            10: '....ossssmsssso...',
            11: '.....ossssssso....',
            12: '......oossoo......',
          },
          front: [[1, 5, ['e.e', 'eEe', 'e.e']]],
        } },
        // A sailor's little tail at the back of his neck, tied with a red
        // ribbon.
        'captain-seatail': { name: name('seatail'), icon: '🎗️', boy: true, art: {
          back: [[15, 8, [
            'ohho',
            'eEeo',
            'oeoe',
            'ohho',
            'ohHo',
            '.oho',
            '.oho',
            '..o.',
          ]]],
        } },
        // A round bowl cut: a straight fringe and hair down to his jaw.
        'captain-bowlcut': { name: name('bowlcut'), icon: '🥣', boy: true, art: {
          rows: {
            5: '..ohhhhhhhhhhhho..',
            6: '..ohhhhhhhhhhhho..',
            7: '..ohhsskssskssho..',
            8: '..ohhsskssskssho..',
            9: '..ohhspssssspsho..',
            10: '..ohhssssmssssho..',
            11: '...ohosssssssoho..',
            12: '....oooossoooo....',
          },
        } },
        // Buzzed very short all over: a bare forehead and his ears sticking
        // out.
        'captain-buzz': { name: name('buzz'), icon: '🪒', boy: true, art: {
          rows: {
            0: '..................',
            1: '......oooooo......',
            2: '....ooHhHhHhoo....',
            3: '...ohHhHhHhHhho...',
            4: '..ohhhhhhhhhhhho..',
            5: '..osssssssssssso..',
            6: '..oosssssssssssoo.',
            7: '.oposssksssksssopo',
            8: '.oposssksssksssopo',
            9: '..o.ospssssspso.o.',
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
