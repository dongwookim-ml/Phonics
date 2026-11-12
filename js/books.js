// Story books for the royal library on the castle's second floor: short
// public-domain fairy tales and fables, retold in very simple English.
// Pages have short sentences and optional illustration (emoji fallback), and each
// book ends with three questions. Option text starts with its emoji; the
// voice reads the words after it (bookSpoken).
// tools/tts-phrases.js reads this file too, so keep it free of page code.

const BOOKS = [
  {
    id: 'tortoise-hare', title: 'The Tortoise and the Hare', label: I18n.t('books.theTortoiseAndTheHare'), cover: '🐢', coverImage: 'img/books/tortoise-hare/page-08.webp', color: '#8fd896',
    pages: [
      { text: 'Hare was very fast. Tortoise was very slow.', pic: '🐇🐢', image: 'img/books/tortoise-hare/page-01.webp', imageAlt: I18n.t('books.raceArt1') },
      { text: '"Let\'s have a race!" said Hare.', pic: '🐇🏁', image: 'img/books/tortoise-hare/page-02.webp', imageAlt: I18n.t('books.raceArt2') },
      { text: 'Off they went! Hare ran far ahead.', pic: '🐇💨', image: 'img/books/tortoise-hare/page-03.webp', imageAlt: I18n.t('books.raceArt3') },
      { text: '"I have lots of time," said Hare. He lay down and fell asleep.', pic: '🌳🐇💤', image: 'img/books/tortoise-hare/page-04.webp', imageAlt: I18n.t('books.raceArt4') },
      { text: 'Tortoise did not stop. Step, step, step!', pic: '🐢👣', image: 'img/books/tortoise-hare/page-05.webp', imageAlt: I18n.t('books.raceArt5') },
      { text: 'He walked right past the sleeping Hare.', pic: '🐢💤', image: 'img/books/tortoise-hare/page-06.webp', imageAlt: I18n.t('books.raceArt6') },
      { text: 'Hare woke up and ran. But it was too late!', pic: '🐇😮', image: 'img/books/tortoise-hare/page-07.webp', imageAlt: I18n.t('books.raceArt7') },
      { text: 'Tortoise won the race! Slow and steady wins.', pic: '🐢🏆', image: 'img/books/tortoise-hare/page-08.webp', imageAlt: I18n.t('books.raceArt8') },
    ],
    quiz: [
      { q: 'Who won the race?', options: ['🐢 Tortoise', '🐇 Hare', '🦊 Fox'], answer: 0 },
      { q: 'What did Hare do in the middle of the race?', options: ['🍎 He ate an apple', '😴 He fell asleep', '🏊 He went swimming'], answer: 1 },
      { q: 'Who was very slow?', options: ['🐇 Hare', '🐆 Cheetah', '🐢 Tortoise'], answer: 2 },
    ],
  },
  {
    id: 'lion-mouse', title: 'The Lion and the Mouse', label: I18n.t('books.theLionAndTheMouse'), cover: '🦁', coverImage: 'img/books/lion-mouse/page-08.webp', color: '#ffd34d',
    pages: [
      { text: 'A big lion was sleeping. A little mouse ran over his nose.', pic: '🦁💤🐭', image: 'img/books/lion-mouse/page-01.webp', imageAlt: I18n.t('books.lionMouseArt1') },
      { text: 'The lion woke up and caught the mouse!', pic: '🦁🐭', image: 'img/books/lion-mouse/page-02.webp', imageAlt: I18n.t('books.lionMouseArt2') },
      { text: '"Please let me go," said the mouse. "One day I will help you."', pic: '🐭🙏', image: 'img/books/lion-mouse/page-03.webp', imageAlt: I18n.t('books.lionMouseArt3') },
      { text: 'The lion laughed and let the mouse go.', pic: '🦁😄', image: 'img/books/lion-mouse/page-04.webp', imageAlt: I18n.t('books.lionMouseArt4') },
      { text: 'One day, the lion was caught in a net. He roared and roared.', pic: '🦁🕸️', image: 'img/books/lion-mouse/page-05.webp', imageAlt: I18n.t('books.lionMouseArt5') },
      { text: 'The little mouse heard him. She ran to help.', pic: '🐭👂', image: 'img/books/lion-mouse/page-06.webp', imageAlt: I18n.t('books.lionMouseArt6') },
      { text: 'She chewed the ropes with her tiny teeth. Snip, snip, snip!', pic: '🐭🦷', image: 'img/books/lion-mouse/page-07.webp', imageAlt: I18n.t('books.lionMouseArt7') },
      { text: 'The lion was free! "Thank you, little friend," he said.', pic: '🦁❤️🐭', image: 'img/books/lion-mouse/page-08.webp', imageAlt: I18n.t('books.lionMouseArt8') },
    ],
    quiz: [
      { q: 'What caught the lion?', options: ['🧺 A basket', '🕸️ A net', '🐘 An elephant'], answer: 1 },
      { q: 'How did the mouse help the lion?', options: ['🦷 She chewed the ropes', '🎵 She sang a song', '💧 She got him water'], answer: 0 },
      { q: 'Who was very small?', options: ['🦁 The lion', '🐻 The bear', '🐭 The mouse'], answer: 2 },
    ],
  },
  {
    id: 'three-pigs', title: 'The Three Little Pigs', label: I18n.t('books.theThreeLittlePigs'), cover: '🐷', coverImage: 'img/books/three-pigs/page-08.webp', color: '#ffb3cf',
    pages: [
      { text: 'Three little pigs each built a house.', pic: '🐷🐷🐷', image: 'img/books/three-pigs/page-01.webp', imageAlt: I18n.t('books.threePigsArt1') },
      { text: 'The first pig built a house of straw. The second pig built a house of sticks.', pic: '🌾🪵', image: 'img/books/three-pigs/page-02.webp', imageAlt: I18n.t('books.threePigsArt2') },
      { text: 'The third pig built a house of bricks. It took a long time.', pic: '🧱🐷', image: 'img/books/three-pigs/page-03.webp', imageAlt: I18n.t('books.threePigsArt3') },
      { text: 'A big bad wolf came. He huffed and he puffed!', pic: '🐺💨', image: 'img/books/three-pigs/page-04.webp', imageAlt: I18n.t('books.threePigsArt4') },
      { text: 'He blew down the straw house. He blew down the stick house too!', pic: '🌾💨🪵', image: 'img/books/three-pigs/page-05.webp', imageAlt: I18n.t('books.threePigsArt5') },
      { text: 'The two pigs ran to the brick house.', pic: '🐷🐷🏠', image: 'img/books/three-pigs/page-06.webp', imageAlt: I18n.t('books.threePigsArt6') },
      { text: 'The wolf huffed and puffed, but the brick house did not fall.', pic: '🐺🧱', image: 'img/books/three-pigs/page-07.webp', imageAlt: I18n.t('books.threePigsArt7') },
      { text: 'The wolf ran away, and the three pigs were safe.', pic: '🐷🐷🐷', image: 'img/books/three-pigs/page-08.webp', imageAlt: I18n.t('books.threePigsArt8') },
    ],
    quiz: [
      { q: 'Which house did not fall down?', options: ['🌾 The straw house', '🪵 The stick house', '🧱 The brick house'], answer: 2 },
      { q: 'Who blew the houses down?', options: ['🐺 The wolf', '🐻 The bear', '🐮 The cow'], answer: 0 },
      { q: 'How many little pigs were there?', options: ['🐷🐷 Two', '🐷🐷🐷 Three', '🐷🐷🐷🐷 Four'], answer: 1 },
    ],
  },
  {
    id: 'goldilocks', title: 'Goldilocks and the Three Bears', label: I18n.t('books.goldilocksAndTheThreeBears'), cover: '🐻', coverImage: 'img/books/goldilocks/page-07.webp', color: '#f0b070',
    pages: [
      { text: 'Three bears lived in a house in the woods.', pic: '🐻🏠🌲', image: 'img/books/goldilocks/page-01.webp', imageAlt: I18n.t('books.goldilocksArt1') },
      { text: 'One day, a girl named Goldilocks walked in.', pic: '👧🚪', image: 'img/books/goldilocks/page-02.webp', imageAlt: I18n.t('books.goldilocksArt2') },
      { text: 'She saw three bowls of porridge. She ate the little one all up!', pic: '🥣🥣🥣', image: 'img/books/goldilocks/page-03.webp', imageAlt: I18n.t('books.goldilocksArt3') },
      { text: 'She sat on three chairs. The little chair broke!', pic: '🪑💥', image: 'img/books/goldilocks/page-04.webp', imageAlt: I18n.t('books.goldilocksArt4') },
      { text: 'She lay on three beds. The little bed was just right, and she fell asleep.', pic: '🛏️💤', image: 'img/books/goldilocks/page-05.webp', imageAlt: I18n.t('books.goldilocksArt5') },
      { text: 'The bears came home. "Someone ate my porridge!" said Baby Bear.', pic: '🐻🥣😢', image: 'img/books/goldilocks/page-06.webp', imageAlt: I18n.t('books.goldilocksArt6') },
      { text: 'Then Baby Bear saw Goldilocks in his bed.', pic: '🐻👀👧', image: 'img/books/goldilocks/page-07.webp', imageAlt: I18n.t('books.goldilocksArt7') },
      { text: 'Goldilocks woke up and ran all the way home!', pic: '👧💨', image: 'img/books/goldilocks/page-08.webp', imageAlt: I18n.t('books.goldilocksArt8') },
    ],
    quiz: [
      { q: 'Whose porridge did Goldilocks eat?', options: ['👑 The king\'s', '🧸 Baby Bear\'s', '🐱 The cat\'s'], answer: 1 },
      { q: 'What broke?', options: ['🪑 The little chair', '🛏️ The big bed', '🚪 The door'], answer: 0 },
      { q: 'Where did Goldilocks fall asleep?', options: ['🌳 Under a tree', '🛁 In the bath', '🛏️ In a little bed'], answer: 2 },
    ],
  },
  {
    id: 'red-hen', title: 'The Little Red Hen', label: I18n.t('books.theLittleRedHen'), cover: '🐔', coverImage: 'img/books/red-hen/page-08.webp', color: '#ff9a8a',
    pages: [
      { text: 'The Little Red Hen found some wheat seeds.', pic: '🐔🌾', image: 'img/books/red-hen/page-01.webp', imageAlt: I18n.t('books.redHenArt1') },
      { text: '"Who will help me plant the seeds?" she asked. "Not I," said the cat, the dog and the duck.', pic: '🐱🐶🦆', image: 'img/books/red-hen/page-02.webp', imageAlt: I18n.t('books.redHenArt2') },
      { text: 'So she planted them herself. The wheat grew tall.', pic: '🐔🌱', image: 'img/books/red-hen/page-03.webp', imageAlt: I18n.t('books.redHenArt3') },
      { text: '"Who will help me make bread?" she asked. "Not I," they all said.', pic: '🐔🍞', image: 'img/books/red-hen/page-04.webp', imageAlt: I18n.t('books.redHenArt4') },
      { text: 'So she made the bread herself. It smelled so good!', pic: '🐔🍞✨', image: 'img/books/red-hen/page-05.webp', imageAlt: I18n.t('books.redHenArt5') },
      { text: '"Who will help me eat the bread?" she asked. "I will!" said the cat, the dog and the duck.', pic: '🐱🐶🦆', image: 'img/books/red-hen/page-06.webp', imageAlt: I18n.t('books.redHenArt6') },
      { text: '"No," said the hen. "I did all the work, so I will eat it!"', pic: '🐔😋', image: 'img/books/red-hen/page-07.webp', imageAlt: I18n.t('books.redHenArt7') },
      { text: 'And she did, with her little chicks.', pic: '🐥🍞🐥', image: 'img/books/red-hen/page-08.webp', imageAlt: I18n.t('books.redHenArt8') },
    ],
    quiz: [
      { q: 'What did the hen make?', options: ['🎂 A cake', '🍕 A pizza', '🍞 Bread'], answer: 2 },
      { q: 'Who helped the hen do the work?', options: ['🙅 Nobody', '🐱 The cat', '🐶 The dog'], answer: 0 },
      { q: 'Who ate the bread?', options: ['🦆 The duck', '🐥 The hen and her chicks', '🐶 The dog'], answer: 1 },
    ],
  },
  {
    id: 'ugly-duckling', title: 'The Ugly Duckling', label: I18n.t('books.theUglyDuckling'), cover: '🦢', coverImage: 'img/books/ugly-duckling/page-08.webp', color: '#a8d8ff',
    pages: [
      { text: 'A mother duck had some eggs. One egg was big and gray.', pic: '🦆🥚', image: 'img/books/ugly-duckling/page-01.webp', imageAlt: I18n.t('books.ducklingArt1') },
      { text: 'Out came a big gray duckling. He did not look like the others.', pic: '🐣🦆', image: 'img/books/ugly-duckling/page-02.webp', imageAlt: I18n.t('books.ducklingArt2') },
      { text: '"You are ugly!" said the other ducks. The duckling was very sad.', pic: '🦆🦆😢', image: 'img/books/ugly-duckling/page-03.webp', imageAlt: I18n.t('books.ducklingArt3') },
      { text: 'He went away and lived alone all winter.', pic: '❄️🐣', image: 'img/books/ugly-duckling/page-04.webp', imageAlt: I18n.t('books.ducklingArt4') },
      { text: 'When spring came, he saw some swans on the lake.', pic: '🌸🦢🦢', image: 'img/books/ugly-duckling/page-05.webp', imageAlt: I18n.t('books.ducklingArt5') },
      { text: 'He looked down into the water. He was a beautiful white swan!', pic: '💧🦢✨', image: 'img/books/ugly-duckling/page-06.webp', imageAlt: I18n.t('books.ducklingArt6') },
      { text: '"Come and swim with us!" said the swans.', pic: '🦢🦢🦢', image: 'img/books/ugly-duckling/page-07.webp', imageAlt: I18n.t('books.ducklingArt7') },
      { text: 'He was so happy at last.', pic: '🦢💖', image: 'img/books/ugly-duckling/page-08.webp', imageAlt: I18n.t('books.ducklingArt8') },
    ],
    quiz: [
      { q: 'What did the duckling grow up to be?', options: ['🦆 A duck', '🦢 A swan', '🐔 A hen'], answer: 1 },
      { q: 'How did the duckling feel when the ducks were mean?', options: ['😢 Sad', '😄 Happy', '😴 Sleepy'], answer: 0 },
      { q: 'When did he see the swans?', options: ['❄️ In winter', '🌙 At night', '🌸 In spring'], answer: 2 },
    ],
  },
  {
    id: 'cried-wolf', title: 'The Boy Who Cried Wolf', label: I18n.t('books.theBoyWhoCriedWolf'), cover: '🐑', coverImage: 'img/books/cried-wolf/page-05.webp', color: '#c8f0a0',
    pages: [
      { text: 'A boy looked after the sheep on a hill.', pic: '🧒🐑⛰️', image: 'img/books/cried-wolf/page-01.webp', imageAlt: I18n.t('books.wolfArt1') },
      { text: 'He was bored. So he shouted, "Wolf! Wolf!"', pic: '🧒📢', image: 'img/books/cried-wolf/page-02.webp', imageAlt: I18n.t('books.wolfArt2') },
      { text: 'The people ran up the hill to help. But there was no wolf!', pic: '🏃🏃⛰️', image: 'img/books/cried-wolf/page-03.webp', imageAlt: I18n.t('books.wolfArt3') },
      { text: 'The boy laughed. He did it again the next day.', pic: '🧒😆', image: 'img/books/cried-wolf/page-04.webp', imageAlt: I18n.t('books.wolfArt4') },
      { text: 'Then one day, a real wolf came!', pic: '🐺🐑', image: 'img/books/cried-wolf/page-05.webp', imageAlt: I18n.t('books.wolfArt5') },
      { text: '"Wolf! Wolf!" the boy shouted. But nobody came.', pic: '🧒📢🐺', image: 'img/books/cried-wolf/page-06.webp', imageAlt: I18n.t('books.wolfArt6') },
      { text: 'They thought he was telling a lie again.', pic: '🙉', image: 'img/books/cried-wolf/page-07.webp', imageAlt: I18n.t('books.wolfArt7') },
      { text: 'Always tell the truth, and people will believe you.', pic: '💬✨', image: 'img/books/cried-wolf/page-08.webp', imageAlt: I18n.t('books.wolfArt8') },
    ],
    quiz: [
      { q: 'What did the boy look after?', options: ['🐄 Cows', '🐑 Sheep', '🐔 Chickens'], answer: 1 },
      { q: 'What did the boy shout?', options: ['🐺 Wolf!', '🔥 Fire!', '🐍 Snake!'], answer: 0 },
      { q: 'Did the people come when the real wolf came?', options: ['✅ Yes, they all came', '👑 Only the king came', '❌ No, nobody came'], answer: 2 },
    ],
  },
  {
    id: 'ant-grasshopper', title: 'The Ant and the Grasshopper', label: I18n.t('books.theAntAndTheGrasshopper'), cover: '🐜', coverImage: 'img/books/ant-grasshopper/page-07.webp', color: '#ffe27a',
    pages: [
      { text: 'It was a hot summer day.', pic: '☀️🌻', image: 'img/books/ant-grasshopper/page-01.webp', imageAlt: I18n.t('books.antArt1') },
      { text: 'The ant worked hard. She carried food to her home.', pic: '🐜🌽', image: 'img/books/ant-grasshopper/page-02.webp', imageAlt: I18n.t('books.antArt2') },
      { text: 'The grasshopper sang and played all day.', pic: '🦗🎻', image: 'img/books/ant-grasshopper/page-03.webp', imageAlt: I18n.t('books.antArt3') },
      { text: '"Come and play!" said the grasshopper. "I must save food for winter," said the ant.', pic: '🦗🐜', image: 'img/books/ant-grasshopper/page-04.webp', imageAlt: I18n.t('books.antArt4') },
      { text: 'Then winter came. It was very cold.', pic: '❄️🌨️', image: 'img/books/ant-grasshopper/page-05.webp', imageAlt: I18n.t('books.antArt5') },
      { text: 'The ant had lots of food. The grasshopper had nothing to eat.', pic: '🐜🍞🦗', image: 'img/books/ant-grasshopper/page-06.webp', imageAlt: I18n.t('books.antArt6') },
      { text: 'The kind ant shared her food.', pic: '🐜🤝🦗', image: 'img/books/ant-grasshopper/page-07.webp', imageAlt: I18n.t('books.antArt7') },
      { text: '"Next summer, I will work too," said the grasshopper.', pic: '🦗💡', image: 'img/books/ant-grasshopper/page-08.webp', imageAlt: I18n.t('books.antArt8') },
    ],
    quiz: [
      { q: 'Who worked hard all summer?', options: ['🦗 The grasshopper', '🦋 The butterfly', '🐜 The ant'], answer: 2 },
      { q: 'What did the grasshopper do all summer?', options: ['🎵 He sang and played', '🧹 He cleaned', '🌽 He saved food'], answer: 0 },
      { q: 'What did the kind ant do in winter?', options: ['🏃 She ran away', '🤝 She shared her food', '🎻 She played music'], answer: 1 },
    ],
  },
  {
    id: 'gingerbread', title: 'The Gingerbread Man', label: I18n.t('books.theGingerbreadMan'), cover: '🍪', coverImage: 'img/books/gingerbread/page-02.webp', color: '#e8b07a',
    pages: [
      { text: 'An old woman baked a gingerbread man.', pic: '👵🍪', image: 'img/books/gingerbread/page-01.webp', imageAlt: I18n.t('books.gingerbreadArt1') },
      { text: 'She opened the oven, and he jumped out! "Run, run, as fast as you can!" he sang.', pic: '🍪💨', image: 'img/books/gingerbread/page-02.webp', imageAlt: I18n.t('books.gingerbreadArt2') },
      { text: 'The old woman ran after him. She could not catch him.', pic: '👵🍪', image: 'img/books/gingerbread/page-03.webp', imageAlt: I18n.t('books.gingerbreadArt3') },
      { text: 'A cow and a horse ran after him too. They could not catch him!', pic: '🐄🐎🍪', image: 'img/books/gingerbread/page-04.webp', imageAlt: I18n.t('books.gingerbreadArt4') },
      { text: 'Then he came to a river. He could not swim.', pic: '🍪🌊', image: 'img/books/gingerbread/page-05.webp', imageAlt: I18n.t('books.gingerbreadArt5') },
      { text: '"Jump on my tail," said a fox. "I will take you across."', pic: '🦊🌊', image: 'img/books/gingerbread/page-06.webp', imageAlt: I18n.t('books.gingerbreadArt6') },
      { text: 'The fox swam out, and the gingerbread man climbed onto his nose.', pic: '🦊🍪', image: 'img/books/gingerbread/page-07.webp', imageAlt: I18n.t('books.gingerbreadArt7') },
      { text: 'Snap! The fox ate him up.', pic: '🦊😋', image: 'img/books/gingerbread/page-08.webp', imageAlt: I18n.t('books.gingerbreadArt8') },
    ],
    quiz: [
      { q: 'Where did the gingerbread man jump out from?', options: ['📦 A box', '🔥 The oven', '🎒 A bag'], answer: 1 },
      { q: 'Why did he need help at the river?', options: ['🌊 He could not swim', '😴 He was sleepy', '🌧️ It was raining'], answer: 0 },
      { q: 'Who ate the gingerbread man?', options: ['🐄 The cow', '👵 The old woman', '🦊 The fox'], answer: 2 },
    ],
  },
  {
    id: 'town-country-mouse', title: 'The Town Mouse and the Country Mouse', label: I18n.t('books.theTownMouseAndTheCountry'), cover: '🐭', coverImage: 'img/books/town-country-mouse/page-02.webp', color: '#d8c4f0',
    pages: [
      { text: 'Country Mouse lived in a quiet field.', pic: '🐭🌾', image: 'img/books/town-country-mouse/page-01.webp', imageAlt: I18n.t('books.mouseArt1') },
      { text: 'One day, Town Mouse came to visit. They ate corn and seeds.', pic: '🐭🌽🐭', image: 'img/books/town-country-mouse/page-02.webp', imageAlt: I18n.t('books.mouseArt2') },
      { text: '"Come to the town with me," said Town Mouse. "We have cake and cheese!"', pic: '🏙️🧀', image: 'img/books/town-country-mouse/page-03.webp', imageAlt: I18n.t('books.mouseArt3') },
      { text: 'The town house was very big. The food was yummy!', pic: '🍰🧀', image: 'img/books/town-country-mouse/page-04.webp', imageAlt: I18n.t('books.mouseArt4') },
      { text: 'Then a big cat jumped out! The mice ran and hid.', pic: '🐱🐭💨', image: 'img/books/town-country-mouse/page-05.webp', imageAlt: I18n.t('books.mouseArt5') },
      { text: '"The town is too scary for me," said Country Mouse.', pic: '🐭😨', image: 'img/books/town-country-mouse/page-06.webp', imageAlt: I18n.t('books.mouseArt6') },
      { text: 'He went home to his quiet field.', pic: '🐭🏡', image: 'img/books/town-country-mouse/page-07.webp', imageAlt: I18n.t('books.mouseArt7') },
      { text: 'A safe little home is the best home of all.', pic: '🌾💖', image: 'img/books/town-country-mouse/page-08.webp', imageAlt: I18n.t('books.mouseArt8') },
    ],
    quiz: [
      { q: 'What scared the mice?', options: ['🐶 A dog', '🐱 A cat', '🐍 A snake'], answer: 1 },
      { q: 'Where did Country Mouse live?', options: ['🌾 In a quiet field', '🏙️ In a big town', '🌊 In the sea'], answer: 0 },
      { q: 'What did Country Mouse do at the end?', options: ['🍰 He ate more cake', '🐱 He played with the cat', '🏡 He went home'], answer: 2 },
    ],
  },
];

