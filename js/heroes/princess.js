// The princess (js/heroes.js): the hero as she was first drawn, in ball
// gowns and tiaras, and the girl's own wardrobe so far. Her own things
// below are what only a princess has: gowns with hearts, roses and rainbow
// ruffles, a heart crown, a storybook hat with a veil, a rose clip, a
// glass slipper, a heart handbag, a big bow at her back, ringlets and a
// crown braid.
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
