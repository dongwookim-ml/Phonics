// The princess (js/heroes.js): the hero as she was first drawn, in ball
// gowns and tiaras, and the girl's own wardrobe so far. Her own things
// below are what only a princess has: gowns with hearts, roses and rainbow
// ruffles, a palace gown, a bubble dress and a nightgown; a heart crown, a
// storybook hat with a veil, a rose clip, a feather hat, earmuffs and a
// nightcap; a glass slipper, a heart handbag, the frog prince, a teacup
// and a dancing ribbon; a big bow, heart wings, bubbles and a lace collar
// cape at her back; ringlets, a crown braid, Rapunzel's braid, twin tails
// and straight-cut bangs.
(() => {
  const name = key => I18n.t(`heroes.princess.${key}`);
  // A bitmap and its mirror image side by side (the left half given).
  const mirrored = rows => rows.map(row => row + [...row].reverse().join(''));

  addHeroKit('princess', {
    looks: ['girl'],
    items: {
      shape: {
        // A ball gown covered in little red hearts, a heart at her waist.
        'princess-heartgown': { name: name('heartgown'), icon: '💝', art: {
          top: { 17: '......oteeto......' },
          bottom: [
            '.....oddddddo.....',
            '....oEdeddEdeo....',
            '...odeeeddeeeDo...',
            '..oddLeddddeDDDo..',
            '..odLdddddddDDDo..',
            '.oEdeddeddedDEDeo.',
            '.oeeeddEeeedDeeeo.',
            'oddeddddeedddDeDDo',
            'otttttttttttttttto',
            '......ff..ff......',
          ],
          walk: 'feet',
          ride: 'skirt',
        } },
        // Roses climbing her skirt and all round the hem (the forest's).
        'princess-rosegown': { name: name('rosegown'), icon: '🌹', forest: true, art: {
          top: { 17: '......oGGGGo......' },
          bottom: [
            '.....oddddddo.....',
            '....oddLddddDo....',
            '...oddLdeEdddDo...',
            '..oddLddeeGddDDo..',
            '..odLdGddddddDDo..',
            '.oddLeEdddddeEDDo.',
            '.odLdeeGdddGeeDDo.',
            'oddLddddddddddDDDo',
            'oeEGeEGeEGeEGeEGeo',
            '......ff..ff......',
          ],
          walk: 'feet',
          ride: 'skirt',
        } },
        // Tiers of ruffles, each edged in a colour of the rainbow (the
        // Unicorn Village's).
        'princess-rainbowgown': { name: name('rainbowgown'), icon: '🌈', unicorn: true, art: {
          bottom: [
            '.....oddddddo.....',
            '....oLddddddDo....',
            '...oeEeEeEeEeEo...',
            '...oLdddddddDDo...',
            '..oyzyzyzyzyzyzo..',
            '..oLddddddddDDDo..',
            '.oqGqGqGqGqGqGqGo.',
            '.oLddddddddddDDDo.',
            'oBcBcBcBcBcBcBcBco',
            '......ff..ff......',
          ],
          walk: 'feet',
          ride: 'skirt',
        } },
        // Wide at the hips like a palace ball gown of long ago (panniers),
        // a light front panel laced with a ladder of bows (from the shop).
        'princess-palacegown': { name: name('palacegown'), icon: '🎀', shop: true, price: 12, art: {
          top: {
            13: '..ohLLoLLLLoLLho..',
            14: '..oLLLdrRRrdLLLo..',
            15: '...osodLLLLdoso...',
            16: '...os.orRRro.so...',
            17: '......oLLLLo......',
          },
          bottom: [
            '....oddrRRrddo....',
            '..oodddLLLLdddoo..',
            '.oddddLLLLLLddDDo.',
            'oddLddLrRRrLdDDDDo',
            'oddLdLLLLLLLLdDDDo',
            'oddLdLLrRRrLLdDDDo',
            'odLdLLLLLLLLLLDDDo',
            'odLdLLLrRRrLLLDDDo',
            'owtwtwtwtwtwtwtwto',
            '......ff..ff......',
          ],
          walk: 'feet',
          ride: 'skirt',
        } },
        // A short, round bubble skirt tucked in at the hem, a sash with a
        // bow at her side, white tights (from the fairies).
        'princess-bubble': { name: name('bubble'), icon: '🎈', fairy: true, art: {
          top: { 17: '...orRoRRRRo......' },
          bottom: [
            '...oRo.oddddo.....',
            '...ooddLddddDoo...',
            '..odLLddddddDDDo..',
            '.odLLdddddddDDDDo.',
            '.odLddddddddDDDDo.',
            '..oddddddddDDDDo..',
            '...oottttttttoo...',
            '......ow..wo......',
            '......ow..wo......',
            '......ff..ff......',
          ],
          walk: { 7: '.....ow....wo.....', 8: '.....ow....wo.....' },
          ride: 'skirt',
        } },
        // A loose spotted nightgown with a frilly collar and hem, and
        // fluffy pink slippers: bedtime in the castle.
        'princess-nightgown': { name: name('nightgown'), icon: '🌙', art: {
          top: { 13: '..ohLLowwwwoLLho..', 17: '......oddddo......' },
          bottom: [
            '.....odLdddDo.....',
            '.....odddLdDo.....',
            '....odLddddDDo....',
            '....odddLdddDo....',
            '....odLddddLDo....',
            '...oddddLdddDDo...',
            '...odLddddLddDo...',
            '..owwwwwwwwwwwwo..',
            '..oWwWwWwWwWwWwo..',
            '.....PPP..PPP.....',
          ],
          walk: { 9: '....PPP....PPP....' },
          ride: 'skirt',
        } },
      },
      head: {
        // A little gold crown with a red heart on top, pearls on its points.
        'princess-heartcrown': { name: name('heartcrown'), icon: '💕', art: { x: 4, y: -5, rows: [
          '...e..e...',
          'w.eEeeee.w',
          'y..eeee..y',
          'yy..ee..yy',
          'yyybyybyyy',
        ] } },
        // A tall storybook princess hat in her dress colours, a gold band
        // round it, a veil floating from its tip.
        'princess-conehat': { name: name('conehat'), icon: '🏰', art: { x: 4, y: -5, rows: [
          '....yy.w......',
          '...oLdoww.....',
          '...oLdo.wW....',
          '..oLddDo.wW...',
          '..oLddDo..wW..',
          '.oLdddDDo.wWw.',
          'oyyyyyyyyo.wW.',
          '...........wWw',
          '...........wW.',
          '............Ww',
          '...........wW.',
          '............w.',
        ] } },
        // A red rose with leaves, clipped over one ear (the forest's).
        'princess-roseclip': { name: name('roseclip'), icon: '🌺', forest: true, art: { x: 0, y: 1, rows: [
          '..ooo.',
          '.oeEeo',
          'oevEeo',
          'oeEvEo',
          'GoeeoG',
          '.GG.G.',
        ] } },
        // A tiny hat tipped over one side, a white feather and a little
        // net over her brow (from the forest).
        'princess-fascinator': { name: name('fascinator'), icon: '🪶', forest: true, art: { x: 7, y: -4, rows: [
          '.......ww..',
          '......wWw..',
          '....ooowWo.',
          '...oLLLLwo.',
          '...oddddDo.',
          '..oRRRRRRo.',
          '.oooooooooo',
          '..W.W.W....',
        ] } },
        // Big fluffy white earmuffs on a pink band (from the shop).
        'princess-earmuffs': { name: name('earmuffs'), icon: '❄️', shop: true, price: 8, art: { x: -1, y: -1, rows: [
          '.......PPPPPP.......',
          '.....PP......PP.....',
          '....P..........P....',
          '...P............P...',
          '...P............P...',
          '..oPo..........oPo..',
          '.owwwo........owwwo.',
          'owwwWwo......owWwwwo',
          'owwwwWo......oWwwwwo',
          'oWwwwwo......owwwwWo',
          '.oWwwo........owwWo.',
          '..ooo..........ooo..',
        ] } },
        // A floppy spotted nightcap in her dress colours with a frilly
        // band, its tip flopped over with a little star on the end.
        'princess-nightcap': { name: name('nightcap'), icon: '😴', art: { x: 2, y: -5, rows: [
          '.....oooo........',
          '....oLdwDoo......',
          '...oLdddddDoo....',
          '..oLdwdddwddDo...',
          '.oLdddddwdddDDo..',
          'owWwWwWwWwWwWoDo.',
          '.............oDo.',
          '.............oDDo',
          '..............oDo',
          '...............y.',
          '..............yzy',
          '...............y.',
        ] } },
      },
      hand: {
        // A sparkling glass slipper (from the fairies), its toe out.
        'princess-slipper': { name: name('slipper'), icon: '👠', fairy: true, art: { x: 12, y: 12, pal: { o: '#4f6fc0' }, rows: [
          'oo....w.',
          'oco..wzw',
          'oZZo..w.',
          'oZZZooo.',
          'oooZZwZo',
          'o.oZZZZo',
          'o..oooo.',
        ] } },
        // A red heart handbag on a gold chain.
        'princess-heartbag': { name: name('heartbag'), icon: '👛', art: { x: 13, y: 10, rows: [
          '..yyy..',
          '.y...y.',
          '.oo.oo.',
          'oeEoeeo',
          'oEeeeeo',
          'oeeyeeo',
          '.oeeeo.',
          '..oeo..',
          '...o...',
        ] } },
        // The frog prince in her hand, a tiny gold crown on his head
        // (from the forest).
        'princess-frog': { name: name('frog'), icon: '🐸', forest: true, art: { x: 11, y: 8, rows: [
          '..y.y.y..',
          '..yyyyy..',
          '.ooo.ooo.',
          'owwkokwwo',
          'oqqqqqqqo',
          'oqpqqqpqo',
          'oqqoooqqo',
          '.oqqqqqo.',
          'oqQo.oQqo',
          '.oo...oo.',
        ] } },
        // A teacup with pink spots on its saucer, still warm (from the shop).
        'princess-teacup': { name: name('teacup'), icon: '☕', shop: true, price: 6, art: { x: 11, y: 10, rows: [
          '.W..W....',
          '..W..W...',
          'ooooooo..',
          'oyyyyyooo',
          'owPwPwo.o',
          'owwwwwooo',
          '.owwwoo..',
          'oWwwwwwWo',
          '.ooooooo.',
        ] } },
        // A dancing ribbon on a stick, looping round in rainbow colours
        // (from the Unicorn Village).
        'princess-ribbon': { name: name('ribbon'), icon: '🎗️', unicorn: true, art: { x: 11, y: 2, rows: [
          '....eee..',
          '...e...O.',
          '..u.....O',
          '..u.....y',
          '.Pu.....y',
          '.P.B...q.',
          'P...BBq..',
          '.....q...',
          '.....q...',
          '......y..',
          '......K..',
          '.....K...',
          '.....K...',
          '....K....',
          '....K....',
        ] } },
      },
      back: {
        // A big pink bow tied at the back of her waist, its loops out at
        // her sides and its tails down past her hem.
        'princess-bowsash': { name: name('bowsash'), icon: '🎀', art: { x: -2, y: 14, pal: { o: '#4a2c4f', r: '#ff6fa8', R: '#e04a8a', P: '#ffb0d0' }, rows: mirrored([
          '.oooo......',
          'oPrrro.....',
          'oPrRrro....',
          'orrRRrro...',
          'orrRRrrRRRR',
          'orrrrro.oRR',
          '.ooooo..oRR',
          '.......oRro',
          '.....ooRro.',
          '...ooRRro..',
          '..oRRro....',
          '.oRro......',
          'oRro.......',
          'oro........',
          'oo.........',
        ]) } },
        // Little wings made of hearts (from the Unicorn Village).
        'princess-heartwings': { name: name('heartwings'), icon: '💘', unicorn: true, art: { wings: [[
          '.oo.....',
          'oeeo.oo.',
          'oeweoeeo',
          'oeeeeEeo',
          '.oeeeeo.',
          '..oeeo..',
          '.oEEEEo.',
          'oEwEEEo.',
          'oEEEEo..',
          '.oEo....',
          '..o.....',
        ], { o: '#4a2c4f' }, 7] } },
        // Soap bubbles floating all round her (from the fairies).
        'princess-bubbles': { name: name('bubbles'), icon: '🫧', fairy: true, art: { x: -2, y: -4, pal: { c: '#7fc8f0', Z: '#e0f8ff', w: '#ffffff' }, rows: [
          '...................cc.',
          '..................cwZc',
          '..................cZZc',
          '.ccc...............cc.',
          'cwZZc.................',
          'cZZZc.................',
          'cZZZc.................',
          '.ccc..................',
          '..................ccc.',
          '.................cwZZc',
          '.................cZZZc',
          '.................cZZZc',
          '.c................ccc.',
          'cwc...................',
          '.c....................',
          '......................',
          '....................c.',
          '...................cwc',
          '.cc.................c.',
          'cwZc..................',
          'cZZc..................',
          '.cc...................',
          '...................cc.',
          '..................cwZc',
          '..................cZZc',
          '.c.................cc.',
          'cwc...................',
          '.c....................',
        ] } },
        // A white lace cape with a high collar standing up behind her
        // head, its hem scalloped.
        'princess-lacecape': { name: name('lacecape'), icon: '🤍', art: { x: -2, y: 5, pal: { o: '#a890c0', w: '#ffffff', W: '#e4d8f4' }, rows: mirrored([
          '..o........',
          '.owo.......',
          'owWwo......',
          'owwWo......',
          'owWwo......',
          'owwWo......',
          '.owWwo.....',
          '..owwwwwwww',
          '...owwwwwww',
          '...owWwwwww',
          '..owwwwwwww',
          '..owwWwwwww',
          '.owWwwwwwww',
          '.owwwWwwwww',
          'owWwwwwwwww',
          '.owwWwwwwww',
          'owWwwwwwwww',
          '.owwWwwwwww',
          'owWwwwwwwww',
          '.owwWwwwwww',
          'owWwwwwwwww',
          '.owwwwwwwww',
          'oWoWoWoWoWo',
        ]) } },
      },
      style: {
        // Long spiral ringlets down to her waist.
        'princess-ringlets': { name: name('ringlets'), icon: '➰', art: {
          back: [
            [-1, 5, ['.oh.', 'ohh.', 'oHh.', '.oh.', 'ohh.', 'oHh.', '.oh.', 'ohh.', 'oHhh', '.ohH', 'ohhh', 'oHhH', '.ohh', 'ohHo', 'oHhh', '.ohH', '.ohh', '..oo']],
            [15, 5, ['.ho.', '.hho', '.hHo', '.ho.', '.hho', '.hHo', '.ho.', '.hho', 'hhHo', 'Hho.', 'hhho', 'HhHo', 'hho.', 'oHho', 'hhHo', 'Hho.', 'hho.', 'oo..']],
          ],
        } },
        // A braid round her head like a crown, the rest long down her back.
        'princess-crownbraid': { name: name('crownbraid'), icon: '👸', art: {
          back: HAIR_STYLE_ART.long.back,
          front: [[2, 2, [
            '..oHhwHhoHho..',
            '.oHhwywoHhoHo.',
            'oHhoHwoHhoHwoH',
            '...........wyw',
            '............w.',
          ]]],
        } },
        // One very long braid over her shoulder down to the floor, flowers
        // woven in, a ribbon at its end (Rapunzel's).
        'princess-rapunzel': { name: name('rapunzel'), icon: '🗼', art: {
          front: [[12, 10, [
            '..o.....',
            '.ohHo...',
            '.oHho...',
            '.ohHo...',
            '.owyo...',
            '.oHho...',
            '.ohHo...',
            '.oHho...',
            '.ohHo...',
            '.owyo...',
            '.oHho...',
            '.ohHo...',
            '.oHho...',
            '.ohHo...',
            '..oHho..',
            '...ohHo.',
            '....oHHo',
            '.....oRo',
          ]]],
        } },
        // Two long tails tied high with pink bows, down past her waist.
        'princess-twintails': { name: name('twintails'), icon: '🎀', art: {
          rows: { 11: '..ohhossssssohho..', 12: '...ooooossooooo...' },
          short: true,
          back: [
            [-2, 1, ['..oo', '.ohh', 'ohhH', 'ohHh', 'ohhh', 'oHho', 'ohho', 'ohHo', 'oHho', 'ohho', 'ohHo', 'oHho', 'ohho', '.oho', '.ohH', '..oh', '.oho', 'oho.', '.o..']],
            [16, 1, ['oo..', 'hho.', 'Hhho', 'hHho', 'hhho', 'ohHo', 'ohho', 'oHho', 'ohHo', 'ohho', 'oHho', 'ohHo', 'ohho', 'oho.', 'Hho.', 'ho..', 'oho.', '.oho', '..o.']],
          ],
          front: [[0, 0, ['rr.rr', '.rRr.', 'r...r']], [13, 0, ['rr.rr', '.rRr.', 'r...r']]],
        } },
        // Long and straight with a blunt fringe, cut straight at her cheeks.
        'princess-bangs': { name: name('bangs'), icon: '💇‍♀️', art: {
          rows: {
            5: '.ohhhhhhhhhhhhhho.',
            6: '.ohhhHhHhHhHhHhho.',
            7: '.ohhhhskssskshho..',
            8: '.ohhhhskssskshho..',
            9: '.ohhhhpsssssphho..',
            10: '.ohhhhsssmssshhho.',
          },
          back: [[1, 13, ['hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'oo']], [15, 13, ['hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'hh', 'oo']]],
        } },
      },
    },
    uses: {
      shape: ['ballgown', 'long', 'tutu', 'party', 'cake', 'mermaid', 'hanbok', 'petal'],
      head: ['tiara', 'flowers', 'bow', 'heartband', 'bunny', 'kitty', 'butterfly', 'starpins', 'sunhat', 'crown', 'horn', 'gemband'],
      hand: ['wand', 'bouquet', 'heartwand', 'moonwand', 'parasol', 'fan', 'teddy', 'balloon', 'lantern'],
      back: ['wings', 'angel', 'butterfly', 'cape', 'rainbow'],
      style: ['long', 'bob', 'pigtails', 'ponytail', 'bun', 'braids', 'curly'],
    },
    defaults: { girl: { shape: 'ballgown', head: 'tiara', hand: 'none', back: 'none', style: 'long', dress: 'pink', hair: 'brown' } },
  });
})();
