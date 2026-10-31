// The queen (js/heroes.js): a grown-up royal. Her hair is swept up (a bun
// behind her crown) with pearl drops at her ears, a round white ermine
// capelet with a jewel at her throat sits on her shoulders, and a sash
// crosses her bodice. Her gowns reach the floor (the coronation gown sweeps
// into a train), her crowns are tall, and she holds a sceptre, an orb, a
// fan or a mirror.
(() => {
  // Rows from their left halves, the right half mirrored.
  const mirror = rows => rows.map(r => r + [...r].reverse().join(''));

  // Her head and body (rows 0-17): the royal updo, pearl earrings, the
  // ermine capelet (w with x spots) closed with a jewel, the sash (n j)
  // across her bodice, her hands under the capelet at her sides.
  const TOP = [
    '......oooooo......',
    '....oohhhhhhoo....',
    '...ohhhHHHHhhho...',
    '..ohhHHhhhhHHhho..',
    '..ohHhhhhhhhhHho..',
    '..ohhsshhhhsshho..',
    '..ohhsssssssssho..',
    '..ohhsskssskssho..',
    '..ohhsskssskssho..',
    '..ohhspssssspsho..',
    '...ohssssmssssho..',
    '....wosssssso.w...',
    '......oossoo......',
    '..owwxwwyywwxwwo..',
    '.owxwwwweewwwwxwo.',
    '.owwwxwnjddwxwwwo.',
    '..ooooodnjdooooo..',
    '......otttno......',
  ];

  // The sash: blue, or red on a blue or purple dress.
  const COOL = ['sky', 'navy', 'aqua', 'night', 'lavender'];
  const palette = (outfit, look, base) => Object.assign({}, base, COOL.includes(outfit.dress)
    ? { n: '#ff6f8a', j: '#c83f5f' }
    : { n: '#6fb7ff', j: '#3f74c8' });

  const FEET_B = '.....ff....ff.....';

  const shape = {
    // Straight down with a gold-edged panel, sweeping into a train.
    'queen-coronation': { name: I18n.t('heroes.queen.coronation'), icon: '👑', girl: true, art: {
      bottom: [
        '.....odtLLtdo.....',
        '.....odtLLtDo.....',
        '....oddtLLtDDo....',
        '....oddtLLtDDo....',
        '...odddtLLtDDDo...',
        '...odddtLLtDDDDo..',
        '..oddddtLLtDDDDDo.',
        '..oddddtLLtDDDDDDo',
        '.ottttttttttDDDDDo',
        '......ff..ff.oooo.',
      ],
      walk: { 9: '.....ff....ffoooo.' },
      ride: 'skirt',
    } },
    // A bell of velvet folds with a deep band of ermine at the hem.
    'queen-velvet': { name: I18n.t('heroes.queen.velvet'), icon: '🤍', girl: true, art: {
      bottom: [
        '.....oddddddo.....',
        '....oddDddDddo....',
        '....odDddDddDo....',
        '...oddDddDddDDo...',
        '...odDddDdddDDo...',
        '..oddDddDdddDDDo..',
        '..owwxwwwwxwwwxwo.',
        '.owxwwwwxwwwwxwwwo',
        '.oooooooooooooooo.',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
      ride: 'skirt',
    } },
    // A wide bell with gold garlands caught up by rosettes, a gold hem.
    'queen-golden': { name: I18n.t('heroes.queen.golden'), icon: '✨', girl: true, art: {
      bottom: [
        '.....oyyyyyyo.....',
        '...ooddddddddoo...',
        '..oLddddddddDDDo..',
        '.oLdddddddddDDDDo.',
        'oeLdddeddddeDDDDeo',
        'oLyddydyddyDyDDyDo',
        'oLdyydddyydDDyyDDo',
        'oLddddddddddDDDDDo',
        'oyyyyyyyyyyyyyyyyo',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
      ride: 'skirt',
    } },
    // Long and slim, twinkling with stars, stars along the hem.
    'queen-starlight': { name: I18n.t('heroes.queen.starlight'), icon: '🌟', girl: true, forest: true, art: {
      bottom: [
        '......oddddo......',
        '.....oddydDo......',
        '.....odyzyDo......',
        '....oddLydDDo.....',
        '....odLdddDyDo....',
        '...odLddddyzyDo...',
        '...oyLdddddyDDo...',
        '..oyzydddddDDDDo..',
        '.oyoyyoyyoyyoyyoyo',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
      ride: 'skirt',
    } },
    // The queen's dangui: a green court jacket with gold leaf and white
    // cuffs, its front panel curving down, over a long chima in her colour.
    'queen-dangui': { name: I18n.t('heroes.queen.dangui'), icon: '🎎', girl: true, art: {
      bottom: [
        '..osoqqqeqqqqoso..',
        '...ooqqyqqyqqoo...',
        '...odoqyqqyqoDo...',
        '..oddoqQqqQqoDDo..',
        '..odddooooooDDDo..',
        '.oLdddddddddDDDDo.',
        '.oLddddddddddDDDo.',
        'oLdddddddddddDDDDo',
        'oyYyYyYyYyYyYyYyYo',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
      top: {
        13: '..oqqqqwsswqqqqo..',
        14: '.oqqyqqqwwqqqyqqo.',
        15: '.oqqqoqqeeqqoqqqo.',
        16: '.oqqqoqqeqqqoqqqo.',
        17: '.owwwoqqeqqqowwwo.',
      },
      ride: 'skirt',
    } },
  };

  const head = {
    // A tall crown: gold arches over red velvet, a cross on top, jewels
    // round the band.
    'queen-crown': { name: I18n.t('heroes.queen.crown'), icon: '👑', art: { x: 4, y: -5, rows: [
      '....yy....',
      '..oyzyyo..',
      '.oyvyyvyo.',
      'oyvvyyvvyo',
      'yyyyyyyyyy',
      'YeYbYYbYeY',
    ] } },
    // A wide band of gold with big jewels, a ruby in the middle.
    'queen-diadem': { name: I18n.t('heroes.queen.diadem'), icon: '💠', art: { x: 3, y: -3, rows: [
      '.....yy.....',
      '....yeey....',
      '.y.yeEeey.y.',
      'yByyyeeyyyBy',
      'YyYqYyyYqYyY',
    ] } },
    // A gold comb with a lace veil falling over her hair.
    'queen-veil': { name: I18n.t('heroes.queen.veil'), icon: '👰', art: { x: 1, y: -2, pal: { V: 'rgba(255,255,255,0.8)', l: 'rgba(221,228,242,0.9)' }, rows: [
      '.....yzyyzy.....',
      '....VyeyyeyV....',
      '..VVVVVVVVVVVV..',
      '.VlVVlVVlVVlVVl.',
      'VlV..........VlV',
      'VVl..........lVV',
      'VlV..........VlV',
      'VVl..........lVV',
      'VlV..........VlV',
      'VVl..........lVV',
      'VlV..........VlV',
      'VVl..........lVV',
      'VlV..........VlV',
      'lVl..........lVl',
      '.l............l.',
    ] } },
    // A tall pointed tiara with a big sapphire drop.
    'queen-gemtiara': { name: I18n.t('heroes.queen.gemtiara'), icon: '💎', art: { x: 3, y: -5, rows: [
      '.....yy.....',
      '....yBBy....',
      '.y..yBNy..y.',
      'yzy.yNNy.yzy',
      '.yyyyyyyyyy.',
      'yYyYyYYyYyYy',
    ] } },
    // Stars on gold points, the middle one biggest.
    'queen-stars': { name: I18n.t('heroes.queen.stars'), icon: '🌠', forest: true, art: { x: 2, y: -5, rows: [
      '......yy......',
      '......yy......',
      '..y.yyzzyy.y..',
      '.yzy.yzzy.yzy.',
      '..y.yy..yy.y..',
      '...YyYyyYyY...',
    ] } },
    // The fairy queen's crown of flowers and leaves, gold points between.
    'queen-fairycrown': { name: I18n.t('heroes.queen.fairycrown'), icon: '🌺', fairy: true, art: { x: 2, y: -4, rows: [
      '...y...y...y..',
      '..yzy.yzy.yzy.',
      '.PpP.qPpPq.PpP',
      'qPyPqPPyPPqPyP',
      'GqPqGqPqqGqPqG',
    ] } },
  };

  // Things in her hand: her hand (s) holds each one at her side.
  const hand = {
    // A gold sceptre with a ruby and a little cross on top.
    'queen-sceptre': { name: I18n.t('heroes.queen.sceptre'), icon: '🔱', art: { x: 14, y: 3, rows: [
      '..y..',
      '.yyy.',
      '..y..',
      '.oeo.',
      'oeEeo',
      'oeeeo',
      '.oYo.',
      '..y..',
      '..y..',
      '..Y..',
      '..y..',
      '..y..',
      '..y..',
      '.sys.',
      '.sYs.',
      '..y..',
      '..Y..',
    ] } },
    // A gold orb with a band of jewels and a cross, on her hand.
    'queen-orb': { name: I18n.t('heroes.queen.orb'), icon: '🔮', art: { x: 13, y: 10, rows: [
      '...y...',
      '..yyy..',
      '...y...',
      '.oyyyo.',
      'oyzyyYo',
      'oeyByeo',
      'oyyyYYo',
      '.oYYYo.',
      '.sssss.',
    ] } },
    // A folding lace fan, open.
    'queen-fan': { name: I18n.t('heroes.queen.fan'), icon: '🪭', art: { x: 11, y: 11, rows: [
      'owowowowo',
      'owPwPwPwo',
      'owPwPwPwo',
      '.oPwPwPo.',
      '..owPwo..',
      '...oyo...',
      '...sys...',
    ] } },
    // A gold hand mirror.
    'queen-mirror': { name: I18n.t('heroes.queen.mirror'), icon: '🪞', art: { x: 14, y: 8, rows: [
      '.yyy.',
      'yZcZy',
      'ycZcy',
      'yZcwy',
      'ycZcy',
      '.yyy.',
      '..Y..',
      '..y..',
      '.sYs.',
      '.sys.',
    ] } },
    // A sceptre with a golden unicorn horn and a pink heart.
    'queen-unicorn': { name: I18n.t('heroes.queen.unicorn'), icon: '🦄', unicorn: true, art: { x: 14, y: 2, rows: [
      '..o..',
      '.oyo.',
      '.ozo.',
      '.oyYo',
      '.ozyo',
      'ePePe',
      'ePPPe',
      '.ePe.',
      '..e..',
      '..w..',
      '..c..',
      '..w..',
      '..P..',
      '..w..',
      '.scs.',
      '.sws.',
      '..c..',
      '..w..',
    ] } },
  };

  // Her capes' own colours (a cape's picture in the wardrobe has no palette).
  const CAPE = { o: '#4a2c4f', w: '#ffffff', y: '#ffd34d', Y: '#e0a52a' };

  const back = {
    // A wide cloak of red velvet from her shoulders to the floor, edged
    // and hemmed with ermine.
    'queen-mantle': { name: I18n.t('heroes.queen.mantle'), icon: '🧣', art: { x: -2, y: 12, pal: CAPE, rows: mirror([
      '....ooooooo',
      '...owwwxwww',
      '..owxwwwwxw',
      '..owwvvvvvv',
      '.owxwvvvvvv',
      '.owwvvvvvvv',
      '.owxvevvvvv',
      'owwvvvvvvvv',
      'owxvvvvvvvv',
      'owwvevvvvvv',
      'owxvvvvvvvv',
      'owwvvvvvvvv',
      'owxvevvvvvv',
      'owwvvvvvvvv',
      'owxwwwwxwww',
      'owwwxwwwwxw',
      'ooooooooooo',
    ]) } },
    // A long royal blue train with gold lilies, from her shoulders and
    // spreading wide on the floor.
    'queen-train': { name: I18n.t('heroes.queen.train'), icon: '💙', art: { x: -2, y: 12, pal: CAPE, rows: mirror([
      '.....oooooo',
      '....oNNNNNN',
      '....oNNNNNN',
      '...oyNNNNNN',
      '...oyNyNNNN',
      '...oyyyyNNN',
      '..oyNNyNNNN',
      '..oyNNNNNNN',
      '..oyNNNyNNN',
      '.oyNNNyyyNN',
      '.oyNNNNyNNN',
      '.oyNyNNNNNN',
      'oyNyyyNNNNN',
      'oyNNyNNNyNN',
      'oyNNNNNyyyN',
      'oyNNNNNNyNN',
      'oyyyyyyyyyy',
    ]) } },
    // A tall fan of gold-rimmed lace standing behind her head, and a short
    // purple cape with jewels along its hem.
    'queen-jewelcape': { name: I18n.t('heroes.queen.jewelcape'), icon: '💎', art: { x: -2, y: 5, pal: CAPE, rows: mirror([
      'oyyo.......',
      'oywwyyyyyyy',
      'oywWwwwwwww',
      '.oywWwwwwww',
      '.oywwWwwwww',
      '..oywWwwwww',
      '..oyywWwwww',
      '...ooyyywww',
      '..ouuuuuuuu',
      '.ouUuuuuuuu',
      '.ouUuuuuuuu',
      'ouUuuuuuuuu',
      'ouUuuuuuuuu',
      'ouUuuuuuuuu',
      'ouUuuuuuuuu',
      'oyeyByeyBye',
      'ooooooooooo',
    ]) } },
    // A sheer cape of ice, with snowflakes.
    'queen-snowcape': { name: I18n.t('heroes.queen.snowcape'), icon: '❄️', art: { x: -2, y: 12, pal: Object.assign({}, CAPE, { C: 'rgba(200,246,255,0.75)', F: 'rgba(255,255,255,0.95)' }), rows: mirror([
      '...CCCCCCCC',
      '..CCCCCCCCC',
      '..CCFCCCCCC',
      '.CCFFFCCCCC',
      '.CCCFCCCCCC',
      '.CCCCCCCCCC',
      'CCCCCCCCCCC',
      'CCFCCCCCCCC',
      'CFFFCCCCCCC',
      'CCFCCCCCCCC',
      'CCCCCCCCCCC',
      'CCCCFCCCCCC',
      'CCCFFFCCCCC',
      'CCCCFCCCCCC',
      'CCCCCCCCCCC',
      'CFCFCFCFCFC',
    ]) } },
  };

  const style = {
    // Swept up into a round bun behind her head (the starting style).
    'queen-updo': { name: I18n.t('heroes.queen.updo'), icon: '👸', girl: true, art: {
      short: true,
      back: [[4, -3, ['...oooo...', '.oohhHHoo.', 'ohhHhhhhho', 'ohhhhhhhho']]],
    } },
    // A braid over the top of her head like a crown.
    'queen-crownbraid': { name: I18n.t('heroes.queen.crownbraid'), icon: '🥨', girl: true, art: {
      short: true,
      rows: {
        2: '...oooooooooooo...',
        3: '..oHHhHHhHHhHHho..',
        4: '..ohHHhHHhHHhHHo..',
        5: '..oHhsshhhhsshHo..',
        6: '..ohHsssssssssho..',
        7: '..oHhsskssskssHo..',
        8: '..ohHsskssskssho..',
      },
    } },
    // Long and wavy, over her shoulders and down to her waist.
    'queen-waves': { name: I18n.t('heroes.queen.waves'), icon: '🌊', girl: true, art: {
      rows: {
        10: '..ohhssssmsssshho.',
        11: '..ohhossssssohhho.',
        12: '..ohhhoossoohhho..',
      },
      front: [
        [0, 12, ['.ohho', 'ohho.', 'ohHo.', '.ohHo', '.ohho', 'ohho.', 'oHho.', '.ohHo', '..oo.']],
        [13, 12, ['ohho.', '.ohho', '.oHho', 'oHho.', 'ohho.', '.ohho', '.ohHo', 'oHho.', '.oo..']],
      ],
    } },
    // Swept to one side into a thick braid over her shoulder.
    'queen-sidebraid': { name: I18n.t('heroes.queen.sidebraid'), icon: '❄️', girl: true, art: {
      rows: {
        4: '..ohHhhhhhhhHHho..',
        5: '..ohhsshhhhhhhho..',
        10: '...ohssssmsssshho.',
        11: '....wossssssohho..',
      },
      front: [[12, 10, ['.ohho', 'ohHho', 'oHhho', '.ohHo', 'ohHho', 'oHhho', '.ohHo', 'ohhho', '.ohHo', '.oZZo', '..oo.']]],
    } },
  };

  addHeroKit('queen', {
    looks: ['girl'],
    base: { girl: { top: TOP } },
    palette,
    items: { shape, head, hand, back, style },
    defaults: { girl: { shape: 'queen-coronation', head: 'queen-crown', hand: 'none', back: 'none', style: 'queen-updo', dress: 'lavender', hair: 'brown' } },
  });
})();
