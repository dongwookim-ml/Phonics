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
  왕자 prince, 여왕 queen, 기사 knight, 요정 fairy, 마법사 wizard, 탐험가
  explorer, 선장 captain). A Korean name is turned into Latin letters for the
  English voice (윤아 → Yuna); fix the spelling by hand if it sounds wrong and
  tap 🔊 to hear it. Villagers then greet her as "Prince Seoyeon" and so on.

- The town is 40 x 40 tiles and the camera follows the princess. Tap the
  ground to walk there.
- **Castle**: the princess's home at the top of town. Tap it to walk to the
  gate and go inside the throne room, where the king, the queen and a maid live.
- **Houses**: there are twelve letter houses (A B C D F G H M N P S T). Tap a
  house to walk in. Each house's resident asks words that start with that
  house's letter, and the wall shows the letter and its pictures.
- **Villagers** (♪ bubble): tap one to talk and they ask a question with
  answers **1, 2, 3**. Town folk mix three kinds: pick the word you hear,
  pick the letter a word starts with, or find the word that rhymes. House
  residents ask for the picture that starts with their house's letter
  instead of the letter question. A wrong pick is greyed out and the
  question is said again.
- **No repeats**: a person never asks the same kind of question twice in a
  row, and the last 24 answers are kept out of new questions (saved with the
  game). The mix lives in `QUIZ_TYPES` and the builders in `js/quiz.js`.
- **Presents**: every right answer offers a present, which can be a dress
  colour, a dress shape, a crown or tiara, a wand or bouquet, or a hair
  colour. The child sees "now" and "after" side by side and chooses to
  wear it now or put it in her wardrobe.
- **Wardrobe**: every present is kept. In the throne room, the 🎀 door on
  the right leads to the princess's own room. Tap the wardrobe or the mirror
  to change clothes freely; presents not yet earned show as ❓.
- **Starlight Forest (level 2)**: a gate at the south end of the main road
  opens at 10 stars. The forest folk (★ bubble) ask harder questions: four
  words that share the first letter (hug / hut / hat / hen), the missing
  middle sound (c ? t), the missing last sound (ca ?), reading a word with
  no voice and picking its picture, and rhymes. Only the forest gives out fairy wings, a starlight cape and a
  night-sky dress. Word families live in `WORD_FAMILIES` in `js/data.js`.
- 🖼️ toggles picture hints on the answer cards (easier). With it off, the
  child has to read the first letter.

The name and title, stars, the outfit, recent words and the hint setting are saved in the browser.

## Customizing

Content lives in `js/data.js`: the default name and the titles (`TITLES`), the letters and words,
the wardrobe options, the villagers and the house positions.

### Voices and lines

Each kind of villager has its own voice (`VOICES` in `js/data.js`). The game
uses a preferred system voice when the device has one, otherwise any English
voice of the right gender, and pitch and speed keep people distinct even on
a device with a single voice. iPads and Macs usually have the most voices.
What people say comes from `LINES` and `PERSONA`, and a short pause comes
before each quiz word.

### Recorded voices

Browser speech voices pronounce isolated sounds unevenly. To use your own
recordings, set `USE_RECORDINGS = true` and add files such as:

```
audio/letters/b.mp3   "buh"
audio/words/bus.mp3   "bus"
```

Any missing file falls back to the speech voice.

## Files

- `js/data.js`: content and settings
- `js/sprites.js`: pixel-art drawing (tiles, cottages, castle, furniture, characters)
- `js/world.js`: town and room layouts, pathfinding
- `js/audio.js`: speech and sound effects
- `js/game.js`: game loop, camera, input, dialogs, presents
