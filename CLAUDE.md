# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PixelTown: an isometric pixel-art browser game where a young Korean-speaking child practises English phonics (plus a math village). Plain HTML/CSS/JS with **no build step, no bundler, no package.json**; opening `index.html` from the file system must keep working. A small optional FastAPI service in `server/` provides accounts, save sync and live TTS fallback. The game is served by GitHub Pages straight from `main`.

`README.md` (about 1,200 lines) is the detailed spec of every feature and names the constants and functions behind each rule; grep it for a feature before changing that feature, and update it when behaviour changes. `docs/ROADMAP.md` (Korean) records the improvement plan and release rows.

## Commands

```sh
npx http-server -p 8080 .          # serve locally (or just open index.html)
node tools/stamp.js                # stamp a build id; regenerates en/ and ko/ index.html and version.json
cd server && pip install -r requirements.txt && uvicorn app:app --port 8000
pytest server -q                   # server tests (SQLite; Postgres when DATABASE_URL is set)
pytest server -q -k <name>         # a single server test
```

There is no test runner: each check is a standalone Node script in `tools/` that exits non-zero on failure. Browser checks need Playwright (not vendored): `npm install --no-save --no-package-lock playwright@1.63.0 && npx playwright install chromium`. `tools/browser.js` picks Chromium from `CHROMIUM`, then `/opt/pw-browsers/chromium`, then Playwright's download. Pages are loaded as `file://` URLs.

`.github/workflows/ci.yml` is the authoritative list and order of checks. The ones used most:

| Check | Covers |
| --- | --- |
| `node tools/check-i18n.js` | locale keys, placeholders, source coverage (no browser, fast) |
| `node tools/check-merge.js` | save merge rules (no browser, fast) |
| `node tools/smoke.js` | duplicate globals across scripts; every scene builds, doors are reachable, every wardrobe item draws |
| `ROUNDS=30 node tools/quiz-test.js` | thousands of generated questions from every asker |
| `node tools/check-levels.js` | tier / mastery / next-stage rules |
| `node tools/check-tts.js` | every line spoken while playing both editions has a recording |
| `node tools/check-visual.js` | layout at iPad and phone sizes (not in CI) |
| `node tools/check-flows.js` | long end-to-end flows (about 10 minutes) |
| `node tools/check-sync.js` | multi-tablet account sync against a local server (needs Python with `fastapi`, `uvicorn`) |

Useful environment switches:

- `ONLY=<substring>` runs matching named parts of `check-flows.js` and `check-sync.js` (part names are the keys of the `parts` object near the end of each file, e.g. `ONLY=music`, `ONLY=Captain`). This is the way to run a "single test" there.
- `UI_LANGUAGE=en` runs `smoke.js` / `check-visual.js` in the English UI (default `ko`).
- `AUDIT_LANGUAGE=en TTS_STRICT=0 node tools/check-tts.js` audits the English UI for leftover Korean.
- `TTS_STRICT=1` makes a spoken-but-unrecorded line a failure; CI sets it only on `main`.
- `TITLE=queen node tools/check-heroes.js` checks one hero title; `SHOW=1` prints extra detail in `check-flows.js`.
- `SYNC_SERVER_REF=origin/main` runs `check-sync.js` against the deployed server code; it also plays the deployed game from `origin/main`, so it needs full git history.

## Architecture

### Scripts are globals in a fixed load order

Every file in `js/` is a classic `<script>` listed in `index.html`; there are no modules. Top-level `const`/`function` names are shared globals, load order is dependency order (locales → `i18n.js` → `data.js` → audio indexes → `audio.js` → sprites/world/scenes → quiz → features → `game.js` → `parent.js` → `update.js`), and a duplicate top-level name silently replaces the earlier one (`smoke.js` fails on that). A new script must be added to `index.html` in the right place, then `node tools/stamp.js` run so `en/index.html` and `ko/index.html` (generated copies with `<base href="../">`) match; never edit those two by hand.

Tools that need game data without a browser (`tts-phrases.js`, `check-merge.js`, `check-i18n.js`) evaluate the `js/` files with Node's `vm`, so those files must stay loadable outside a DOM.

### Two editions, one codebase

