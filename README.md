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
- **Boy hero**: a boy has short hair and wears a tunic, prince coat or king's
  robe (in the same colours as the dresses), a prince circlet, king crown or
  feather hat, and carries a sword, golden sceptre or the forest's star
  sword. Presents only offer things that suit the hero; capes, crowns, hair
  colours and unicorns suit both. Each look remembers its own outfit.

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
  instead of the letter question. A wrong pick is greyed out and the
  question is said again.
- **No repeats**: a person never asks the same kind of question twice in a
  row, and the last 24 answers are kept out of new questions (saved with the
  game). The mix lives in `QUIZ_TYPES` and the builders in `js/quiz.js`.
- **Solved questions and review**: every question has a stable id
  (`rhyme:cat`, `sentence:The {} says moo.`) and each kind has a pool of all
  its ids (`reviewPool(kind, npc)`; house pools are per letter). Answers are
  saved in `history` (tries, right, wrong, last time). Questions she has
  already got right are not asked again until the whole pool is done; a
  miss stays a miss even if the retry is right. Then that kind switches to
  review (a 복습 tag on the dialog), which favours the ones she missed and
  the ones not seen for a while.
- **Parent panel (⚙️, top right)**: asks for the login password (0000
  without an account) and shows stars, coins, fairy dust and answers, a
  bar per question kind (right / missed / not tried, out of the pool) with
  the first-try accuracy, the most-missed questions and the last 7 days.
  The game is paused while it is open. Code in `js/parent.js`.
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
- **Unicorn Village (level 3)**: a gate at the south end of the forest path
  opens at 25 stars. The unicorns and their friends (♥ bubble) ask sentence
  questions: hear "The cow says moo." and pick *cow* from words that sound
  alike, or hear "I eat a red, hmm hmm." and pick the word that makes sense.
  Sentences live in `SENTENCES` in `js/data.js`.
- **Unicorns**: right answers in the Unicorn Village give one of eight
  unicorns. Tap 🦄 (top right) or the waiting unicorn to ride, which is
  faster than walking. She gets off at the door of a house or the castle and
  the unicorn waits outside. Pick which unicorn to ride in the wardrobe.
- **Crystal Cave (level 4)**: a rocky hill at the west end of the forest's
  cross path opens at 30 stars (`DUNGEON_STARS`). Cute monsters (◆ bubble:
  slimes, a bat, a ghost, a baby dragon, a mushroom) ask the same sentence
  questions as the Unicorn Village. A right answer catches the monster: it
  goes poof and drops 1–3 🪙 coins instead of a star and a present. Caught
  monsters come back after a minute or when she walks in again. Monsters
  live in `DUNGEON_NPCS` in `js/data.js`.
- **Starlight Shop**: the golden cottage on the forest's cross path. Tap it
  or the shopkeeper (🪙 bubble) to buy anything she doesn't own yet with
  coins, including a few shop-only treasures (crystal dress, silver hair,
  gem headband, firefly lantern). Prices are in `shopPrice()` in
  `js/game.js`, or `price` on an item.
- **Fairy Village (level 5)**: a gate at the east end of town's lower road
  opens at 15 stars (`FAIRY_STARS`). Giant flowers and toadstools, teacup
  and tulip cottages and a lily pond. The fairies (✨ bubble) ask spelling
  questions: hear "cat", see 🐱 and three blanks, and tap the letter tiles
  c, a, t in order (each tap says the letter's sound; 지움 takes back the
  last letter; a keyboard works too). The words are the game's own short
  words where every letter says its sound (`spell` in `js/quiz.js`).
- **Fairy friends**: right answers in the Fairy Village give one of six
  little fairies (each fairy villager offers her own first). Her fairy
  flies above her head and trails after her, also while riding; pick one
  in the wardrobe. Every right answer there also gives 2–4 ✨ fairy dust,
  shown next to the stars. What dust is for is not decided yet; it is saved.
- **Royal library (castle 2nd floor)**: tap a bookcase, or the librarian's
  "📖 책 읽어주세요" button, for ten short fairy tales and fables retold in
  simple English. The reader reads each sentence aloud and highlights it,
  turning pages on its own (⏸ pauses, ◀ ▶ turn pages, tap a sentence to hear
  it). After the last page come three questions; each right answer pays
  🪙 1 coin, but only the first time that question is answered right, so
  re-reading is free but can't farm coins. A wrong answer gets a second try,
  then the answer is shown. Books live in `BOOKS` in `js/books.js`; the
  reader is `js/library.js`.
- 🖼️ toggles picture hints on the answer cards (easier). With it off, the
  child has to read the first letter.

The name, title and look (girl or boy), stars, coins, fairy dust, the outfit, recent words, the question history, the reading log (`books`: `{ [bookId]: { read, quizRight, got } }`, where `got` lists the questions already paid) and the hint setting are saved in the browser.

- **Accounts**: before the start screen, 로그인 / 회원가입 asks only for an id
  (3–20 lowercase letters, digits or _) and a password (4 or more
  characters). Signed in, the whole save is kept on the server as well, so
  another tablet that logs into the same account gets the same progress.
  Two tablets can play at once, say one the princess and one the captain
  edition: when one saves after the other, the two saves are put together
  in place, without a reload (`js/progress.js`). Answers, presents and books
  are joined, and stars, coins and fairy dust are counted per device
  (`earned` / `spent` in the save), so both tablets' stars add up. The
  outfit and name come from the tablet playing that edition, or else from
  the copy saved on the newer server version. The tablet stays signed in,
  and the game keeps working offline and uploads again later (one upload
  at a time). "계정 없이 할래요" plays with the
  browser-only save; 🔑 로그인 / 로그아웃 is at the top right of the start
  screen. Logging in on a tablet that was played as a guest adds that
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
is pre-recorded with the open-source [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
voice model into `audio/tts/`, one natural voice per kind of villager
(`tts` in `VOICES`) and a narrator voice for quiz words and letter sounds.

After changing lines, words or the default name, record again:

```sh
pip install kokoro-onnx soundfile        # once, plus ffmpeg
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
node tools/tts-phrases.js                # lists every line the game can say
python tools/tts-build.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin
```

Lines that are not recorded, such as a name typed on the start screen, come
from the live speech server when `TTS_SERVER` is set, otherwise from the
device's own voice.

## Before deploying

`node tools/smoke.js` (needs the `playwright` package) checks that no two
scripts define the same global and that every scene builds without errors,
for both a girl and a boy hero.

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

Optional variables: `ALLOWED_ORIGINS=https://dongwookim-ml.github.io` to
accept calls only from the game, and `ENGINE=polly` with `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY` and `AWS_REGION` to use Amazon Polly instead.

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

These win over the Kokoro recordings; any missing file falls back to them.

## Files

- `js/data.js`: content and settings
- `js/account.js`: login / sign-up and the server save
- `js/progress.js`: putting two copies of the save together (account sync)
- `js/sprites.js`: pixel-art drawing (tiles, cottages, castle, furniture, characters)
- `js/world.js`: town and room layouts, pathfinding
- `js/audio.js`: speech and sound effects
- `js/books.js`: the library's story books and their questions
- `js/library.js`: the book list, the reader and the book quiz
- `js/game.js`: game loop, camera, input, dialogs, presents
