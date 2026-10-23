// Story books for the royal library on the castle's second floor: short
// public-domain fairy tales and fables, retold in very simple English.
// Each page is one or two sentences with a little emoji picture, and each
// book ends with three questions. Option text starts with its emoji; the
// voice reads the words after it (bookSpoken).
// tools/tts-phrases.js reads this file too, so keep it free of page code.

const BOOKS = [
  {
    id: 'tortoise-hare', title: 'The Tortoise and the Hare', ko: '토끼와 거북이', cover: '🐢', color: '#8fd896',
    pages: [
      { text: 'Hare was very fast. Tortoise was very slow.', pic: '🐇🐢' },
      { text: '"Let\'s have a race!" said Hare.', pic: '🐇🏁' },
      { text: 'Off they went! Hare ran far ahead.', pic: '🐇💨' },
      { text: '"I have lots of time," said Hare. He lay down and fell asleep.', pic: '🌳🐇💤' },
      { text: 'Tortoise did not stop. Step, step, step!', pic: '🐢👣' },
      { text: 'He walked right past the sleeping Hare.', pic: '🐢💤' },
      { text: 'Hare woke up and ran. But it was too late!', pic: '🐇😮' },
      { text: 'Tortoise won the race! Slow and steady wins.', pic: '🐢🏆' },
    ],
    quiz: [
      { q: 'Who won the race?', options: ['🐢 Tortoise', '🐇 Hare', '🦊 Fox'], answer: 0 },
      { q: 'What did Hare do in the middle of the race?', options: ['🍎 He ate an apple', '😴 He fell asleep', '🏊 He went swimming'], answer: 1 },
      { q: 'Who was very slow?', options: ['🐇 Hare', '🐆 Cheetah', '🐢 Tortoise'], answer: 2 },
    ],
  },
  {
    id: 'lion-mouse', title: 'The Lion and the Mouse', ko: '사자와 생쥐', cover: '🦁', color: '#ffd34d',
    pages: [
      { text: 'A big lion was sleeping. A little mouse ran over his nose.', pic: '🦁💤🐭' },
      { text: 'The lion woke up and caught the mouse!', pic: '🦁🐭' },
      { text: '"Please let me go," said the mouse. "One day I will help you."', pic: '🐭🙏' },
      { text: 'The lion laughed and let the mouse go.', pic: '🦁😄' },
      { text: 'One day, the lion was caught in a net. He roared and roared.', pic: '🦁🕸️' },
      { text: 'The little mouse heard him. She ran to help.', pic: '🐭👂' },
      { text: 'She chewed the ropes with her tiny teeth. Snip, snip, snip!', pic: '🐭🦷' },
      { text: 'The lion was free! "Thank you, little friend," he said.', pic: '🦁❤️🐭' },
    ],
    quiz: [
      { q: 'What caught the lion?', options: ['🧺 A basket', '🕸️ A net', '🐘 An elephant'], answer: 1 },
      { q: 'How did the mouse help the lion?', options: ['🦷 She chewed the ropes', '🎵 She sang a song', '💧 She got him water'], answer: 0 },
      { q: 'Who was very small?', options: ['🦁 The lion', '🐻 The bear', '🐭 The mouse'], answer: 2 },
    ],
  },
  {
    id: 'three-pigs', title: 'The Three Little Pigs', ko: '아기 돼지 삼형제', cover: '🐷', color: '#ffb3cf',
    pages: [
      { text: 'Three little pigs each built a house.', pic: '🐷🐷🐷' },
      { text: 'The first pig built a house of straw. The second pig built a house of sticks.', pic: '🌾🪵' },
      { text: 'The third pig built a house of bricks. It took a long time.', pic: '🧱🐷' },
      { text: 'A big bad wolf came. He huffed and he puffed!', pic: '🐺💨' },
      { text: 'He blew down the straw house. He blew down the stick house too!', pic: '🌾💨🪵' },
      { text: 'The two pigs ran to the brick house.', pic: '🐷🐷🏠' },
      { text: 'The wolf huffed and puffed, but the brick house did not fall.', pic: '🐺🧱' },
      { text: 'The wolf ran away, and the three pigs were safe.', pic: '🐷🐷🐷' },
    ],
    quiz: [
      { q: 'Which house did not fall down?', options: ['🌾 The straw house', '🪵 The stick house', '🧱 The brick house'], answer: 2 },
      { q: 'Who blew the houses down?', options: ['🐺 The wolf', '🐻 The bear', '🐮 The cow'], answer: 0 },
      { q: 'How many little pigs were there?', options: ['🐷🐷 Two', '🐷🐷🐷 Three', '🐷🐷🐷🐷 Four'], answer: 1 },
    ],
  },
  {
    id: 'goldilocks', title: 'Goldilocks and the Three Bears', ko: '골디락스와 곰 세 마리', cover: '🐻', color: '#f0b070',
    pages: [
      { text: 'Three bears lived in a house in the woods.', pic: '🐻🏠🌲' },
      { text: 'One day, a girl named Goldilocks walked in.', pic: '👧🚪' },
      { text: 'She saw three bowls of porridge. She ate the little one all up!', pic: '🥣🥣🥣' },
      { text: 'She sat on three chairs. The little chair broke!', pic: '🪑💥' },
      { text: 'She lay on three beds. The little bed was just right, and she fell asleep.', pic: '🛏️💤' },
      { text: 'The bears came home. "Someone ate my porridge!" said Baby Bear.', pic: '🐻🥣😢' },
      { text: 'Then Baby Bear saw Goldilocks in his bed.', pic: '🐻👀👧' },
      { text: 'Goldilocks woke up and ran all the way home!', pic: '👧💨' },
    ],
    quiz: [
      { q: 'Whose porridge did Goldilocks eat?', options: ['👑 The king\'s', '🧸 Baby Bear\'s', '🐱 The cat\'s'], answer: 1 },
      { q: 'What broke?', options: ['🪑 The little chair', '🛏️ The big bed', '🚪 The door'], answer: 0 },
      { q: 'Where did Goldilocks fall asleep?', options: ['🌳 Under a tree', '🛁 In the bath', '🛏️ In a little bed'], answer: 2 },
    ],
  },
  {
    id: 'red-hen', title: 'The Little Red Hen', ko: '빨간 암탉', cover: '🐔', color: '#ff9a8a',
    pages: [
      { text: 'The Little Red Hen found some wheat seeds.', pic: '🐔🌾' },
      { text: '"Who will help me plant the seeds?" she asked. "Not I," said the cat, the dog and the duck.', pic: '🐱🐶🦆' },
      { text: 'So she planted them herself. The wheat grew tall.', pic: '🐔🌱' },
      { text: '"Who will help me make bread?" she asked. "Not I," they all said.', pic: '🐔🍞' },
      { text: 'So she made the bread herself. It smelled so good!', pic: '🐔🍞✨' },
      { text: '"Who will help me eat the bread?" she asked. "I will!" said the cat, the dog and the duck.', pic: '🐱🐶🦆' },
      { text: '"No," said the hen. "I did all the work, so I will eat it!"', pic: '🐔😋' },
      { text: 'And she did, with her little chicks.', pic: '🐥🍞🐥' },
    ],
    quiz: [
      { q: 'What did the hen make?', options: ['🎂 A cake', '🍕 A pizza', '🍞 Bread'], answer: 2 },
      { q: 'Who helped the hen do the work?', options: ['🙅 Nobody', '🐱 The cat', '🐶 The dog'], answer: 0 },
      { q: 'Who ate the bread?', options: ['🦆 The duck', '🐥 The hen and her chicks', '🐶 The dog'], answer: 1 },
    ],
  },
  {
    id: 'ugly-duckling', title: 'The Ugly Duckling', ko: '미운 아기 오리', cover: '🦢', color: '#a8d8ff',
    pages: [
      { text: 'A mother duck had some eggs. One egg was big and gray.', pic: '🦆🥚' },
      { text: 'Out came a big gray duckling. He did not look like the others.', pic: '🐣🦆' },
      { text: '"You are ugly!" said the other ducks. The duckling was very sad.', pic: '🦆🦆😢' },
      { text: 'He went away and lived alone all winter.', pic: '❄️🐣' },
      { text: 'When spring came, he saw some swans on the lake.', pic: '🌸🦢🦢' },
      { text: 'He looked down into the water. He was a beautiful white swan!', pic: '💧🦢✨' },
      { text: '"Come and swim with us!" said the swans.', pic: '🦢🦢🦢' },
      { text: 'He was so happy at last.', pic: '🦢💖' },
    ],
    quiz: [
      { q: 'What did the duckling grow up to be?', options: ['🦆 A duck', '🦢 A swan', '🐔 A hen'], answer: 1 },
      { q: 'How did the duckling feel when the ducks were mean?', options: ['😢 Sad', '😄 Happy', '😴 Sleepy'], answer: 0 },
      { q: 'When did he see the swans?', options: ['❄️ In winter', '🌙 At night', '🌸 In spring'], answer: 2 },
    ],
  },
  {
    id: 'cried-wolf', title: 'The Boy Who Cried Wolf', ko: '양치기 소년', cover: '🐑', color: '#c8f0a0',
    pages: [
      { text: 'A boy looked after the sheep on a hill.', pic: '🧒🐑⛰️' },
      { text: 'He was bored. So he shouted, "Wolf! Wolf!"', pic: '🧒📢' },
      { text: 'The people ran up the hill to help. But there was no wolf!', pic: '🏃🏃⛰️' },
      { text: 'The boy laughed. He did it again the next day.', pic: '🧒😆' },
      { text: 'Then one day, a real wolf came!', pic: '🐺🐑' },
      { text: '"Wolf! Wolf!" the boy shouted. But nobody came.', pic: '🧒📢🐺' },
      { text: 'They thought he was telling a lie again.', pic: '🙉' },
      { text: 'Always tell the truth, and people will believe you.', pic: '💬✨' },
    ],
    quiz: [
      { q: 'What did the boy look after?', options: ['🐄 Cows', '🐑 Sheep', '🐔 Chickens'], answer: 1 },
      { q: 'What did the boy shout?', options: ['🐺 Wolf!', '🔥 Fire!', '🐍 Snake!'], answer: 0 },
      { q: 'Did the people come when the real wolf came?', options: ['✅ Yes, they all came', '👑 Only the king came', '❌ No, nobody came'], answer: 2 },
    ],
  },
  {
    id: 'ant-grasshopper', title: 'The Ant and the Grasshopper', ko: '개미와 베짱이', cover: '🐜', color: '#ffe27a',
    pages: [
      { text: 'It was a hot summer day.', pic: '☀️🌻' },
      { text: 'The ant worked hard. She carried food to her home.', pic: '🐜🌽' },
      { text: 'The grasshopper sang and played all day.', pic: '🦗🎻' },
      { text: '"Come and play!" said the grasshopper. "I must save food for winter," said the ant.', pic: '🦗🐜' },
      { text: 'Then winter came. It was very cold.', pic: '❄️🌨️' },
      { text: 'The ant had lots of food. The grasshopper had nothing to eat.', pic: '🐜🍞🦗' },
      { text: 'The kind ant shared her food.', pic: '🐜🤝🦗' },
      { text: '"Next summer, I will work too," said the grasshopper.', pic: '🦗💡' },
    ],
    quiz: [
      { q: 'Who worked hard all summer?', options: ['🦗 The grasshopper', '🦋 The butterfly', '🐜 The ant'], answer: 2 },
      { q: 'What did the grasshopper do all summer?', options: ['🎵 He sang and played', '🧹 He cleaned', '🌽 He saved food'], answer: 0 },
      { q: 'What did the kind ant do in winter?', options: ['🏃 She ran away', '🤝 She shared her food', '🎻 She played music'], answer: 1 },
    ],
  },
  {
    id: 'gingerbread', title: 'The Gingerbread Man', ko: '진저브레드맨', cover: '🍪', color: '#e8b07a',
    pages: [
      { text: 'An old woman baked a gingerbread man.', pic: '👵🍪' },
      { text: 'She opened the oven, and he jumped out! "Run, run, as fast as you can!" he sang.', pic: '🍪💨' },
      { text: 'The old woman ran after him. She could not catch him.', pic: '👵🍪' },
      { text: 'A cow and a horse ran after him too. They could not catch him!', pic: '🐄🐎🍪' },
      { text: 'Then he came to a river. He could not swim.', pic: '🍪🌊' },
      { text: '"Jump on my tail," said a fox. "I will take you across."', pic: '🦊🌊' },
      { text: 'The fox swam out, and the gingerbread man climbed onto his nose.', pic: '🦊🍪' },
      { text: 'Snap! The fox ate him up.', pic: '🦊😋' },
    ],
    quiz: [
      { q: 'Where did the gingerbread man jump out from?', options: ['📦 A box', '🔥 The oven', '🎒 A bag'], answer: 1 },
      { q: 'Why did he need help at the river?', options: ['🌊 He could not swim', '😴 He was sleepy', '🌧️ It was raining'], answer: 0 },
      { q: 'Who ate the gingerbread man?', options: ['🐄 The cow', '👵 The old woman', '🦊 The fox'], answer: 2 },
    ],
  },
  {
    id: 'town-country-mouse', title: 'The Town Mouse and the Country Mouse', ko: '시골 쥐와 도시 쥐', cover: '🐭', color: '#d8c4f0',
    pages: [
      { text: 'Country Mouse lived in a quiet field.', pic: '🐭🌾' },
      { text: 'One day, Town Mouse came to visit. They ate corn and seeds.', pic: '🐭🌽🐭' },
      { text: '"Come to the town with me," said Town Mouse. "We have cake and cheese!"', pic: '🏙️🧀' },
      { text: 'The town house was very big. The food was yummy!', pic: '🍰🧀' },
      { text: 'Then a big cat jumped out! The mice ran and hid.', pic: '🐱🐭💨' },
      { text: '"The town is too scary for me," said Country Mouse.', pic: '🐭😨' },
      { text: 'He went home to his quiet field.', pic: '🐭🏡' },
      { text: 'A safe little home is the best home of all.', pic: '🌾💖' },
    ],
    quiz: [
      { q: 'What scared the mice?', options: ['🐶 A dog', '🐱 A cat', '🐍 A snake'], answer: 1 },
      { q: 'Where did Country Mouse live?', options: ['🌾 In a quiet field', '🏙️ In a big town', '🌊 In the sea'], answer: 0 },
      { q: 'What did Country Mouse do at the end?', options: ['🍰 He ate more cake', '🐱 He played with the cat', '🏡 He went home'], answer: 2 },
    ],
  },
];

// What the narrator and the librarian say around the books.
const BOOK_LINES = {
  welcome: ['Which book shall we read today, {title} {name}?', 'Pick a book, and I will read it with you!', 'So many stories! Which one do you like?'],
  quiz: ["Let's see what you remember!"],
  right: ['Yes! That is right!', 'Well done, {name}!', 'You remembered!', 'Great listening!'],
  tryAgain: ['Not quite. Try again!'],
  reveal: ['Good try! Here is the answer.'],
  done: ['You did it! Great reading, {name}!', 'What a good listener you are!'],
  theEnd: ['The End!'],
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
