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

  // A cloud of curls behind her head, and her head's top rows filled in
  // with curls (no outline inside the cloud).
  const CURLS = [
    '........oo..oo........',
    '...ooo.oHhoohHo.ooo...',
    '..oHhhoohhhhhhoohhHo..',
    '..ohhhhhhhhhhhhhhhho..',
    '.ooohhhhhhhhhhhhhhooo.',
    'oHhhohhhhhhhhhhhhohhHo',
    'ohhhhhhhhhhhhhhhhhhhho',
    'ohhhhhhhhhhhhhhhhhhhho',
    '.oohhhhhhhhhhhhhhhhoo.',
    'oHhhhhhhhhhhhhhhhhhhHo',
    'ohhhhhhhhhhhhhhhhhhhho',
    '.ohhhhhhhhhhhhhhhhhho.',
    '..oohhhhhhhhhhhhhhoo..',
    '.oHhhhhhhhhhhhhhhhhHo.',
    '.ohhhhhhhhhhhhhhhhhho.',
    '..ooo.oooooooooo.ooo..',
  ];
  const CURLS_TOP = {
    0: 'hhohhhhhhhhhhhhohh',
    1: 'hhhhhhhhhhhhhhhhhh',
    2: 'hhhhhhhhhhhhhhhhhh',
    3: 'ohhhhhhhhhhhhhhhho',
    4: 'hhhhhhhhhhhhhhhhhh',
    5: 'hhhhhhhhhhhhhhhhhh',
  };

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
        // A bluebell: a narrow bell whose lip flares and curls up at the
        // sides.
        'fairy-bluebell': {
          name: I18n.t('heroes.fairy.bluebell'), icon: '🔔', girl: true, fairy: true,
          art: {
            bottom: [
              '......oddddo......',
              '.....oLddddDo.....',
              '.....oLddddDo.....',
              '....oLLddddDDo....',
              '....oLdddddDDo....',
              '...oLLdddddDDDo...',
              '.o.oLddddddDDDo.o.',
              '.oLLdoLddoddDoDDo.',
              '..ooooos..sooooo..',
              FEET,
            ],
            walk: { 8: '..oooos....soooo..', 9: FEET_B },
            ride: 'skirt',
          },
        },
        // A toadstool: a wide spotted cap, frilly gills under it, her legs
        // for its stalk.
        'fairy-toadstool': {
          name: I18n.t('heroes.fairy.toadstool'), icon: '🍄', girl: true, forest: true,
          art: {
            bottom: [
              '......oddddo......',
              '....ooLddddDoo....',
              '..ooLdwwddddDDoo..',
              '.oLLddwwdddwwDDDo.',
              'oLwddddddddwwDDDDo',
              'oLwwdddwwdddddDDDo',
              'oooooooooooooooooo',
              '....oiIiIiIiIo....',
              LEGS,
              FEET,
            ],
            walk: STEP,
            ride: 'skirt',
          },
        },
        // A bumblebee: a striped skirt and striped stockings.
        'fairy-bee': {
          name: I18n.t('heroes.fairy.bee'), icon: '🐝', girl: true, shop: true, price: 10,
          art: {
            top: { 17: '......oxyxyo......' },
            bottom: [
              '......oyyyyo......',
              '.....oxxxxxxo.....',
              '....oyzyyyyyYo....',
              '...oxxxxxxxxxxo...',
              '..oyzyyyyyyyyYYo..',
              '..oooooooooooooo..',
              '......oy..yo......',
              '......ox..xo......',
              '......oy..yo......',
              FEET,
            ],
            walk: { 6: '.....oy....yo.....', 7: '.....ox....xo.....', 8: '.....oy....yo.....', 9: FEET_B },
            ride: { flap: 4, cloth: 'yx', hem: 'y', leg: 's', sock: 'x', boot: 'D', shine: 'z' },
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
        // An upside-down bluebell for a hat, a curl of stalk on top.
        'fairy-bellcap': {
          name: I18n.t('heroes.fairy.bellcap'), icon: '🪻', girl: true, fairy: true,
          art: { x: 3, y: -5, pal: { B: '#9aa8ff', N: '#5a64d0', c: '#d4dcff' }, rows: [
            '.......oqo...',
            '......oqo....',
            '.....oBBBo...',
            '....oBcBBNo..',
            '...oBcBBBBNo.',
            '..oBcBBBBBNNo',
            '.oBBBBBBBBBNo',
            'oBoBoBoBoNoNo',
            'o..o.o.o.o..o',
          ] },
        },
        // A crescent moon clip with a little star by it.
        'fairy-moonclip': {
          name: I18n.t('heroes.fairy.moonclip'), icon: '🌙', girl: true, unicorn: true,
          art: { x: 0, y: -1, rows: [
            '..ooo....',
            '.oyyzo...',
            'oyzoo..w.',
            'oyo...wyw',
            'oyzoo..w.',
            '.oyyzo...',
            '..ooo....',
          ] },
        },
        // A pointy cap made of a leaf, its tip flopping over.
        'fairy-leafhat': {
          name: I18n.t('heroes.fairy.leafhat'), icon: '🌿', girl: true,
          art: { x: 3, y: -5, rows: [
            '............oo',
            '..........ooqo',
            '........ooqqo.',
            '......ooqQqo..',
            '....ooqqQqqo..',
            '...oqqqQqqqo..',
            '..oqqqQqqqqqo.',
            '.oQQQQQQQQQQQo',
            '.ooooooooooooo',
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
        // A bubble wand, bubbles floating up past her.
        'fairy-bubbles': {
          name: I18n.t('heroes.fairy.bubbles'), icon: '🫧', girl: true, unicorn: true,
          art: { x: 13, y: -5, pal: { c: '#58b4e8', e: '#d070e0' }, rows: [
            '....cc.',
            '...c.wc',
            '...e..c',
            '....cc.',
            '.c.....',
            'c.e....',
            '.c.....',
            '.....c.',
            '....u..',
            '...u.u.',
            '....u..',
            '....u..',
            '....u..',
            '...u...',
            '...u...',
            '..u....',
            '..u....',
            '..u....',
            '.u.....',
            '.u.....',
          ] },
        },
        // A squat pot brimming with honey, a label round it, the dipper
        // standing in it with a blob of honey, and a bee buzzing by.
        'fairy-honeypot': {
          name: I18n.t('heroes.fairy.honeypot'), icon: '🍯', girl: true, shop: true, price: 7,
          art: { x: 13, y: 11, rows: [
            '....ZZ.',
            '.yy.xyx',
            '.yY....',
            '.oJyyo.',
            'oyyyyyo',
            'oKyKKyo',
            'oiIiIio',
            'oKKKKKo',
            '.ooooo.',
          ] },
        },
        // A little golden harp with a flower on it.
        'fairy-harp': {
          name: I18n.t('heroes.fairy.harp'), icon: '🎵', girl: true, fairy: true,
          art: { x: 14, y: 9, rows: [
            '.Y...Y',
            '.yY.Yy',
            '.yyyyy',
            '.yw.wy',
            'Pyw.wy',
            'yPw.wy',
            'Py.w.y',
            '..yyy.',
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
        // Two big leaves, a vein down each.
        'fairy-leafwings': {
          name: I18n.t('heroes.fairy.leafwings'), icon: '🍀', girl: true, forest: true,
          art: { wings: [[
            'nn......',
            'nGnn....',
            'nGGqnn..',
            'nGqqqQn.',
            '.nGqqQqn',
            '.nGqQqqn',
            '..nqQqqn',
            '..nqqQqn',
            '...nqqQn',
            '....nnQn',
            '......nn',
          ], { n: '#2e6a3a', G: '#8ee07a', q: '#5cbf5a', Q: '#3a8a48' }, 9] },
        },
        // Tall wings like the night sky, dotted with stars.
        'fairy-nightwings': {
          name: I18n.t('heroes.fairy.nightwings'), icon: '🌌', girl: true, shop: true, price: 12,
          art: { wings: [[
            'o......',
            'oo.....',
            'omo....',
            'omno...',
            '.omno..',
            '.onyno.',
            '.onnnno',
            'onmnnno',
            'onnwnno',
            'onnnnno',
            '.onnyno',
            '.onnnno',
            '..onnno',
            '..onnno',
            '...onno',
            '....ooo',
          ], { o: '#2a2560', n: '#3e3a9a', m: '#6a68d0', y: '#ffd34d', w: '#ffffff' }, 3] },
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
        // A ponytail high on one side, tied with a flower.
        'fairy-sidetail': {
          name: I18n.t('heroes.fairy.sidetail'), icon: '💐', girl: true,
          art: { front: [[-2, -3, [
            '..oooo...',
            '.ohhhho..',
            'ohhHooP..',
            'ohHo.PyP.',
            'ohho..P..',
            'ohHo.....',
            '.oho.....',
            '..o......',
          ]]] },
        },
        // A big soft cloud of curls.
        'fairy-curls': {
          name: I18n.t('heroes.fairy.curls'), icon: '☁️', girl: true,
          art: {
            rows: CURLS_TOP,
            back: [[-2, -5, CURLS]],
          },
        },
        // A little topknot with a seedling sprouting from it.
        'fairy-sprout': {
          name: I18n.t('heroes.fairy.sprout'), icon: '🌱', girl: true,
          art: { front: [[5, -5, [
            '.oo...oo.',
            'oqGo.oGqo',
            '.oqQoQqo.',
            '..ohQho..',
            '.ohhhHho.',
            '..oRRRo..',
          ]]] },
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