// Longer traditional tales, retold for readers aged 6–7. Dialogue uses straight
// quotation marks so bookSentences keeps each spoken line together.
BOOKS.push(
  {
    id: "crow-pitcher", title: "The Crow and the Pitcher", label: I18n.t('books.theCrowAndThePitcher'), cover: "🐦", coverImage: 'img/books/crow-pitcher/page-09.webp', color: '#dba863',
    readingAge: '6–7', source: 'https://www.gutenberg.org/ebooks/53103',
    pages: [
      { text: "On a hot summer day, a thirsty crow flew over the fields. He was looking for water.", pic: "🐦", image: 'img/books/crow-pitcher/page-01.webp', imageAlt: I18n.t('books.crowpitcherArt1') },
      { text: "At last, he spotted a pitcher beside a tree. He landed next to it and looked inside.", pic: "🐦", image: 'img/books/crow-pitcher/page-02.webp', imageAlt: I18n.t('books.crowpitcherArt2') },
      { text: "There was a little water at the bottom. The crow felt hopeful and pushed his beak into the pitcher.", pic: "🐦", image: 'img/books/crow-pitcher/page-03.webp', imageAlt: I18n.t('books.crowpitcherArt3') },
      { text: "But the water was too far down. He stretched his neck, but he still could not reach it.", pic: "🐦", image: 'img/books/crow-pitcher/page-04.webp', imageAlt: I18n.t('books.crowpitcherArt4') },
      { text: "He tried to tip the pitcher over. It was too heavy, and it would not move.", pic: "🐦", image: 'img/books/crow-pitcher/page-05.webp', imageAlt: I18n.t('books.crowpitcherArt5') },
      { text: "The tired crow stopped to think. Then he noticed some small stones lying on the ground.", pic: "🐦", image: 'img/books/crow-pitcher/page-06.webp', imageAlt: I18n.t('books.crowpitcherArt6') },
      { text: "He picked up a stone and dropped it into the pitcher. Plop! The water rose a little.", pic: "🐦", image: 'img/books/crow-pitcher/page-07.webp', imageAlt: I18n.t('books.crowpitcherArt7') },
      { text: "The crow dropped in another stone, then another. With each stone, the water rose higher.", pic: "🐦", image: 'img/books/crow-pitcher/page-08.webp', imageAlt: I18n.t('books.crowpitcherArt8') },
      { text: "At last, the water was close enough to reach. The crow dipped his beak in and took a long drink.", pic: "🐦", image: 'img/books/crow-pitcher/page-09.webp', imageAlt: I18n.t('books.crowpitcherArt9') },
      { text: "Feeling cool and happy, he spread his wings. He had solved the problem by stopping to think and trying something new.", pic: "🐦", image: 'img/books/crow-pitcher/page-10.webp', imageAlt: I18n.t('books.crowpitcherArt10') },
    ],
    quiz: [
      { q: "Why could the crow not drink at first?", options: ["💧 The water was too far down","❄️ The water was frozen","🏺 The pitcher was empty"], answer: 0 },
      { q: "What did the crow put into the pitcher?", options: ["🍃 Leaves","🪨 Small stones","🌸 Flowers"], answer: 1 },
      { q: "What happened when the crow added stones?", options: ["💨 The pitcher blew away","🧊 The water froze","💧 The water rose higher"], answer: 2 },
    ],
  },
  {
    id: "wind-sun", title: "The North Wind and the Sun", label: I18n.t('books.theNorthWindAndTheSun'), cover: "☀️", coverImage: 'img/books/wind-sun/page-09.webp', color: '#efbd58',
    readingAge: '6–7', source: 'https://www.gutenberg.org/ebooks/53103',
    pages: [
      { text: "One day, the North Wind and the Sun began to argue. Each thought he was stronger than the other.", pic: "☀️", image: 'img/books/wind-sun/page-01.webp', imageAlt: I18n.t('books.windsunArt1') },
      { text: "Below them, a traveller walked along a road. He wore a thick coat to keep himself warm.", pic: "☀️", image: 'img/books/wind-sun/page-02.webp', imageAlt: I18n.t('books.windsunArt2') },
      { text: "\"Let's have a contest,\" said the Wind. \"Who can make that man take off his coat?\"", pic: "☀️", image: 'img/books/wind-sun/page-03.webp', imageAlt: I18n.t('books.windsunArt3') },
      { text: "The Wind went first and blew a cold gust. The traveller shivered and pulled his coat tightly around him.", pic: "☀️", image: 'img/books/wind-sun/page-04.webp', imageAlt: I18n.t('books.windsunArt4') },
      { text: "The Wind blew harder, shaking the trees. But the traveller held his coat even tighter.", pic: "☀️", image: 'img/books/wind-sun/page-05.webp', imageAlt: I18n.t('books.windsunArt5') },
      { text: "At last, the Wind grew tired and stopped. \"Now it's my turn,\" said the Sun quietly.", pic: "☀️", image: 'img/books/wind-sun/page-06.webp', imageAlt: I18n.t('books.windsunArt6') },
      { text: "The Sun came out from behind a cloud. His warm light fell gently on the road.", pic: "☀️", image: 'img/books/wind-sun/page-07.webp', imageAlt: I18n.t('books.windsunArt7') },
      { text: "Soon, the traveller stopped shivering and opened his coat. \"What a lovely day,\" he said.", pic: "☀️", image: 'img/books/wind-sun/page-08.webp', imageAlt: I18n.t('books.windsunArt8') },
      { text: "As the air grew warmer, he took off his coat. Then he sat beneath a tree to rest.", pic: "☀️", image: 'img/books/wind-sun/page-09.webp', imageAlt: I18n.t('books.windsunArt9') },
      { text: "The Wind stared in surprise. The Sun smiled. \"You see? Being gentle can work better than pushing harder.\"", pic: "☀️", image: 'img/books/wind-sun/page-10.webp', imageAlt: I18n.t('books.windsunArt10') },
    ],
    quiz: [
      { q: "What did the traveller do when the Wind blew harder?", options: ["🧥 He took off his coat","🧥 He held his coat tighter","🏊 He went swimming"], answer: 1 },
      { q: "Who made the traveller take off his coat?", options: ["☀️ The Sun","💨 The North Wind","🌧️ The rain"], answer: 0 },
      { q: "Where did the traveller sit down to rest?", options: ["🏰 In a castle","🌉 On a bridge","🌳 Beneath a tree"], answer: 2 },
    ],
  },
  {
    id: "three-goats", title: "The Three Billy Goats Gruff", label: I18n.t('books.theThreeBillyGoatsGruff'), cover: "🐐", coverImage: 'img/books/three-goats/page-12.webp', color: '#9bbf9f',
    readingAge: '6–7', source: 'https://www.gutenberg.org/ebooks/30973',
    pages: [
      { text: "Three goat brothers lived beside a river. There was hardly any grass left for them to eat.", pic: "🐐", image: 'img/books/three-goats/page-01.webp', imageAlt: I18n.t('books.threegoatsArt1') },
      { text: "Across the river, a hillside was covered in fresh green grass. To reach it, they had to cross a wooden bridge.", pic: "🐐", image: 'img/books/three-goats/page-02.webp', imageAlt: I18n.t('books.threegoatsArt2') },
      { text: "But a hungry troll lived under the bridge. He did not want anyone crossing above his head.", pic: "🐐", image: 'img/books/three-goats/page-03.webp', imageAlt: I18n.t('books.threegoatsArt3') },
      { text: "The smallest goat stepped onto the bridge. Trip, trap! His little hooves tapped against the wood.", pic: "🐐", image: 'img/books/three-goats/page-04.webp', imageAlt: I18n.t('books.threegoatsArt4') },
      { text: "\"Who is crossing my bridge?\" roared the troll. The little goat trembled. \"Please let me pass. My bigger brother is coming.\"", pic: "🐐", image: 'img/books/three-goats/page-05.webp', imageAlt: I18n.t('books.threegoatsArt5') },
      { text: "The troll wanted a bigger meal, so he let the little goat go. Soon, the middle brother stepped onto the bridge.", pic: "🐐", image: 'img/books/three-goats/page-06.webp', imageAlt: I18n.t('books.threegoatsArt6') },
      { text: "Trip, trap! \"I'm going to eat you!\" shouted the troll. \"Wait for my brother,\" said the goat. \"He is bigger than me.\"", pic: "🐐", image: 'img/books/three-goats/page-07.webp', imageAlt: I18n.t('books.threegoatsArt7') },
      { text: "The greedy troll let him pass too. Then the biggest brother stepped onto the bridge. TRIP, TRAP!", pic: "🐐", image: 'img/books/three-goats/page-08.webp', imageAlt: I18n.t('books.threegoatsArt8') },
      { text: "The troll jumped up and blocked the way. \"At last! You will make a fine meal,\" he growled.", pic: "🐐", image: 'img/books/three-goats/page-09.webp', imageAlt: I18n.t('books.threegoatsArt9') },
      { text: "The big goat stood firm and lowered his horns. \"You will not frighten my brothers again!\" he said.", pic: "🐐", image: 'img/books/three-goats/page-10.webp', imageAlt: I18n.t('books.threegoatsArt10') },
      { text: "The troll rushed forward, but the goat pushed him off the bridge. Splash! The troll landed in the river and swam away.", pic: "🐐", image: 'img/books/three-goats/page-11.webp', imageAlt: I18n.t('books.threegoatsArt11') },
      { text: "The big goat crossed safely and joined his brothers. Together, they ate the sweet green grass, with no troll to trouble them.", pic: "🐐", image: 'img/books/three-goats/page-12.webp', imageAlt: I18n.t('books.threegoatsArt12') },
    ],
    quiz: [
      { q: "Why did the goats want to cross the bridge?", options: ["🌱 To eat fresh green grass","🛏️ To find a bed","🧸 To buy a toy"], answer: 0 },
      { q: "Where did the troll live?", options: ["🌳 In a tree","🌉 Under the bridge","🏰 In a castle"], answer: 1 },
      { q: "Which goat pushed the troll off the bridge?", options: ["🐐 The smallest goat","🐐 The middle goat","🐐 The biggest goat"], answer: 2 },
    ],
  },
  {
    id: "elves-shoemaker", title: "The Elves and the Shoemaker", label: I18n.t('books.theElvesAndTheShoemaker'), cover: "👞", coverImage: 'img/books/elves-shoemaker/page-11.webp', color: '#c89f7e',
    readingAge: '6–7', source: 'https://www.gutenberg.org/ebooks/2591',
    pages: [
      { text: "A shoemaker and his wife had very little money. He worked hard, but they could hardly buy food.", pic: "👞", image: 'img/books/elves-shoemaker/page-01.webp', imageAlt: I18n.t('books.elvesshoemakerArt1') },
      { text: "One evening, he cut his last piece of leather. It was just enough to make one pair of shoes.", pic: "👞", image: 'img/books/elves-shoemaker/page-02.webp', imageAlt: I18n.t('books.elvesshoemakerArt2') },
      { text: "In the morning, two beautiful shoes stood on his table. \"Who made these?\" he asked in surprise.", pic: "👞", image: 'img/books/elves-shoemaker/page-03.webp', imageAlt: I18n.t('books.elvesshoemakerArt3') },
      { text: "A customer loved the shoes and bought them. Now the shoemaker could buy leather for two more pairs.", pic: "👞", image: 'img/books/elves-shoemaker/page-04.webp', imageAlt: I18n.t('books.elvesshoemakerArt4') },
      { text: "That night, he cut the new leather and went to bed. By morning, both pairs were finished!", pic: "👞", image: 'img/books/elves-shoemaker/page-05.webp', imageAlt: I18n.t('books.elvesshoemakerArt5') },
      { text: "Soon, more customers came to his shop. Each night, someone made the shoes while the shoemaker slept.", pic: "👞", image: 'img/books/elves-shoemaker/page-06.webp', imageAlt: I18n.t('books.elvesshoemakerArt6') },
      { text: "\"We must find our helpers,\" said his wife. That night, they hid behind a curtain and waited.", pic: "👞", image: 'img/books/elves-shoemaker/page-07.webp', imageAlt: I18n.t('books.elvesshoemakerArt7') },
      { text: "At midnight, two tiny elves hurried inside. They stitched and tapped until every shoe was ready.", pic: "👞", image: 'img/books/elves-shoemaker/page-08.webp', imageAlt: I18n.t('books.elvesshoemakerArt8') },
      { text: "The elves wore thin, torn clothes. \"They have helped us so much,\" whispered his wife. \"Let's help them too.\"", pic: "👞", image: 'img/books/elves-shoemaker/page-09.webp', imageAlt: I18n.t('books.elvesshoemakerArt9') },
      { text: "She made tiny coats and trousers, and he made tiny shoes. They left the gifts on the table.", pic: "👞", image: 'img/books/elves-shoemaker/page-10.webp', imageAlt: I18n.t('books.elvesshoemakerArt10') },
      { text: "The elves found the gifts and gasped with delight. They put everything on and danced around the room.", pic: "👞", image: 'img/books/elves-shoemaker/page-11.webp', imageAlt: I18n.t('books.elvesshoemakerArt11') },
      { text: "The happy elves danced away into the night. The shoemaker kept working, and the couple always remembered their little friends.", pic: "👞", image: 'img/books/elves-shoemaker/page-12.webp', imageAlt: I18n.t('books.elvesshoemakerArt12') },
    ],
    quiz: [
      { q: "Who secretly made the shoes at night?", options: ["🐈 Two cats","🧚 Two tiny elves","👑 A king"], answer: 1 },
      { q: "Where did the couple hide to watch their helpers?", options: ["🪟 Behind a curtain","🌳 Behind a tree","🛏️ Under a bed"], answer: 0 },
      { q: "What did the couple make for the elves?", options: ["🍰 A cake","🏠 A new house","👞 Tiny clothes and shoes"], answer: 2 },
    ],
  },
  {
    id: "jack-beanstalk", title: "Jack and the Beanstalk", label: I18n.t('books.jackAndTheBeanstalk'), cover: "🌱", coverImage: 'img/books/jack-beanstalk/page-04.webp', color: '#79ba9c',
    readingAge: '6–7', source: 'https://www.gutenberg.org/ebooks/7439',
    pages: [
      { text: "Jack and his mother were very poor. When their cow stopped giving milk, Mother sent Jack to sell her at the market.", pic: "🌱", image: 'img/books/jack-beanstalk/page-01.webp', imageAlt: I18n.t('books.jackbeanstalkArt1') },
      { text: "On the way, Jack met a man with five beans. \"These are magic,\" said the man. Jack traded the cow for them.", pic: "🌱", image: 'img/books/jack-beanstalk/page-02.webp', imageAlt: I18n.t('books.jackbeanstalkArt2') },
      { text: "Mother was upset when Jack came home without any money. \"How will we buy food?\" she cried, throwing the beans out of the window.", pic: "🌱", image: 'img/books/jack-beanstalk/page-03.webp', imageAlt: I18n.t('books.jackbeanstalkArt3') },
      { text: "By morning, a huge beanstalk had grown outside. It reached above the clouds! Curious and excited, Jack began to climb.", pic: "🌱", image: 'img/books/jack-beanstalk/page-04.webp', imageAlt: I18n.t('books.jackbeanstalkArt4') },
      { text: "At the top, he found a giant's house. The giant's wife gave him bread, then hid him when her husband came home.", pic: "🌱", image: 'img/books/jack-beanstalk/page-05.webp', imageAlt: I18n.t('books.jackbeanstalkArt5') },
      { text: "The giant counted his gold and fell asleep. Jack crept out, took a bag of coins, and hurried down the beanstalk.", pic: "🌱", image: 'img/books/jack-beanstalk/page-06.webp', imageAlt: I18n.t('books.jackbeanstalkArt6') },
      { text: "Some time later, Jack climbed up again. This time, he found a hen that laid golden eggs. While the giant slept, Jack carried her home.", pic: "🌱", image: 'img/books/jack-beanstalk/page-07.webp', imageAlt: I18n.t('books.jackbeanstalkArt7') },
      { text: "On his third visit, Jack saw a golden harp. It played beautiful music all by itself, and the giant soon fell asleep.", pic: "🌱", image: 'img/books/jack-beanstalk/page-08.webp', imageAlt: I18n.t('books.jackbeanstalkArt8') },
      { text: "Jack picked up the harp and ran towards the door. \"Master! Master!\" cried the harp. The giant woke with an angry roar.", pic: "🌱", image: 'img/books/jack-beanstalk/page-09.webp', imageAlt: I18n.t('books.jackbeanstalkArt9') },
      { text: "Terrified, Jack raced to the beanstalk and climbed down. The giant followed, making the whole stalk shake beneath his weight.", pic: "🌱", image: 'img/books/jack-beanstalk/page-10.webp', imageAlt: I18n.t('books.jackbeanstalkArt10') },
      { text: "\"Mother, bring an axe!\" Jack shouted. He jumped to the ground and chopped the beanstalk. With a great crash, it fell.", pic: "🌱", image: 'img/books/jack-beanstalk/page-11.webp', imageAlt: I18n.t('books.jackbeanstalkArt11') },
      { text: "The giant never came back. Jack hugged his mother, glad to be safe. With the hen's golden eggs, they never went hungry again.", pic: "🌱", image: 'img/books/jack-beanstalk/page-12.webp', imageAlt: I18n.t('books.jackbeanstalkArt12') },
    ],
    quiz: [
      { q: "What did Jack get in exchange for the cow?", options: ["🌱 Five magic beans","🪙 A bag of coins","🍞 A loaf of bread"], answer: 0 },
      { q: "What did the hen lay?", options: ["🪨 Small stones","🥚 Golden eggs","🌱 Magic beans"], answer: 1 },
      { q: "What woke the giant on Jack's third visit?", options: ["🐄 The cow mooed","🌧️ Thunder","🎵 The harp cried out"], answer: 2 },
    ],
  },
);

