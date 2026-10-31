// The king (js/heroes.js): a jolly storybook king. Rounder and stately: a
// big curly beard and moustache in his hair colour, a round tummy, an
// ermine collar over his shoulders, long robes trimmed with ermine (white
// with little black spots), big crowns, and a sceptre, an orb, a goblet or
// the royal seal in his hand. His robes are in his dress colour; ermine is
// w with x spots, gold y Y z.
(() => {
  const name = key => I18n.t(`heroes.king.${key}`);

  // His head and body (18 rows): a round face with rosy cheeks, curly hair,
  // an ermine collar, a round tummy and a gold belt with a ruby. His hands
  // are at x 2 and x 16 on row 16.
  const TOP = [
    '......ooooooo.....',
    '....oohhhhhhhoo...',
    '...ohhhHHhhhhhho..',
    '..ohhHHhhhhhhhhho.',
    '..ohHhhhhhhhhhhho.',
    '..ohhssshhhssshho.',
    '..ohsssssssssssho.',
    '..ohsssksssksssho.',
    '..ohsssksssksssho.',
    '..ohsppsssssppsho.',
    '..ohsssssmsssssho.',
    '...ohsssssssssho..',
    '.....oosssssoo....',
    '..owwwxwwwwwxwwwo.',
    '.owwxwwwwwwwwwxwwo',
    '.oLoLdddddddddDoDo',
    '.osoLddddddddDDoso',
    '..ooYyyyyeyyyyYoo.',
  ];
  // His beard and moustache, over everything he wears (x 2, from row 8).
  const BEARD = [
    '.hh.........hh.',
    '.hH.........Hh.',
    '.hhh.hHhHh.hhh.',
    'ohHhhhmmmhhhHho',
    'ohhhHhhhhhHhhho',
    '.ohHhhhHhhhHho.',
    '..ohhHhhhHhho..',
    '...oohhhhhoo...',
    '.....ooooo.....',
  ];

  // The back things' own colours (their wardrobe picture is drawn without
  // his palette).
  const ERMINE = { o: '#4a2c4f', w: '#ffffff', W: '#dde4f2', x: '#3a3450', y: '#ffd34d', Y: '#e0a52a' };

  const shape = {
    // A long coronation robe, ermine down the front and round the hem,
    // under a big ermine cape over his shoulders.
    'king-coronation': {
      name: name('coronation'), icon: '👑', boy: true,
      art: {
        top: {
          13: '..owwwxwwwwwxwwwo.',
          14: '.owwxwwwwwwwwwxwwo',
          15: '.owwwwxwwwwwxwwwwo',
          16: '.osoLdddwxwdddDoso',
          17: '..oLddddwwwddddDo.',
        },
        bottom: [
          '..oLddddwxwddddDo.',
          '.oLdddddwwwdddddDo',
          '.oLdddddwxwddddDDo',
          '.oLdddddwwwddddDDo',
          'oLddddddwxwddddDDo',
          'oLddddddwwwdddDDDo',
          'oLddddddwxwdddDDDo',
          'owwxwwwxwwwxwwwxwo',
          '.oooooooooooooooo.',
          '......ff...ff.....',
        ],
        walk: { 9: '.....ff.....ff....' },
        ride: { flap: 6, cloth: 'dD', hem: 'w', leg: 'd', boot: 'f' },
      },
    },
    // A round tunic to his knees with an ermine hem, white tights and
    // shiny black shoes.
    'king-ermine': {
      name: name('ermine'), icon: '🤍', boy: true,
      art: {
        top: {
          13: '..owwwxwwwwwxwwwo.',
          14: '.oLLdddddddddDDDo.',
          15: '.oLoLddddyddddDoDo',
          16: '.osoLddddddddDDoso',
          17: '..ooYyyyyeyyyyYoo.',
        },
        bottom: [
          '..oLdddddddddddDo.',
          '.oLddddddddddddDDo',
          '.oLdddddddddddDDDo',
          '.owxwwxwwxwwxwwxwo',
          '..ooooooooooooooo.',
          '.....owwo.owwo....',
          '.....owwo.owwo....',
          '.....owWo.oWwo....',
          '.....oxXo.oXxo....',
          '.....oooo.oooo....',
        ],
        walk: { 7: '....owWo...oWwo...', 8: '....oxXo...oXxo...', 9: '....oooo...oooo...' },
        ride: { flap: 4, cloth: 'dD', hem: 'w', leg: 'w', boot: 'x' },
      },
    },
    // A golden coat to his knees with a sash in his colour, its hem trimmed
    // in his colour too, white stockings and buckled shoes.
    'king-goldcoat': {
      name: name('goldcoat'), icon: '🧥', boy: true,
      art: {
        top: {
          13: '..oyyyzyyyyyzyyyo.',
          14: '.oyzyyyyyyyyyyyYYo',
          15: '.odozyyyyyyyyYYodo',
          16: '.osozyyyyyyyyYYoso',
          17: '..oodddddyddddDoo.',
        },
        bottom: [
          '..ozyyyyyoyyyyYYo.',
          '..ozyyyyyoyyyyYYo.',
          '.ozyyyyyyoyyyyyYYo',
          '.ozyyyyyodoyyyyYYo',
          '.oddddddododdddddo',
          '..ooooowwowwooooo.',
          '......owwowwo.....',
          '......owwowwo.....',
          '.....oxxyoyxxo....',
          '.....ooooooooo....',
        ],
        walk: { 7: '.....owwo.owwo....', 8: '....oxxyo.oyxxo...', 9: '....ooooo.ooooo...' },
        ride: { flap: 5, cloth: 'yY', hem: 'Y', leg: 'w', boot: 'x' },
      },
    },
    // A Korean king's robe (gonryongpo): golden dragon badges on his
    // shoulders (and one on his chest, under his beard), a jewelled belt,
    // black boots.
    'king-gonryongpo': {
      name: name('gonryongpo'), icon: '🐉', boy: true,
      art: {
        top: {
          13: '..oddddddddddddDo.',
          14: '.oyYddddddddddyYo.',
          15: '.oYyoddddddddoYyo.',
          16: '.osoLddddddddDDoso',
          17: '..oLddddddddddDDo.',
        },
        bottom: [
          '.oxyxxyxxyxxyxxyxo',
          '..oooooooooooooo..',
          '..oLdddddddddDDo..',
          '..oLdddddddddDDDo.',
          '.oLddddddddddDDDo.',
          '.oLddddddddddDDDo.',
          '.oLLdddddddddDDDo.',
          '..ooooooooooooooo.',
          '.....oxxo.oxxo....',
          '.....oooo.oooo....',
        ],
        walk: { 8: '....oxxo...oxxo...', 9: '....oooo...oooo...' },
        ride: { flap: 6, cloth: 'dD', hem: 'D', leg: 'd', boot: 'x' },
      },
    },
    // A long striped nightgown with a frilly white collar and fluffy
    // slippers (with his nightcap, the sleepiest king).
    'king-nightgown': {
      name: name('nightgown'), icon: '🌙', boy: true, fairy: true,
      art: {
        top: {
          13: '..owwWwwwwwwWwwwo.',
          14: '.oLwdLdLdLdLdLwDo.',
          15: '.oLoLdLdLdLdLdDoDo',
          16: '.osoLdLdLdLdLdDoso',
          17: '..oLLdLdLdLdLdDDo.',
        },
        bottom: [
          '..oLLdLdLdLdLdDDo.',
          '.oLLdLdLdLdLdLdDDo',
          '.oLLdLdLdLdLdLdDDo',
          '.oLLdLdLdLdLdLdDDo',
          '.oLLdLdLdLdLdLdDDo',
          '.oLLdLdLdLdLdLdDDo',
          '.owWwWwWwWwWwWwWwo',
          '..ooooooooooooooo.',
          '.....oPPPo.oPPPo..',
          '.....ooooo.ooooo..',
        ],
        walk: { 8: '....oPPPo...oPPPo.', 9: '....ooooo...ooooo.' },
        ride: { flap: 6, cloth: 'Ld', hem: 'w', leg: 'L', boot: 'P' },
      },
    },
  };

  const head = {
    // A big gold crown with red velvet, a cross on top and jewels.
    'king-grand': {
      name: name('grand'), icon: '👑', boy: true,
      art: { x: 3, y: -5, rows: [
        '......o......',
        '.....oyo.....',
        '.o..oyYyo..o.',
        'oyo.ooyoo.oyo',
        'oyyoeeyeeoyyo',
        'oyyyyyyyyyyyo',
        'oYyeyyByyeyYo',
        'oYYYYYYYYYYYo',
      ] },
    },
    // A crown set all round with jewels of every colour.
    'king-jewel': {
      name: name('jewel'), icon: '💎', boy: true, unicorn: true,
      art: { x: 3, y: -4, rows: [
        '.P....c....u.',
        'oyo..oyo..oyo',
        'oyyoyyByyoyyo',
        'oyyyyyyyyyyyo',
        'oyPyqyeyByuyo',
        'oYYYYYYYYYYYo',
      ] },
    },
    // A purple velvet cap under gold arches, a cross on top, on a band of
    // jewels.
    'king-velvet': {
      name: name('velvet'), icon: '🟣', boy: true,
      art: { x: 3, y: -6, rows: [
        '......y......',
        '.....yYy.....',
        '......y......',
        '...ooozooo...',
        '..oyuuyuuyo..',
        '.oyuuuyuuUyo.',
        '.oyuuuyuuUyo.',
        'oyuuuuyuuuUyo',
        'oyyyyyyyyyyyo',
        'oYeYBYeYBYeYo',
      ] },
    },
    // A Korean king's black silk hat (ikseongwan), its two little wings up
    // at the back.
    'king-ikseon': {
      name: name('ikseon'), icon: '🎩', boy: true,
      art: { x: 3, y: -5, rows: [
        '.oo.......oo.',
        'oXXo.....oXXo',
        'oXxo.....oxXo',
        'oXxoooooooxXo',
        '.ooxXxxxxxoo.',
        '.ooooooooooo.',
        'oxxXxxxxxxxxo',
        'oXXXXXXXXXXXo',
      ] },
    },
    // A long floppy striped nightcap with a little gold star at its tip.
    'king-nightcap': {
      name: name('nightcap'), icon: '🛌', boy: true,
      art: { x: 3, y: -5, rows: [
        '...oooooo........',
        '..oLdLdLdoo......',
        '.oLdLdLdLdLoo....',
        '.odLdLdLdLdLdoo..',
        'oLdLdLdLdLdLdLdo.',
        'odLdLdLdLdLdLdLdo',
        'oLLLLLLLLLLLLoLdo',
        '.oooooooooooo.oLo',
        '..............oyo',
        '..............yYy',
        '...............y.',
      ] },
    },
  };

  const hand = {
    // A gold sceptre with a ruby on top.
    'king-sceptre': {
      name: name('sceptre'), icon: '🔱', boy: true,
      art: { x: 14, y: 2, rows: [
        '..o..',
        '.oeo.',
        'oeEeo',
        '.oeo.',
        'oyYyo',
        '.oyo.',
        '.oYo.',
        '.oyo.',
        '.oYo.',
        '.oyo.',
        '.oYo.',
        '.oyo.',
        '.oYo.',
        '.oyo.',
        '.....',
        '.oyo.',
        '..o..',
      ] },
    },
    // A round gold orb with a band and a little cross.
    'king-orb': {
      name: name('orb'), icon: '🔮', boy: true,
      art: { x: 13, y: 8, rows: [
        '...o...',
        '..oyo..',
        '...o...',
        '..oyo..',
        '.oyeyo.',
        'oyyeyyo',
        'oeeeeeo',
        'oYyeyYo',
        '.oYeYo.',
        '..ooo..',
      ] },
    },
    // A golden goblet of berry juice.
    'king-goblet': {
      name: name('goblet'), icon: '🏆', boy: true,
      art: { x: 13, y: 9, rows: [
        'ooooooo',
        'oPPPPPo',
        'oyyByyo',
        'oyYyYyo',
        '.oyyYo.',
        '..oYo..',
        '..oyo..',
        '.......',
        '.oyyyo.',
      ] },
    },
    // The royal seal: a gold stamp with a round handle and red ink
    // underneath, for stamping his letters.
    'king-seal': {
      name: name('seal'), icon: '🔏', boy: true,
      art: { x: 13, y: 9, rows: [
        '..ooo..',
        '.oyzyo.',
        '.oyyyo.',
        '..oYo..',
        '.ooooo.',
        'oyyzyyo',
        'oyyyyyo',
        'oYYYYYo',
        'oeeeeeo',
        '.ooooo.',
      ] },
    },
    // A sceptre of a big pink flower, a present from the fairies.
    'king-flower': {
      name: name('flower'), icon: '🌸', boy: true, fairy: true,
      art: { x: 14, y: 2, rows: [
        '.o.o.',
        'oPoPo',
        'oPyPo',
        'oPoPo',
        '.o.o.',
        '..q..',
        '.qQ..',
        'qQq..',
        '..Q..',
        '..q.q',
        '..Qqq',
        '..q..',
        '..Q..',
        '..q..',
      ] },
    },
  };

  const back = {
    // A wide white ermine mantle, round over his shoulders.
    'king-mantle': {
      name: name('mantle'), icon: '🤍', boy: true,
      art: { x: -2, y: 11, pal: ERMINE, rows: [
        '..oooo.........oooo...',
        '.owwwwo.......owwwwo..',
        'owwxwwwo.....owwwxwwo.',
        'owwwwwwwoooooowwwwwwwo',
        'owxwwwwwwwwwwwwwwwxwwo',
        'owwwwwwwwwwwwwwwwwwwwo',
        'owwwxwwwwwwwwwwwwxwwwo',
        'owwwwwwwwwwwwwwwwwwwwo',
        'owxwwwwwwwwwwwwwwwwxwo',
        'owwwwwwwwwwwwwwwwwwwwo',
        'owwwxwwwwwwwwwwwwxwwwo',
        'owwwwwwwwwwwwwwwwwwwwo',
        'owxwwwwwwwwwwwwwwwwxwo',
        'owwwwwwwwwwwwwwwwwwwwo',
        'owwwxwwwwwwwwwwwwxwwwo',
        'oWwwwwwwwwwwwwwwwwwwWo',
        'oWWWWWWWWWWWWWWWWWWWWo',
      ] },
    },
    // A long purple velvet cloak with an ermine edge, its train on the
    // ground round his feet.
    'king-cloak': {
      name: name('cloak'), icon: '🟣', boy: true,
      art: { x: -2, y: 11, pal: Object.assign({}, ERMINE, { u: '#b98cff', U: '#8a5ad8' }), rows: [
        '..oooo.........oooo...',
        '.owuuuo.......ouuuwo..',
        'owuuuuuo.....ouuuuUwo.',
        'oxuuuuuuoooooouuuuUxo.',
        'owuuuuuuuuuuuuuuuuUUwo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'oxuuuuuuuuuuuuuuuuUUxo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'oxuuuuuuuuuuuuuuuuUUxo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'oxuuuuuuuuuuuuuuuuUUxo',
        'owuuuuuuuuuuuuuuuuUUwo',
        'owuuuuuuuuuuuuuuuuuUwo',
        'owwxwwwxwwwxwwwxwwwxwo',
        'oooooooooooooooooooooo',
      ] },
    },
    // A midnight-blue cloak full of stars, from the Starlight Forest.
    'king-starcloak': {
      name: name('starcloak'), icon: '🌟', boy: true, forest: true,
      art: { x: -2, y: 11, pal: Object.assign({}, ERMINE, { n: '#3a3a86', N: '#5a5ab8' }), rows: [
        '..oooo.........oooo...',
        '.oyNNNo.......oNNNyo..',
        'oyNnynno.....onnynNyo.',
        'oNnnnnnnoooooonnnnnnyo',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oNynnnnnnnnnnnnnnnnyno',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oNnnynnnnnnnnnnnnynnno',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oNynnnnnnnnnnnnnnnnyno',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oNnnynnnnnnnnnnnnynnno',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oNynnnnnnnnnnnnnnnnyno',
        'oNnnnnnnnnnnnnnnnnnnno',
        'oyyyyyyyyyyyyyyyyyyyyo',
        'oooooooooooooooooooooo',
      ] },
    },
  };

  // His hairstyles (the beard stays with every one).
  const style = {
    // Big round curls puffed out at both sides.
    'king-curls': {
      name: name('curls'), icon: '🌀', boy: true,
      art: { back: [
        [-1, 3, ['..oo', '.ohh', 'ohHh', 'ohhh', '.ohh', 'ohHh', 'ohhh', '.ohh', 'ohHh', 'ohhh', '.ooh', '..oo']],
        [16, 3, ['oo..', 'hho.', 'hHho', 'hhho', 'hho.', 'hHho', 'hhho', 'hho.', 'hHho', 'hhho', 'hoo.', 'oo..']],
      ] },
    },
    // Long wavy hair down past his shoulders, locks falling over them.
    'king-long': {
      name: name('long'), icon: '🦁', boy: true,
      art: { front: [
        [0, 11, ['ohho', 'ohHo', 'oHho', 'ohho', 'ohHo', '.oo.']],
        [15, 11, ['ohho', 'oHho', 'ohHo', 'ohho', 'oHho', '.oo.']],
      ], back: [
        [-1, 3, ['..oo', '.ohh', 'ohhh', 'ohHh', '.ohh', 'ohhh', 'ohHh', '.ohh', 'ohhh', 'ohHh', '.ohh', 'ohhh', 'ohHh', '.ohh', '..oo']],
        [16, 3, ['oo..', 'hho.', 'hhho', 'hHho', 'hho.', 'hhho', 'hHho', 'hho.', 'hhho', 'hHho', 'hho.', 'hhho', 'hHho', 'hho.', 'oo..']],
      ] },
    },
    // Neatly combed to one side, shining.
    'king-neat': {
      name: name('neat'), icon: '✨', boy: true,
      art: { rows: {
        2: '...ohhhhhhHHhhho..',
        3: '..ohhhhhhHHhhhhho.',
        4: '..ohhhhhHHhhhhhho.',
        5: '..ohhhhhhhhssshho.',
      } },
    },
  };

  addHeroKit('king', {
    looks: ['boy'],
    base: { boy: { top: TOP, front: [[2, 8, BEARD]] } },
    items: { shape, head, hand, back, style },
    uses: {
      shape: ['robe'],
      head: ['kingcrown'],
    },
    defaults: { boy: { shape: 'king-coronation', head: 'king-grand', hand: 'none', back: 'none', style: 'king-curls', dress: 'rose', hair: 'brown' } },
  });
})();
