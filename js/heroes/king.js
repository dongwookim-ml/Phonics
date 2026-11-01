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
    // A parade uniform: a jacket in his colour with gold epaulettes and a
    // gold belt, white trousers with a gold stripe, tall black boots.
    'king-parade': {
      name: name('parade'), icon: '🎖️', boy: true,
      art: {
        top: {
          13: '.oyYdddddddddddYyo',
          14: '.oyyYdddddddddYyyo',
          15: '.yYyoLdddddddDoyYy',
          16: '.osoLddddddddDDoso',
          17: '..ooyyyyyzyyyyyoo.',
        },
        bottom: [
          '..oLddddddddddDDo.',
          '..oLdddddoddddDDo.',
          '..ooooooooooooooo.',
          '....oywwwowwwyo...',
          '....oywwwowwwyo...',
          '....oywwwowwwyo...',
          '....oxXxxoxxXxo...',
          '....oxXxxoxxXxo...',
          '...oxxxxxoxxxxxo..',
          '...ooooooooooooo..',
        ],
        walk: { 7: '...oxXxxo.oxxXxo..', 8: '..oxxxxxo.oxxxxxo.', 9: '..ooooooo.ooooooo.' },
        ride: { flap: 3, cloth: 'dD', hem: 'D', leg: 'w', boot: 'x' },
      },
    },
    // A pharaoh's outfit: a striped gold and blue collar, gold armbands, a
    // white linen kilt with a gold apron, and sandals.
    'king-pharaoh': {
      name: name('pharaoh'), icon: '🏺', boy: true,
      art: {
        top: {
          13: '..oyyyyyyyyyyyyyo.',
          14: '.oyBBBBBBBBBBBBByo',
          15: '.oyoyeyeyeyeyeyoyo',
          16: '.osowwwwwwwwwWWoso',
          17: '..ooyyByyeyyByyoo.',
        },
        bottom: [
          '..owwwwwyYywwwWWo.',
          '..owwwwydYdywwWWo.',
          '.owwwwwydYdywwWWo.',
          '.oWwWwWoyyyoWwWWo.',
          '..ooooo.oyo.oooo..',
          '.....osso.osso....',
          '.....osso.osso....',
          '.....oyso.osyo....',
          '....oyYyo.oyYyo...',
          '....ooooo.ooooo...',
        ],
        walk: { 7: '....oyso...osyo...', 8: '...oyYyo...oyYyo..', 9: '...ooooo...ooooo..' },
        ride: { flap: 4, cloth: 'wW', hem: 'y', leg: 's', boot: 'Y', shine: 'W' },
      },
    },
    // An Arabian king's outfit: a short gold-edged vest over a white shirt
    // with puffed sleeves, a wide gold sash, big puffy trousers in his
    // colour and gold slippers with curled toes.
    'king-arabian': {
      name: name('arabian'), icon: '🪔', boy: true,
      art: {
        top: {
          13: '..oxywwwwwwwwwyxo.',
          14: '.owxxywwwwwwwyxxwo',
          15: '.owoxxywwwwwyxxowo',
          16: '.osoxxywwwwwyxxoso',
          17: '..oyYyYyyyyyYyYyo.',
        },
        bottom: [
          '..oLddddddddddDo..',
          '.oLdddddddddddDDo.',
          'oLddddddddddddDDDo',
          'oLddddddDoLddddDDo',
          'oLddddddDoLdddDDDo',
          '.oLddddDo.oLdddDo.',
          '...oLddo...oddDo..',
          '..y.oyyo...oyyo.y.',
          '..oyYyyo...oyyYyo.',
          '..oooooo...oooooo.',
        ],
        walk: { 7: '.y..oyyo...oyyo..y', 8: '.oyYyyo.....oyyYyo', 9: '.oooooo.....oooooo' },
        ride: { flap: 5, cloth: 'dD', hem: 'D', leg: 'd', boot: 'y' },
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
      art: { x: 3, y: -5, rows: [
        '......y......',
        '.....yYy.....',
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
    // A big round white turban wound round and round, a ruby brooch and a
    // white feather.
    'king-turban': {
      name: name('turban'), icon: '👳', boy: true,
      art: { x: 2, y: -5, rows: [
        '.......ow......',
        '......owWo.....',
        '......oWo......',
        '...ooooyoooo...',
        '..owWwyeywWwo..',
        '.owWwwwywwwWwo.',
        'owWwwWwwwWwwWwo',
        'oWwwWwwwWwwWwWo',
        '.ooooooooooooo.',
      ] },
    },
    // A pharaoh's headdress: blue and gold stripes over his head and down
    // both sides of his face, a gold band and a little gold snake.
    'king-nemes': {
      name: name('nemes'), icon: '🐍', boy: true,
      art: { x: 0, y: -3, rows: [
        '......ooooooo......',
        '....ooyyyyyyyoo....',
        '...oNNNNNNNNNNNo...',
        '..oyyyyyyyyyyyyyo..',
        '..oNNNNNNyNNNNNNo..',
        '.oyyyyyyyYyyyyyyyo.',
        '.oNNNNNNNyNNNNNNNo.',
        '.oyoYYYYYYYYYYYoyo.',
        'oNNo...........oNNo',
        'oyyo...........oyyo',
        'oNNo...........oNNo',
        'oyyo...........oyyo',
        'oNNo...........oNNo',
        'oyyo...........oyyo',
        'oNNo...........oNNo',
        'oyyo...........oyyo',
        '.oo.............oo.',
      ] },
    },
    // A paper party crown: pink zigzag points with white dots and a
    // yellow band with coloured stickers. Sold in the shop.
    'king-paper': {
      name: name('paper'), icon: '🎉', boy: true, shop: true, price: 8,
      art: { x: 3, y: -2, rows: [
        '.o..o...o..o.',
        'oPooPo.oPooPo',
        'oPwPPPoPPPwPo',
        'oyByeyqyeyByo',
        'oYYYYYYYYYYYo',
        '.ooooooooooo.',
      ] },
    },
    // A crown of daisies, pink roses and leaves, from the fairies.
    'king-flowers': {
      name: name('flowers'), icon: '🌼', boy: true, fairy: true,
      art: { x: 3, y: -2, rows: [
        '.w....w....w.',
        'wywEPwywPEwyw',
        'QwQPPQwQPPQwQ',
        'oqQqQqQqQqQqo',
        '.ooooooooooo.',
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
    // A big golden castle key held sideways across his tummy: its round bow
    // in his hand, its teeth at the far end.
    'king-key': {
      name: name('key'), icon: '🗝️', boy: true,
      art: { x: 5, y: 14, rows: [
        '..........oooo.',
        '.........oyzyyo',
        'ooooooooooy..yo',
        'oyyyyyyyyyy..Yo',
        'oYYYYYYYYYyYYYo',
        'oyyoyyoooooooo.',
        'oYyoYyo........',
        'oYyoooo........',
        'oooo...........',
      ] },
    },
    // A royal scroll held up for all to read: cream paper with writing and
    // a red seal between two wooden rollers with gold ends.
    'king-scroll': {
      name: name('scroll'), icon: '📜', boy: true,
      art: { x: 13, y: 5, rows: [
        '.ooooo.',
        'yKKKKKy',
        '.oiiio.',
        '.oIIIo.',
        '.oiiio.',
        '.oIiIo.',
        '.oiiio.',
        '.oIIio.',
        '.oieio.',
        'yKKKKKy',
        '.ooooo.',
      ] },
    },
    // A little rainbow layer cake with a candle, on a plate in his hand.
    'king-cake': {
      name: name('cake'), icon: '🎂', boy: true, unicorn: true,
      art: { x: 13, y: 8, rows: [
        '...y...',
        '...O...',
        '..owo..',
        '.owPwo.',
        '.oPPPo.',
        '.oyyyo.',
        '.oqqqo.',
        '.oBBBo.',
        'oWWWWWo',
        '.ooooo.',
      ] },
    },
  };

  const back = {
    // A wide white ermine mantle, round over his shoulders.
    'king-mantle': {
      name: name('mantle'), icon: '🤍', boy: true,
      art: { x: -2, y: 11, pal: ERMINE, rows: [
        '..oooo...........oooo.',
        '.owwwwo.........owwwwo',
        '.owwxwwo.......owwxwwo',
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
    // A long purple velvet cloak, over his shoulders and down both sides to
    // the floor, edged in gold (drawn over him, his beard and hands free).
    'king-cloak': {
      name: name('cloak'), icon: '🟣', boy: true,
      art: { x: -1, y: 12, front: true, pal: Object.assign({}, ERMINE, { u: '#b98cff', U: '#8a5ad8' }), rows: [
        '.oo...............oo.',
        'ouuy.............yuuo',
        'ouuUy...........yUuuo',
        'ouuUy...........yUuuo',
        'ouo...............ouo',
        'ouuy.............yuuo',
        'ouuy.............yuuo',
        'ouuUy...........yUuuo',
        'ouuUy...........yUuuo',
        'ouuUy...........yUuuo',
        'ouuuUy.........yUuuuo',
        'ouuuUy.........yUuuuo',
        'ouuuUy.........yUuuuo',
        'ouuuUy.........yUuuuo',
        'oyyyyy.........yyyyyo',
        'oooooo.........oooooo',
      ] },
    },
    // A midnight-blue cloak full of stars, from the Starlight Forest.
    'king-starcloak': {
      name: name('starcloak'), icon: '🌟', boy: true, forest: true,
      art: { x: -2, y: 11, pal: Object.assign({}, ERMINE, { n: '#3a3a86', N: '#5a5ab8' }), rows: [
        '..oooo...........oooo.',
        '.oyNNNo.........oNNNyo',
        '.onnynno.......onnynno',
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
    // A golden throne to carry about: a red velvet back in a gold frame, its
    // posts topped with gold balls beside his crown. Sold in the shop.
    'king-throne': {
      name: name('throne'), icon: '🪑', boy: true, shop: true, price: 12,
      art: { x: -2, y: -5, pal: Object.assign({}, ERMINE, { e: '#e8485a', v: '#c8303f', z: '#fff6c0' }), rows: [
        '.ozo...............ozo',
        '.oyoooooooooooooooooyo',
        '.oyyyyyyyyyyyyyyyyyyyo',
        '.oYoooooooooooooooooYo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoveeeeeeeeeeeeevoyo',
        '.oyoooooooooooooooooyo',
        '.oyo...............oyo',
        '.ooo...............ooo',
      ] },
    },
    // A wide blue sash with gold edges from his shoulder round past his
    // beard to his hip, and a big gold star medal on a red ribbon.
    'king-sash': {
      name: name('sash'), icon: '🎖️', boy: true,
      art: { x: -1, y: 12, front: true, pal: { o: '#4a2c4f', B: '#6fb7ff', N: '#3f74c8', y: '#ffd34d', Y: '#e0a52a', z: '#fff6c0', e: '#e8485a' }, rows: [
        'NyN................',
        'NByN...............',
        'NByBN..............',
        '.NByBN.............',
        '....NByN...........',
        '....NBByBN.........',
        '......NBByBN.......',
        '........NBByBN.....',
        '..........NBByBN...',
        '.............ee....',
        '.............oyo...',
        '...........ooyYyoo.',
        '...........oyyzyyo.',
        '............oyYyo..',
        '............oyoyo..',
        '............oo.oo..',
      ] },
    },
    // A royal banner over his shoulder: a midnight-blue flag with a gold
    // star flying beside his crown, from the Starlight Forest (carried in
    // front of his hair).
    'king-banner': {
      name: name('banner'), icon: '🚩', boy: true, forest: true,
      art: { x: -2, y: -5, front: true, pal: { o: '#4a2c4f', y: '#ffd34d', N: '#3a3a86', J: '#7a4a2e' }, rows: [
        'yooooooo',
        'JNNyNNNo',
        'JNyyyNNo',
        'JNNyNNNo',
        'JNyNyNNo',
        'Jooooooo',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'Jo......',
        'o.......',
      ] },
    },
  };

  // His hairstyles (the beard stays with every one).
  const style = {
    // Royal curls: big round curls puffed out at both sides, a curly top and
    // a fringe of little ringlets.
    'king-curls': {
      name: name('curls'), icon: '🌀', boy: true,
      art: {
        rows: { 5: '..ohHshsHhHshsHho.' },
        front: [[3, -1, ['..oo.ooo.oo..', '.ohhohHhohho.', 'ohHhhhhhhhHho']]],
        back: [
          [-1, 3, ['..ooo', '.ohHh', 'ohHhh', 'ohhhh', '.oohh', '.ohHh', 'ohHhh', 'ohhhh', '.oohh', '.ohHh', 'ohHhh', 'ohhhh', '.ooo.']],
          [15, 3, ['ooo..', 'hHho.', 'hhHho', 'hhhho', 'hhoo.', 'hHho.', 'hhHho', 'hhhho', 'hhoo.', 'hHho.', 'hhHho', 'hhhho', '.ooo.']],
        ],
      },
    },
    // Long royal hair: parted in the middle, straight down his back, and
    // long locks falling over his shoulders (his hands free).
    'king-long': {
      name: name('long'), icon: '🦁', boy: true,
      art: {
        rows: { 1: '....oohhhohhhoo...', 2: '...ohhHhhohhHhho..', 3: '..ohHhhhhhhhhhHho.', 4: '..oHhhhhhhhhhhhHo.', 5: '..ohhhssssssshhho.' },
        front: [
          [-1, 11, ['.ohho', 'ohhHo', 'ohHho', 'ohhHo', 'ohHo.', 'oho..', 'oHo..', '.o...']],
          [15, 11, ['ohho.', 'oHhho', 'ohHho', 'oHhho', '.oHho', '..oho', '..oHo', '...o.']],
        ],
        back: [
          [-1, 3, ['..oo', '.ohh', 'ohhh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohHh', 'ohhh', '.ohh', '..oo']],
          [16, 3, ['oo..', 'hho.', 'hhho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hHho', 'hhho', 'hho.', 'oo..']],
        ],
      },
    },
    // Neatly combed: a side parting with a shine, the sides cut short so his
    // ears show.
    'king-neat': {
      name: name('neat'), icon: '✨', boy: true,
      art: { rows: { 1: '....oohohhhhhoo...', 2: '...ohhoHHhhhhhho..', 3: '..ohhoHHhhhhhhhho.', 4: '..ohHHhhhhhhhhhho.', 5: '..ohhhhhhhhssshho.', 6: '..ohsssssssssssho.', 7: '.oshssskssskssshso', 8: '.oshssskssskssshso', 9: '..ohsppsssssppsho.' } },
    },
    // A shiny bald head with fluffy little tufts over his ears.
    'king-bald': {
      name: name('bald'), icon: '🥚', boy: true,
      art: {
        rows: { 1: '....oosssssssoo...', 2: '...oswwsssssssso..', 3: '..oswssssssssssso.', 4: '..ohsssssssssssho.', 5: '..ohhssssssssshho.' },
        back: [
          [-1, 3, ['..oo', '.ohh', 'ohHh', 'ohhh', 'ohHh', '.ohh', '..oo']],
          [16, 3, ['oo..', 'hho.', 'hHho', 'hhho', 'hHho', 'hho.', 'oo..']],
        ],
      },
    },
    // A Korean topknot (sangtu): his hair combed up into a knot with a gold
    // pin, and a black headband (manggeon) across his forehead.
    'king-topknot': {
      name: name('topknot'), icon: '🎎', boy: true,
      art: {
        rows: { 1: '....oohHhHhHhoo...', 2: '...ohHhHhHhHhHho..', 3: '..ohHhHhHhHhHhHho.', 4: '..oxxXxxxxxxxXxxo.', 5: '..ohsssssssssssho.' },
        front: [[6, -4, ['..ooo..', '.ohHho.', 'yyhhhyy', '.ohhho.']]],
      },
    },
    // A lion's mane: spiky hair all round his head like the sun.
    'king-mane': {
      name: name('mane'), icon: '🌞', boy: true,
      art: { back: [
        [2, -3, ['...o...o...o...', '..oho.oho.oho..', '.ohhhohhhohhho.', 'ohhhhhhhhhhhhho']],
        [-1, 0, ['....o', '...oh', '..ohh', '.ohhh', 'ohHhh', '.ohhh', '..ohh', '.ohhh', 'ohHhh', '.ohhh', '..ohh', '.ohhh', 'ohHhh', '.ohhh', '..ooo']],
        [15, 0, ['o....', 'ho...', 'hho..', 'hhho.', 'hhHho', 'hhho.', 'hho..', 'hhho.', 'hhHho', 'hhho.', 'hho..', 'hhho.', 'hhHho', 'hhho.', 'ooo..']],
      ] },
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