// More short tales for listening, told like the first ten: one or two short
// sentences a page. They have no illustrations yet, so each page shows its
// emoji picture; the art prompts wait in img/books/<id>/artwork.json.
BOOKS.push(
  {
    id: 'fox-grapes', title: 'The Fox and the Grapes', label: I18n.t('books.theFoxAndTheGrapes'), cover: '🦊', color: '#c9a7e8',
    source: 'https://www.gutenberg.org/ebooks/53103',
    pages: [
      { text: 'A hungry fox walked into a garden.', pic: '🦊🌿' },
      { text: 'He saw big purple grapes, high up on a vine.', pic: '🍇⬆️' },
      { text: '"Yum! Those grapes look so sweet," said the fox.', pic: '🦊🍇' },
      { text: 'He jumped, but he could not reach them.', pic: '🦊⬆️' },
      { text: 'He jumped higher. He still could not reach them!', pic: '🦊💨' },
      { text: 'He tried again and again. Jump, jump, jump!', pic: '🦊💦' },
      { text: 'At last, he gave up and walked away.', pic: '🦊🚶' },
      { text: '"Those grapes are sour anyway," he said. But he still wanted them!', pic: '🦊😤🍇' },
    ],
    quiz: [
      { q: 'What did the fox want to eat?', options: ['🍇 Grapes', '🍎 Apples', '🧀 Cheese'], answer: 0 },
      { q: 'Why could the fox not eat them?', options: ['🐝 Bees were there', '⬆️ They were too high', '🌧️ It was raining'], answer: 1 },
      { q: 'What did the fox say at the end?', options: ['😋 They are yummy', '🎁 They are a present', '🍋 They are sour'], answer: 2 },
    ],
  },
  {
    id: 'dog-bone', title: 'The Dog and His Bone', label: I18n.t('books.theDogAndHisBone'), cover: '🦴', color: '#b8d8f0',
    source: 'https://www.gutenberg.org/ebooks/53103',
    pages: [
      { text: 'A dog found a big, juicy bone.', pic: '🐶🦴' },
      { text: 'He carried it home in his mouth. On the way, he crossed a little bridge.', pic: '🐶🌉' },
      { text: 'He looked down into the water. He saw another dog with a bone!', pic: '🐶💧🐶' },
      { text: '"That bone is bigger than mine," he thought. "I want it too!"', pic: '🐶🤔' },
      { text: 'He opened his mouth and barked at the other dog. Woof!', pic: '🐶💬' },
      { text: 'Splash! His own bone fell into the water.', pic: '🦴💦' },
      { text: 'The other dog was only his own picture in the water.', pic: '🪞🐶' },
      { text: 'Now he had no bone at all. Wanting too much can make you lose what you have.', pic: '🐶😢' },
    ],
    quiz: [
      { q: 'What did the dog find?', options: ['⚽ A ball', '🦴 A bone', '🧦 A sock'], answer: 1 },
      { q: 'What did the dog see in the water?', options: ['🐶 Another dog with a bone', '🐟 A big fish', '🐸 A green frog'], answer: 0 },
      { q: 'What happened when he barked?', options: ['🦴 He got two bones', '😴 He fell asleep', '💦 His bone fell into the water'], answer: 2 },
    ],
  },
  {
    id: 'princess-pea', title: 'The Princess and the Pea', label: I18n.t('books.thePrincessAndThePea'), cover: '👑', color: '#f7c6e0',
    source: 'https://www.gutenberg.org/ebooks/1597',
    pages: [
      { text: 'A prince wanted to marry a real princess.', pic: '🤴👑' },
      { text: 'He looked all over the world, but he could not find one.', pic: '🤴🌍' },
      { text: 'One stormy night, someone knocked at the castle door.', pic: '🌧️🏰🚪' },
      { text: 'It was a girl, all wet from the rain. "I am a real princess," she said.', pic: '👸💧' },
      { text: 'The queen put one tiny pea on a bed. Then she piled twenty soft mattresses on top!', pic: '🟢🛏️' },
      { text: 'The princess climbed up and slept on the tall, tall bed.', pic: '👸🛏️' },
      { text: 'In the morning, she said, "I could not sleep at all! Something hard was in my bed."', pic: '👸😫' },
      { text: 'Only a real princess could feel a tiny pea! The prince and the princess were very happy.', pic: '🤴💖👸' },
    ],
    quiz: [
      { q: 'What did the queen put under the mattresses?', options: ['🪨 A big rock', '🧸 A teddy bear', '🟢 A tiny pea'], answer: 2 },
      { q: 'How many mattresses were on the bed?', options: ['🛏️ Two', '🛏️ Twenty', '🛏️ One hundred'], answer: 1 },
      { q: 'How did the princess sleep?', options: ['😫 She could not sleep', '😴 She slept very well', '🌙 She slept on the floor'], answer: 0 },
    ],
  },
  {
    id: 'big-turnip', title: 'The Enormous Turnip', label: I18n.t('books.theEnormousTurnip'), cover: '🌱', color: '#d6e9a8',
    pages: [
      { text: 'An old man planted a little turnip seed.', pic: '👴🌱' },
      { text: 'The turnip grew big. Then it grew bigger and bigger!', pic: '🌱⬆️' },
      { text: '"Time to pull it up!" said the old man. He pulled and pulled, but it did not come up.', pic: '👴💪' },
      { text: 'The old woman came to help. They pulled and pulled, but it did not come up.', pic: '👵👴' },
      { text: 'A little girl came to help. They pulled and pulled, but it did not come up!', pic: '👧👵👴' },
      { text: 'A dog and a cat came to help. They pulled and pulled. It still did not come up!', pic: '🐶🐱' },
      { text: 'Then a tiny mouse came to help. They all pulled together.', pic: '🐭💪' },
      { text: 'Pop! Out came the enormous turnip! Everyone fell down and laughed.', pic: '🎉😂' },
    ],
    quiz: [
      { q: 'Who planted the turnip?', options: ['👴 An old man', '👧 A little girl', '🐶 A dog'], answer: 0 },
      { q: 'Who came to help last?', options: ['🐱 A cat', '👵 An old woman', '🐭 A tiny mouse'], answer: 2 },
      { q: 'How did they get the turnip out?', options: ['🔨 With a hammer', '💪 They all pulled together', '💧 They gave it water'], answer: 1 },
    ],
  },
  {
    id: 'stone-soup', title: 'Stone Soup', label: I18n.t('books.stoneSoup'), cover: '🍲', color: '#f0c987',
    pages: [
      { text: 'A tired traveller came to a little village. He was very hungry.', pic: '🚶🏘️' },
      { text: '"Sorry, we have no food to share," said the people.', pic: '🏘️🙅' },
      { text: '"That\'s all right," he said. "I will make stone soup!"', pic: '🪨🍲' },
      { text: 'He put a big pot of water on the fire. Then he dropped in a stone.', pic: '🍲🔥🪨' },
      { text: '"Stone soup is even better with a carrot," he said. A girl ran home and brought one.', pic: '👧🥕' },
      { text: 'A boy brought potatoes. A farmer brought onions. A grandma brought salt.', pic: '🥔🧅🧂' },
      { text: 'Soon the pot was full of good things. It smelled delicious!', pic: '🍲😋' },
      { text: 'Everyone ate the soup together. When we all share, there is plenty for everyone!', pic: '🥣😊' },
    ],
    quiz: [
      { q: 'What did the traveller put in the pot first?', options: ['🥕 A carrot', '🪨 A stone', '🧂 Salt'], answer: 1 },
      { q: 'What did the girl bring?', options: ['🥕 A carrot', '🧅 An onion', '🍞 Some bread'], answer: 0 },
      { q: 'Why was there plenty of soup?', options: ['🪄 The stone was magic', '🛒 He went to a shop', '🤝 Everyone shared'], answer: 2 },
    ],
  },
  {
    id: 'porridge-pot', title: 'The Magic Porridge Pot', label: I18n.t('books.theMagicPorridgePot'), cover: '🥣', color: '#ffdca8',
    source: 'https://www.gutenberg.org/ebooks/2591',
    pages: [
      { text: 'A little girl and her mother had no food to eat.', pic: '👧👩' },
      { text: 'In the woods, a kind old woman gave the girl a little pot.', pic: '👵🍲' },
      { text: '"Say, \'Cook, little pot, cook!\' and it will make porridge," said the old woman.', pic: '🍲✨' },
      { text: '"Say, \'Stop, little pot!\' and it will stop."', pic: '🍲✋' },
      { text: 'At home, the pot made sweet, yummy porridge. Now they were never hungry.', pic: '🥣😋' },
      { text: 'One day, the girl went out. Her mother said, "Cook, little pot, cook!"', pic: '👩🍲' },
      { text: 'The pot cooked and cooked. But Mother forgot the words to make it stop!', pic: '👩😮' },
      { text: 'Porridge filled the kitchen. It filled the house. It ran out into the street!', pic: '🏠🥣🌊' },
      { text: 'The girl came home and said, "Stop, little pot!" It stopped at last. Everyone had porridge for a week!', pic: '👧✋🥣' },
    ],
    quiz: [
      { q: 'What did the little pot make?', options: ['🍕 Pizza', '🍦 Ice cream', '🥣 Porridge'], answer: 2 },
      { q: 'What did Mother forget?', options: ['🗣️ The words to make it stop', '🔑 Her keys', '🥄 Her spoon'], answer: 0 },
      { q: 'Who stopped the pot?', options: ['👵 The old woman', '👧 The little girl', '🐱 The cat'], answer: 1 },
    ],
  },
  {
    id: 'town-musicians', title: 'The Town Musicians', label: I18n.t('books.theTownMusicians'), cover: '🎺', color: '#a8d8c8',
    source: 'https://www.gutenberg.org/ebooks/2591',
    pages: [
      { text: 'An old donkey wanted to play music. He set off for the town.', pic: '🐴🎵' },
      { text: 'On the road, he met a tired dog, a sad cat and a noisy rooster.', pic: '🐶🐱🐓' },
      { text: '"Come with me!" said the donkey. "We can make music together."', pic: '🐴🐶🐱🐓' },
      { text: 'At night, they saw a little house in the woods. Robbers were inside, eating a big dinner.', pic: '🏠🍗' },
      { text: 'The animals made a plan. The dog stood on the donkey, the cat stood on the dog, and the rooster stood on top!', pic: '🐓🐱🐶🐴' },
      { text: 'Then they all sang at once. Hee-haw! Woof! Meow! Cock-a-doodle-doo!', pic: '🎶📢' },
      { text: 'The robbers were so scared that they ran far away into the woods.', pic: '🏃💨🌲' },
      { text: 'The four friends ate the dinner. They made music in their cosy house every day.', pic: '🏠🎵💖' },
    ],
    quiz: [
      { q: 'How many animal friends were there?', options: ['🐾 Three', '🐾 Four', '🐾 Five'], answer: 1 },
      { q: 'Who stood on the very top?', options: ['🐓 The rooster', '🐴 The donkey', '🐶 The dog'], answer: 0 },
      { q: 'Why did the robbers run away?', options: ['🌧️ It started to rain', '🍗 Their dinner was gone', '📢 The loud song scared them'], answer: 2 },
    ],
  },
  {
    id: 'frog-prince', title: 'The Frog Prince', label: I18n.t('books.theFrogPrince'), cover: '🐸', color: '#9fdc9a',
    source: 'https://www.gutenberg.org/ebooks/2591',
    pages: [
      { text: 'A princess was playing with her golden ball beside a well.', pic: '👸🟡' },
      { text: 'Oops! The ball fell into the deep well. The princess began to cry.', pic: '🟡💧😢' },
      { text: 'A frog popped up. "I will get your ball if you will be my friend," he said.', pic: '🐸💬' },
      { text: '"Yes, yes!" said the princess. The frog dived down and brought back the ball.', pic: '🐸🟡' },
      { text: 'But the princess took the ball and ran home. She forgot all about the frog!', pic: '👸🏃' },
      { text: 'That night, the frog hopped to the castle. "You promised to be my friend," he said.', pic: '🐸🏰' },
      { text: 'The king said, "A promise is a promise." So the princess shared her dinner with the frog.', pic: '🤴🍽️🐸' },
      { text: 'She was kind to him, and pop! The frog turned into a prince. They became the best of friends.', pic: '🐸✨🤴' },
    ],
    quiz: [
      { q: 'What fell into the well?', options: ['👑 A crown', '🟡 A golden ball', '👟 A shoe'], answer: 1 },
      { q: 'What did the princess promise the frog?', options: ['🎂 A cake', '🏰 A castle', '🤝 To be his friend'], answer: 2 },
      { q: 'What happened when the princess was kind?', options: ['🤴 The frog turned into a prince', '🐸 The frog hopped away', '🌧️ It began to rain'], answer: 0 },
    ],
  },
);

