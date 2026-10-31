// The fairy (js/heroes.js): a small, light, magical girl. A pixie cut,
// pointed elf ears, rosy cheeks, little wings of her own (so she is a
// fairy even with nothing on her back) and a twinkle or two around her;
// short petal and leaf dresses over bare legs and pointed slippers.
(() => {
  // Her own little wings, the left one (palette letters 1 2 3: hidden when
  // she wears other wings or a cape). Drawn over her hair, beside her.
  const WING_L = [
    '.22..',
    '2112.',
    '21312',
    '21111',
    '.2111',
    '..211',
    '.2112',
    '2132.',
    '.22..',
  ];
  const mirror = rows => rows.map(r => [...r].reverse().join(''));

  // Bare legs and pointed slippers under a short dress, and as she steps.
  const LEGS = '......os..so......';
  const FEET = '.....oDD..DDo.....';
  const LEGS_B = '.....os....so.....';
  const FEET_B = '....oDD....DDo....';
  const STEP = { 7: LEGS_B, 8: LEGS_B, 9: FEET_B };
  // Long wavy hair over her left shoulder (mirrored for the right).
  const FLOWING_L = ['.ohho', 'ohhho', 'ohHho', 'ohhHo', '.ohho', '.ohHo', 'ohhho', 'oHhho', '.oho.', '..o..'];

  addHeroKit('fairy', {
    looks: ['girl'],
    base: {
      girl: {
        // A pixie cut swept to one side, a slim bodice on thin straps.
        top: [
          '.......ooooo......',
          '.....oohhhhhoo....',
          '....ohhhhhHHhho...',
          '...ohhhHHHhhhhho..',
          '..ohhHHhhhhhhhhho.',
          '.ohhhhhhhhhhhhhho.',
          '..ohhhhhhssssshho.',
          '..ohhsskssskssho..',
          '..ohhsskssskssho..',
          '...ohspssssspsho..',
          '....ossssmsssso...',
          '.....osssssssoo...',
          '......oossoo......',
          '....ooLddddLoo....',
          '...osoLddddLoso...',
          '...os.oddddo.so...',
          '...os.oddddo.so...',
          '......otttto......',
        ],
        // Twinkles round her.
        back: [
          [-1, 1, ['.z.', 'zwz', '.z.']],
          [16, 0, ['.y.', 'yzy', '.y.']],
          [17, 20, ['.z.', 'zwz', '.z.']],
        ],
        // Pointed ears and her wings, over any hairstyle.
        front: [
          [-2, 6, ['oo....', 'osoo..', '.ospso', '..osso', '...oo.']],
          [14, 6, ['....oo', '..ooso', 'ospso.', 'osso..', '.oo...']],
          [-2, 11, WING_L],
          [15, 11, mirror(WING_L)],
        ],
      },
    },
    palette: (outfit, look, pal) => {
      const back = BACK_ITEMS[outfit.back];
      const art = back && back.art;
      const covered = HERO_WINGS[outfit.back] || CAPES[outfit.back] || (art && (art.wings || art.cape));
      return Object.assign({}, pal, covered ? {} : { 1: '#e2f6ff', 2: '#4f98d0', 3: '#ffffff' });
    },
    items: {
      shape: {
        // An upside-down tulip: a long petal in the middle, one curling
        // out either side.
        'fairy-petals': {
          name: I18n.t('heroes.fairy.petals'), icon: '🌷', girl: true,
          art: {
            bottom: [
              '......oddddo......',
              '.....oLddddDo.....',
              '....oLdLddLdDo....',
              '...oLddLddLddDo...',
              '..oLLdoLddLoDDDo..',
              '.oLLdoLdddLDoDDDo.',
              '.ooo.oLdddDDo.ooo.',
              '......ooLDoo......',
              LEGS,
              FEET,
            ],
            walk: { 8: LEGS_B, 9: FEET_B },
            ride: 'skirt',
          },
        },
        // Pointed leaves of different lengths, each with its vein, on a
        // belt of vine.
        'fairy-leaves': {
          name: I18n.t('heroes.fairy.leaves'), icon: '🍃', girl: true, forest: true,
          art: {
            top: { 17: '......oqGqqo......' },
            bottom: [
              '......oddddo......',
              '.....oLdDddDo.....',
              '....oLdDdddDDo....',
              '...oLdDddLddDDo...',
              '..oLdDddLddDdDDo..',
              '.oLdDdoLdDdoDdDDo.',
              '.oDoo.oDdDo..oDo..',
              '..o....ooo....o...',
              LEGS,
              FEET,
            ],
            walk: { 8: LEGS_B, 9: FEET_B },
            ride: 'skirt',
          },
        },
        // Round as a dewdrop, shining, with drops along the hem.
        'fairy-dewdrop': {
          name: I18n.t('heroes.fairy.dewdrop'), icon: '🫧', girl: true,
          art: {
            top: { 13: '....oowddddwoo....' },
            bottom: [
              '......oddddo......',
              '....ooLddddDoo....',
              '...oLwwdddddDDo...',
              '..oLwLddddddDDDo..',
              '..oLLdddddddDDDo..',
              '..oLddddddddDDDo..',
              '...ooDddddddDoo...',
              '...c.oooooooo.c...',
              '..cZc.os..so.cZc..',
              '...c.oDD..DDo.c...',
            ],
            walk: { 8: '..cZcos....socZc..', 9: '...coDD....DDoc...' },
            ride: 'skirt',
          },
        },
        // A puff of dandelion fluff, seeds blowing off it.
        'fairy-fluff': {
          name: I18n.t('heroes.fairy.fluff'), icon: '☁️', girl: true, fairy: true,
          art: {
            top: { 13: '....owLddddLwo....', 14: '...osowLLLLwoso...' },
            bottom: [
              '.....owwLLwwo.....',
              '...oowLLwLLLwoo...',
              '.w.owLLLLLLLLLwo..',
              '..owLLwLLLLwLLLwo.',
              '.owLLLLLLwLLLLLwo.',
              '..owLwLLLLLLwLwo..',
              '...owowowowowo..w.',
              '.w.....os..so.....',
              LEGS,
              FEET,
            ],
            walk: STEP,
            ride: 'skirt',
          },
        },
        // Long and soft, shaped like a moth's wings (a big pair with a spot
        // on each, a small pair below), a fluffy collar and a fringed hem.
        'fairy-moth': {
          name: I18n.t('heroes.fairy.moth'), icon: '🦋', girl: true,
          art: {
            top: { 13: '....owLddddLwo....', 14: '...osowddddwoso...' },
            bottom: [
              '......oddddo......',
              '.....oLddddDo.....',
              '...ooLLddddDDoo...',
              '..oLLDLddddDDDDo..',
              '.oLLDyDLddDDyDDDo.',
              '.oLLLDLddddDDDDDo.',
              '..ooLLddddddDDoo..',
              '...oLLddddddDDo...',
              '..oLwDwwDDwwDwDo..',
              '.....oDD..DDo.....',
            ],
            walk: { 9: FEET_B },
            ride: 'skirt',
          },
        },
      },
      head: {
        // Little wild flowers round her head: pink, white and blue.
        'fairy-wreath': {
          name: I18n.t('heroes.fairy.wreath'), icon: '🌼', girl: true,
          art: { x: 3, y: -1, rows: [
            '....P....w...',
            '...PyPq.wyw..',
            '..qGPGqGGwGq.',
            '.Bq.......qB.',
            'ByB.......ByB',
            '.B.........B.',
          ] },
        },
        // A headband with two curly antennae, glowing at the tips.
        'fairy-antennae': {
          name: I18n.t('heroes.fairy.antennae'), icon: '🐝', girl: true,
          art: { x: 3, y: -4, rows: [
            'yy........yy',
            'yzo......ozy',
            '...o....o...',
            '....o..o....',
            '....o..o....',
            '..uuUuuUuu..',
          ] },
        },
        // An acorn's cap with its little stalk.
        'fairy-acorn': {
          name: I18n.t('heroes.fairy.acorn'), icon: '🌰', girl: true, forest: true,
          art: { x: 3, y: -4, rows: [
            '.....oJo.....',
            '.....oJo.....',
            '..ooKKKKKoo..',
            '.oKJKJKJKJKo.',
            'oKJKJKJKJKJKo',
            'oJJJJJJJJJJJo',
            '.ooooooooooo.',
          ] },
        },
        // A big star in her hair, rainbow ribbons under it.
        'fairy-starpin': {
          name: I18n.t('heroes.fairy.starpin'), icon: '🌟', girl: true, unicorn: true,
          art: { x: 11, y: -3, rows: [
            '...o...w',
            '..oyo...',
            'ooyzyoo.',
            'oyyzyyo.',
            '.oyyyo..',
            '.oyoyo..',
            '.ooeooB.',
            '..eO.qB.',
            '..O..q..',
          ] },
        },
        // A silver tiara with dewdrops on it.
        'fairy-dewtiara': {
          name: I18n.t('heroes.fairy.dewtiara'), icon: '💧', girl: true, fairy: true,
          art: { x: 4, y: -3, rows: [
            '.....c.....',
            '....cZc....',
            '.c..cwc..c.',
            'cZc.oco.cZc',
            'ocoMaMaMoco',
            'aMaaaaaaaMa',
          ] },
        },
      },
      hand: {
        // A star on a wand, trailing sparkles.
        'fairy-starwand': {
          name: I18n.t('heroes.fairy.starwand'), icon: '🪄', girl: true,
          art: { x: 13, y: 10, rows: [
            '....y..',
            '...yzy.',
            '..yyzyy',
            '...yyy.',
            '...y.y.',
            '..u...w',
            '..u....',
            '.u.....',
          ] },
        },
        // A dandelion clock, a seed or two blowing away.
        'fairy-dandelion': {
          name: I18n.t('heroes.fairy.dandelion'), icon: '🌬️', girl: true, fairy: true,
          art: { x: 13, y: 7, rows: [
            '.....W.',
            '..ooo.W',
            '.owWwo.',
            'owWwWwo',
            'owwIwwo',
            'owWwWwo',
            '.owwwo.',
            '..oqo..',
            '...q...',
            '..q....',
            '..q....',
          ] },
        },
        // A jar of fireflies, one out flying.
        'fairy-firefly': {
          name: I18n.t('heroes.fairy.firefly'), icon: '🫙', girl: true, forest: true,
          art: { x: 15, y: 11, rows: [
            '...z.',
            '..zyz',
            '...z.',
            '.ooo.',
            'oJJJo',
            'oZyZo',
            'oyZzo',
            'oZzyo',
            '.ooo.',
          ] },
        },
        // A big leaf for an umbrella.
        'fairy-leaf': {
          name: I18n.t('heroes.fairy.leaf'), icon: '☂️', girl: true,
          art: { x: 11, y: -3, rows: [
            '...ooo...',
            '.ooqqqoo.',
            'oqqqQqqqo',
            'oqQqQqQqo',
            '.oqqQqqo.',
            '..ooQoo..',
            '.....Q...',
            '.....Q...',
            '.....Q...',
            '.....Q...',
            '.....Q...',
            '.....Q...',
            '....Q....',
            '....Q....',
            '...Q.....',
            '...Q.....',
            '...Q.....',
            '..Q......',
            '..Q......',
          ] },
        },
      },
      back: {
        // A dragonfly's long shimmering wings, two on each side.
        'fairy-dragonfly': {
          name: I18n.t('heroes.fairy.dragonfly'), icon: '🪽', girl: true,
          art: { wings: [[
            'NN....',
            'NcNN..',
            'NZcZN.',
            '.NZcuN',
            '.NZZcN',
            '..NZZc',
            '...NNc',
            '....cc',
            '...NNc',
            '..NZZc',
            '.NZZcN',
            '.NZcuN',
            'NZcZN.',
            'NcNN..',
            'NN....',
          ], { N: '#4fa894', c: '#a8ecd8', Z: '#e8fff6', u: '#d8c4ff' }, 5] },
        },
        // Butterfly wings striped like a rainbow.
        'fairy-rainbow': {
          name: I18n.t('heroes.fairy.rainbow'), icon: '🌈', girl: true, unicorn: true,
          art: { wings: [[
            'oo.....',
            'oeeo...',
            'oOeeoo.',
            'oyOOeeo',
            '.oyyOeo',
            '..oqyOo',
            '...oqyo',
            '...oBqo',
            '..oBBuo',
            '.ouBuuo',
            '..ouuo.',
            '...oo..',
          ], { o: '#4a2c4f' }, 9] },
        },
        // Wings of pink petals.
        'fairy-petalwings': {
          name: I18n.t('heroes.fairy.petalwings'), icon: '🌺', girl: true, fairy: true,
          art: { wings: [[
            '.oo....',
            'oEPo...',
            'oEPPo..',
            'oEEPPo.',
            '.oEPPPo',
            '..oEPPo',
            '...oEPo',
            '..oEPPo',
            '.oEPPo.',
            '.oPPo..',
            '..oo...',
          ], { o: '#c0507a', E: '#ffd0e6', P: '#ff9ac8' }, 8] },
        },
        // Fairy dust swirling round her: a star leading a glittering trail
        // across the front of her skirt.
        'fairy-sparkles': {
          name: I18n.t('heroes.fairy.sparkles'), icon: '✨', girl: true,
          art: { x: -2, y: 11, front: true, rows: [
            '...................Y..',
            '..................YyY.',
            '.................YywyY',
            '..................YyY.',
            '..................Y.Y.',
            '.y................y...',
            '..w..z...........zy...',
            '....zwz....z.....yy...',
            '..y..z....zwz...zz....',
            '...z.......z...yyy....',
            'z...yz........wyz.....',
            'wz...yy......yzy......',
            'z.....zw....zyy.......',
            '.......zyPzwyz........',
            '........zyyzy.........',
          ] },
        },
      },
      style: {
        // Short and tousled, a curl sticking up on top.
        'fairy-pixie': {
          name: I18n.t('heroes.fairy.pixie'), icon: '🧚', girl: true,
          art: { front: [[8, -1, ['.o', 'oh']]] },
        },
        // Two little buns side by side up top, little flowers round them.
        'fairy-buns': {
          name: I18n.t('heroes.fairy.buns'), icon: '🌸', girl: true,
          art: { front: [
            [4, -4, ['.ooo.', 'ohhHo', 'ohHho', 'ohhho', '.ooo.']],
            [9, -4, ['.ooo.', 'oHhho', 'ohhHo', 'ohhho', '.ooo.']],
            [7, -5, ['.P.', 'PyP', '.P.']],
            [2, -1, ['.w.', 'wyw', '.w.']],
            [14, -1, ['.B.', 'ByB', '.B.']],
          ] },
        },
        // Long and wavy, falling over her shoulders.
        'fairy-flowing': {
          name: I18n.t('heroes.fairy.flowing'), icon: '💫', girl: true,
          art: {
            rows: { 9: '..ohhspssssspshho.', 10: '.ohhossssmssssohho', 11: '.ohhhosssssssohhho', 12: '.ohhhhoossoohhhho.' },
            front: [
              [1, 12, FLOWING_L],
              [12, 12, mirror(FLOWING_L)],
            ],
          },
        },
      },
    },
    uses: {
      shape: ['petal'],
      back: ['butterfly'],
    },
    defaults: { girl: { shape: 'fairy-petals', head: 'fairy-wreath', hand: 'none', back: 'none', style: 'fairy-pixie', dress: 'mint', hair: 'gold' } },
  });
})();
