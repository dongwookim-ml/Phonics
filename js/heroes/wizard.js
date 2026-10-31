// The wizard (js/heroes.js): a girl or a boy in a long starry robe with a
// high collar and wide sleeves, a pointed hat and a staff. The girl has
// long wavy hair, the boy a little white wizard's beard. Storybook magic:
// stars, moons, crystals, an owl friend and floating spellbooks.
(() => {
  // The head (rows 0-12), shared by every robe: the same face as every
  // hero, framed by wavy hair (the girl) or short hair (the boy), and the
  // robe's high collar under the chin, a gold clasp at the front.
  const GIRL_HEAD = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHhhhhho...',
    '..ohhHHhhhhhhhho..',
    '.ohHhhhhhhhhhhhho.',
    '.ohhhsshhhhsshhho.',
    'ohhhhssssssssshhho',
    'ohHhhsskssskssHhho',
    '.ohhhsskssskssHho.',
    '.oHhhspssssspshho.',
    'ohhhhssssmsssshhho',
    'ohhHhossssssohHhho',
    '.ohhhoLLyyLLohhho.',
  ];
  const BOY_HEAD = [
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
    '.....oLLyyLLo.....',
  ];
  // The robe's top (rows 13-17): no waist, wide bell sleeves down to gold
  // cuffs, a gold rope belt.
  const ROBE_TOP = [
    '..oLdddDyyDdddDo..',
    '.oLdddDdddddDdDDo.',
    'oLddDoddddddoDdDDo',
    'oLdDDoddddddoDDDDo',
    'ottttoyyyyyyotttto',
  ];

  // The sleeves close under the cuffs (the first two rows below), the
  // hands peeking out.
  const cuffs = bottom => ['.osso' + bottom[0].slice(5, 13) + 'osso.', '..oo' + bottom[1].slice(4, 14) + 'oo..'].concat(bottom.slice(2));
  // A robe: its top rows and 10 rows below, the feet under it.
  const robe = (top, bottom, extra) => Object.assign({ top, bottom: cuffs(bottom), walk: 'feet', ride: { flap: 6, cloth: 'dD', hem: 't', leg: 'n', boot: 'f' } }, extra);

  const shape = {
    // Long and starry, gold stars all over and a gold hem (the starting robe).
    'wizard-starrobe': {
      name: I18n.t('heroes.wizard.starrobe'), icon: '🌟',
      art: robe(ROBE_TOP, [
        '....oLddddddDo....',
        '....oLdydddDDo....',
        '...oLdyzydddDDo...',
        '...oLddyddddDDo...',
        '...oLdddddydDDo...',
        '..oLddddddyzyDDo..',
        '..oLdyddddDyDDDo..',
        '.oLdyzydddddDDDDo.',
        '.otttttttttttttto.',
        '......ff..ff......',
      ]),
    },
    // Dark like the night, a big silver crescent moon on the front.
    'wizard-moonrobe': {
      name: I18n.t('heroes.wizard.moonrobe'), icon: '🌙',
      art: robe([
        '..odDDDDMMDDDDDo..',
        '.odDDDDDDDDDDDDDo.',
        'odDDDoDDDDDDoDDDDo',
        'odDDDoDDDDDDoDDDDo',
        'oWWWWoMMMMMMoWWWWo',
      ], [
        '....oDDDDDDDDo....',
        '....oDDDMMDDDo....',
        '...oDDDMMDDDDDo...',
        '...oDDMMDDDDDDo...',
        '...oDDMMDDDDDDo...',
        '..oDDDMMDDDDzDDo..',
        '..oDDDDMMDDDDDDo..',
        '.oDDzDDDMMMDDDDDo.',
        '.oWWWWWWWWWWWWWWo.',
        '......ff..ff......',
      ]),
    },
    // A learner's robe to the knee with a rope belt, leggings and boots.
    'wizard-apprentice': {
      name: I18n.t('heroes.wizard.apprentice'), icon: '📜',
      art: {
        top: [
          '..oLdddDiiDdddDo..',
          '.oLdddDdddddDdDDo.',
          'oLddDoddddddoDdDDo',
          'oLdDDoddddddoDDDDo',
          'oiiiioKKJKKKoiiiio',
        ],
        bottom: cuffs([
          '....oddddddDDo....',
          '....oLddddddDo....',
          '...oLddddddddDo...',
          '...oLddddddddDo...',
          '...oiiiiiiiiiio...',
          '.....onnoonno.....',
          '.....onnoonno.....',
          '.....oJJooJJo.....',
          '.....oJJooJJo.....',
          '.....oooooooo.....',
        ]),
        walk: 'legs',
        ride: { flap: 4, cloth: 'dD', hem: 'i', leg: 'n', boot: 'J' },
      },
    },
    // Ice-blue crystals down the front and round the hem.
    'wizard-crystalrobe': {
      name: I18n.t('heroes.wizard.crystalrobe'), icon: '💎',
      art: robe([
        '..oLdddDcZDdddDo..',
        '.oLdddDddcddDdDDo.',
        'oLddDoddZcddoDdDDo',
        'oLdDDoddcdddoDDDDo',
        'oZcZcocZcZcZocZcZo',
      ], [
        '....oLdddcdDDo....',
        '....oLddcZcdDo....',
        '...oLdddZcdddDo...',
        '...oLddddcddDDo...',
        '...oLdcddddcdDo...',
        '..oLdcZcddcZcDDo..',
        '..oLddcddddcdDDo..',
        '.oLddddddddddDDDo.',
        '.oZcZcZcZcZcZcZco.',
        '......ff..ff......',
      ], { ride: { flap: 6, cloth: 'dD', hem: 'c', leg: 'n', boot: 'f' } }),
    },
    // Rainbow stripes round the hem (the Unicorn Village's).
    'wizard-rainbowrobe': {
      name: I18n.t('heroes.wizard.rainbowrobe'), icon: '🌈', unicorn: true,
      art: robe(ROBE_TOP, [
        '....oLddddddDo....',
        '....oLddddddDo....',
        '...oLdddydddDDo...',
        '...oLddddddddDo...',
        '...oeeeeeeeeeeo...',
        '..oOOOOOOOOOOOOo..',
        '..oyyyyyyyyyyyyo..',
        '.oqqqqqqqqqqqqqqo.',
        '.oBBBBBBBBBBBBBBo.',
        '......ff..ff......',
      ], { ride: { flap: 6, cloth: 'dD', hem: 'B', leg: 'n', boot: 'f' } }),
    },
    // Sewn from patches of every colour, with big stitches.
    'wizard-patchrobe': {
      name: I18n.t('heroes.wizard.patchrobe'), icon: '🧵',
      art: robe(ROBE_TOP, [
        '....oLddddddDo....',
        '....oLdPPPddDo....',
        '...oLddPwPdddDo...',
        '...oLddPPPdddDo...',
        '...oLdddddBBBDo...',
        '..oLqqqdddBwBDDo..',
        '..oLqwqdddBBBDDo..',
        '.oLdqqqdddddDDDDo.',
        '.otttttttttttttto.',
        '......ff..ff......',
      ]),
    },
  };

  const head = {
    // A tall pointed hat whose tip flops over, a gold star at its end.
    'wizard-starhat': {
      name: I18n.t('heroes.wizard.starhat'), icon: '⭐',
      art: { x: 1, y: -5, rows: [
        '.....ooooo......',
        '..oooddddDoo....',
        '.oyoo.ooddDo....',
        'oyzyo..oddDo....',
        '.oyo..oddydDo...',
        '......odyzydDo..',
        '.....oddDydDDo..',
        'ooooooyyyyyyoooo',
        'oDDDDDDDDDDDDDDo',
        '.oooooooooooooo.',
      ] },
    },
    // A tall straight hat with a silver crescent moon.
    'wizard-moonhat': {
      name: I18n.t('heroes.wizard.moonhat'), icon: '🌛',
      art: { x: 2, y: -5, rows: [
        '.........oo...',
        '.......ooDo...',
        '......oDDo....',
        '.....oMMDDo...',
        '....oMDDDzDo..',
        '....oMMDDDDo..',
        '...oDDMMDDDDo.',
        'oooWWWWWWWWWWo',
        'oDDDDDDDDDDDDo',
        '.oooooooooooo.',
      ] },
    },
    // A witch's hat with a wide brim, a ribbon and a flower.
    'wizard-witchhat': {
      name: I18n.t('heroes.wizard.witchhat'), icon: '🧙‍♀️',
      art: { x: 0, y: -5, rows: [
        '..........ooo.....',
        '.........oDDo.....',
        '........oddo......',
        '.......oddDo......',
        '......oddddDo.....',
        '.....odddddDDo....',
        '.....oPPPPePPo....',
        '..oooodddddddooo..',
        '.oDDDDDDDDDDDDDDo.',
        'oDDDDDDDDDDDDDDDDo',
        '.oooooooooooooooo.',
      ] },
    },
    // A pointed hood in her robe's colour, trimmed in gold.
    'wizard-hood': {
      name: I18n.t('heroes.wizard.hood'), icon: '🧥',
      art: { x: 0, y: -4, rows: [
        '.........oo.......',
        '........oddo......',
        '.......oddDDo.....',
        '.....oodddDDoo....',
        '....oddddddDDDo...',
        '...odddddddddDDo..',
        '..oddtttttttttDDo.',
        '.oddt........tDDo.',
        '.odt..........tDo.',
        'oddt..........tDDo',
        'oddt..........tDDo',
        'oddt..........tDDo',
        'oddt..........tDDo',
        'oddt..........tDDo',
        'oddt..........tDDo',
        '.oddt........tDDo.',
        '..odd........DDo..',
      ] },
    },
    // A gold circlet with a glowing crystal.
    'wizard-circlet': {
      name: I18n.t('heroes.wizard.circlet'), icon: '💠',
      art: { x: 2, y: 0, rows: [
        '......oo......',
        '.....oZco.....',
        '.c...ocZo...c.',
        'yYy.yyoyyy.yYy',
        '.oyyy....yyyo.',
      ] },
    },
    // Little round spectacles with gold rims.
    'wizard-specs': {
      name: I18n.t('heroes.wizard.specs'), icon: '👓',
      art: { x: 5, y: 6, rows: [
        '.YYY.YYY.',
        'Yw.ZYZ.wY',
        'YZ.Z.Z.ZY',
        '.YYY.YYY.',
      ] },
    },
    // A red toadstool hat with white spots (the Forest's).
    'wizard-mushroom': {
      name: I18n.t('heroes.wizard.mushroom'), icon: '🍄', forest: true,
      art: { x: 1, y: -4, rows: [
        '.....oooooo.....',
        '...ooeewweeoo...',
        '..oeeeeewweeeo..',
        '.oewweeeeeeeweo.',
        '.oewweeeeeeeeeo.',
        'oeeeeeeewweeeeeo',
        'oEEEEEEEEEEEEEEo',
        '.oioiooooooioio.',
      ] },
    },
  };

  // Things in her hand: her right hand is at (14-15, 18), under her cuff.
  const shaft = (n, a, b) => Array.from({ length: n }, (_, i) => `...${i % 2 ? b : a}...`);
  const hand = {
    // A wooden staff with a big purple crystal on top, sparkling.
    'wizard-crystalstaff': {
      name: I18n.t('heroes.wizard.crystalstaff'), icon: '🔮',
      art: { x: 13, y: -3, rows: [
        '...z...',
        '...o...',
        '..oUo..',
        '.ouzUo.',
        'zouuUoz',
        '.ouuUo.',
        '..oUo..',
        '.yoJoy.',
        '..yKy..',
      ].concat(shaft(21, 'J', 'K')) },
    },
    // A fat spellbook with a gold star on its cover.
    'wizard-spellbook': {
      name: I18n.t('heroes.wizard.spellbook'), icon: '📖',
      art: { x: 13, y: 12, rows: [
        '...z...',
        '.ooooo.',
        'oUuuuuo',
        'oUuyuuo',
        'oUyzyuo',
        'oUuyuuo',
        'oUuuuuo',
        'oiiiiio',
        '.ooooo.',
      ] },
    },
    // A round bottle of bubbling pink potion with a cork.
    'wizard-potion': {
      name: I18n.t('heroes.wizard.potion'), icon: '🧪',
      art: { x: 13, y: 10, rows: [
        '....z.',
        '.z....',
        '..oo..',
        '.oKKo.',
        '.oWWo.',
        'oWPPWo',
        'oPPwPo',
        'oPPPPo',
        'oEPPEo',
        '.oooo.',
      ] },
    },
    // A broom to fly on, held up by its handle with its bristles at the
    // top (so they show on a unicorn too).
    'wizard-broom': {
      name: I18n.t('heroes.wizard.broom'), icon: '🧹',
      art: { x: 13, y: -1, rows: [
        '.o.o.o.',
        'oISIISo',
        'oISISIo',
        'oIISIIo',
        '.oISIo.',
        '.oIIIo.',
        '..yyy..',
      ].concat(shaft(17, 'J', 'K')) },
    },
    // An owl friend with big round eyes, sitting on her hand (the Forest's).
    'wizard-owl': {
      name: I18n.t('heroes.wizard.owl'), icon: '🦉', forest: true,
      art: { x: 13, y: 9, rows: [
        'o.....o',
        'oKo.oKo',
        'oKKKKKo',
        'owwKwwo',
        'owkKkwo',
        'oKKOKKo',
        'oJiiiJo',
        'oJiIiJo',
        '.oJJJo.',
        '.O...O.',
      ] },
    },
    // A white staff with a golden unicorn's horn and ribbons (the Unicorn Village's).
    'wizard-unistaff': {
      name: I18n.t('heroes.wizard.unistaff'), icon: '🦄', unicorn: true,
      art: { x: 13, y: -4, rows: [
        '...o...',
        '..oyo..',
        '..oYo..',
        '..oyo..',
        '.ozYyo.',
        '.oYyYo.',
        'PPoyoBB',
        'P.PwB.B',
      ].concat(shaft(23, 'w', 'W')) },
    },
  };

  // Back things carry their own colours. The moon cloak and the books are
  // worn over her, with outlines of their own so their wardrobe pictures
  // stay whole where they cross hers.
  const INK = { o: '#4a2c4f', y: '#ffd34d', Y: '#e0a52a', z: '#fff6c0' };
  const back = {
    // A violet cloak edged in gold, its collar up beside her head, stars.
    'wizard-starcloak': {
      name: I18n.t('heroes.wizard.starcloak'), icon: '🌌',
      art: { x: -2, y: 9, pal: Object.assign({ C: '#4b2f86', c: '#8a70d0' }, INK), rows: [
        '..oyo............oyo..',
        '..oCyo..........oyCo..',
        '..oCCyooooooooooyCCo..',
        '..ocCCCCCCCCCCCCCCco..',
        '..ocCCCCCCCCCCCCCCco..',
        '.ocCzCCCCCCCCCCCCCCco.',
        '.ocCCCCCCCCCCCCCCyCco.',
        '.ocCCCCCCCCCCCCCCCCco.',
        'ocCyCCCCCCCCCCCCCCCCco',
        'ocCCCCCCCCCCCCCCCCzCco',
        'ocCCCCCCCCCCCCCCCCCCco',
        'ocCzCCCCCCCCCCCCCCCCco',
        'ocCCCCCCCCCCCCCCCCyCco',
        'ocyCCCCCCCCCCCCCCCCCco',
        'ocCCCCCCCCCCCCCCCCCzco',
        'oczCCCCCCCCCCCCCCCCCco',
        'oyyyyyyyyyyyyyyyyyyyyo',
        '.oooooooooooooooooooo.',
      ] },
    },
    // A purple cloak worn over her shoulders (drawn over her, so it shows
    // past long hair): its silver-edged sides hang down, tied at the throat
    // with a silver cord and a crescent-moon clasp.
    'wizard-mooncloak': {
      name: I18n.t('heroes.wizard.mooncloak'), icon: '🌜',
      art: { x: -2, y: 12, front: true, pal: Object.assign({}, INK, { o: '#3e2a72', C: '#8a5ad8', c: '#b98cff', M: '#f4f8ff', W: '#c8d2e4' }), rows: [
        '..ooo......MM....ooo..',
        '.oCCMWWWW.M..WWWoMCCo.',
        '.oCCMo.....MM...oMCCo.',
        'oCCCMo..........oMCCCo',
        'oCCMo............oMCCo',
        'oCCMo............oMCCo',
        'oCMo..............oMCo',
        'oCCWo............oWzCo',
        'oCcWo............oWCCo',
        'oCMWo............oWCzo',
        'oMCWo............oWcCo',
        'oCMWo............oWCCo',
        'oCcWo............oWzco',
        'oCCWo............oWCCo',
        'oWWWo............oWWWo',
        '.ooo..............ooo.',
      ] },
    },
    // Two spellbooks floating beside her, clear of her hat and her staff.
    'wizard-books': {
      name: I18n.t('heroes.wizard.books'), icon: '📚',
      art: { x: -2, y: 5, front: true, pal: Object.assign({ R: '#e8485a', r: '#ff9aa8', B: '#3f74c8', b: '#6fb7ff', i: '#fff4dc', Q: '#8a2038', q: '#22407e' }, INK), rows: [
        'QQQQQ',
        'QRrRQ',
        'QRyRQ',
        'QRrRQ',
        'QiiiQ',
        '.QQQ.',
        '..z..',
        'qqqqq',
        'qbbBq',
        'qbyBq',
        'qbbBq',
        'qiiiq',
        '.qqq.',
      ] },
    },
    // Twinkle dust: big and little stars sparkling all over her (the Fairy
    // Village's).
    'wizard-sparkles': {
      name: I18n.t('heroes.wizard.sparkles'), icon: '✨', fairy: true,
      art: { x: -2, y: 10, front: true, pal: Object.assign({ P: '#ff7fb6', c: '#9fe8ff', u: '#b98cff', w: '#ffffff' }, INK), rows: [
        '......................',
        '...................c..',
        '..y...............czc.',
        '.yzy.....z.........c..',
        'yzwzy...........P.....',
        '.yzy...........PzP...u',
        '..y.z......w....P.....',
        '......................',
        'P......u..............',
        '......uzu......c...P..',
        '.......u..........PzP.',
        '..c..............PzwzP',
        '.czc.........u....PzP.',
        'czwzc.......uzu....P..',
        '.czc.......uzwzu......',
        '..c....P....uzu...y...',
        '......PzP....u...yzy..',
        '....y..P..........y..c',
      ] },
    },
  };

  // Hairstyles: hers long and wavy, his short and tousled. Her waves fall
  // behind her, out past her wide sleeves.
  const WAVES = [
    '..oh',
    '.ohh',
    'ohhh',
    'ohHh',
    '.ohh',
    '.ohh',
    'ohhh',
    'oHhh',
    '.ohh',
    '.oHh',
    'ohho',
    '.oo.',
  ];
  // A low tail tied with a purple ribbon, over the edge of her sleeve.
  const TAIL = [
    '.uu.',
    'uUuo',
    '.oho',
    'ohho',
    'oHo.',
    '.oho',
    '.ohh',
    'ohHo',
    'oho.',
    '.o..',
  ];
  const style = {
    // Long and wavy down her back, out past her sleeves (her starting style).
    'wizard-wavy': {
      name: I18n.t('heroes.wizard.wavy'), icon: '🌊', girl: true,
      art: {
        back: [[-2, 11, WAVES], [16, 11, WAVES.map(r => [...r].reverse().join(''))]],
      },
    },
    // One thick braid over her shoulder, tied with a star.
    'wizard-braid': {
      name: I18n.t('heroes.wizard.braid'), icon: '🥨', girl: true,
      art: {
        front: [[13, 11, ['ohho.', 'oHho.', '.ohHo', '.oHho', '.ohHo', '.oHho', '.ohHo', '.oHho', '.oyo.', 'oyzyo', '.oyo.']]],
      },
    },
    // Two low wavy tails, tied with purple ribbons.
    'wizard-tails': {
      name: I18n.t('heroes.wizard.tails'), icon: '🎀', girl: true,
      art: {
        front: [[-2, 11, TAIL], [16, 11, TAIL.map(r => [...r].reverse().join(''))]],
      },
    },
    // Short and windswept, tufts sticking out at both sides and a curl on
    // top (his starting style).
    'wizard-tousled': {
      name: I18n.t('heroes.wizard.tousled'), icon: '🌀', boy: true,
      art: {
        rows: { 5: '.ohhhsshhhhsshhho.', 6: 'ohhhhssssssssshhho', 7: '..ohhsskssskssHho.', 8: 'ohhhhsskssskssHhho', 9: '..ohospssssspsoho.' },
        front: [[4, -2, ['.....o....', '....oho...', '.o..ohoo.o', 'oho.ohhoho']]],
      },
    },
    // Grown long and tied in a little tail, over his left shoulder.
    'wizard-tail': {
      name: I18n.t('heroes.wizard.tail'), icon: '🎗️', boy: true,
      art: {
        rows: { 9: '...ohspssssspsho..', 10: '...ohssssmsssso...' },
        front: [[0, 8, ['..oh', '.ohh', 'ouUo', 'ohho', 'ohHo', 'oHho', 'ohho', '.oHo', '.oho', '..o.']]],
      },
    },
    // A long fringe swept over to one side, down past his ear to his chin.
    'wizard-swoop': {
      name: I18n.t('heroes.wizard.swoop'), icon: '💨', boy: true,
      art: {
        rows: {
          5: '..ohhhhhhhhhhsho..',
          6: '...ohhhhssssssHho.',
          7: '...ohsskssskssHho.',
          8: '...ohsskssskssHhho',
          9: '....ospssssspsHhho',
          10: '....ossssmssssHho.',
          11: '.....osssssssoHho.',
          12: '.....oLLyyLLohho..',
        },
        front: [[12, 3, ['.ooo.', 'ohhho', 'ohHho', '.oho.']]],
      },
    },
  };

  addHeroKit('wizard', {
    looks: ['girl', 'boy'],
    base: {
      girl: { top: GIRL_HEAD.concat(ROBE_TOP) },
      // A little white wizard's beard round his chin.
      boy: { top: BOY_HEAD.concat(ROBE_TOP), front: [[4, 10, ['ow.......wo', '.owwwwwwWo.', '..owwwwWo..', '...owwWo...', '....owo....', '.....o.....']]] },
    },
    // Leggings the same for both, under a short robe and on a unicorn.
    palette: (outfit, look, base) => Object.assign({}, base, { n: '#4a4a7a' }),
    items: { shape, head, hand, back, style },
    // The old wizard things (js/sprites.js) are the boy wizard's too.
    uses: { shape: ['wizard'], head: ['wizardhat'], hand: ['staff'] },
    defaults: {
      girl: { shape: 'wizard-starrobe', head: 'wizard-witchhat', hand: 'wizard-broom', back: 'none', style: 'wizard-wavy', dress: 'berry', hair: 'red' },
      boy: { shape: 'wizard-starrobe', head: 'wizard-starhat', hand: 'wizard-crystalstaff', back: 'none', style: 'wizard-tousled', dress: 'navy', hair: 'brown' },
    },
  });
})();
