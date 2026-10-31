// The knight (js/heroes.js): a brave storybook knight, a girl or a boy.
// Sturdy and armoured where the others are not: round steel pauldrons
// standing out over the arms and a steel collar built into the shoulders,
// a tabard in her colour with a gold cross, a leather belt, steel legs and
// big chunky boots. The girl has a braid over her shoulder and an armoured
// skirt; the boy a short crop and plate legs. Both start in a plumed helmet.
(() => {
  // Steel is HERO_EXTRA's: M shine, a steel, A shade; j a deeper shade.
  // b a leather belt, f leather boots, l leggings (the same for both looks).
  const palette = (outfit, look, base) => Object.assign({}, base, {
    b: '#7a5038', f: '#6a4430', j: '#68708e', l: '#a8714a',
  });

  // ---- Bodies -------------------------------------------------------------

  // Shoulders and body (rows 12 to 17), the same for both looks: round
  // pauldrons, the steel collar, the tabard with its gold cross, the belt
  // and her hands.
  const BODY = [
    '.oooo.oooooo.oooo.',
    'oMMaAoMaaaaAoMMaAo',
    'oMaAjoLdyydDoMaAjo',
    '.ooooLdyyyydDoooo.',
    '.oaAoLddyyddDoaAo.',
    '.ossobbbyybbbosso.',
  ];
  // Her hair tucked back behind her ears (her hairstyle adds the braid).
  const GIRL_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhhhhho..',
    '.ohhhsshhhhsshhho.',
    '.ohhhssssssssshho.',
    '.ohhhsskssskssho..',
    '.ohhhsskssskssho..',
    '..ohhspssssspsho..',
    '..ohhssssmsssho...',
    '...ohossssssoho...',
  ];
  // A short crop, the fringe swept to one side.
  const BOY_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '..ohHhhhhhhHHhho..',
    '..ohhhhhhsssshho..',
    '...ohsssssssssho..',
    '...ohsskssskssho..',
    '...ohsskssskssho..',
    '....ospssssspso...',
    '....ossssmsssso...',
    '.....ossssssso....',
  ];

  // ---- Clothes (shapes) ---------------------------------------------------

  // Chunky boots (the last three rows below the belt): steel, leather, gold.
  const STEEL_BOOTS = ['....oaaAooaaAo....', '...oMaAAooMaAAo...', '...oooooooooooo...'];
  const LEATHER_BOOTS = ['....offfoofffo....', '...offffooffffo...', '...oooooooooooo...'];
  const GOLD_BOOTS = ['....oMMyooMMyo....', '...oyyyyooyyyyo...', '...oooooooooooo...'];
  // The second walking frame: the boots step apart.
  const step = ([a, b]) => ({
    7: `...${a.slice(4, 9)}..${a.slice(9, 14)}...`,
    8: `..${b.slice(3, 9)}..${b.slice(9, 15)}..`,
    9: '..oooooo..oooooo..',
  });
  // Steel legs with round knee plates.
  const STEEL_LEGS = ['.....oaAooaAo.....', '....oMMAooMMAo....', '.....oaAooaAo.....', '.....oaAooaAo.....'];
  const FEET = '......ff..ff......';

  const thing = (name, icon, art, flags) => Object.assign({ name: I18n.t(`heroes.knight.${name}`), icon }, flags, { art });
  // A shape: the top rows it changes, its bottom rows, how it rides; it
  // walks with its boots stepping apart, or a long skirt's feet.
  const shape = (name, icon, top, bottom, ride, flags) => thing(name, icon, {
    bottom, top: top || {}, walk: bottom[9] === FEET ? 'feet' : step(bottom.slice(7, 9)), ride,
  }, flags);

  const SHAPES = {
    // Plate armour: steel hip plates round the tabard's hem, steel legs.
    'knight-plate': shape('plate', '🛡️', null, [
      '....oMaLddDaAo....',
      '...oMaAoLdoMaAo...',
      '...ooooottooooo...',
      ...STEEL_LEGS,
      ...STEEL_BOOTS,
    ], { flap: 3, cloth: 'aA', hem: 'A', leg: 'a', boot: 'A' }),
    // An armoured skirt: steel plates over a skirt in her colour.
    'knight-skirt': shape('skirt', '⚔️', null, [
      '....oMaaaaaaAo....',
      '...oMaaAaaaaAjo...',
      '...oooooooooooo...',
      '..oLddddyyddDDDo..',
      '..oLdddddddddDDo..',
      '..otttttttttttto..',
      '.....oaAooaAo.....',
      ...STEEL_BOOTS,
    ], { flap: 5, cloth: 'dD', hem: 't', leg: 'a', boot: 'A' }, { girl: true }),
    // Chainmail from her neck to her knees, leather boots.
    'knight-mail': shape('mail', '⛓️', {
      14: 'oMaAjoaAaAaAoMaAjo',
      15: '.ooooaAaAaAaAoooo.',
      16: '.oaAoAaAaAaAaoaAo.',
    }, [
      '....oaAaAaAaAo....',
      '...oaAaAaAaAaAo...',
      '...oAaAaAaAaAao...',
      '...ojjjjjjjjjjo...',
      '.....oaAooaAo.....',
      '.....oAaooAao.....',
      '.....oaAooaAo.....',
      ...LEATHER_BOOTS,
    ], { flap: 4, cloth: 'aA', hem: 'j', leg: 'a', boot: 'f' }),
    // A long tabard, half in her colour and half white, gold at the hem.
    'knight-tabard': shape('tabard', '🏳️', {
      14: 'oMaAjoLdddwwoMaAjo',
      15: '.ooooLdddwwwWoooo.',
      16: '.oaAoLdddwwwWoaAo.',
    }, [
      '....oLdddwwwWo....',
      '...oLddddwwwWWo...',
      '...oLddddwwwWWo...',
      '...oLddddwwwWWo...',
      '...oyyyyyyyyyyo...',
      '.....oaAooaAo.....',
      '.....oAaooAao.....',
      ...STEEL_BOOTS,
    ], { flap: 5, cloth: 'dD', hem: 'y', leg: 'a', boot: 'A' }),
    // A squire's padded jacket, quilted in her colour, with puffed
    // shoulders, leggings and leather boots: no steel yet.
    'knight-squire': shape('squire', '🧥', {
      13: 'oLLddoLDdDdDoLLdDo',
      14: 'oLdDDodDdDdDoLdDDo',
      15: '.ooooLdDdDdDDoooo.',
      16: '.oLdoLDdDdDdDoLdo.',
    }, [
      '....oLdDdDdDdo....',
      '...oLdDdDdDdDDo...',
      '...otttttttttto...',
      '.....olloollo.....',
      '.....olloollo.....',
      '.....olloollo.....',
      '.....olloollo.....',
      ...LEATHER_BOOTS,
    ], { flap: 3, cloth: 'dD', hem: 't', leg: 'l', boot: 'f' }, { forest: true }),
    // A knight's long dress with the gold cross, a gold belt.
    'knight-surcoat': shape('surcoat', '👗', { 17: '.ossoyyyYYyyyosso.' }, [
      '....oLddddddDo....',
      '...oLddddddddDo...',
      '...oLdddddddDDo...',
      '..oLddddddddDDDo..',
      '..oLddddddddDDDo..',
      '.oLdddddddddDDDDo.',
      '.oLddddddddddDDDo.',
      'oLdddddddddddDDDDo',
      'otttttttttttttttto',
      FEET,
    ], 'skirt', { girl: true }),
    // Shining parade armour, white steel trimmed with gold.
    'knight-parade': shape('parade', '✨', {
      13: 'oMMMyoMMMMMyoMMMyo',
      14: 'oyMMyoMMyyMyoyMMyo',
      15: '.ooooMMyyyyMyoooo.',
      16: '.oMyoMMMyyMMyoMyo.',
      17: '.ossoyyyYYyyyosso.',
    }, [
      '....oMMyyyyMyo....',
      '...oMMyoMMoMMyo...',
      '...oooooooooooo...',
      '.....oMyooMyo.....',
      '....oyyyooyyyo....',
      '.....oMyooMyo.....',
      '.....oMyooMyo.....',
      ...GOLD_BOOTS,
    ], { flap: 3, cloth: 'My', hem: 'y', leg: 'M', boot: 'y' }),
  };

  // ---- Head things --------------------------------------------------------

  const HEADS = {
    // A round steel helmet with cheek guards, a plume in her colour
    // sweeping back from a gold holder.
    'knight-plume': thing('plume', '🪖', { x: 1, y: -5, rows: [
      '.......oooo.....',
      '......oLLLdoo...',
      '.....oLLdddDDo..',
      '.....oLdyoDDDDo.',
      '....oooyyoooDDo.',
      '...oMMaaaaaAoDo.',
      '..oMMaaaaaaaAoo.',
      '..oMaaaaaaaaaAo.',
      '.oMaaaaaaaaaaaAo',
      'oyyyyyyyyyyyyyyo',
      'oMao........oAjo',
      'oaAo........oAjo',
      '.oo..........oo.',
    ] }),
    // A helmet with its visor lifted up over the forehead.
    'knight-visor': thing('visor', '⛑️', { x: 1, y: -4, rows: [
      '.....oooooo.....',
      '...ooMMaaaaoo...',
      '..oMaaaaaaaaAo..',
      '.oMaaaaaaaaaaAo.',
      '.oAjjjjjjjjjjAo.',
      'oMaoxxxooxxxoaAo',
      'oMaAaaaaaaaaAaAo',
      'oaAoooooooooojAo',
      'oaAo........oAjo',
      'oaAo........oAjo',
      '.oo..........oo.',
    ] }),
    // A great helm, flat on top with a crest in her colour, open round
    // her face.
    'knight-greathelm': thing('greathelm', '🪣', { x: 1, y: -4, rows: [
      '......oooo......',
      '.....oLddDo.....',
      '.....oLdDDo.....',
      '..oooooyyooooo..',
      '.oMMaaaaaaaaaAo.',
      '.oMaaaaaaaaaaAo.',
      '.oMaaaaaaaaaaAo.',
      '.oyyyyyyyyyyyyo.',
      '.oMaaaaaaaaaaAo.',
      '.oMaooooooooaAo.',
      '.oMao.......oAo.',
      '.oMao.......oAo.',
      '.oMao.......oAo.',
      '.oMao.......oAo.',
      '.oMaaoo...ooaAo.',
      '.oMaaAo...oaaAo.',
      '..ooooooooooooo.',
    ] }),
    // A little steel cap with a gold circlet, a blue jewel and a feather.
    'knight-circlet': thing('circlet', '💠', { x: 1, y: -3, rows: [
      '.........ooo....',
      '......oooowWo...',
      '....ooMMaowWo...',
      '...oMMaaaaoWo...',
      '..oMaaaaaaaoAo..',
      '.oyyyyyBByyyyyo.',
      '.oYYYYYNNYYYYYo.',
      '..oo...oo...oo..',
    ] }, { girl: true }),
    // A helmet with white feathered wings, from the Fairy Village.
    'knight-winghelm': thing('winghelm', '🪽', { x: -2, y: -4, rows: [
      '.oo................oo.',
      'owwo..............owwo',
      'owWwo..oooooooo..owWwo',
      '.owWwooMMaaaaaAoowWwo.',
      'owwwWoMaaaaaaaaAoWwwwo',
      '.owwWoMaaaaaaaaAoWwwo.',
      '..oowoMaaaaaaaaAowoo..',
      '....oyyyyyyyyyyyyo....',
      '....oMo........oAo....',
      '....oao........oAo....',
      '.....o..........o.....',
    ] }, { fairy: true }),
    // A unicorn's helmet: a gold horn and a pink mane, from the Unicorn
    // Village.
    'knight-unihelm': thing('unihelm', '🦄', { x: 1, y: -5, rows: [
      '.......oo.......',
      '.......oyo......',
      '......oyYo..oo..',
      '......oYyo.oPPo.',
      '.....oyYyooPuuPo',
      '....oooYoooPuPo.',
      '...oMMaaaaoPuPo.',
      '..oMMaaaaaaoPPo.',
      '..oMaaaaaaaaoPPo',
      'oyyyyyyyyyyyyyoo',
      'oMao........oAjo',
      'oaAo........oAjo',
      '.oo..........oo.',
    ] }, { unicorn: true }),
    // A chainmail hood round her face.
    'knight-coif': thing('coif', '🧣', { x: 1, y: -1, rows: [
      '.....oooooo.....',
      '...ooaAaAaAoo...',
      '..oaAaAaAaAaAo..',
      '.oaAaAaAaAaAaAo.',
      '.oAaAaAaAaAaAao.',
      '.oaAaooooooaAao.',
      '.oAao......oaAo.',
      '.oaAo......oAao.',
      '.oAao......oaAo.',
      '.oaAo......oAao.',
      '.oAaAo....oAaAo.',
      '.oaAaAooooAaAao.',
      '..oaAaAaAaAaAo..',
    ] }),
  };

  // ---- Hand things --------------------------------------------------------

  const HANDS = {
    // A broad steel sword held up, her fist round its grip.
    'knight-sword': thing('sword', '🗡️', { x: 13, y: 4, rows: [
      '..oo..',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      '.oMao.',
      'ooMaoo',
      'oyyyYo',
      '.ooJo.',
      'osssso',
      '.oyyo.',
      '..oo..',
    ] }),
    // A tall lance striped in her colour, with a pennant.
    'knight-lance': thing('lance', '🎏', { x: 13, y: -5, rows: [
      '..o....',
      '.oMo...',
      '.oao...',
      '.oaooo.',
      'oLdLddo',
      'oddLddo',
      'oddLdo.',
      'oddLddo',
      'oddLo..',
      'owdo...',
      'odwo...',
      'owdo...',
      'odwo...',
      'owdo...',
      'odwo...',
      'owdo...',
      'odwo...',
      'oawo...',
      'oaaAo..',
      'oMaaAo.',
      'oosssoo',
      '.oJJo..',
    ] }),
    // A round shield in her colour, a steel rim and a big gold boss, held
    // up on her arm (above where her legs hang when she rides).
    'knight-round': thing('round', '🛡️', { x: -2, y: 9, rows: [
      '..oooo..',
      '.ooaaAoo',
      'oaLddDAo',
      'oLdyydDo',
      'odyYYyDo',
      'odyYYyDo',
      'oddyyDDo',
      'oAdDDDAo',
      '.ooAAoo.',
    ] }),
    // A white shield with a red heart, from the Fairy Village.
    'knight-heart': thing('heart', '💖', { x: -2, y: 9, rows: [
      'ooooooo',
      'owwwwWo',
      'oweweWo',
      'oeeEeeo',
      'oeeeeeo',
      'oweeeWo',
      '.owewo.',
      '..oWo..',
      '...o...',
    ] }, { fairy: true }),
    // A banner in her colour with a gold crown, high on its pole.
    'knight-banner': thing('banner', '🚩', { x: 9, y: -5, rows: [
      '.......oyo.',
      'ooooooooYo.',
      'oJKKKKKKJo.',
      '.oLdddDoJo.',
      '.oLyyydoJo.',
      '.oLdyddoJo.',
      '.oLdddDoJo.',
      '.oLdodDoJo.',
      '.ooo.oooJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '.......oJo.',
      '......osJso',
      '.......oJo.',
      '........o..',
    ] }),
    // A wooden practice sword from the Forest.
    'knight-wooden': thing('wooden', '🪵', { x: 13, y: 5, rows: [
      '..oo..',
      '.oKKo.',
      '.oKJo.',
      '.oKJo.',
      '.oKJo.',
      '.oKJo.',
      '.oKJo.',
      '.oKJo.',
      'oJJJJo',
      '.oeEo.',
      'osssso',
      '.oJJo.',
      '..oo..',
    ] }, { forest: true }),
  };

  // ---- Back things --------------------------------------------------------

  // A pegasus's white wing (the left one; drawn as a mirrored pair).
  const PEGASUS = [
    'oo......',
    'owoo....',
    'owWwoo..',
    '.owwWwo.',
    'owwwWWwo',
    'oWwwWWWo',
    '.owwWWWo',
    'owwwWWZo',
    'oWwWWZZo',
    '.owWWZZo',
    'owwWZZo.',
    'oWWZZo..',
    '.oWZo...',
    'oWZo....',
    '.oo.....',
  ];
  const INK = '#4a2c4f';
  const BACKS = {
    // A royal blue cape over her shoulders, pinned with gold by her collar,
    // falling to her heels behind her arms (drawn over her: the mantle on
    // her shoulders, the sides beside her).
    'knight-cape': thing('cape', '🦸', {
      x: -2, y: 12, front: true, pal: { o: INK, C: '#3f5fb8', V: '#24357a', F: '#6a8ad8', y: '#ffd34d', Y: '#e0a52a' },
      rows: [
        '...ooooo......ooooo...',
        '..oFCCCCyo..oyCCCCFo..',
        '.oFCCCCVYo..oYVCCCCFo.',
        'oCCVVVVo......oVVVVCCo',
        ...Array(10).fill('oCVo..............oVCo'),
        'oVVo..............oVVo',
        'oooo..............oooo',
      ],
    }),
    // A big sword in its scabbard on her back, the hilt over her shoulder.
    'knight-sheath': thing('sheath', '⚔️', { x: 15, y: -1, pal: { o: INK, y: '#ffd34d', Y: '#e0a52a' }, rows: [
      '.ooo.',
      'oyyYo',
      'oYyYo',
      '.oJo.',
      '.oJo.',
      'ooJoo',
      'yyyyY',
      'ooKoo',
      ...Array(14).fill('.oKo.'),
      '.oyo.',
      '.oYo.',
      '..o..',
    ] }),
    // A pegasus's wings, from the Unicorn Village.
    'knight-pegasus': thing('pegasus', '🪽', { wings: [PEGASUS, { o: INK, w: '#ffffff', W: '#dde4f2', Z: '#c8f6ff' }, -1] }, { unicorn: true }),
  };

  // ---- Hairstyles ---------------------------------------------------------

  const STYLES = {
    // One thick braid over her shoulder, tied with a red ribbon.
    'knight-braid': thing('braid', '🥨', {
      front: [[-2, 9, ['..oo', '.ohH', 'ohHo', 'oHho', '.oo.', 'ohHo', 'oHho', '.oo.', 'ohHo', 'oHho', '.oo.', 'oeEo', 'oeeo', '.oo.']]],
    }, { girl: true }),
    // A braid wrapped round her head like a crown, down over her ears.
    'knight-crownbraid': thing('crownbraid', '👑', {
      front: [
        [1, 1, ['..oooooooooooo..', '.ohHohHohHohHoo.', 'ohHohHohHohHohHo', '.oooooooooooooo.']],
        [0, 4, ['.oo.', 'ohHo', 'oHho', '.oo.', 'ohHo', 'oHho', '.oo.', 'ohHo', '.oo.']],
        [14, 4, ['.oo.', 'oHho', 'ohHo', '.oo.', 'oHho', 'ohHo', '.oo.', 'oHho', '.oo.']],
      ],
    }, { girl: true }),
    // A high ponytail tied with gold, swinging out like a plume.
    'knight-ponytail': thing('ponytail', '🎗️', {
      back: [[11, -4, ['..ooo...', '.ohhHo..', 'ohHhhho.', 'ohhhHho.', '.oyyYo..', '..ohHho.', '..ohhHo.', '...ohHo.', '...ohhHo', '...oHhho', '....ohHo', '....ohho', '....oHho', '....ohho', '.....oho', '.....oho', '......o.']]],
    }, { girl: true }),
    // Short, the fringe swept to one side (his starting hair).
    'knight-crop': thing('crop', '💇‍♂️', {}, { boy: true }),
    // A pageboy's round bowl cut, straight across his brow and down over
    // his ears.
    'knight-pageboy': thing('pageboy', '🥣', {
      rows: {
        4: '.ohHhhhhhhhhhhhho.',
        5: '.ohhhhhhhhhhhhhho.',
        6: '.ohhhhhhhhhhhhhho.',
        7: '.ohhhssksssksshho.',
        8: '.ohhhssksssksshho.',
        9: '.ohhhspssssspshho.',
        10: '..ohhssssmssssho..',
        11: '...ooosssssssoo...',
      },
    }, { boy: true }),
    // Windswept: tufts on top and a lock over his brow blowing to one side.
    'knight-swept': thing('swept', '🌬️', {
      rows: { 5: '..ohhhhhhhhhhhho..', 6: '...ohhhhhsssssho..' },
      front: [
        [1, -3, ['..........oo....', '.......ooohho...', '..ooooohhhHHho..', '.ohhhhhhHHhhhhho', 'ohhHHhhhhhhhhhho']],
        [14, 5, ['.ooo.', 'ohhHo', '.ohho', '..oo.']],
      ],
    }, { boy: true }),
  };

  addHeroKit('knight', {
    looks: ['girl', 'boy'],
    base: {
      girl: { top: GIRL_HEAD.concat(BODY) },
      boy: { top: BOY_HEAD.concat(BODY) },
    },
    palette,
    // The knight's helmet and shield the boy hero always had.
    uses: { head: ['helmet'], hand: ['shield'] },
    items: { shape: SHAPES, head: HEADS, hand: HANDS, back: BACKS, style: STYLES },
    defaults: {
      girl: { shape: 'knight-skirt', head: 'knight-plume', hand: 'none', back: 'none', style: 'knight-braid', dress: 'sky', hair: 'red' },
      boy: { shape: 'knight-plate', head: 'knight-plume', hand: 'none', back: 'none', style: 'knight-crop', dress: 'rose', hair: 'brown' },
    },
  });
})();