// ---- I can read! ---------------------------------------------------------
// Little books she reads herself (their own shelf in the library, above the
// stories): one short sentence per page with a big picture, every word one
// she can sound out at the book's level or one of the few SIGHT_WORDS.
// Tapping a word says it whole ("cat!"). All books are open from the start;
// levels describe phonics difficulty. tools/check-books.js checks every
// word against decodeLevel below.
//   level 1  short a: cat, had      level 3  sh ch th ck ll ss ng: fish, duck
//   level 2  any short vowel: pig   level 4  blends: frog, jump, splash

// Words she learns by heart, said whole when tapped.
const SIGHT_WORDS = ['the', 'a', 'I', 'is', 'to', 'see', 'go', 'no', 'my', 'we', 'said', 'you'];

const DECODABLE_BOOKS = [
  {
    id: 'cat-hat', level: 1, title: 'The Cat', label: I18n.t('books.theCat'), cover: '🐱', coverImage: 'img/books/cat-hat/page-01.webp', color: '#ffd9a0',
    pages: [
      { text: 'A cat sat.', pic: '🐱', image: 'img/books/cat-hat/page-01.webp' },
      { text: 'The cat had a hat.', pic: '🐱🎩', image: 'img/books/cat-hat/page-02.webp' },
      { text: 'The cat had a nap.', pic: '🐱💤', image: 'img/books/cat-hat/page-03.webp' },
      { text: 'A rat ran at the cat.', pic: '🐀💨🐱', image: 'img/books/cat-hat/page-04.webp' },
      { text: 'The rat had the hat!', pic: '🐀🎩', image: 'img/books/cat-hat/page-05.webp' },
    ],
  },
  {
    id: 'i-can', level: 1, title: 'I Can!', label: I18n.t('books.iCan'), cover: '🙌', coverImage: 'img/books/i-can/page-01.webp', color: '#b8eab0',
    pages: [
      { text: 'I can tap.', pic: '👆🥁', image: 'img/books/i-can/page-01.webp' },
      { text: 'I can tag Dad.', pic: '🏃👨', image: 'img/books/i-can/page-02.webp' },
      { text: 'I can pat my cat.', pic: '✋🐱', image: 'img/books/i-can/page-03.webp' },
      { text: 'I can nap.', pic: '😴', image: 'img/books/i-can/page-04.webp' },
    ],
  },
  {
    id: 'big-pig', level: 2, title: 'The Big Pig', label: I18n.t('books.theBigPig'), cover: '🐷', coverImage: 'img/books/big-pig/page-01.webp', color: '#ffc4dc',
    pages: [
      { text: 'A big pig sat in the mud.', pic: '🐷🟫', image: 'img/books/big-pig/page-01.webp' },
      { text: 'The pig had a nap in the sun.', pic: '☀️🐷💤', image: 'img/books/big-pig/page-02.webp' },
      { text: 'A red hen got on the pig.', pic: '🐔🐷', image: 'img/books/big-pig/page-03.webp' },
      { text: 'The pig did not get up.', pic: '🐷😴', image: 'img/books/big-pig/page-04.webp' },
      { text: 'The hen had a nap on the pig!', pic: '🐔💤🐷', image: 'img/books/big-pig/page-05.webp' },
    ],
  },
  {
    id: 'bug-cup', level: 2, title: 'The Bug in the Cup', label: I18n.t('books.theBugInTheCup'), cover: '🐛', coverImage: 'img/books/bug-cup/page-01.webp', color: '#bfe2ff',
    pages: [
      { text: 'A dog sat on a log.', pic: '🐶🪵', image: 'img/books/bug-cup/page-01.webp' },
      { text: 'A bug sat on the dog.', pic: '🐛🐶', image: 'img/books/bug-cup/page-02.webp' },
      { text: 'The dog did a big hop.', pic: '🐶💨', image: 'img/books/bug-cup/page-03.webp' },
      { text: 'The bug hid in a cup.', pic: '🐛🥤', image: 'img/books/bug-cup/page-04.webp' },
      { text: 'The dog can not see the bug!', pic: '🐶❓', image: 'img/books/bug-cup/page-05.webp' },
      { text: 'The bug had fun.', pic: '🐛😄', image: 'img/books/bug-cup/page-06.webp' },
    ],
  },
  {
    id: 'fish-wish', level: 3, title: 'The Fish Wish', label: I18n.t('books.theFishSWish'), cover: '🐟', coverImage: 'img/books/fish-wish/page-01.webp', color: '#a8dcff',
    pages: [
      { text: 'Beth got a fish.', pic: '👧🐟', image: 'img/books/fish-wish/page-01.webp' },
      { text: 'The fish is in a dish.', pic: '🐟🥣', image: 'img/books/fish-wish/page-02.webp' },
      { text: 'The fish had a wish.', pic: '🐟💭🛁', image: 'img/books/fish-wish/page-03.webp' },
      { text: 'Beth got a big tub.', pic: '👧🛁', image: 'img/books/fish-wish/page-04.webp' },
      { text: 'The fish got its wish!', pic: '🐟🛁✨', image: 'img/books/fish-wish/page-05.webp' },
    ],
  },
  {
    id: 'chuck-duck', level: 3, title: 'Chuck the Duck', label: I18n.t('books.chuckTheDuck'), cover: '🦆', coverImage: 'img/books/chuck-duck/page-01.webp', color: '#ffe98a',
    pages: [
      { text: 'Chuck is a duck.', pic: '🦆', image: 'img/books/chuck-duck/page-01.webp' },
      { text: 'Chuck fell in the mud.', pic: '🦆🟫', image: 'img/books/chuck-duck/page-02.webp' },
      { text: 'Chuck had a bath in a tub.', pic: '🦆🛁', image: 'img/books/chuck-duck/page-03.webp' },
      { text: 'Rub, rub, rub!', pic: '🧽🦆', image: 'img/books/chuck-duck/page-04.webp' },
      { text: 'Chuck sat in the sun.', pic: '🦆☀️', image: 'img/books/chuck-duck/page-05.webp' },
    ],
  },
  {
    id: 'frog-jump', level: 4, title: 'Jump, Frog, Jump!', label: I18n.t('books.hopFrog'), cover: '🐸', coverImage: 'img/books/frog-jump/page-01.webp', color: '#a8eb98',
    pages: [
      { text: 'A frog sat on a big rock.', pic: '🐸🪨', image: 'img/books/frog-jump/page-01.webp' },
      { text: 'The frog had a plan.', pic: '🐸💭', image: 'img/books/frog-jump/page-02.webp' },
      { text: 'Jump, frog, jump!', pic: '🐸⬆️', image: 'img/books/frog-jump/page-03.webp' },
      { text: 'The frog fell in the pond with a splash!', pic: '🐸💦', image: 'img/books/frog-jump/page-04.webp' },
      { text: 'The frog can swim fast.', pic: '🐸💨', image: 'img/books/frog-jump/page-05.webp' },
      { text: 'The frog is glad.', pic: '🐸😊', image: 'img/books/frog-jump/page-06.webp' },
    ],
  },
  {
    id: 'best-gift', level: 4, title: 'The Best Gift', label: I18n.t('books.theBestGift'), cover: '🎁', coverImage: 'img/books/best-gift/page-01.webp', color: '#ffbcb0',
    pages: [
      { text: 'Brad got a gift.', pic: '👦🎁', image: 'img/books/best-gift/page-01.webp' },
      { text: 'The gift is in a big red box.', pic: '🎁📦', image: 'img/books/best-gift/page-02.webp' },
      { text: 'Brad lifts the lid.', pic: '👦📦', image: 'img/books/best-gift/page-03.webp' },
      { text: 'It is a drum!', pic: '🥁', image: 'img/books/best-gift/page-04.webp' },
      { text: 'Brad can drum and drum.', pic: '👦🥁', image: 'img/books/best-gift/page-05.webp' },
      { text: 'Mom and Dad clap and clap!', pic: '👩👨👏', image: 'img/books/best-gift/page-06.webp' },
    ],
  },
];

