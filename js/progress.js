// Putting two copies of the save together, for the account sync in
// js/account.js: another tablet on the same account saved first (maybe
// playing the other edition), or a guest's progress joins an account.
// Nothing is lost: answers, presents and books are joined, and stars, coins
// and fairy dust are counted per device, so two tablets' stars add up.
//
// Progress.FMT             the save format written (fmt in the save)
// Progress.device          this device's id in the counters
// Progress.tally(ed)       one edition's counters: { earned, spent }
// Progress.count(state)    puts the live stars, coins and dust in the counters
// Progress.history(h)      the question history without broken entries
// Progress.merge(l, s, how) the local save and the server's, as one
// Progress.played(save)    whether a save has any progress
// Progress.stars(save)     stars in a save, every edition
// Progress.same(a, b)      whether two saves hold the same

const Progress = (() => {
  // Save format 2 (fmt: 2): counters per edition, earned[device] and
  // spent[device], which only ever grow; each device adds to its own entry,
  // so putting two copies together takes the larger of each entry (a
  // grow-only counter). Totals are earned minus spent, and are written too
  // (stars, coins, dust), so an older version of the game can still read
  // the save.
  //
  // A copy without them (no fmt: an older version of the game wrote it, or a
  // save from before) only has totals. Those totals are one "old client"
  // entry, '_', taken as a floor: the old client started from a copy that
  // already had the per-device counts in its totals, so its totals are never
  // added on top of them. Merged with a fmt 2 copy, the result is the fmt 2
  // counts, with '_' raised just enough that each total is at least the old
  // copy's (a max, not a sum). Two copies without counters: the larger of
  // each total. Only a guest's progress joining an account (how 'foreign')
  // adds up in full, since it never was in the account.
  const FMT = 2;
  const FIELDS = ['stars', 'coins', 'dust'];
  const OLD = '_';
  const n = x => { const v = Math.floor(Number(x)); return Number.isFinite(v) && v > 0 ? v : 0; };
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  function randomId(prefix) {
    let s = '';
    try {
      const a = new Uint32Array(2);
      crypto.getRandomValues(a);
      s = a[0].toString(36) + a[1].toString(36);
    } catch (e) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    return prefix + s.slice(0, 12);
  }

  const device = (() => {
    try {
      let id = localStorage.getItem('pixeltown-device');
      if (!id) { id = randomId('d'); localStorage.setItem('pixeltown-device', id); }
      return id;
    } catch (e) {
      return randomId('d'); // private mode: this page only
    }
  })();

  function tallyOf(ed) {
    if (isObj(ed.earned)) return { earned: ed.earned, spent: isObj(ed.spent) ? ed.spent : {}, old: false };
    const e = { stars: n(ed.stars), coins: n(ed.coins), dust: n(ed.dust) };
    return { earned: FIELDS.some(f => e[f]) ? { [OLD]: e } : {}, spent: {}, old: true };
  }
  const copy = map => {
    const out = {};
    for (const [k, e] of Object.entries(map)) if (isObj(e)) out[k] = Object.assign({}, e);
    return out;
  };
  function tally(ed) {
    const t = tallyOf(ed || {});
    return { earned: copy(t.earned), spent: copy(t.spent) };
  }
  function sum(map, f) {
    let s = 0;
    for (const e of Object.values(map)) if (isObj(e)) s += n(e[f]);
    return s;
  }
  function totals(t) {
    const out = {};
    for (const f of FIELDS) out[f] = sum(t.earned, f) - sum(t.spent, f);
    return out;
  }
  function add(map, key, f, d) {
    const e = map[key] = isObj(map[key]) ? map[key] : {};
    e[f] = n(e[f]) + d;
  }
  // Larger of each entry, field by field.
  function maxMap(a, b) {
    const out = {};
    for (const src of [a, b]) {
      for (const [k, e] of Object.entries(src)) {
        if (!isObj(e)) continue;
        const o = out[k] || (out[k] = {});
        for (const [f, v] of Object.entries(e)) o[f] = Math.max(n(o[f]), n(v));
      }
    }
    return out;
  }

  // Whatever changed in the live counters since the last save is this
  // device's: called by save() in js/game.js.
  function count(st) {
    const t = st.tally || (st.tally = { earned: {}, spent: {} });
    const have = totals(t);
    for (const f of FIELDS) {
      const d = (Number(st[f]) || 0) - have[f];
      if (d > 0) add(t.earned, device, f, d);
      else if (d < 0) add(t.spent, device, f, -d);
    }
    return { earned: t.earned, spent: t.spent };
  }

  function counters(l, s, foreign) {
    const A = tallyOf(l);
    const B = tallyOf(s);
    // A guest's progress was never in the account: it all counts on top,
    // under a new key, and the account's old totals stay as they are.
    if (foreign) {
      const key = randomId('g');
      const one = map => { const e = {}; for (const f of FIELDS) e[f] = sum(map, f); return { [key]: e }; };
      A.earned = one(A.earned);
      A.spent = one(A.spent);
      A.old = B.old = false;
    }
    if (A.old !== B.old) {
      // One copy only has totals, written by an older version of the game
      // that started from the other copy's: those totals are a floor.
      const [old, cur] = A.old ? [A, B] : [B, A];
      const out = { earned: copy(cur.earned), spent: copy(cur.spent) };
      const have = totals(out);
      const floor = totals(old);
      for (const f of FIELDS) if (floor[f] > have[f]) add(out.earned, OLD, f, floor[f] - have[f]);
      return out;
    }
    return { earned: maxMap(A.earned, B.earned), spent: maxMap(A.spent, B.spent) };
  }

  // Unknown fields: lists are joined, objects joined key by key, and
  // anything else comes from the copy that is preferred (`a`).
  function join(a, b) {
    if (a === undefined) return b;
    if (b === undefined) return a;
    if (Array.isArray(a) && Array.isArray(b)) {
      const seen = new Set();
      return a.concat(b).filter(x => { const k = JSON.stringify(x); return seen.has(k) ? false : seen.add(k); });
    }
    if (isObj(a) && isObj(b)) {
      const out = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = join(a[k], b[k]);
      return out;
    }
    return a;
  }
  // Progress fields: the same, but numbers take the larger.
  function grow(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (isObj(a) && isObj(b)) {
      const out = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = grow(a[k], b[k]);
      return out;
    }
    return join(a, b);
  }

  // History: per question, the most tries, rights, misses and the latest time.
  function joinHistory(a, b) {
    const out = {};
    for (const src of [a, b]) {
      if (!isObj(src)) continue;
      for (const [id, h] of Object.entries(src)) {
        if (!isObj(h) || typeof h.kind !== 'string') continue;
        const o = out[id];
        const e = Object.assign({}, h);
        for (const f of ['tries', 'right', 'wrong', 'last']) e[f] = n(h[f]);
        out[id] = o ? grow(o, e) : e;
      }
    }
    return out;
  }
  // Books: questions paid joined, read the most times.
  function joinBooks(a, b) {
    const out = grow(isObj(a) ? a : {}, isObj(b) ? b : {});
    for (const [id, x] of Object.entries(out)) {
      if (!isObj(x)) { delete out[id]; continue; }
      if (Array.isArray(x.got)) x.quizRight = Math.max(n(x.quizRight), x.got.length);
    }
    return out;
  }
  // Skill per question kind: the entry with more answers behind it.
  function joinSkill(a, b) {
    if (!isObj(a) || !isObj(b)) return a === undefined ? b : a;
    const out = Object.assign({}, b, a);
    for (const k of Object.keys(b)) {
      if (has(a, k) && isObj(a[k]) && isObj(b[k]) && n(b[k].n) > n(a[k].n)) out[k] = b[k];
    }
    return out;
  }
  // Dust fed to each fairy friend and the first-steps pointer (js/friend.js,
  // js/guide.js) only ever grow, so the larger wins.
  const JOIN = { history: joinHistory, books: joinBooks, owned: grow, skill: joinSkill, friends: grow, guide: grow };
  // The outfit, name and settings come whole from one copy.
  const WHOLE = ['outfit', 'player', 'pictures', 'recent', 'at', 'ver'];
  const COUNTED = ['stars', 'coins', 'dust', 'earned', 'spent'];

  // One edition from two copies; `mineFirst` says whose outfit and name win.
  function joinEdition(l, s, mineFirst, foreign) {
    const [a, b] = mineFirst ? [l, s] : [s, l];
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (COUNTED.includes(k) || k === 'other') continue;
      if (WHOLE.includes(k)) out[k] = a[k] !== undefined ? a[k] : b[k];
      else out[k] = (JOIN[k] || join)(a[k], b[k]);
    }
    const t = counters(l, s, foreign);
    const sums = totals(t);
    for (const f of FIELDS) out[f] = Math.max(0, sums[f]);
    out.earned = t.earned;
    out.spent = t.spent;
    out.fmt = FMT;
    return out;
  }

  // Every edition in a save, by name (one at the top, the rest in `other`).
  function editions(save) {
    const out = {};
    if (!isObj(save)) return out;
    const put = (ed, x) => {
      const e = Object.assign({}, x, { edition: ed });
      delete e.other;
      out[ed] = e;
    };
    if (isObj(save.other)) for (const [ed, x] of Object.entries(save.other)) if (isObj(x)) put(ed, x);
    put(save.edition || 'princess', save);
    return out;
  }
  // The other way round, with the edition played here at the top.
  function build(eds) {
    const top = Object.assign({}, eds[EDITION] || {}, { edition: EDITION, fmt: FMT });
    top.other = {};
    for (const [ed, x] of Object.entries(eds)) if (ed !== EDITION) top.other[ed] = x;
    return top;
  }

  // how: 'mine'    this device has unsent progress: its outfit and name win
  //                in the edition it is playing;
  //      'theirs'  nothing unsent here: the server's copy is the newer one;
  //      'foreign' a guest's save joins an account: every count adds up, and
  //                the outfit and name come from whichever has more stars.
  // The other edition's outfit comes from the copy written on the newer
  // server version (`ver`, the server's clock, not the device's).
  function merge(local, server, how) {
    const L = editions(local);
    const S = editions(server);
    const out = {};
    for (const ed of new Set([...Object.keys(S), ...Object.keys(L)])) {
      const l = L[ed];
      const s = S[ed];
      if (!l || !s) { out[ed] = l || s; continue; }
      let mineFirst;
      if (how === 'foreign') mineFirst = totals(tallyOf(l)).stars > totals(tallyOf(s)).stars;
      else if (ed === EDITION) mineFirst = how === 'mine';
      else mineFirst = n(l.ver) > n(s.ver);
      out[ed] = joinEdition(l, s, mineFirst, how === 'foreign');
    }
    return build(out);
  }

  // load() in js/game.js keeps only answers it can show: a known kind and
  // plain numbers (a broken or edited save can't reach the parent panel).
  function history(h) {
    const out = {};
    if (!isObj(h)) return out;
    const kinds = typeof Quiz !== 'undefined' ? Quiz.kinds : null;
    for (const [id, x] of Object.entries(h)) {
      if (!isObj(x) || typeof x.kind !== 'string' || (kinds && !kinds.includes(x.kind))) continue;
      const nums = ['tries', 'right', 'wrong', 'last'].map(f => (x[f] === undefined ? 0 : x[f]));
      if (nums.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0)) continue;
      out[id] = x;
    }
    return out;
  }

  function played(save) {
    return Object.values(editions(save)).some(ed => {
      const t = totals(tallyOf(ed));
      return t.stars > 0 || t.coins > 0 || t.dust > 0 || (isObj(ed.history) && Object.keys(ed.history).length > 0);
    });
  }
  function stars(save) {
    return Object.values(editions(save)).reduce((a, ed) => a + Math.max(0, totals(tallyOf(ed)).stars), 0);
  }

  // JSON with sorted keys, so two copies compare by what they hold.
  function canon(x) {
    if (Array.isArray(x)) return `[${x.map(canon).join(',')}]`;
    if (isObj(x)) return `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canon(x[k])}`).join(',')}}`;
    return JSON.stringify(x === undefined ? null : x);
  }
  const same = (a, b) => canon(editions(a)) === canon(editions(b));

  return { FMT, device, tally, count, merge, history, played, stars, same, editions };
})();
