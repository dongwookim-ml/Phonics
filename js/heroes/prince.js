// The prince (js/heroes.js): the young prince of the storybooks. A neat
// side-parted fringe, a white collar and a red sash across a slim jacket
// with a gold belt; round puffed breeches, white tights and black boots; a
// little crown and a short royal-blue cape with a high collar. The king's
// robes, the knight's armour, the captain's sailor suit, the explorer's and
// the wizard's things are theirs now; the prince has his own doublet, ball
// jacket, cape coat, velvet suit, frog costume and pajamas; crown, beret,
// leaf crown, cavalier hat, nightcap and frog hood; rapier, ball
// invitation, harp, glass slipper, enchanted rose and hobby horse; capes, a
// hooded cloak and pegasus wings; and four haircuts of his own.
(() => {
  const t = key => I18n.t(`heroes.prince.${key}`);

  // His body: the boy's head, then a white collar with a gold pin, a red
  // sash from his shoulder to his gold belt.
  const PRINCE_TOP = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '..ohhsshhhhsshho..',
    '...ohsssssssssho..',
    '...ohsskssskssho..',
    '...ohsskssskssho..',
    '....ospssssspso...',
    '....ossssmsssso...',
    '.....ossssssso....',
    '......oossoo......',
    '...oLewwyywwdDo...',
    '..oLLdeedddddDDo..',
    '..oLoddeedddDoDo..',
    '..osodddeeddDoso..',
    '...ooYyyyeeyYoo...',
  ];

  // Royal doublet: a short skirt edged in gold, round puffed breeches with
  // stripes, white tights and black boots.
  const DOUBLET = [
    '....oLddddddDo....',
    '...oyyyyyyyyyyo...',
    '..odLdLDoodLdLDo..',
    '..odLdLDoodLdLDo..',
    '...oDdDDooDdDDo...',
    '.....owwoowwo.....',
    '.....owwoowwo.....',
    '.....oXxooXxo.....',
    '.....oxxooxxo.....',
    '.....oooooooo.....',
  ];

  // Ball jacket: gold shoulder boards, a white front with gold buttons and
  // a red belt; tails open over white trousers, tall black boots.
  const JACKET_TOP = [
    '..oyyLwwyywwDyyo..',
    '..oYYddwyywdDYYo..',
    '..oLoddwwwwdDoDo..',
    '..osoddwyywdDoso..',
    '...ooeeeyyeeeoo...',
  ];
  const JACKET = [
    '....oLddwwddDo....',
    '...oLddowwodDDo...',
    '...oLdowwwwoDDo...',
    '..oLdowwoowwoDDo..',
    '..oyyowwoowwoyyo..',
    '.....owwoowwo.....',
    '.....oXxooXxo.....',
    '.....oxxooxxo.....',
    '.....oxxooxxo.....',
    '.....oooooooo.....',
  ];

  // Cape coat: a little cape over his shoulders and arms, edged in gold,
  // over a long coat buttoned down the front.
  const CAPECOAT_TOP = [
    '..oDDDwwyywwDDDo..',
    '.oLDDDDDDDDDDDDDo.',
    '.oLLDDDDDDDDDDDDo.',
    '.oyyyyyyyyyyyyyyo.',
    '..osoLddydddDoso..',
  ];
  const CAPECOAT = [
    '....oLddydddDo....',
    '...oLdddodddDDo...',
    '...oLdddydddDDo...',
    '..oLddddoddddDDo..',
    '..oLddddyddddDDo..',
    '..oyyyyyoyyyyyyo..',
    '.....onnoonno.....',
    '.....oxxooxxo.....',
    '.....oxXooxXo.....',
    '.....oooooooo.....',
  ];

  // Colours of his capes (drawn on their own in the wardrobe too).
  const CAPE_PAL = { o: '#4a2c4f', y: '#ffd34d', Y: '#e0a52a', w: '#ffffff', 1: '#3a56b8', 2: '#5a7ee0', 3: '#2a3c88' };
  const UNI_PAL = { o: '#4a2c4f', y: '#ffd34d', w: '#ffffff', 1: '#e4d4ff', 2: '#c4aaf4', p: '#ffb8d8',
    r: '#ff8fb0', O: '#ffc070', Z: '#fff08a', q: '#9ee8a8', c: '#9fd8ff', u: '#c4a2ff' };

  // Lace-collar velvet suit: a big white lace collar with a red bow, a
  // short velvet jacket with gold buttons, knee breeches, white socks and
  // buckled shoes.
  const VELVET_TOP = [
    '...owwwevvewwwo...',
    '..oDwWwwwwwwWwDo..',
    '..oDowDwDDwDwoDo..',
    '..osoDDDyyDDDoso..',
    '...ooDDDDDDDDoo...',
  ];
  const VELVET = [
    '....odDDDDDDDo....',
    '....odDDyyDDDo....',
    '....oDDDooDDDo....',
    '....odDDoodDDo....',
    '.....ossoosso.....',
    '.....owwoowwo.....',
    '.....owWoowWo.....',
    '.....oxyooxyo.....',
    '.....oxxooxxo.....',
    '.....oooooooo.....',
  ];

  // The Frog Prince: a green frog suit with a pale tummy, green hands, bent
  // frog legs and big webbed feet.
  const FROG_TOP = [
    '...oqqqzzzzqqQo...',
    '..oqqqzzzzzzqQQo..',
    '..oqoqzzzzzzQoQo..',
    '..oqoqzzzzzzQoqo..',
    '...ooqqzzzzQQoo...',
  ];
  const FROG = [
    '....oqqzzzzQQo....',
    '....oqqqzzQQQo....',
    '....oQqqqqqqQo....',
    '...oqQqooooqQqo...',
    '...oqQo....oQqo...',
    '....oqQo..oQqo....',
    '.....oqqooqqo.....',
    '.....oqqooqqo.....',
    '...oqqqqooqqqqo...',
    '...oooooooooooo...',
  ];
  const FROG_WALK = { 7: '....oqqo..oqqo....', 8: '..oqqqqo..oqqqqo..', 9: '..oooooo..oooooo..' };

  // Striped pajamas in his colour and white, buttoned, with red slippers.
  const PAJAMA_TOP = [
    '...oLLdwddwdLLo...',
    '..odwLwdyydwLwdo..',
    '..odowdwddwdwodo..',
    '..osowdwyywdwoso..',
    '...ooDDDDDDDDoo...',
  ];
  const PAJAMAS = [
    '....owdwddwdwo....',
    '....owdwddwdwo....',
    '....owdwoowdwo....',
    '....owdwoowdwo....',
    '.....odwoowdo.....',
    '.....odwoowdo.....',
    '.....oDDooDDo.....',
    '.....oEeooeEo.....',
    '.....oeeooeeo.....',
    '.....oooooooo.....',
  ];

  // His travel cloak's greens, and white feathers for the pegasus wings.
  const CLOAK_PAL = { o: '#2e3a30', y: '#ffd34d', 1: '#4a8a56', 2: '#36683f', 3: '#6aaa72' };
  const PEGASUS_WING = [
    'oo.....',
    'owoo...',
    'owwwoo.',
    '.owWwwo',
    'owwwWwo',
    'owcwwWo',
    '.owwWwo',
    'owcwwwo',
    '.owwWwo',
    '..owcWo',
    '...owwo',
    '....oo.',
  ];

  addHeroKit('prince', {
    looks: ['boy'],
    base: { boy: { top: PRINCE_TOP } },
    items: {
      shape: {
        'prince-doublet': { name: t('doublet'), icon: '🤴', boy: true, art: {
          bottom: DOUBLET, walk: 'legs', ride: { flap: 4, cloth: 'dy', hem: 'L', leg: 'w', boot: 'x' } } },
        'prince-jacket': { name: t('jacket'), icon: '🕺', boy: true, art: {
          bottom: JACKET, top: JACKET_TOP, walk: 'legs', ride: { flap: 4, cloth: 'dD', hem: 'y', leg: 'w', boot: 'x' } } },
        'prince-capecoat': { name: t('capecoat'), icon: '🧥', boy: true, art: {
          bottom: CAPECOAT, top: CAPECOAT_TOP, walk: 'legs', ride: { flap: 6, cloth: 'dD', hem: 'y', leg: 'n', boot: 'x' } } },
        'prince-velvet': { name: t('velvet'), icon: '🎀', boy: true, art: {
          bottom: VELVET, top: VELVET_TOP, walk: 'legs', ride: { flap: 2, cloth: 'dD', hem: 'D', leg: 's', sock: 'w', boot: 'x' } } },
        'prince-frog': { name: t('frog'), icon: '🐸', boy: true, forest: true, art: {
          bottom: FROG, top: FROG_TOP, walk: FROG_WALK, ride: { flap: 3, cloth: 'qQ', hem: 'Q', leg: 'q', boot: 'q', shine: 'z' } } },
        'prince-pajamas': { name: t('pajamas'), icon: '🛌', boy: true, shop: true, price: 10, art: {
          bottom: PAJAMAS, top: PAJAMA_TOP, walk: 'legs', ride: { flap: 2, cloth: 'dw', hem: 'd', leg: 'w', boot: 'e', shine: 'w' } } },
      },
      head: {
        // A little gold crown, three round points and a blue jewel: smaller
        // than the king's, outlined unlike the plain golden crown.
        'prince-crown': { name: t('crown'), icon: '👑', boy: true, art: { x: 4, y: -5, rows: [
          '....oo....',
          '.o.oyyo.o.',
          'oyooyyooyo',
          'oyyyBByyyo',
          'oYYYYYYYYo',
        ] } },
        // A soft beret in his colour, tipped to one side, with a long white
        // feather and a gold pin.
        'prince-beret': { name: t('beret'), icon: '🪶', boy: true, art: { x: 1, y: -5, rows: [
          'w...............',
          'Ww.....oooooo...',
          '.Ww..ooDDDDDDoo.',
          '..WwoDDdDDDDDDDo',
          '..oWwddDDDDDDDDo',
          '..oDdyddDDDDDDo.',
          '...ooooooooooo..',
        ] } },
        // A ring of green leaves with red berries at the front: a crown
        // from the forest.
        'prince-leafcrown': { name: t('leafcrown'), icon: '🌿', boy: true, forest: true, art: { x: 3, y: -2, rows: [
          '.q.q.qq.q.q.',
          'qQqQqeeqQqQq',
          'oqQqQqqQqQqo',
        ] } },
        // A musketeer's wide-brimmed dark hat with a gold band and a big
        // red plume curling over the top.
        'prince-cavalier': { name: t('cavalier'), icon: '🎩', boy: true, art: { x: 0, y: -5, rows: [
          '....eeEEee........',
          '..eeEEeeeEEeo.....',
          '.eEeoxxxxxxeEe....',
          'eEeoxXxxxxxxoEe...',
          'eeoyyyyyyyyyyoeo..',
          '.oxxxxxxxxxxxxxxo.',
          'oxXXXXXXXXXXXXXXxo',
          '.oooooooooooooooo.',
        ] } },
        // A striped nightcap that flops over to one side, with a pom-pom.
        'prince-nightcap': { name: t('nightcap'), icon: '🌙', boy: true, shop: true, price: 6, art: { x: 3, y: -5, rows: [
          '..oooooo.........',
          '.odwdwdwoo.......',
          'odwdwdwdwdoo.....',
          'odwdwdwdwdwdoo...',
          'oWwWwWwWwWwWdwo..',
          'oWWWWWWWWWWWodwo.',
          '............odwo.',
          '............oowwo',
          '............owwwo',
          '.............ooo.',
        ] } },
        // A green frog hood with big frog eyes and a tiny gold crown between
        // them, from the forest pond.
        'prince-froghood': { name: t('froghood'), icon: '🐸', boy: true, forest: true, art: { x: 1, y: -5, rows: [
          '.ooo........ooo.',
          'owwwo......owwwo',
          'owkwo.y.y.yowkwo',
          'oqqqqoyyyyyoqqqo',
          '.oqqqqqqqqqqqqo.',
          'oqqqqqqqqqqqqqqo',
          'oqQqqqqqqqqqqQqo',
          'oqqoooooooooqqqo',
          'oqo..........oqo',
          'oqo..........oqo',
          '.o............o.',
        ] } },
      },
      hand: {
        // A thin silver rapier with a gold guard looping round his hand.
        'prince-rapier': { name: t('rapier'), icon: '🤺', boy: true, art: { x: 13, y: 1, rows: [
          '..o...',
          '..Mo..',
          '..Mo..',
          '..ao..',
          '..Mo..',
          '..ao..',
          '..Mo..',
          '..ao..',
          '..Mo..',
          '..ao..',
          'oyyyyo',
          'y.o.Yo',
          'y.f.yo',
          'oyfyo.',
          '.oeo..',
          '..o...',
        ] } },
        // A letter with a red heart seal: an invitation to the royal ball.
        'prince-letter': { name: t('letter'), icon: '💌', boy: true, art: { x: 12, y: 13, rows: [
          'oooooooo',
          'oWiiiiWo',
          'oiWeeWio',
          'oiiWWiio',
          'oiiiiiio',
          'oooooooo',
        ] } },
        // A little golden harp that sings in the Fairy Village: white
        // strings over a purple glow, inside the canvas (grid x up to 19).
        'prince-harp': { name: t('harp'), icon: '🎶', boy: true, fairy: true, art: { x: 13, y: 7, rows: [
          '.oo....',
          'oyyooo.',
          'oyYyyyo',
          'oywUwyo',
          'oywUwyo',
          'oywUwyo',
          'oywUwyo',
          'oywUyo.',
          'oywyo..',
          'oyyyo..',
          '.ooo...',
        ] } },
        // Cinderella's glass slipper on a red velvet cushion with gold
        // tassels.
        'prince-slipper': { name: t('slipper'), icon: '👠', boy: true, art: { x: 10, y: 10, rows: [
          '......oo..',
          '.....oZco.',
          '.....oZZo.',
          '.oooooZco.',
          'oZwccccZo.',
          '.ooooooZo.',
          'yoeEEEEEoy',
          '.oeeeeeeo.',
          'yooooooooy',
        ] } },
        // A red rose glowing under a glass dome, from the Fairy Village.
        'prince-rose': { name: t('rose'), icon: '🌹', boy: true, fairy: true, art: { x: 13, y: 8, rows: [
          '..ooo..',
          '.oZwZo.',
          'oZZeZZo',
          'oZeEeZo',
          'oZZeZZo',
          'oZqqZZo',
          'oZZqZZo',
          'oyyyyyo',
          'oYYYYYo',
          '.ooooo.',
        ] } },
        // A toy unicorn's head on a stick to ride, from the Unicorn Village.
        'prince-hobbyhorse': { name: t('hobbyhorse'), icon: '🦄', boy: true, unicorn: true, art: { x: 12, y: 3, rows: [
          '.....o.y',
          '..PoowYo',
          '.PPwwwwo',
          'PPwwkwwo',
          '.Pwwwwwo',
          '..owwwPo',
          '..oKooo.',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..oJo...',
          '..oKo...',
          '..ooo...',
        ] } },
      },
      back: {
        // A short royal-blue cape with a high collar, edged in gold.
        'prince-shortcape': { name: t('shortcape'), icon: '🫅', boy: true, art: { x: -1, y: 9, pal: CAPE_PAL, rows: [
          '...o1..........1o...',
          '...o1o........o1o...',
          '...o11o......o11o...',
          '...o111o....o111o...',
          '..o11111111111111o..',
          '.o2111111111111113o.',
          '.o2111111111111113o.',
          'o221111111111111133o',
          'o221111111111111133o',
          'oy2111111111111113yo',
          'oyy11111111111111yyo',
          '.oyyyyyyyyyyyyyyyyo.',
          '..oooooooooooooooo..',
        ] } },
        // A long lilac cape with a high collar, pink edges, sparkles and a
        // rainbow hem, from the Unicorn Village.
        'prince-unicorncape': { name: t('unicorncape'), icon: '🦄', boy: true, unicorn: true, art: { x: -1, y: 9, pal: UNI_PAL, rows: [
          '...op..........po...',
          '...opo........opo...',
          '...op1o......o1po...',
          '...op11o....o11po...',
          '..op111111111111po..',
          '.op11111111111111po.',
          '.op11111111111111po.',
          '.opw111111111111wpo.',
          'op2111111111111112po',
          'op2111111111111112po',
          'op2w11111111111122po',
          'op2211111111111122po',
          'op221111111111112wpo',
          'op2221111111111222po',
          'opw221111111111222po',
          'op2221111111111222po',
          'op22211111111112w2po',
          'orrOOZZqqccuurrOOZZo',
          '.oooooooooooooooooo.',
        ] } },
        // A green travelling cloak with its hood down behind his head.
        'prince-cloak': { name: t('cloak'), icon: '🧝', boy: true, art: { x: -1, y: -3, pal: CLOAK_PAL, rows: [
          '.......oooooo.......',
          '.....o22222222o.....',
          '...o221111111122o...',
          '..o22111111111122o..',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '.o2111111111111112o.',
          '..o21111111111112o..',
          '..o21111111111112o..',
          '...o211111111112o...',
          '...o211111111112o...',
          '..o31111111111113o..',
          '..o31111111111113o..',
          '..o31111111111113o..',
          '.o3111111111111113o.',
          '.o3111111111111113o.',
          '.o3111111111111113o.',
          '.o3111111111111113o.',
          'o331111111111111133o',
          'o331111111111111133o',
          'o331111111111111133o',
          'o331111111111111133o',
          'o331111111111111133o',
          'o333333333333333333o',
          '.oooooooooooooooooo.',
        ] } },
        // White feathered wings like a pegasus's, sold in the shop.
        'prince-pegasus': { name: t('pegasus'), icon: '🪽', boy: true, shop: true, price: 12, art: {
          wings: [PEGASUS_WING, { o: '#5a6a8a', w: '#ffffff', W: '#dde4f2', c: '#bfeaff' }, 7] } },
      },
      style: {
        // Combed to one side from a neat parting, the fringe swept across.
        'prince-sidepart': { name: t('sidepart'), icon: '👦', boy: true, art: { rows: {
          0: '.....ooooooo......',
          1: '...oohhhhhhhoo....',
          2: '..ohhhhHHHHhhho...',
          3: '..ohhhHHhhhhhhho..',
          4: '..ohhshhhhhhhhho..',
          5: '..ohsssshhhhhhho..',
          6: '...ohsssssshhhho..',
        } } },
        // Brushed up off his forehead into a tall wave that curls up on one
        // side, so it shows beside a crown or a hat too (unlike his short
        // hair's fringe).
        'prince-quiff': { name: t('quiff'), icon: '🌊', boy: true, art: {
          rows: {
            0: '....ohhhhhhhho....',
            1: '...ohhhhhhhhhho...',
            2: '..ohhHHhhhhhhhho..',
            3: '..ohHhhhhhhhhhho..',
            4: '..ohhoooooooohho..',
            5: '..ohssssssssssho..',
          },
          front: [[1, -5, [
            '..ooo...........',
            '.ohHHoo.........',
            '.ohhhHHoooooo...',
            'ohHhhhhhhhhhhoo.',
            'ohhhhhhhhhhhhhho',
            'ohhhhhhhhhhhhhho',
          ]]],
        } },
        // A round pageboy bob: straight bangs and sides to his chin.
        'prince-pageboy': { name: t('pageboy'), icon: '🍄', boy: true, art: { rows: {
          0: '.....oooooooo.....',
          1: '...oohhhhhhhhoo...',
          2: '..ohhHHHHHHHHhho..',
          3: '.ohHHhhhhhhhhHHho.',
          4: '.ohHhhhhhhhhhhHho.',
          5: '.ohhhhhhhhhhhhhho.',
          6: '.ohhhhhhhhhhhhhho.',
          7: '.ohhhssksssksshho.',
          8: '.ohhhssksssksshho.',
          9: '.ohhhspssssspshho.',
          10: '..ohhssssmssssho..',
          11: '...ooosssssssooo..',
        } } },
        // Combed back off his face and tied behind with a red ribbon bow.
        'prince-queue': { name: t('queue'), icon: '🎀', boy: true, art: {
          rows: {
            2: '...ohhHhhhHhhho...',
            3: '..ohhHhhHhhHhhho..',
            4: '..ohHhhHhhHhhHho..',
            5: '..ohssssssssssho..',
          },
          back: [[13, 6, ['.o...o.', 'oeo.oeo', 'oeEoEeo', 'oeo.oeo', '.o.o.o.', '...oho.', '...oho.', '...oHo.', '...oho.', '....o..']]],
        } },
      },
    },
    uses: {
      shape: ['tunic', 'coat', 'suit', 'dopo', 'leaf'],
      head: ['circlet', 'feather', 'cap', 'gat', 'crown', 'horn', 'gemband'],
      hand: ['sword', 'sceptre', 'starsword', 'bow', 'teddy', 'balloon', 'lantern'],
      back: ['redcape', 'dragon', 'cape', 'rainbow'],
      style: ['short', 'spiky', 'curls', 'shaggy'],
    },
    defaults: { boy: { shape: 'prince-doublet', head: 'prince-crown', hand: 'none', back: 'prince-shortcape', style: 'prince-sidepart', dress: 'sky', hair: 'brown' } },
  });
})();