for (const book of DECODABLE_BOOKS) {
  book.pages.forEach((page, i) => {
    page.imageAlt = I18n.t('books.readingPageArt', i + 1, page.text);
  });
}

// What each level can sound out. A word is one short vowel closed by its
// last sounds; letter pairs that say one sound (PART_SOUNDS) come at 3.
const DECODE = {
  pairs: ['sh', 'ch', 'th', 'ck', 'll', 'ss', 'ng'],
  // First sounds: none or one letter (1), sh ch th (3), a blend (4).
  onset1: 'bcdfghjklmnprstvwyz',
  onset3: ['sh', 'ch', 'th'],
  onset4: ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
    'scr', 'spl', 'spr', 'str', 'shr', 'thr'],
  // Last sounds: one letter that says its own sound (1), a pair (3), a blend (4).
  coda1: 'bdfgklmnpstxz',
  coda3: ['sh', 'ch', 'th', 'ck', 'll', 'ss', 'ng'],
  coda4: ['ft', 'lk', 'lp', 'lt', 'lf', 'ld', 'mp', 'nd', 'nt', 'pt', 'sk', 'sp', 'st', 'xt', 'ct', 'nch', 'lch'],
  // Spellings whose letters don't say their usual short sounds: was, want,
  // swan (not wag, swam); won; ball, talk, salt, half; cold, bolt, most; a
  // soft c (cent).
  odd: /wa(?![gxm]|ck)|wo|all$|alk|alt|alf|old$|olt$|[hmp]ost$|c[eiy]/,
  // And words that look regular but aren't.
  irregular: ['put', 'push', 'pull', 'full', 'bull', 'bush', 'puss', 'of', 'son', 'ton', 'from', 'front', 'month',
    'roll', 'toll', 'poll', 'troll', 'scroll', 'stroll', 'kind', 'mind', 'find', 'bind', 'hind', 'rind', 'blind', 'grind',
    'wild', 'mild', 'child', 'gem', 'gel', 'gin', 'gym', 'gist'],
  // And words she would sound out wrong with the sounds she has learned: an
  // s that says /z/ (has: the /s/ she knows is the one in bus) or a voiced
  // th (then: the /th/ she knows is the one in tooth). A book has them only
  // as sight words, or not at all.
  voiced: ['as', 'has', 'his', 'is', 'then', 'this', 'that', 'them', 'than', 'thus'],
  // A pair that says the sound of one of its letters is sounded out as that letter.
  sound: { ll: 'l', ss: 's' },
};

