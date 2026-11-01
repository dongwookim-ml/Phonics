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
    // An alchemist's robe: a leather-trimmed apron over it, potion bottles
    // in its pockets (sold in the shop).
    'wizard-alchemist': {
      name: I18n.t('heroes.wizard.alchemist'), icon: '⚗️', shop: true, price: 10,
      art: robe([
        '..oLdddKyyKdddDo..',
        '.oLddDKiiiiKdDDDo.',
        'oLddDoKiPiiKoDdDDo',
        'oLdDDoKiiiiKoDDDDo',
        'ottttoKKJJKKotttto',
      ], [
        '....oLKiiiiKDo....',
        '....oLKicqiKDo....',
        '...oLdKKKKKKdDo...',
        '...oLdKiiiiKdDo...',
        '...oLdKiyiiKdDo...',
        '..oLddKiiiiKdDDo..',
        '..oLddKKKKKKdDDo..',
        '.oLdddddddddddDDo.',
        '.otttttttttttttto.',
        '......ff..ff......',
      ], { ride: { flap: 6, cloth: 'dD', hem: 't', leg: 'n', boot: 'f', shine: 'i' } }),
    },
    // A short robe with a zigzag hem, striped stockings and gold slippers
    // with curly toes (the Forest's).
    'wizard-curlytoes': {
      name: I18n.t('heroes.wizard.curlytoes'), icon: '🥿', forest: true,
      art: robe(ROBE_TOP, [
        '....oLddddddDo....',
        '....oLddyddDDo....',
        '...oLdddddddDDo...',
        '...oLddddyddDDo...',
        '...oLddddddddDo...',
        '...otootootooto...',
        '....oonnoonnoo....',
        '.....oUUooUUo.....',
        '.oy..owwoowwo..yo.',
        '..oyyyyo..oyyyyo..',
      ], { walk: { 8: 'oy...owwoowwo..yo.', 9: '.oyyyyo...oyyyyo..' }, ride: { flap: 4, cloth: 'dD', hem: 't', leg: 'U', sock: 'w', boot: 'y' } }),
    },
    // A long robe with a gold line down the front under a round capelet
    // sprinkled with fairy dust (the Fairy Village's).
    'wizard-mantle': {
      name: I18n.t('heroes.wizard.mantle'), icon: '🧚', fairy: true,
      art: robe([
        '.oLLLLLLyyLLLLLLo.',
        'oLLPLLLLLLLLLcLLLo',
        'oLLLLLcLLLLPLLLLLo',
        'oyyyyyyyyyyyyyyyyo',
        'ottttoyyyyyyotttto',
      ], [
        '....oLdddydDDo....',
        '....oLdddyddDo....',
        '...oLddddyddDDo...',
        '...oLddddyddDDo...',
        '...oLddddyddDDo...',
        '..oLdddddydddDDo..',
        '..oLdddddydddDDo..',
        '.oLddddddyddddDDo.',
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
    // A long striped nightcap that flops over to one side, a pompom on its end.
    'wizard-nightcap': {
      name: I18n.t('heroes.wizard.nightcap'), icon: '🛌',
      art: { x: 0, y: -3, rows: [
        '.....oooooo.........',
        '...ooddwwddoo.......',
        '..oddwwddwwddoo.....',
        '.oddwwddwwddwwddoo..',
        '.owwddwwddwwddwwddo.',
        'oWWWWWWWWWWWWWWowwo.',
        'oWWWWWWWWWWWWWWoddo.',
        '.ooooooooooooooowwo.',
        '...............oddo.',
        '...............owwo.',
        '..............owWwwo',
        '..............owwWwo',
        '...............oooo.',
      ] },
    },
    // A little black kitten with white paws, peeking over the top of her
    // head (the Forest's).
    'wizard-cat': {
      name: I18n.t('heroes.wizard.cat'), icon: '🐈‍⬛', forest: true,
      art: { x: 4, y: -5, rows: [
        '.o.....o....',
        'oXo...oXo...',
        'oxxoooxxo...',
        'oxxxxxxxo.o.',
        'oxyxxxyxooxo',
        'oxxxPxxxo.xo',
        '.owxxxwo.ox.',
        '..ooooo.oo..',
      ] },
    },
    // A ring of pastel stars floating round her head (the Unicorn Village's).
    'wizard-starhalo': {
      name: I18n.t('heroes.wizard.starhalo'), icon: '💫', unicorn: true,
      art: { x: 0, y: -5, pal: { u: '#b98cff', P: '#ff7fb6', c: '#9fe8ff' }, rows: [
        '.........c........',
        '........czc.z.....',
        '....y.z..c....y...',
        '.z.yzy.......yzy.z',
        '....y.........y...',
        '..P.............u.',
        '.PzP...........uzu',
        '..P.............u.',
        '..................',
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
    // A crystal ball on a little gold stand, glowing (sold in the shop).
    'wizard-crystalball': {
      name: I18n.t('heroes.wizard.crystalball'), icon: '🔮', shop: true, price: 8,
      art: { x: 12, y: 10, rows: [
        '.z...z.',
        '..ooo..',
        '.oZcco.',
        'oZwccBo',
        'oZcccBo',
        'occcBBo',
        '.oBBBo.',
        '.oyyyo.',
        'oyYYYYo',
        '.ooooo.',
      ] },
    },
    // A little black cauldron of bubbling green potion.
    'wizard-cauldron': {
      name: I18n.t('heroes.wizard.cauldron'), icon: '🫕',
      art: { x: 12, y: 10, rows: [
        '.q...z.',
        '..ooo..',
        '.o.q.o.',
        '.oqQqo.',
        'oXXXXXo',
        'oxXxxxo',
        'oxXxxxo',
        '.oxxxo.',
        '.o...o.',
      ] },
    },
    // A short twig wand with a star at its tip, sparks flying (the Fairy
    // Village's).
    'wizard-wand': {
      name: I18n.t('heroes.wizard.wand'), icon: '🪄', fairy: true,
      art: { x: 13, y: 5, pal: { P: '#ff7fb6', c: '#9fe8ff' }, rows: [
        '..z....',
        '...z..z',
        '.P...y.',
        '....ywy',
        '...z.y.',
        'c...oK.',
        '....oK.',
        '.P.oK.z',
        '...oK..',
        '..oJ...',
        '..oJ...',
        '.oJ....',
        '.oJ....',
      ] },
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
    // A case of scrolls on her back, peeking over her shoulder, its strap
    // across her front.
    'wizard-scrolls': {
      name: I18n.t('heroes.wizard.scrolls'), icon: '📜',
      art: { x: -2, y: 4, front: true, pal: Object.assign({}, INK, { o: '#5a3428', e: '#e8485a', i: '#fff4dc', K: '#c08850', J: '#7a4a2e' }), rows: [
        '.o.o.............',
        'oioio............',
        'oeoeo............',
        'oioio............',
        'oKKKo............',
        'oKyKo............',
        'oKKJo............',
        'oKKJo............',
        'oJJJoJJK.........',
        'oKKJo..JJK.......',
        'oKKJo....JyK.....',
        '.ooo.......JJK...',
        '.............JJK.',
        '...............JJ',
      ] },
    },
    // A long rainbow scarf round her neck, one end hanging down (the Unicorn
    // Village's).
    'wizard-scarf': {
      name: I18n.t('heroes.wizard.scarf'), icon: '🧣', unicorn: true,
      art: { x: 2, y: 12, front: true, pal: Object.assign({}, INK, { o: '#5a3a6a', w: '#ffffff' }), rows: [
        '..oeeOOyyqBo.',
        '.ooeeOOyyqBo.',
        'oouuo........',
        '.oeeo........',
        '.oOOo........',
        '.oyyo........',
        '.oqqo........',
        '.oBBo........',
        '.ouuo........',
        '.oeeo........',
        '.owwo........',
        '..w.w........',
        '.............',
      ] },
    },
    // A baby dragon friend sitting on her shoulder.
    'wizard-dragonling': {
      name: I18n.t('heroes.wizard.dragonling'), icon: '🐉',
      art: { x: -2, y: 5, front: true, pal: Object.assign({}, INK, { o: '#2e4a30', q: '#62c46a', i: '#fff4dc', k: '#2e2433', m: '#e0707a', u: '#b98cff', U: '#8a5ad8' }), rows: [
        '.y...y.',
        '.oqqqo.',
        'oqkqkqo',
        'oqqiqqo',
        '.oqmqo.',
        'uoqqqou',
        'Uuoiouu',
        '.oqiqo.',
        '..oqoqo',
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
  // Her cloud of curls, his curls, and her buns (the left ones; mirrored).
  const CLOUD = [
    '..oo',
    '.ohh',
    'ohhh',
    'oHhh',
    '.ohh',
    'ohhh',
    'ohHh',
    '.ohh',
    'ohhh',
    'oHhh',
    '.ohh',
    '.ohh',
    '..oo',
  ];
  const CURLS = ['.oo', 'ohh', 'oHh', '.oo', 'ohh', 'oHh', '.oo', 'ohh', '.oo'];
  const BUN = ['.ooo.', 'ohhHo', 'ohyho', 'oHhho', '.ooo.'];
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
    // Cut in a bob at her chin, a star clip on one side.
    'wizard-bob': {
      name: I18n.t('heroes.wizard.bob'), icon: '✂️', girl: true,
      art: {
        rows: {
          6: '.ohhhssssssssshho.',
          7: '.ohHhsskssskssHho.',
          8: '.ohhhsskssskssHho.',
          10: '.ohhhssssmsssshho.',
          11: '..ohhossssssohho..',
          12: '...oooLLyyLLooo...',
        },
        short: true,
        front: [[14, 6, ['.y.', 'yzy', '.y.']]],
      },
    },
    // Big and curly like a cloud all round her head.
    'wizard-cloud': {
      name: I18n.t('heroes.wizard.cloud'), icon: '☁️', girl: true,
      art: {
        back: [[-2, 1, CLOUD], [16, 1, CLOUD.map(r => [...r].reverse().join(''))]],
        front: [[3, -1, ['.oo..oo..oo.', 'ohhoohhoohho']]],
      },
    },
    // Up in two round buns at the sides, a gold star pin in each.
    'wizard-buns': {
      name: I18n.t('heroes.wizard.buns'), icon: '🍡', girl: true,
      art: {
        rows: {
          6: '.ohhhssssssssshho.',
          7: '.ohhhsskssskssHho.',
          10: '.ohhhssssmsssshho.',
          11: '..ohhossssssohho..',
          12: '...oooLLyyLLooo...',
        },
        short: true,
        front: [[-2, 4, BUN], [15, 4, BUN.map(r => [...r].reverse().join(''))]],
      },
    },
    // Long and straight down to his shoulders, like a wise old wizard's.
    'wizard-long': {
      name: I18n.t('heroes.wizard.long'), icon: '🧙‍♂️', boy: true,
      art: {
        rows: {
          6: '..ohhssssssssshho.',
          7: '..ohhsskssskssHho.',
          8: '..ohhsskssskssHho.',
          9: '..ohhspssssspsHho.',
          10: '..ohhssssmssssHho.',
          11: '..ohhosssssssohho.',
          12: '..ohhoLLyyLLohho..',
        },
        front: [[2, 13, ['ohho', '.oho', '..o.']], [13, 13, ['ohho', 'oho.', '.o..']]],
      },
    },
    // Tight curls all round his head.
    'wizard-curly': {
      name: I18n.t('heroes.wizard.curly'), icon: '➰', boy: true,
      art: {
        back: [[0, 3, CURLS], [15, 3, CURLS.map(r => [...r].reverse().join(''))]],
        front: [[3, -1, ['.oo..oo..oo.', 'ohhoohhoohho']]],
      },
    },
    // A round bowl cut, a straight fringe down to his eyebrows.
    'wizard-bowl': {
      name: I18n.t('heroes.wizard.bowl'), icon: '🥣', boy: true,
      art: {
        rows: {
          5: '..ohhhhhhhhhhhho..',
          6: '..ohhhhhhhhhhhho..',
          7: '..ohhsskssskssho..',
          8: '..ohhsskssskssho..',
          9: '...ohspssssspsho..',
        },
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
