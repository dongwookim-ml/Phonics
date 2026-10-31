// The princess (js/heroes.js): the hero as she was first drawn, in ball
// gowns and tiaras.
addHeroKit('princess', {
  looks: ['girl'],
  uses: {
    shape: ['ballgown', 'long', 'tutu', 'party', 'cake', 'mermaid', 'hanbok', 'petal'],
    head: ['tiara', 'flowers', 'bow', 'heartband', 'bunny', 'kitty', 'butterfly', 'starpins', 'sunhat', 'crown', 'horn', 'gemband'],
    hand: ['wand', 'bouquet', 'heartwand', 'moonwand', 'parasol', 'fan', 'teddy', 'balloon', 'lantern'],
    back: ['wings', 'angel', 'butterfly', 'cape', 'rainbow'],
    style: ['long', 'bob', 'pigtails', 'ponytail', 'bun', 'braids', 'curly'],
  },
  defaults: { girl: { shape: 'ballgown', head: 'tiara', hand: 'none', back: 'none', style: 'long', dress: 'pink', hair: 'brown' } },
});
