# PixelTown 🏰

윤아 공주의 소리 마을: a quarter-view (isometric) pixel-art town where a
young child practises English phonics as a princess. The look is inspired by
HD-2D games such as Octopath Traveler, made brighter and more princess-like.

## Play

Open `index.html` in a browser. No build step or server is needed.
It works best on a tablet in landscape. To serve it on a local network:

```sh
npx http-server -p 8080 .
```

## How it works

- **Start screen**: type the hero's name and pick a title (공주 princess,
  왕자 prince, 여왕 queen, 왕 king, 기사 knight, 요정 fairy, 마법사 wizard, 탐험가
  explorer, 선장 captain). A Korean name is turned into Latin letters for the
  English voice (윤아 → Yuna); fix the spelling by hand if it sounds wrong and
  tap 🔊 to hear it. Villagers then greet her as "Prince Seoyeon" and so on.
  Princes and kings are boys; princesses, queens and fairies are girls; for
  a knight, wizard, explorer or captain pick 👧 여자 or 👦 남자.
- **Boy hero**: a boy has short hair and his own clothes instead of
  dresses, each drawn in pixels in any of the colours: a knight's tunic, a
  prince coat, a king's robe, a suit with a white shirt and red tie, steel
  armour with a tabard, a sailor suit, a hanbok (jeogori and baji), an
  explorer's vest and shorts, a starry wizard robe, and the Fairy
  Village's leaf tunic. On his head a prince circlet, king crown, feather
  hat, knight's helmet, pirate hat, wizard hat, explorer's sun helmet,
  baseball cap or gat; in his hand a sword, sceptre, star sword, shield,
  bow, wizard's staff, telescope or flag; on his back a knight's red cape
  or the forest's dragon wings. Presents, the shop and the wardrobe only
  offer things that suit the hero (`girl` / `boy` on an item in
  `js/data.js`); colours, crowns, capes, hair colours, treasures, unicorns
  and fairies suit both. Each look remembers its own outfit.

- The town is 40 x 40 tiles and the camera follows the princess. Tap the
  ground to walk there.
- **Castle**: the princess's home at the top of town. Tap it to walk to the
  gate and go inside the throne room, where the king, the queen and a maid live.
  The staircase in the back-right corner climbs to the **second floor**: the
  royal library, a balcony looking over the town, a golden harp and the
  treasure corner. The royal librarian and the court harpist ask town
  questions there. Tap the stairs (or the ⬆️ / ⬇️ at their foot) to go up or
  down.
- **Houses**: there are twelve letter houses (A B C D F G H M N P S T). Tap a
  house to walk in. Each house's resident asks words that start with that
  house's letter, and the wall shows the letter and its pictures.
- **Villagers** (♪ bubble): tap one to talk and they ask a question with
  answers **1, 2, 3**. Town folk mix three kinds: pick the word you hear,
  pick the letter a word starts with, or find the word that rhymes. House
  residents ask for the picture that starts with their house's letter
  instead of the letter question. The cards wait (dimmed, the 🔊 glowing) until
  the word has been said. Someone she has already talked to that day skips
  the chat and just asks.
- **A wrong answer** never sends her away. The picked card shakes, turns
  grey and shows its picture; she hears what she picked and a hint for that
  kind of question ("cap… Listen. cat", "M says mmm. Listen. cat", "dog…
  Listen to the end. cat"), and tries again with the cards that are left.
  Right then: praise, a star and the word's sticker, but no pip on the gift
  meter (presents are for getting it right the first time, and never
  something she already has). A second miss,
  or a miss with only the right card left, shows the answer: it glows with a
  👆, the word is sounded out ("/c/ /a/ /t/… cat!") and she taps it to finish
  (no star). That question comes back later from the same person, with new
  cards in a new order; their bubble shows a gold **!** once it is ready.
  The flow is `choose` → `missed` → `hint` / `showAnswer` → `finishShown`
  in `js/game.js`; each builder in `js/quiz.js` gives its `teach`, `picked`
  and `model` lines. Letters she can't tell apart yet (a/e, e/i, f/p, l/r,
  b/p, d/t, m/n… in `HARD_PAIRS`) and c with k never share a question, and
  picture-only cards leave out pictures with another name (`WEAK_PICTURES`).
- **No repeats**: a person never asks the same kind of question twice in a
  row, and the last answers of each kind (up to 24, at most half of what that
  kind can ask at her tier) are kept out of new questions (saved with the
  game). The mix lives in `QUIZ_TYPES` and the builders in `js/quiz.js`.
- **Difficulty that follows her**: every kind of question has tiers, easiest
  first (`TIERS` in `js/data.js`): fewer cards with pictures and letters far
  apart at first, then more cards, text only, words that differ in one sound,
  and only at the top tier the sounds a Korean ear finds hard (a/e, f/p, l/r,
  m/n...). Each kind keeps her own tier (`state.skill`, saved, shared by both
  editions): up after 5 right first tries of the last 6 (the first 3 in a
  row before her first miss), down after 2 misses in a row; after a miss the
  next one is a tier easier, and every 4th question is from the tier below.
  Each place caps the tier (`TIER_BAND`). Reaching a new best tier shows
  "⭐ 레벨 업!" with a fanfare (no message going down). Spelling goes 3
  letters with the first given (4 tiles) → 3 letters, 5 tiles → sh, ck, ll as
  one tile (fish, duck, bell) → 4-letter blends (frog, milk) → 5 letters
  (plant, truck) → two syllables (rab·bit), the last only when a parent
  turns it on. A save from before tiers starts each kind from its answers
  so far, below its hardest tier. The words come from the bank in
  `js/data.js` (`CVC_A1`, `CVC_A2`, `CCVC`, `CVCC`, `LONG`, `DIGRAPH`,
  `MINIMAL_SETS`, `RHYME_SETS`, `SENTENCES_L1`/`_L2`); `ALIAS` lists other
  names for pictures so a wrong card is never right by her name for it, and
  `WEAK_PICTURES` keeps pictures with another name off picture-only cards.
