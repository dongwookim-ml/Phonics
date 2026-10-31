// The prince (js/heroes.js): the young prince of the storybooks. A neat
// side-parted fringe, a white collar and a red sash across a slim jacket
// with a gold belt; round puffed breeches, white tights and black boots; a
// little crown and a short royal-blue cape with a high collar. The king's
// robes, the knight's armour, the captain's sailor suit, the explorer's and
// the wizard's things are theirs now; the prince has his own doublet, ball
// jacket and cape coat, crown, feathered beret and leaf crown, rapier, ball
// invitation and harp, two capes and two haircuts.
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
        // A little golden harp that sings in the Fairy Village.
        'prince-harp': { name: t('harp'), icon: '🎶', boy: true, fairy: true, art: { x: 13, y: 8, rows: [
          '.oo.....',
          'oyyoo...',
          'oy.yyoo.',
          'oyw.w.yo',
          'oyw.w.yo',
          'oyw.wyo.',
          'oyw.yo..',
          'oyyyo...',
          '.ooo....',
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
        // Brushed up into a wave over his forehead.
        'prince-quiff': { name: t('quiff'), icon: '🌊', boy: true, art: {
          rows: {
            0: '.....ohhhhhho.....',
            1: '....ohhhHHhhhoo...',
            2: '...ohhhHHhhhhhho..',
            5: '..ohhsssssssshho..',
          },
          front: [[4, -4, ['......ooo.', '....oohHHo', '...ohhHhoo', '..ohhHhho.', '.ohhhhhho.']]],
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
