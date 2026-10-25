// The recorded voices against what the game says:
//  - every recording in audio/tts/index.js has its mp3 file;
//  - every line tools/tts-phrases.js lists today is recorded, and
//    tools/tts-phrases.json (what the recording workflow reads) is up to date;
//  - while playing both editions (dialogs right and wrong, presents, the
//    shop, the cave, doors and links, riding, the wardrobe, the library) with
//    the default name, nothing is said that has no recording (it would come
//    from the live server, or the device's own voice).
// A missing file or a page error always fails. Lines listed but not
// recorded yet (new lines wait for .github/workflows/polly.yml; the game
// may hold them back until then, see Sound.hasClip) are a to-do list. A
// line actually said without a recording fails with TTS_STRICT=1 (CI sets
// it on main), and is listed otherwise.
// Run: node tools/check-tts.js  (needs the playwright package and Chromium)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const STRICT = process.env.TTS_STRICT === '1';
const norm = t => String(t).trim().replace(/\s+/g, ' ');
let failed = 0;
let waiting = 0;
let todo = 0;
const fail = msg => { console.log(`FAIL ${msg}`); failed++; };
const notYet = msg => { console.log(`${STRICT ? 'FAIL' : 'todo'} ${msg}`); waiting++; };
const toRecord = msg => { console.log(`todo ${msg}`); todo++; };

function staticCheck() {
  const index = vm.runInNewContext(`${fs.readFileSync(path.join(root, 'audio/tts/index.js'), 'utf8')};TTS_INDEX`);
  let entries = 0;
  for (const [voice, lines] of Object.entries(index)) {
    for (const [text, id] of Object.entries(lines)) {
      entries++;
      if (!fs.existsSync(path.join(root, 'audio/tts', voice, `${id}.mp3`))) fail(`no file for ${voice}/${id}.mp3 ("${text}")`);
    }
  }
  // tools/tts-phrases.js as it is, with its file write caught instead.
  let listed = null;
  const quietFs = Object.assign({}, fs, { writeFileSync: (f, data) => { listed = JSON.parse(data); } });
  const src = fs.readFileSync(path.join(__dirname, 'tts-phrases.js'), 'utf8');
  new Function('require', '__dirname', 'console', src)(m => (m === 'fs' ? quietFs : require(m)), __dirname, { log() {} });
  // A pure sound ("/m/") is cut from the narrator's own words, so only the
  // ones tools/letter-sounds.json has can ever be recorded.
  const sounds = JSON.parse(fs.readFileSync(path.join(__dirname, 'letter-sounds.json'), 'utf8')).sounds;
  for (const p of listed) {
    const m = /^\/([a-z]+)\/$/.exec(norm(p.text));
    if (m && !sounds[m[1]]) fail(`${p.voice} "${p.text}" is listed, but tools/letter-sounds.json has no such sound to cut`);
  }
  const now = listed.filter(p => !(index[p.voice] && index[p.voice][norm(p.text)]));
  for (const p of now.slice(0, 30)) toRecord(`not recorded: ${p.voice} "${p.text}"`);
  if (now.length > 30) toRecord(`... ${now.length - 30} more lines not recorded`);
  const saved = JSON.parse(fs.readFileSync(path.join(__dirname, 'tts-phrases.json'), 'utf8'));
  const key = p => `${p.voice}|${norm(p.text)}`;
  const savedKeys = new Set(saved.map(key));
  const fresh = listed.filter(p => !savedKeys.has(key(p)));
  if (fresh.length) toRecord(`tools/tts-phrases.json is missing ${fresh.length} line(s), e.g. ${fresh[0].voice} "${fresh[0].text}": run node tools/tts-phrases.js`);
  console.log(`static: ${entries} recordings, ${listed.length} lines listed, ${now.length} not recorded`);
}

