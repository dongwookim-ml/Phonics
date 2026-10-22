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

- The town is 40 x 40 tiles and the camera follows the princess. Tap the
  ground to walk there.
- **Castle**: the princess's home at the top of town. Tap it to walk to the
  gate and go inside the throne room, where the king, the queen and a maid live.
- **Houses**: there are twelve letter houses (A B C D F G H M N P S T). Tap a
  house to walk in. Each house's resident asks words that start with that
  house's letter, and the wall shows the letter and its pictures.
- **Villagers** (♪ bubble): tap one to talk. They say a word out loud and
  the child picks the matching word from **1, 2, 3**. A wrong pick is
  greyed out and the word is said again.
- **Presents**: every right answer offers a present, which can be a dress
  colour, a dress shape, a crown or tiara, a wand or bouquet, or a hair
  colour. The child sees "now" and "after" side by side and chooses to
  wear it now or put it in her wardrobe.
- **Wardrobe**: every present is kept. In the throne room, the 🎀 door on
  the right leads to the princess's own room. Tap the wardrobe or the mirror
  to change clothes freely; presents not yet earned show as ❓.
- 🖼️ toggles picture hints on the answer cards (easier). With it off, the
  child has to read the first letter.

Stars, the outfit and the hint setting are saved in the browser.

## Customizing

Content lives in `js/data.js`: the princess's name, the letters and words,
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