// The level a word can be sounded out at (1-4), or 0 if it can't. An -s
// on the end (gets, its) comes at level 2, after a word she can read.
function decodeLevel(word) {
  const w = String(word).toLowerCase();
  if (!/^[a-z]+$/.test(w) || DECODE.odd.test(w) || DECODE.irregular.includes(w) || DECODE.voiced.includes(w)) return 0;
  const m = /^([^aeiou]*)([aeiou])([^aeiou]+)$/.exec(w);
  // The level of a first or last sound: no letter or one letter is 1.
  const of = (part, one, three, four) => (part.length < 2 ? (one.includes(part) ? 1 : 0)
    : three.includes(part) ? 3 : four.includes(part) ? 4 : 0);
  const on = m && of(m[1], DECODE.onset1, DECODE.onset3, DECODE.onset4);
  const off = m && of(m[3], DECODE.coda1, DECODE.coda3, DECODE.coda4);
  if (on && off) return Math.max(on, m[2] === 'a' ? 1 : 2, off);
  const stem = w.slice(0, -1);
  if (w.endsWith('s') && !/(s|x|z|sh|ch)$/.test(stem)) { const l = decodeLevel(stem); if (l) return Math.max(2, l); }
  return 0;
}

// Its letters, a pair that says one sound as one: f-i-sh, b-e-ll.
function decodeParts(word) {
  const w = String(word).toLowerCase();
  const out = [];
  for (let i = 0; i < w.length; i++) {
    const two = w.slice(i, i + 2);
    if (DECODE.pairs.includes(two)) { out.push(two); i++; } else out.push(w[i]);
  }
  return out;
}

