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
    '....wosssssssow...',
    '......oossooo.....',
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
    // The snow queen's gown: slim, with a sheer skirt of ice over it that
    // ends in icicles.
    'queen-snow': { name: I18n.t('heroes.queen.snow'), icon: '❄️', girl: true, shop: true, price: 10, art: {
      bottom: [
        '......oddddo......',
        '......odLdDo......',
        '.....oddLdDDo.....',
        '.....ocdLdDco.....',
        '....ocwdLdDcco....',
        '....occdLdDDco....',
        '...occwddLdDcco...',
        '..occcdddLDDDcco..',
        '.ocZcZcZcZcZcZcZo.',
        '..c.c.ff..ff.c.c..',
      ],
      walk: { 9: '..c.cff....ffc.c..' },
      ride: 'skirt',
    } },
    // A riding habit: a fitted jacket with gold buttons, a white jabot and
    // a flared peplum, over a long narrow skirt.
    'queen-riding': { name: I18n.t('heroes.queen.riding'), icon: '🏇', girl: true, unicorn: true, art: {
      top: {
        13: '..oyyDdowwodDyyo..',
        14: '.oyyDdddwwdddDyyo.',
        15: '.oddoDdywwydDoddo.',
        16: '.oddoddyddyddoddo.',
        17: '.owwoddyddyddowwo.',
      },
      bottom: [
        '..osoddddddddoso..',
        '...oddddddddddo...',
        '...ooooDDDDoooo...',
        '.....oDdDDDDo.....',
        '.....oDdDDDDo.....',
        '....oDDdDDDDDo....',
        '....oDDdDDDDDo....',
        '...oDDDdDDDDDDo...',
        '...oooooooooooo...',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
      ride: { flap: 3, cloth: 'dD', hem: 'o', leg: 'D', boot: 'x', shine: 'L' },
    } },
    // The fairy queen's gown, roses climbing it and a hem of big roses.
    'queen-rose': { name: I18n.t('heroes.queen.rose'), icon: '🌹', girl: true, fairy: true, art: {
      bottom: [
        '.....oddddddo.....',
        '....oddLdddeEo....',
        '...oddLdddqeeDo...',
        '...odLddddddqDo...',
        '..oeEdLdddddDDDo..',
        '..oeeqdddddeEDDo..',
        '.oddqLdddddeeqDDo.',
        'oeEqeEqeEqeEqeEqeo',
        'oeeoeeoeeoeeoeeoeo',
        '.oo.ooff..ff.oo.o.',
      ],
      walk: { 9: '.oo.off....ffoo.o.' },
      ride: 'skirt',
    } },
    // A bustle gown: the skirt caught back like curtains over a frilled
    // underskirt, with a big bow at the hip.
    'queen-bustle': { name: I18n.t('heroes.queen.bustle'), icon: '🎀', girl: true, art: {
      bottom: [
        '.....oddddddoRRo..',
        '....oddddddddRrRo.',
        '...oddddLLdddDoRo.',
        '..oddddLwwLdDDDoRo',
        '..odddLLLLLLdDDo..',
        '.oddddwwwwwwdDDDo.',
        '.odddLLLLLLLLdDDo.',
        'oddddwwwwwwwwdDDDo',
        'oLwLwLwLwLwLwLwLwo',
        '......ff..ff......',
      ],
      walk: { 9: FEET_B },
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
    // A wide hat in her colour, tilted, with a white plume and a gold band.
    'queen-hat': { name: I18n.t('heroes.queen.hat'), icon: '👒', shop: true, price: 9, art: { x: 0, y: -5, rows: [
      '...........ooo....',
      '.....oooooowWWo...',
      '....odddddwWwwo...',
      '....oDdddddwWo....',
      '...oyyyyyyyyyo....',
      '.oodddddddddddoo..',
      'oddDDDDDDDDDDDddo.',
      '.ooooooooooooooo..',
    ] } },
    // A crown of ice: sharp clear crystals of different heights.
    'queen-icecrown': { name: I18n.t('heroes.queen.icecrown'), icon: '🧊', forest: true, art: { x: 3, y: -5, rows: [
      '.....oo.....',
      '.o..oZco..o.',
      'oZo.oZco.oZo',
      'oZcocZZcocZo',
      'oZcZcwwcZcZo',
      '.oBBBBBBBBo.',
    ] } },
    // A little crown of red hearts on a gold band.
    'queen-heartcrown': { name: I18n.t('heroes.queen.heartcrown'), icon: '❤️', art: { x: 2, y: -5, rows: [
      '....ee..ee....',
      'e.e.eEeeee.e.e',
      'eEe..eeee..eEe',
      '.e....ee....e.',
      '.yyyyyyyyyyyy.',
      '..YyYyYYyYyY..',
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
    // A teacup on its saucer, steaming.
    'queen-teacup': { name: I18n.t('heroes.queen.teacup'), icon: '🍵', shop: true, price: 8, art: { x: 13, y: 12, rows: [
      '..W.W..',
      '...W...',
      '.oyyyo.',
      '.owPwoo',
      '.owwwoo',
      'oyyyyyo',
      '.sssss.',
    ] } },
    // A royal letter: a scroll hanging from its gold rod, sealed in red.
    'queen-scroll': { name: I18n.t('heroes.queen.scroll'), icon: '📜', art: { x: 12, y: 15, rows: [
      '..ss...',
      'oyssyyo',
      '.oiiio.',
      '.oIIio.',
      '.oiiio.',
      '.oIiIo.',
      '.oieio.',
      '.oeEeo.',
      'oyyyyyo',
    ] } },
    // A corgi puppy in her arm.
    'queen-puppy': { name: I18n.t('heroes.queen.puppy'), icon: '🐶', forest: true, art: { x: 12, y: 11, rows: [
      'o.....o',
      'OoOOOoO',
      'OOOOOOO',
      'OxOwOxO',
      'OwwxwwO',
      '.owPwo.',
      'oOwwwOo',
      'sOOOOOs',
      '.O...O.',
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
    // A cape of ice blue with big white snowflakes and an icicle hem.
    'queen-snowcape': { name: I18n.t('heroes.queen.snowcape'), icon: '❄️', art: { x: -2, y: 12, pal: CAPE, rows: mirror([
      '....ooooooo',
      '...occccccc',
      '..ocBcccccc',
      '..owcBccccc',
      '.owwwcBcccc',
      '.ocwcBccccc',
      'ocBcccccccc',
      'ocwcwcwcccc',
      'occwwwccccc',
      'ocwwBwwcccc',
      'occwwwccccc',
      'ocwcwcwcccc',
      'ocBcccccccc',
      'ocBccwccccc',
      'oBcBwwwcBcB',
      'oNBNBwBNBNB',
      'oNoNoNoNoNo',
    ]) } },
    // The fairy queen's wings: tall and clear, edged in gold.
    'queen-wings': { name: I18n.t('heroes.queen.wings'), icon: '🪽', fairy: true, art: { wings: [[
      'yy......',
      'yzy.....',
      'yzzy....',
      '.yzzy...',
      '.yzZzy..',
      '.yzZZzy.',
      '..yzZZzy',
      '..yzzZzy',
      '...yzzzy',
      '....yyyy',
      '...yzzy.',
      '..yzZzy.',
      '.yzZzy..',
      '.yzzy...',
      '..yy....',
    ], { z: 'rgba(255,240,250,0.85)', Z: 'rgba(200,180,255,0.85)' }, 1] } },
    // A peacock's tail fanned out behind her from her waist: feathers
    // spreading from one point, two rows of blue eyes, a scalloped rim.
    'queen-peacock': { name: I18n.t('heroes.queen.peacock'), icon: '🦚', unicorn: true, art: { x: -2, y: 2, rows: [
      '..........oo..........',
      '.........oqqo.........',
      '....oooooqyyqooooo....',
      '....oQqqqyBByqqqQo....',
      '...oqyByqyNNyqyByqo...',
      '..oqyNNyqyBByqyNNyqo..',
      'ooqqyBNyqqyyqqyNByqqoo',
      'oqqqqyByqqqqqqyByqqqqo',
      'oyBqqQqqqqqqqqqqQqqByo',
      'oNNyqqqqqqqqqqqqqqyNNo',
      'oNNyqqQyqqqqqqyQqqyNNo',
      'oyBQqqBByqqqqyBBqqQByo',
      '.oqqqyNNyqqqqyNNyqqqo.',
      '..oqQyBNyqyyqyNByQqo..',
      '...oqQyyQyBByQyyQqo...',
      '....oqqqqyNNyqqqqo....',
      '.....oQqQyBByQqQo.....',
      '......oQqQyyQqQo......',
      '.......oqQqqQqo.......',
      '........oqqqqo........',
      '.........oQQo.........',
      '..........oo..........',
    ] } },
    // A huge bow tied at her back, its tails down to the floor.
    'queen-bigbow': { name: I18n.t('heroes.queen.bigbow'), icon: '🎀', art: { x: -2, y: 14, rows: mirror([
      'oo.........',
      'oRoo.......',
      'orrRoo.....',
      'orrrrRooooo',
      'orrrrRoRRRR',
      'orrrRRoRrrR',
      'oRRRooorrro',
      '.ooo.orRro.',
      '.....orRo..',
      '....orRro..',
      '....orRo...',
      '...orRro...',
      '...orRo....',
      '..orrRo....',
      '..oRoRo....',
    ]) } },
  };

  const style = {
    // Swept up into a tall round bun on top, a band of gold and pearls
    // round its foot (the starting style).
    'queen-updo': { name: I18n.t('heroes.queen.updo'), icon: '👸', girl: true, art: {
      short: true,
      front: [[4, -5, ['...oooo...', '..ohHHho..', '.ohHhhhho.', '.ohhhhhho.', 'oywyywyywo']]],
    } },
    // A thick braid with pearls wound round the top of her head like a
    // crown, tucked in at her temples.
    'queen-crownbraid': { name: I18n.t('heroes.queen.crownbraid'), icon: '🥨', girl: true, art: {
      short: true,
      rows: {
        0: '....ooooooooooo...',
        1: '..ooHwHHhHhHHwHoo.',
        2: '.oHHhHHhHHhHHhHHho',
        3: '.ohHoHHhhhhHHhoHho',
        4: '.oHwohhhhhhhhHowHo',
        5: '..ooosshhhhsshooo.',
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
        11: '....wosssssssohho.',
      },
      front: [[12, 10, ['.ohho', 'ohHho', 'oHhho', '.ohHo', 'ohHho', 'oHhho', '.ohHo', 'ohhho', '.ohHo', '.oZZo', '..oo.']]],
    } },
    // Short and curly all over, puffed out at her temples like a
    // grown-up queen's.
    'queen-curls': { name: I18n.t('heroes.queen.curls'), icon: '🌀', girl: true, art: {
      short: true,
      rows: {
        0: '.....ooooooooo....',
        1: '...ooHhhHhhHhhoo..',
        2: '..ohHohHhohHhohHo.',
        3: '.oHhhohHhhhHhohhHo',
        4: '.ohHohhhhhhhhhoHho',
        5: '.oHhhsshhhhsshhHho',
        6: '.ohHhssssssssshHho',
        7: '..oHhsskssskssHho.',
        8: '.ohHhsskssskssHhho',
        9: '..oHhspssssspsHho.',
        10: '..oohssssmsssshoo.',
      },
    } },
    // Two round buns low at the sides of her head, held with pearl pins.
    'queen-lowbuns': { name: I18n.t('heroes.queen.lowbuns'), icon: '🍡', girl: true, art: {
      short: true,
      front: [
        [-1, 7, ['.ooo.', 'ohHho', 'oHhhw', 'ohhho', 'ohhwo', '.ooo.']],
        [14, 7, ['.ooo.', 'ohHho', 'whhHo', 'ohhho', 'owhho', '.ooo.']],
      ],
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
