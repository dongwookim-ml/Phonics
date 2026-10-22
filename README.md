# PixelTown 🦄

A quarter-view (isometric) pixel-art town where a young child practices
phonics. Every house belongs to a letter; tap it to hear the letter's sound
and a word that starts with it. A little unicorn walks around town with you.

## Play

Open `index.html` in a browser. No build step or server is needed.
It works best on a tablet in landscape. To serve it on a local network:

```sh
npx http-server -p 8080 .
```

## Modes

- 🏡 **Explore**: tap a house. It bounces and says, for example,
  "B. buh, buh. bus!" with a picture bubble. Tap the grass or road to walk
  the unicorn around, and tap the unicorn to say hi.
- 🎯 **Find**: a picture card shows a word with its first letter hidden
  (`?og`). The child taps the house that starts the word. A right answer
  fills in the letter and earns a star; every 5 stars there is a party.
  After two wrong tries the right house glows and the voice gives the
  starting sound as a hint. 🔊 on the card repeats the word.

Stars are saved in the browser.

## Customizing

Everything content-related lives in `js/data.js`:

- `LETTERS`: the letter, its spoken sound, roof colour, and example words.
- `TOWN_MAP`: the 12 x 12 layout. Lowercase letters place houses; the tile
  under each house (one row down) must be road `=` so the unicorn can reach
  the door.

### Recorded voices

Browser speech voices pronounce isolated sounds unevenly. To use your own
recordings, set `USE_RECORDINGS = true` and add files such as:

```
audio/letters/b.mp3   "buh"
audio/words/bus.mp3   "bus"
```

Any missing file falls back to the speech voice.

## Files

- `js/data.js`: letters, words, map
- `js/sprites.js`: pixel-art drawing (tiles, houses, trees, unicorn)
- `js/audio.js`: speech and sound effects
- `js/game.js`: game loop, input, quest logic