// The pure sounds that say it, one per part: b-e-ll is /b/ /e/ /l/. Each
// is one the game teaches (tools/check-books.js).
const decodeSounds = word => decodeParts(word).map(p => DECODE.sound[p] || p);

// A page's words as tiles: { text (shown), word (said), sight, level }.
// Punctuation stays on the tile it follows.
function decodeTokens(text) {
  return String(text).split(/\s+/).filter(Boolean).map(t => {
    const word = t.replace(/[^A-Za-z']/g, '');
    const sight = SIGHT_WORDS.includes(word) || SIGHT_WORDS.includes(word.toLowerCase());
    return { text: t, word, sight, level: sight ? 0 : decodeLevel(word) };
  });
}

// What the narrator and the librarian say around the books.
const BOOK_LINES = {
  // Said when she comes upstairs, so she knows the bookcases open stories.
  invite: ['Welcome to the library, {title} {name}! Tap a bookshelf, and I will read you a story.', 'Hello, {name}! Would you like a story? Tap the bookshelf over there!', 'Come and read with me, {title} {name}! Just tap a bookshelf.'],
  welcome: ['Which book shall we read today, {title} {name}?', 'Pick a book, and I will read it with you!', 'So many stories! Which one do you like?'],
  quiz: ["Let's see what you remember!"],
  right: ['Yes! That is right!', 'Well done, {name}!', 'You remembered!', 'Great listening!'],
  tryAgain: ['Not quite. Try again!'],
  reveal: ['Good try! Here is the answer.'],
  done: ['You did it! Great reading, {name}!', 'What a good listener you are!'],
  theEnd: ['The End!'],
  // The books she reads herself: when one opens, a locked one, the end.
  selfStart: ['Your turn to read! Tap a word if you need help.', 'Now you read it! Tap a word to hear it.'],
  selfLocked: ['Keep reading words, and this book will open soon!'],
  selfDone: ['You read it all by yourself, {name}!', 'Wow, {name}! You can read!'],
};

// The words the voice reads for an option: the text after its emoji.
function bookSpoken(text) {
  return String(text).replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}‍️⃣]/gu, '').trim();
}

// A page's sentences, in order. A quote stays whole, so '"Wolf! Wolf!"'
// is one sentence and '"Help!" said Hare.' is too.
function bookSentences(text) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    cur += ch;
    if (ch === '"') { quoted = !quoted; if (quoted) continue; }
    const end = ch === '"' ? /[.!?]/.test(text[i - 1]) : /[.!?]/.test(ch) && !quoted && text[i + 1] !== '"';
    // A sentence ends at a stop followed by a space and a capital or a new quote.
    if (end && !quoted && /^\s+["A-Z]/.test(text.slice(i + 1))) { out.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