`EDITION` in `js/data.js` is `'princess'` (original) or `'captain'` (robot hero), chosen at login or by `?edition=captain`. Captain scenes are registered by name in `CAPTAIN_SCENES` from `js/captain-*.js`; a scene without an entry uses the princess builder. One save holds both editions: skill tiers (`state.skill`) are shared, while question history and the stars/coins/dust counters are kept per edition (`editionSave` in `js/game.js`, `Progress.tally`), the counters also per device. Most features have to work, be translated and be recorded for both, and most checks play both. Other URL switches: `?language=en|ko`, `?halloween=0|1`, `?fx=0|1|2`.

### Core modules

- `js/data.js`: all content and tuning (word banks, `TIERS`, `TIER_BAND`, `QUIZ_TYPES`, `LINES`, `PERSONA`, `VOICES`, NPC tables, wardrobe items, `TTS_SERVER`).
- `js/quiz.js`: question builders per kind, adaptive tier selection (`nextKind`, `Quiz.skill`), no-repeat and review pools. Each builder supplies the `teach`, `picked` and `model` lines used after a miss.
- `js/game.js`: main loop, camera, input, dialogs, the answer flow (`choose` → `missed` → `hint` / `showAnswer` → `finishShown`), presents, wardrobe, shop, local save.
- `js/world.js` + `js/sprites.js`: scene layouts, pathfinding and all pixel art drawn in code to canvas. Village files (`neighborhoods.js`, `monster-village.js`, `math-village.js`, `riverside-park.js`, …) add scenes.
- `js/progress.js` + `js/account.js`: the save format (`Progress.FMT`) and `Progress.merge`, which joins two copies of a save without losing anything (counters per device, history joined). Open tabs on older builds and the deployed server keep talking to new code, so save changes must stay backward compatible; `check-sync.js` plays against `origin/main` and the first release to enforce it.
- `js/update.js` polls `version.json` so open tabs reload onto a new build.
- `js/heroes.js` + `js/heroes/<title>.js`: one character kit per title (princess edition).

### Text: i18n versus learning content

UI text lives in `js/locales/ko.js` and `js/locales/en.js` with identical keys, read through `I18n.t(key, ...values)` (`{0}` placeholders) or `data-i18n*` attributes in HTML. Never put Korean display text in JS or HTML. English phonics words, stories and spoken lesson lines are learning content and stay in the data tables, always spoken in English regardless of UI language.

### Speech: everything said must be pre-recorded

Three clip stores, each with a generated `index.js` loaded before `js/audio.js`:

- `audio/tts/`: the main Polly generative recordings, one folder per voice. Clip ids hash voice + text + processing + gain, so any change produces new URLs. Recorded only by `.github/workflows/polly.yml` (AWS keys are repository secrets), triggered by changing `tools/polly-run.json` on a non-`main` branch; the workflow commits clips back to the branch. Do not hand-edit `audio/tts/index.js`, `tools/tts-phrases.json`, `tools/clip-check.json` or `tools/voice-check.json`.
- `audio/math/` and `audio/quests/`: math lessons and quest instructions, built locally by `python3 tools/record-math.py` (`--lesson quests`, `--plan`) from the speech server, with a `manifest.json` of hashes; resolved through `MathSpeech.clip` / `QuestSpeech.clip`.

`tools/tts-phrases.js` enumerates every line the game can say; a new spoken line must be reachable from it or `check-tts.js` reports it. Unrecorded lines fall back to the live server (`TTS_SERVER`), then the device voice; `Sound.hasClip` lets features hold a line back until it is recorded. `python tools/check-recordings.py` is the recordings gate before deploying.

### Deploying

`main` is production. Before merging there, run `node tools/stamp.js` and commit `index.html`, `en/index.html`, `ko/index.html` and `version.json`; CI on `main` runs `tools/check-build.js` (stamp consistency) and strict TTS. Pushing to `main` also redeploys `server/` on Railway (accounts in Postgres via `DATABASE_URL`, SQLite otherwise).

## Conventions

- The player is about five and plays on a tablet: tap targets are at least 64 px (52 px on a phone), layouts must fit the sizes in `check-visual.js`, and a wrong answer never ends a dialog.
- Art is drawn in code or stored as local WebP in `img/`; no external image services at runtime.
- Comments and commit messages are plain descriptive English sentences (e.g. "Add a playful riverside park and fishing dock"); "Stamp build" commits carry the stamp alone.