- **Solved questions and review**: every question has a stable id
  (`rhyme:cat`, `sentence:The {} says moo.`) and each kind has a pool of all
  its ids at the tiers the parent's settings allow (`reviewPool(kind, npc)`;
  house pools are per letter). Answers are saved in `history` (tries,
  right, wrong, last time). Questions she has already got right are not
  asked again until the whole pool is done; a miss stays a miss even if
  the retry is right. Then that kind switches to review (a 복습 tag on the
  dialog), which favours the ones she missed and the ones not seen for a
  while.
- **Parent panel (⚙️, top right)**: asks for the login password (0000
  without an account) and shows stars, coins, fairy dust and answers, a
  bar per question kind (right / missed / not tried, out of the pool) with
  the first-try accuracy, her tier ("단계 2 / 4", with − and + to set it),
  her best tier and her last ten first tries, the most-missed questions,
  the last 7 days, first-try accuracy per first letter, and a setting for
  two-syllable spelling words. The game is paused while it is open: she
  stops walking, nobody talks, and timers wait until it closes. Without a
  connection the password is checked against a copy kept on the tablet at
  login (PBKDF2, WebCrypto); otherwise it says the internet is not
  connected, or to try again later. Code in `js/parent.js`.
- **Parent settings** (설정, at the bottom of the parent panel):
  - 놀이 시간 off / 15 / 20 / 30 minutes a day. Once it is reached, at the
    next quiet moment (no dialog, present, shop or game open) the town goes
    to sleep: it dims, stars twinkle and the narrator says "Time to rest!
    See you tomorrow." Only the parent password (🔑 부모님) wakes it, for
    another full stretch; a reload doesn't.
  - 그림 힌트: pictures on the word cards (easier); they start on for a new
    player. With them off, the child has to read the first letter. This
    used to be the 🖼️ button in the HUD.
  - 🔊 소리 버튼: hide the child's mute button (the sound comes back on).
  - 배경 음악: the background music on (the default) or off.
  - 두 음절 철자: let the top spelling tier use two-syllable words.
  Settings are shared by both editions (그림 힌트 is per edition); each
  change is stamped on its own, so when two tablets' saves are put together
  the newest change to each setting wins and a change to one never reverts
  another. The panel shows the account's newest copy when it opens.
  The play-time clock, the limit and the sleep screen are in `js/guide.js`.
- **Presents and the gift meter**: 🎁 ●●○ next to the stars fills a pip
  for every answer right the first time (not in the cave, which pays
  coins); the third opens a present from whoever she answered last. There
  are about a hundred things to collect for each look (16 dress colours,
  8 dresses or 10 boy outfits, 8 hair colours, hats and crowns, things to
  hold, wings and capes, unicorns, fairies, and 26 treasures for the
  treasure shelf: a shell, a kite, a toy piano, a golden key…). A present
  is picked by kind first (so colours don't crowd out the rest), then at
  random among the things of that kind she doesn't have that suit the
  hero. A unicorn gives itself and a fairy villager her favourite fairy
  first; a village's own treasures (`forest`, `unicorn`, `fairy` on an
  item) come before anything else there and only from there. When the
  villager's own one is hers already, it is something else new; a present
  is never something she has. Once nobody there has anything new left, a
  full meter gives a pack of three stickers she hasn't found yet instead
  (fairy dust or batteries once the album is full). The child sees "now"
  and "after" side by side (on foot, unless the present is a unicorn) and
  chooses to wear it now or put it in her wardrobe; a treasure shows on
  its own, with one button that puts it on the shelf.
- **Sticker album (📒)**: every right answer, first try or after a hint,
  puts the question's word in the album as a sticker (its picture and the
  word, first letter in colour). A new one flies from the card into 📒,
  whose dot counts the ones not seen yet. The album opens from 📒 at the top
  right or from the desk with the open book in her room: a page per first
  letter with big letter tabs, stickers she has in colour (shining gold once
  she has got that word three times), the others as grey "?" shapes. Tapping
  a sticker says its word, and "cat starts with C." once that is recorded.
  The words come from the word lists in `js/data.js`, so new words show up by
  themselves. The robot edition calls it a word chip book. Code in
  `js/album.js`.
- **Next gate and medals**: the star counter shows the next gate that is
  still shut, "⭐ 7/10 🌲" over a bar (from 820 px down just the picture and
  the bar), and goes back to plain stars when every gate is open. When a
  gate's stars are reached, once the dialog and any present have closed,
  there is a short party (fireworks, "The Starlight Forest is open!") and a
  sparkle trail on the ground leads to that gate for a minute and a half. A
  letter house gets a medal when every question about its letter (its words,
  the pictures that start with it) has been answered right once; a village
  when every question of its kinds has. Medals show as a ⭐ on the house sign
  and on the album's 🏅 page with how far each one is.
- **Cheers**: three answers right the first time in a row and the asker says
  "Three in a row!" instead of the usual praise, with a burst of sparkles;
  five, "Five in a row! Super star!", then a cheer every five. A miss starts
  the count again without a word. No celebration gives stars, each lasts
  about two seconds, and a tap anywhere ends it.