// Plays through everything in one edition, noting each line said that has no
// recording. Game timers (later) run when flush() says, in order, so a present
// always comes from the villager who asked and nothing waits on the clock.
async function play(browser, edition) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.goto(`file://${path.join(root, 'index.html')}?edition=${edition}`);
  await page.click('#login-guest');
  const r = await page.evaluate(async () => {
    const norm = t => String(t).trim().replace(/\s+/g, ' ');
    const missing = {};
    const steps = [];
    let spoken = 0;
    const say = Sound.say;
    Sound.say = (parts, who) => {
      for (const p0 of [].concat(parts)) {
        const p = typeof p0 === 'string' ? { text: p0 } : p0;
        if (!p || !p.text) continue;
        spoken++;
        const v = p.narrator || !(who && who.tts) ? TTS_NARRATOR : who.tts;
        if (!(TTS_INDEX[v] && TTS_INDEX[v][norm(p.text)])) missing[`${v} "${norm(p.text)}"`] = (missing[`${v} "${norm(p.text)}"`] || 0) + 1;
      }
      return say(parts, who);
    };
    const queue = [];
    later = (ms, fn) => { queue.push(fn); };
    const flush = () => { for (let i = 0; i < 500 && queue.length; i++) queue.shift()(); };
    const step = (what, fn) => { try { fn(); flush(); } catch (e) { steps.push(`${what}: ${e.message}`); } };
    Sound.toggleMute(); // quicker book timers; what is said is still noted
    ui.mute.textContent = '🔇';
    document.querySelector('.start').classList.add('hidden');
    state.stars = 99;
    const answer = right => {
      const q = state.question;
      if (!q) return;
      if (q.tiles) {
        q.picked = right ? [...q.word].map((l, j) => q.tiles.findIndex((t, i) => t.l === l && !q.picked.slice(0, j).includes(i)))
          : q.tiles.map((t, i) => i).filter(i => !q.word.includes(q.tiles[i].l)).slice(0, q.word.length);
        checkSpell(q);
      } else {
        const i = q.options.findIndex(o => !!o.right === right);
        choose(i, ui.choices.children[i]);
      }
    };
    const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
    for (const n of names) {
      step(`go to ${n}`, () => changeScene(n));
      const sc = state.scene;
      for (const npc of sc.npcs.slice()) {
        if (npc.mount) continue;
        for (let round = 0; round < 3; round++) {
          if (npc.shop) {
            step(`${npc.name}: too few coins`, () => { state.coins = 0; openShop(npc); state.shopPick = shopItems()[0]; buyPick(); closeShop(); });
            step(`${npc.name}: buy`, () => { state.coins = 999; openShop(npc); state.shopPick = shopItems()[0]; buyPick(); acceptReward(round % 2 === 0); closeShop(); });
            continue;
          }
          if (npc.caught) break;
          step(`${npc.name}: wrong`, () => { npc.waitUntil = 0; openDialog(npc); answer(false); });
          step(`${npc.name}: close`, () => { if (state.talking) closeDialog(); });
          step(`${npc.name}: asked again too soon`, () => { openDialog(npc); if (state.talking) closeDialog(); });
          step(`${npc.name}: right`, () => { npc.waitUntil = 0; npc.missed = null; openDialog(npc); answer(true); });
          step(`${npc.name}: present`, () => { if (!ui.reward.classList.contains('hidden')) acceptReward(round % 2 === 0); if (state.talking) closeDialog(); });
        }
      }
      if (n === 'castle2') step('library', () => { openLibrary(); closeLibrary(); library.hintUntil = 0; libraryInvite(); });
      // Every book she reads herself: each word tapped, ▶ on each page, to
      // the end, and a locked one. The reader is quiet while 🔊 shows muted,
      // so it shows sound on here (Sound itself stays muted).
      if (n === 'castle2') step('reading', () => {
        const skill = JSON.stringify(state.skill.read || null);
        ui.mute.textContent = '🔊';
        openLibrary();
        selfLocked(document.createElement('button'));
        state.skill.read = Object.assign(Quiz.skill('read'), { t: 4 });
        for (const book of DECODABLE_BOOKS) {
          openSelfBook(book);
          for (let i = 0; i < book.pages.length; i++) {
            document.querySelectorAll('#rd-text .rd-word').forEach(b => b.click());
            library.self.ready[library.page] = true;
            selfPlay();
            selfTurn(1);
          }
        }
        closeLibrary();
        ui.mute.textContent = '🔇';
        state.skill.read = JSON.parse(skill) || undefined;
      });
      if (n === 'yuna') step('wardrobe', () => { openWardrobe(); closeWardrobe(); });
      for (const l of sc.links || []) if (l.needStars) step('locked', () => Sound.say([{ text: line('locked', { stars: l.needStars }) }]));
      if (sc.outdoor) {
        step('ride', () => {
          const k = Object.keys(UNICORNS).find(x => x !== 'none');
          if (!state.owned.ride.includes(k)) state.owned.ride.push(k);
          state.outfit = Object.assign({}, state.outfit, { ride: k });
          getOn();
          getOff();
        });
      }
    }
    // Ways in and out.
    step('town', () => changeScene('town'));
    for (const d of state.scene.doors) step(`door ${d.target}`, () => { enterDoor(d); flush(); leaveRoom(); });
    for (const n of ['town', 'forest', 'unicorn', 'fairy', 'castle', 'castle2', 'yuna', 'dungeon']) {
      for (const l of sceneFor(n).links || []) step(`${n} → ${l.target}`, () => { changeScene(n); flush(); followLink(l); });
    }
    Sound.say = say;
    return { spoken, missing: Object.entries(missing).sort((a, b) => b[1] - a[1]), steps };
  });
  console.log(`${edition}: ${r.spoken} lines said, ${r.missing.length} without a recording`);
  for (const [line, times] of r.missing.slice(0, 30)) notYet(`${edition}: said without a recording (${times}x): ${line}`);
  if (r.missing.length > 30) notYet(`${edition}: ... ${r.missing.length - 30} more`);
  for (const s of r.steps) fail(`${edition}: ${s}`);
  for (const e of errors) fail(`${edition}: page error: ${e}`);
  await page.close();
}

(async () => {
  staticCheck();
  const browser = await launch();
  try {
    for (const edition of ['princess', 'captain']) await play(browser, edition);
  } finally {
    await browser.close();
  }
  if (STRICT) failed += waiting;
  const left = waiting + todo;
  console.log(failed ? `${failed} problem(s)` : left ? `recordings OK (${left} line(s) still to record)` : 'recordings OK');
  process.exit(failed ? 1 : 0);
})();
