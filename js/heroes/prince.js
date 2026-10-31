// The prince (js/heroes.js): the boy hero as he was first drawn.
addHeroKit('prince', {
  looks: ['boy'],
  uses: {
    shape: ['tunic', 'coat', 'robe', 'suit', 'armour', 'sailor', 'dopo', 'explorer', 'wizard', 'leaf'],
    head: ['circlet', 'kingcrown', 'feather', 'helmet', 'pirate', 'wizardhat', 'safari', 'cap', 'gat', 'crown', 'horn', 'gemband'],
    hand: ['sword', 'sceptre', 'starsword', 'shield', 'bow', 'staff', 'telescope', 'flag', 'teddy', 'balloon', 'lantern'],
    back: ['redcape', 'dragon', 'cape', 'rainbow'],
    style: ['short', 'spiky', 'curls', 'shaggy'],
  },
  defaults: { boy: { shape: 'tunic', head: 'circlet', hand: 'none', back: 'none', style: 'short', dress: 'sky', hair: 'brown' } },
});