- **Wardrobe**: every present is kept. In the throne room, the 🎀 door on
  the right leads to the princess's own room. Tap the wardrobe or the mirror
  to change clothes freely. A row of picture tabs (she can't read yet) has
  one tab per kind: 👗 dresses (👕 a boy's clothes), 🎨 colours, 💇 hair,
  👑 head, 🪄 hand (🗡️), 🦋 wings and capes (🦸), 🧚 fairy friends,
  🦄 unicorns and 💎 the treasure shelf. Each thing is a picture: her
  wearing it (the whole of her for clothes and colours, her head for hats
  and hair), or the thing itself (what she holds, wings and capes, the
  unicorn, the fairy, the treasure). Things not hers yet are a grey shape
  with a ❓ and tapping one goes "nope"; a treasure hops when tapped. Over
  the pictures, the tab's name and how many of them she has; the mirror
  still shows her outfit, and the last present sparkles (✨) on its tab,
  which the wardrobe opens on. In the robot edition the workbench has the
  same tabs for heads, bodies, arms, legs, paint, backpacks, cars, buddies
  and treasures, the part tabs showing the robot's own parts. Code in
  `renderWardrobe` and `itemPicture` in `js/game.js`; the tabs are
  `WARDROBE`.
- **Starlight Forest (level 2)**: a gate at the south end of the main road
  opens at 10 stars. The forest folk (★ bubble) ask harder questions: four
  words that share the first letter (hug / hut / hat / hen), the missing
  middle sound (c ? t), the missing last sound (ca ?), reading a word with
  no voice and picking its picture, hearing a word's sounds one by one
  ("/s/ … /u/ … /n/") and picking its picture, and rhymes. Only the forest
  (and the villages past it) gives out its treasures: fairy wings, a
  starlight cape, a night-sky dress, the star sword and dragon wings for a
  boy, a glowing mushroom and an acorn. Word families live in
  `WORD_FAMILIES` in `js/data.js`.
- **Unicorn Village (level 3)**: a gate at the south end of the forest path
  opens at 25 stars. The unicorns and their friends (♥ bubble) ask sentence
  questions: hear "The cow says moo." and pick *cow* from words that sound
  alike, or hear "I eat a red, hmm hmm." and pick the word that makes sense.
  Sentences live in `SENTENCES_L1`, `SENTENCES_L2` (easier) and `SENTENCES`
  in `js/data.js`.
- **Unicorns**: presents in the Unicorn Village (a full gift meter) are its
  eight unicorns and its treasures first (a unicorn horn, a rainbow cape, a
  rainbow marble and a unicorn plush). Tap 🦄 (top right) or the waiting unicorn to ride, which is
  faster than walking. She gets off at the door of a house or the castle and
  the unicorn waits outside. Pick which unicorn to ride in the wardrobe.
- **Crystal Cave (level 4)**: a rocky hill at the west end of the forest's
  cross path opens at 30 stars (`DUNGEON_STARS`). Cute monsters (◆ bubble:
  slimes, a bat, a ghost, a baby dragon, a mushroom) ask the same sentence
  questions as the Unicorn Village. A right answer catches the monster: it
  goes poof and drops 1–3 🪙 coins instead of a star and a present. Caught
  monsters come back after a minute or when she walks in again. Monsters
  live in `DUNGEON_NPCS` in `js/data.js`.
- **Monster magic** (princess edition): the monsters float or bounce and
  blink while they wait, and she steps back a tile to face the one she
  talks to. After a wrong answer and its hint, the dialog steps aside: the
  monster wobbles while sparkles gather, hops and sends its magic at her (the
  slimes a bubble or a heart, the bat a moon, the ghost and the baby dragon
  a star, the mushroom a glowing bubble); a soap bubble pops up around her
  and the magic bursts into hearts on it, never hurting her. It is short,
  so a miss is never the fun part, then the same question comes back.
  After a right answer (once the praise and the answer have been said) the
  monster tries one last spell, her bubble catches it, and her golden star
  flies back with a rainbow tail: the monster giggles in a ring of hearts,
  twirls and goes poof. While the dialog is aside the game stays busy, as
  in the robot's cave fight; ✕ during the praise skips the magic, and the
  monster still goes poof and pays. Sounds are the game's own effects; no
  new lines are said. Code in `js/cave-magic.js` (`MONSTER_MAGIC` sets each
  monster's magic and colours).
- **Starlight Shop**: the golden cottage on the forest's cross path. Tap it
  or the shopkeeper (🪙 bubble) to buy anything she doesn't own yet with
  coins, including a few shop-only treasures (crystal dress, silver hair,
  gem headband, firefly lantern, marked ✨). It has the wardrobe's picture
  tabs (only the kinds with something left to buy) and pictures with
  prices; the mirror shows her with the one picked on (a treasure on its
  own). Prices are in `shopPrice()` in `js/game.js` (treasures 3 coins, a
  village's 5), or `price` on an item.
- **Fairy Village (level 5)**: a gate at the east end of town's lower road
  opens at 15 stars (`FAIRY_STARS`). Giant flowers and toadstools, teacup
  and tulip cottages and a lily pond. The fairies (✨ bubble) ask spelling
  questions: hear "cat", see 🐱 and three blanks, and tap the letter tiles
  c, a, t in order (each tap says the letter's sound; a keyboard works too).
  Every tile is checked as it goes in: a right letter stays, green; a wrong
  one shakes and hops back while the word is said again slowly. Two wrong
  tiles for the same blank make the right tile glow. The words are the
  game's own short words where every letter says its sound (`spell` in
  `js/quiz.js`). Between spelling questions the fairies also ask the
  easier reading and sound-blending ones.
- **Monster Village (level 6)**: a gate at the west end of town's upper road
  opens at 40 stars (`MONSTER_STARS`), the same village in both editions.
  Lavender grass at dusk, glowing mushrooms, crystals and lanterns; four
  friendly monsters (👾 bubble) ask the next step after short vowels: long
  vowels, the ones that say their name (`QUIZ_TYPES.monster`). In the
  middle stands the Monster Tower, with a monster's face (round-window
  eyes, the doorway for a mouth). Inside live the monsters the child drew
  herself (🖍️ bubble, `js/kid-monsters.js`): talking to one shows her
  drawing in the dialog. Each is pixel art from a drawing, kept in one
  place (`KID_MONSTERS`) so a parent's own drawings can replace them later.
  Built in `js/monster-village.js`.
- **Fairy friends**: presents in the Fairy Village (a full gift meter) are
  its six little fairies and its treasures first (a petal dress, a leaf
  tunic for a boy, butterfly wings, a fairy teapot and a tulip; each fairy
  villager offers her own fairy first). Her fairy
  flies above her head and trails after her, also while riding; pick one
  in the wardrobe. Every answer right the first time there also gives 2–4 ✨ fairy dust,
  shown next to the stars.
- **A friend that grows**: in her room, tap the fairy friend flying over
  her (a ring round it shows how far it is to the next stage, and a ✨
  bubble when she has dust), or the ✨ chip at the front of the fairy tab in
  the wardrobe. A card shows the friend big; every tap on it (or on the ✨
  jar) feeds it one dust. At 10, 25 and 45 dust (`FRIEND_STAGES`) it grows:
  a brighter glow, then a crown, then a little loop-the-loop dance, each
  with a short celebration (tap to skip) and a line. A grown friend
  sparkles now and then wherever she goes; tapped outside her room it
  twirls. Nothing is ever taken away. In the robot edition batteries charge
  the helper buddy, which gets an antenna. Code in `js/friend.js`.
- **Fishing at the pond**: the fisherman (낚시 아저씨) has a 🎣 낚시 놀이
  button in his dialog, a 🎣 bubble floats over the town pond, and tapping
  the pond starts it too. Four fish with pictures swim by and he says
  "Catch the fish that starts with /m/!" with the letter's pure sound (the
  letter is shown at the top; 🔊 or the letter says it again). The fish
  can be caught once the sound has been said. A wrong fish swims away and
  she hears its word and the sound again; after two misses the right fish
  glows. A catch is reeled into the bucket and the narrator says "moon
  starts with M.". Five fish pay 3 🪙 coins (`FISHING`). Letters she can't
  tell apart (`HARD_PAIRS`) never swim together. On the first round a
  finger taps on each fish in turn until she tries one. In the robot
  edition the fishing robot works a 🧲 magnet crane that lifts boxes into
  a truck. Code in `js/minigame.js`.
- **A little game in each village**: one villager in each village has a
  button in their dialog with the village's picture (🌲 버섯 점프 놀이, 🧚
  글자 요정 놀이, 🦄 유니콘 달리기, 💎 보물 상자 놀이). Each is five rounds of
  that village's own skill, three pictures to pick from (four letters to
  spell), and pays the fishing game's coins (`VILLAGE_GAMES` in
  `js/data.js`):
  - Starlight Forest, from the mushroom grandpa: "Which one rhymes with…
    cat?" and she hops onto the mushroom with the 🎩 (rhyme).
  - Fairy Village, from the petal fairy: she hears "cat" and taps c, a, t
    in order on the bubbles little fairies carry; each says its sound and
    the right one flies up into the next slot (spell, three-letter words;
    the first letter given at her first tier).
  - Unicorn Village, from the ranch girl: she hears /c/ /a/ /t/ and taps
    the unicorn whose cloud shows the 🐱, which gallops off (blend).
  - Crystal Cave, from the baby dragon: "cat" is written at the top and
    nobody says it; she opens the treasure chest with the 🐱 (read).
  In the robot edition: Dinosaur Village's triceratops has eggs that hatch
  baby dinos, Drone Village's doctor has drones carrying letter boxes, Car
  Village's mechanic has cars that race over the finish line, and the
  Villain Cave's Can Bot has crystals to free. Every round is a question
  from `js/quiz.js` of that kind, at her tier for it (capped like the
  village asks it), so the hint after a miss ("dog… Listen to the end.
  cat") and the answer shown after two are the questions' own, and the
  rhyme pictures are ones she can name for sure. The narrator says what to
  do once at the start ("Hop on the mushroom that rhymes!") and a finger
  taps on each picture in turn until she tries one; everything else said
  was recorded already. The answers don't move her tier, give no stars and
  aren't kept in her history. Like fishing, the card keeps the game busy
  and the music down, never opens once today's play time is used up, and
  ends with 🔁 / 👋. The games share one framework in `js/minigame.js`
  (rounds, hints, the finger, coins and the card); each brings its
  questions and pictures (`js/village-games.js`).
- **First steps**: a new player sees a bouncing 👆 on the nearest villager
  until she first taps one, and once more after her first present. After
  about 20 seconds with no tap (and nothing open) the nearest villager hops
  and calls "Princess Yuna, over here!", at most once a minute and three
  times in a row. Code in `js/guide.js`.
- **Today's adventures and the treasure chest**: a little chest at the top
  right (three dots under it) opens a card with three picture quests for
  the day, one of each kind: answering (⭐ ●●●●● stars, 🎁 a full gift
  meter, 📒 new stickers, ✨ fairy dust), playing (🎮 rounds won in the
  little games, fishing or a village's, 📖 a book read to her or one she
  reads herself, her own friend fed once) and going somewhere (🏠 a letter
  house, or a village by its picture). Only what she can do is picked:
  nothing behind a shut gate, no feeding without a friend. What she does
  that day fills the dots;
  a finished quest gets a tick and a chime once she is free, and when all
  three are done the chest glows ("All done! Open the treasure chest!").
  Tapping it opens it (about 2 seconds, a tap skips) and 5 🪙 coins
  (`QUEST_CHEST`) fly into the purse, once a day (counted under the day's
  own entry, `chest:<day>` in `earned`, so opening it on two tablets
  before they sync pays once). Tapping a picture says
  its word. A day she doesn't play changes nothing: no streak, nothing
  lost. The robot edition has missions, boxes, batteries and a blue chest.
  The quests are `QUESTS` in `js/data.js`; code in `js/quest.js`.
- **Royal library (castle 2nd floor)**: tap a bookcase, or the librarian's
  "📖 책 읽어주세요" button, for ten short fairy tales and fables retold in
  simple English. The reader reads each sentence aloud and highlights it,
  turning pages on its own (⏸ pauses, ◀ ▶ turn pages, tap a sentence to hear
  it). After the last page come three questions; each right answer pays
  🪙 1 coin, but only the first time that question is answered right, so
  re-reading is free but can't farm coins. A wrong answer gets a second try,
  then the answer is shown. Books live in `BOOKS` in `js/books.js`; the
  reader is `js/library.js`.
- **I can read! (the library's first shelf, ✏️ 내가 읽는 책)**: eight
  little books she reads herself, 4–6 pages of one short sentence under a
  big picture. Every word is one she can sound out at the book's level, or
  one of twelve sight words (`SIGHT_WORDS`: the, a, I, is, to, see, go, no,
  my, we, said, you). Level 1 is short a (The Cat, I Can!), 2 any short
  vowel (The Big Pig, The Bug in the Cup), 3 sh, ch, th, ck, ll, ss, ng
  (The Fish Wish, Chuck the Duck), 4 blends (Jump, Frog, Jump!, The Best
  Gift). Each word is a big tile: a tap says the whole word, the
  narrator's "cat!" (a sight word as it is, "the"), the tile and its word
  lit while it does; never letter by letter, as she sounds it out herself.
  ▶ reads the page slowly, but only shows once she has tapped every word
  on it, or after 8 seconds, so she tries first; ➡ turns the page. The end
  is a short party (a tap ends it), ⭐ 1 star the first time she reads that
  book to the end (never again for it), and a ✓ on its cover; every time
  counts for today's 📖 quest, and the star for the ⭐ one. A book opens
  once her tier in reading words (the forest's and fairies' `read`
  questions: read a word with no voice, pick its picture, the very skill
  these books use) reaches the book's level, or a parent sets it there;
  level 1 is always open, and a 🔒 cover says "읽기 3단계". The robot
  edition's HQ library calls it a reading mission (🚀). The parent panel
  lists which ones she has read. Books live in `DECODABLE_BOOKS` in
  `js/books.js`, with the rule for what each level can sound out
  (`decodeLevel`). A word she would sound out wrong is not one of them:
  an s that says /z/ (has, his, as) or a voiced th (then, this, that),
  since the sounds she learns are the /s/ of bus and the /th/ of tooth.
  `node tools/check-books.js` (also run by `tools/quiz-test.js`) checks
  every word against it, the rule against the word bank in `js/data.js`,
  that every sound in it is one the game teaches, and that every picture
  is an emoji an older iPad has (Unicode 13 or before).
- **Village homes**: every home in the villages opens too: the forest's
  mushroom houses, the unicorn homes and stable, and the fairies' teacup
  and tulip cottages (🍄 🦄 🫖 🌷 over their doors). Tap one to walk to its
  door and knock; inside, its resident says hello and asks that village's
  questions. The mat inside leads back out to the same door. Homes live in
  `VILLAGE_HOMES` and their hellos in `HOME_HELLO` (`js/data.js`), the rooms
  in `HOME_THEMES` (`js/world.js`). In the robot edition the Car Village's
  garage, fire station, car wash, gas station and car homes, the dino egg
  huts and the drone hangars and labs open the same way (`captainHomes` in
  `js/captain-town.js`).
- **Touch and hear**: tap anything else (a tree, the fountain, a bed, a
  picture on the wall) and it wiggles or sparkles while the narrator says
  its English word, shown big with the first letter in colour. Pictures in
  a letter house say "apple starts with A." and the poster says its letter.
  Every part of a gate or the cave (arch, posts, sign, padlock, mat) goes
  through it, or says how many stars it needs. Taps never give stars or
  coins. Code in `js/touch.js`; words not in the word lists are in
  `PROP_WORDS`.
- **Closing a card with a tap outside it**: a tap on the town around a
  card she only looks at, or on the counters at the top, closes it the way
  its 👋 does: the sticker album, today's adventures, the library's shelf,
  the wardrobe, the shop, the feeding card (over the wardrobe it closes
  first) and the fishing game's end card. A question, a present, a book
  being read, the fishing game itself, the sleeping town and anything
  under the parent panel stay until she uses them. A tap while the chest
  opens, stickers fly in or her friend celebrates only ends that, so she
  sees the coins land; the next one closes the card. The tap that closes a
  card does nothing else: she doesn't walk, nobody under it is tapped and
  no button of a card under it is pressed; the buttons at the top (📒, the
  chest, 🔊, ⚙️) keep their own job. `OUTSIDE_CARDS` in `js/game.js`.
- **Background music**: a short, calm loop in a major key for each kind of
  place: the town and the castle, the forest, the fairy village, the unicorn
  village, the cave, and inside a house or her room. Each is eight bars of
  a melody over a broken chord and a bass, made on the spot with Web Audio
  (no audio files); every third time round the melody rests. The princess
  hears a music box, the robot edition a little chiptune band a tone higher.
  It is soft (about 14 dB under the voices), and whenever anything is said
  it drops to an eighth within a fraction of a second, then comes back
  slowly (over two or three seconds) once the voice has stopped; while a
  question, a book or a little game is open it stays down the whole
  time. Sound effects play over it. A new place crossfades to its tune in
  about a second. It starts with ▶ (after the first tap, which iOS needs
  before a page may make sound) and is silent while 🔊 is off, the parent
  panel is open, the page is hidden or the town is asleep, or when a parent
  turns it off. Notes are scheduled ahead on the audio clock (a lookahead
  timer, never the frame loop), at most three at once (six in a
  crossfade). The tunes are `MUSIC_TUNES` and the sounds `MUSIC_TIMBRES`
  in `js/music.js`.
- 🖼️ picture hints on the answer cards (easier) are a parent setting now
  (above); they start on for a new player.

The name, title and look (girl or boy), stars, coins, fairy dust, the outfit (and the one last worn as a girl and as a boy, `looks`), the presents she has (`owned`: a list per wardrobe slot, the treasure shelf's in `treasure`; an older version keeps names it doesn't know in its lists, drops a slot it doesn't know, and the next save from this one puts it back, since two saves' lists are joined), recent words, the question history, her level per kind of question (`skill`), the reading log (`books`: `{ [bookId]: { read, quizRight, got } }`, where `got` lists the questions already paid, and `{ ['self:' + id]: { read, last } }` for the books she reads herself), the hint setting (`pictures`, with `stamps: { pictures: { v, at } }` once a parent changed it), the sticker album (`stickers`: `{ [word]: { e, n, at, new } }`), the medals (`medals`: `{ 'house:C' or 'village:forest': when }`), the gift meter's pips (`gifts`), the dust fed to each fairy friend (`friends`), the parent settings (`settings`: `{ playLimit, hideMute, twoSyllables, music, at, stamps }`, `music: false` when a parent turned the background music off, `stamps: { [setting]: { v, at } }` the value a parent set and when, `at` the newest of those, for older versions), the first-steps pointer (`guide`), today's play time (`playtime`) and today's quests (`quests`: `{ day, picks, got: { [device]: { [quest]: n } }, chest }`; two tablets' saves take the later day, and on the same day add up their counts and keep the chest open if either opened it) are saved in the browser.

- **Accounts**: before the start screen, 로그인 / 회원가입 asks only for an id
  (3–20 lowercase letters, digits or _) and a password (6 or more
  characters; accounts made before with 4 or 5 keep working). Signed in,
  the whole save is kept on the server as well, so another tablet that
  logs into the same account gets the same progress.
  Two tablets can play at once, say one the princess and one the captain
  edition: when one saves after the other, the two saves are put together
  in place, without a reload (`js/progress.js`). Answers, presents and books
  are joined, and stars, coins and fairy dust are counted per device
  (`earned` / `spent` in the save, which is marked `fmt: 2`), so both
  tablets' stars add up. The save keeps the plain totals and any fields a
  newer version added, so an older version of the game can still read it.
  Totals uploaded by an older version (no `fmt`) are taken as a floor
  under one "old client" entry, never added on top of the per-device
  counts they already include (`node tools/check-merge.js`). The outfit
  and name come from the tablet playing that edition, or else from the
  copy saved on the newer server version. The tablet stays signed in, and
  the game keeps working offline and uploads again later (one upload at a
  time). "계정 없이 할래요" plays with the browser-only save; 🔑 로그인 /
  로그아웃 is at the top right of the start screen. Logging in on a tablet that was played as a guest adds that
  progress to the account (its stars count on top of the account's) and
  says so in a short note ("이 기기의 별 42개를 계정에 합쳤어요"); a copy of
  the tablet's old save stays in its browser as `pixeltown-v2-backup-<time>`
  (the last three).
  The account password is also the parent password (`Account.verify` in
  `js/account.js`); without an account it is `0000`.

## Customizing

Content lives in `js/data.js`: the default name and the titles (`TITLES`), the letters and words,
the wardrobe options, the villagers and the house positions.

### Voices and lines

What people say comes from `LINES` and `PERSONA` in `js/data.js`. Every line
is pre-recorded with Amazon Polly's generative voices into `audio/tts/`: one
voice per kind of villager (`tts` in `VOICES`, which `VOICES` in
`tools/polly-build.py` maps to a Polly voice) and a narrator (Ruth) for
answers, letter names, letter sounds and the library's books. People who
share a Polly voice are told apart by `lift` in `VOICES`: their chit-chat
plays a little faster and higher (or slower and deeper). Questions, quiz
words and letter sounds always play exactly as recorded.

How a clip is made (`tools/polly-build.py`, `tools/clipaudio.py`):

- A lone word is said as a short sentence ("Cat."), so its pitch falls and
  nothing comes before it. A word starting with b, d, g or j loses any long
  hum before its burst (which sounded like "uh-bear"), and so do the letter
  names B, D, G and J.
- A letter on its own ("H" on the sticker book's tabs) is said from
  phonemes; if that fails the checks, the fix step says its name as a word
  ("Aitch."), then the bare letter.
- Every clip is high-passed at 70 Hz and trimmed, then gets its voice's gain
  (`tools/polly-gains.json`, set towards -20 LUFS by the normalise step) and
  a peak limiter.
- Pure letter sounds: a "/m/" line is the narrator's /m/ cut from its own
  recording of a word (`tools/letter-sounds.json`: m from "ham", s from "bus"
  and so on): continuants held about half a second with no vowel, short
  vowels 0.4 s, p/t/k the burst and its breath up to the vowel's voice
  (drawn out to 130 ms), b/d/g the voice before the burst, the burst and its
  release (about 100-110 ms), ch, j and q about 180-200 ms, w and y their
  steady start held 190 ms, never a vowel ("b", not "buh"). How each kind is
  cut (`KINDS` in `tools/clipaudio.py`) is part of its clips' ids, so a new
  cut re-cuts the sounds and re-makes the lines built from them. In "M says mmm." the
  speaker says "M says" and the narrator's /m/ follows. The automatic checks
  only catch a cut in the wrong place, so listen to them all on
  `tools/letter-sounds.html` (open it from the repository or the site).
- A clip's id (its file name) covers the voice, the text, the processing and
  the gain, so any change gives new URLs. Clips of the deployed build
  (`main`) are kept one more release for tabs that are still open.

Recording runs in GitHub Actions (`.github/workflows/polly.yml`, with the
AWS keys in the repository's secrets). After changing lines, words or the
default name, change `tools/polly-run.json` on a branch and push, e.g.
`{ "mode": "all", "run": 8, "check": "changed", "fix": true }`. The workflow
lists every line (`node tools/tts-phrases.js`), records the new ones, checks
every clip, records failing lines again and commits the clips to the
branch; `"normalise": true` then evens out the voices' loudness, and
`"mode": "check"` or `"normalise"` re-checks or re-levels without recording.

The checks:

- `tools/clip-check.py` (acoustic, no model) writes `tools/clip-check.json`:
  silent clips, a lone word said twice, a clip far longer or shorter than the
  same line in other voices, a late start (a hum or "uh" before a word), a
  lone word rising like a question, long gaps, true peaks over -1 dBTP, and
  a lone letter name over 900 ms ("H" said as "h-i-h").
- `tools/voice-check.py` listens with Whisper as a second opinion, failing a
  clip only where the acoustic measures agree (`tools/voice-check.json`). A
  lone letter must be heard as the letter or its name ("H", "aitch").
- The fix step records failing lines again in another way (wrapped in a
  sentence, then after "Listen." with that cut off), never with another
  engine, and keeps the first that passes.
- `python tools/check-recordings.py` is the gate before deploying: every
  line has a clip, every clip was made on its voice's engine, and both
  reports were made for this very `audio/tts/index.js` with nothing failing.

To record without the workflow (AWS keys in the environment, plus
`pip install boto3 numpy` and ffmpeg):

```sh
node tools/tts-phrases.js                # lists every line the game can say
python tools/polly-build.py --mode all   # then: --mode fix, --mode normalise
python tools/clip-check.py
python tools/letter-sounds.py --sheet sheet.png   # try the letter-sound cutter (Pillow)
python tools/letter-sounds.py --built --sheet sheet.png   # spectrograms of the recorded sounds
python tools/test-voices.py --plan       # checks of the cutter and the letter rules (no AWS),
                                         # and what the next workflow run would record
```

`tools/tts-build.py` can still record everything with the open-source
[Kokoro](https://github.com/thewh1teagle/kokoro-onnx) model as an offline fallback.

Lines that are not recorded, such as a name typed on the start screen, come
from the live speech server when `TTS_SERVER` is set, otherwise from the
device's own voice.

## Before deploying

`node tools/smoke.js` (needs the `playwright` package) checks that no two
scripts define the same global and that every scene (village homes too)
builds without errors, for both a girl and a boy hero and the robot, and
that every door can be reached and leads back out where it was; and that
everything in the wardrobe that suits the hero draws walking, riding, in a
portrait and as its wardrobe picture, and shows on the hero (a thing that
looked the same as the next one in its slot would fail).
`python tools/check-recordings.py` checks the recordings (see above).

`node tools/check-visual.js` checks both editions at iPad sizes
(1024 x 768, 1180 x 820, 768 x 1024, 1024 x 700 with Safari's toolbars) and
on a phone held sideways (844 x 390): no villager hidden behind a building,
every word fits its answer card, the person talking stays visible above the
dialog, the buttons a child taps are big enough (64 px), ▶ and the guest
button show without scrolling, the HUD stays on one row with every counter
and button showing, the sticker album and a celebration fit the screen
with every word fitting its sticker, today's adventures fit on one row
without scrolling, every page of the books she reads herself fits its
word tiles in two rows at most, every little game (the pond's and each
village's) fits the screen with its top row on one line, its buttons and
every picture or letter to tap in every round at least 64 px (52 on the
phone), and its pictures big enough to see, and the wardrobe and the shop
fit on every tab for a girl, a boy and the robot (the picture tabs on one
row, tabs and pictures 64 px or 52 on the phone, every picture inside its
tile, a row of them showing, the mirror and the buttons on screen). On a
phone held upright (390 x 844, 375 x 667, 360 x 640) every word tile of
her books and the end card's buttons are on the page and take a tap; on a
very small one (320 x 568) the page may scroll, as long as each comes into
reach.

The HD-2D finish (tilt-shift, bloom and vignette) is drawn in the canvas
under the signs and bubbles. On a slow tablet it turns itself down; add
`?fx=2` (all), `?fx=1` (no tilt-shift) or `?fx=0` (none) to the address to
fix the level.

The other checks, all run by
`.github/workflows/ci.yml` on every push and pull request:

- `node tools/check-merge.js`: the save merge rules (no browser).
- `ROUNDS=30 node tools/quiz-test.js`: thousands of questions from every
  asker, under an empty, a finished and a mixed history; first it runs
  `tools/check-books.js` (every word of her own books readable at its level).
- `node tools/check-tts.js`: every recording has its file, and nothing the
  game says while playing both editions (every little game too) lacks a
  recording.
- `node tools/check-reach.js`: every villager, door and way out can be
  walked to, also with the ride parked.
- `node tools/check-flows.js`: the parent panel pauses the game, its
  password messages, a broken save, the first tap after ▶, today's
  adventures played through in both editions (picked, ticked, the chest
  paying once, kept over a reload, new ones the next day) and at their
  edges (a pick she can no longer do swapped when the account's copy
  comes in, a card left open overnight, a chest an older tab says is
  shut), the robot's cave fight and the Crystal Cave monsters' magic with
  the parent panel over them, reading one
  of her own books to the end (a tapped word said whole, a star once, a
  locked one stays locked), a tap outside each card in both editions at
  the iPad sizes and on a phone held sideways, with a finger and the mouse
  (it closes the ones she only looks at and never a question, a present or
  a book being read, the game is free afterwards, she doesn't walk and
  nothing under it is pressed),
  every little game in both editions with real taps (its button only in
  its host's dialog, what to do said and the finger on the first round, a
  hint after a miss and the answer after two, five rounds won paying the
  coins once and counting for the quest, busy and the music down until it
  closes, nothing past the play limit, the questions at her tier with no
  tier moved, every line said listed for recording),
  presents for a girl, a boy and the robot (every villager gives until
  nobody has anything new: never a repeat, also from a villager whose own
  unicorn or fairy is hers, never something that doesn't suit the hero, a
  village's treasures only from there, and the count full at the end),
  and the background music in both editions (it starts only after the
  first tap, ducks under a line and for a whole question, follows 🔊, the
  parent panel and its setting, a hidden page and the sleeping town, and
  plays nothing and breaks nothing without Web Audio).
- `node tools/check-sync.js`: tablets on one account against a local
  server (needs Python with `fastapi` and `uvicorn`), among them the
  day's chest opened on two tablets before they sync (it pays once), also
  next to the deployed game (`origin/main`: it loads a save with new clothes
  and treasures without an error, and the treasure shelf it drops comes
  back) and the first release (`eee606ec`); with
  `SYNC_SERVER_REF=origin/main` against the server still deployed.
- `pytest server`: the server, on SQLite or the Postgres at `DATABASE_URL`.

Lines not recorded yet are listed; one the game actually says without a
recording only fails with `TTS_STRICT=1` (CI sets it on `main`).

The game is served from `main`, so stamp a build before merging there:
`node tools/stamp.js`, then commit `index.html` and `version.json` (CI on
`main` runs `node tools/check-build.js`, which fails on an unstamped `dev`
build). Open tabs then see the new version.

### Live speech server (optional)

`server/` is a small web service that speaks any line with Kokoro (or
Amazon Polly). To run it on [Railway](https://railway.app):

1. New Project → Deploy from GitHub repo → pick this repository.
2. In the service's Settings, set **Root Directory** to `server`. Railway
   builds the `Dockerfile` there. Give it about 1 GB of memory.
3. Settings → Networking → Generate Domain, then open it: it should show
   `{"ok":true,...}`.
4. Put that address in `TTS_SERVER` in `js/data.js`, for example
   `const TTS_SERVER = 'https://pixeltown-tts.up.railway.app';`, and push.

Optional variables: `ALLOWED_ORIGINS` lists the sites that may call it
(comma separated, or `*`; by default the game's site
`https://dongwookim-ml.github.io` and `localhost` / `127.0.0.1` on any port,
so opening `index.html` as a file needs `ALLOWED_ORIGINS=*` to use the
accounts), and `ENGINE=polly` with `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY` and `AWS_REGION` uses Amazon Polly instead.

`/tts` takes only the game's voices (`POLLY_VOICES`), about 60 lines a
minute per address, makes at most two lines at a time in its own threads
(so the accounts stay quick; more than 8 waiting get a 503 and the game
uses the device's voice) and caches 50 MB of them. Request bodies over
1 MB are refused before they are read. Wrong passwords: 10 per id from one
address, then 429 for that address; from many addresses an id's logins
only slow down (doubling waits up to a minute), and the parent panel's
check is never held up by someone else's tries.

### Accounts on Railway

The same `server/` keeps the accounts (`/auth/signup`, `/auth/login`,
`/auth/verify`, `/save`). Its disk is wiped on every deploy, so give it a
database once:

1. In the Railway project: **+ New** → **Database** → **PostgreSQL**.
2. Open the phonics service → **Variables** → **New Variable**, name
   `DATABASE_URL`, value `${{Postgres.DATABASE_URL}}` (a reference
   variable; Railway fills in the address).
3. Redeploy the service. The home page should now show `"db":"postgres"`.

Pushing to `main` redeploys the server, and the accounts stay in Postgres.
The last 20 saves of each account are kept in the `save_history` table, to
roll back by hand, for example
`SELECT updated, length(data) FROM save_history WHERE user_id = 'yuna' ORDER BY updated DESC;`
then `UPDATE saves SET data = (SELECT data FROM save_history WHERE user_id = 'yuna' AND updated = …), updated = <now in ms> WHERE user_id = 'yuna';`.
A tab still running an older version of the game (its saves have no
`fmt`) gets one 409 once the stored save is `fmt: 2`, so it reloads into
the new version; at most once every 10 minutes, so a tab still served the
old files never keeps reloading. `pytest server` tests it all (SQLite, or
the Postgres at `DATABASE_URL`).
Without `DATABASE_URL` the server uses SQLite at `$DATA_DIR/pixeltown.db`
(default `./data`), which is fine locally or with a Railway Volume mounted
at `DATA_DIR`. The game talks to the server at `TTS_SERVER`.

To run it locally without the speech model (it loads on the first `/tts`):

```sh
cd server && pip install -r requirements.txt
uvicorn app:app --port 8000
```

### Your own recordings

Browser speech voices pronounce isolated sounds unevenly. To use your own
recordings, set `USE_RECORDINGS = true` and add files such as:

```
audio/letters/b.mp3   "buh"
audio/words/bus.mp3   "bus"
```

These win over the Polly recordings; any missing file falls back to them.

## Files

- `js/data.js`: content and settings
- `js/account.js`: login / sign-up and the server save
- `js/progress.js`: putting two copies of the save together (account sync)
- `js/sprites.js`: pixel-art drawing (tiles, cottages, castle, furniture, characters, and the hero's clothes, hats, things to hold, wings and capes for a girl and a boy)
- `js/world.js`: town and room layouts, pathfinding
- `js/touch.js`: what things on the map do and say when tapped
- `js/audio.js`: speech and sound effects
- `js/music.js`: the background music, its tunes and how it ducks under speech
- `js/books.js`: the library's story books and their questions
- `js/library.js`: the book list, the reader and the book quiz
- `js/friend.js`: feeding the fairy friend (helper buddy) and how it grows
- `js/minigame.js`: the little games' rounds, hints, coins and card, and the fishing (magnet crane) game at the pond
- `js/village-games.js`: the game in each village (rhyme, spell, blend, read) in both editions
- `js/guide.js`: first-steps pointer, idle nudge, play-time limit and sleep
- `js/quest.js`: today's adventures (missions) and the treasure chest
- `js/game.js`: game loop, camera, input, dialogs, presents, the wardrobe and the shop (tabs and pictures)
- `js/album.js`: the sticker album, the gift and next-gate meters, medals, cheers and their celebrations
- `js/cave-magic.js`: the Crystal Cave monsters' idle moves and their magic, and hers (princess edition)
- `js/monster-village.js`: the Monster Village, its tower and the gate to it in town (both editions)
