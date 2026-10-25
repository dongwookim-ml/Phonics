// Tells a tab that is still running an older build that a new one is out.
// tools/stamp.js writes the build id into index.html (the <meta name="build">
// and the ?v= on every script, so a reload fetches fresh files) and into
// version.json at each deploy. This checks version.json now and then; on the
// start or login screen it just reloads, during play it shows a banner and
// reloads when tapped, after saving. A tablet that comes back after a while
// away also just reloads.

const Update = (() => {
  const meta = document.querySelector('meta[name="build"]');
  const running = meta ? meta.content : '';
  const box = document.getElementById('update');
  let shown = false;
  let newest = '';
  let hiddenAt = 0;

  // Nothing to compare against when opened from a file or before stamping.
  const online = () => /^https?:$/.test(location.protocol) && running && running !== 'dev';
  const idle = () => {
    const visible = id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
    const typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    const signingIn = document.getElementById('login-go') && document.getElementById('login-go').disabled;
    return (visible('start') || visible('login')) && !typing && !signingIn;
  };

  // A reload that still came back old (a CDN copy not yet updated) must not
  // reload again by itself, or the login screen would keep reloading.
  const tried = () => { try { return sessionStorage.getItem('pixeltown-reloaded-for'); } catch (e) { return null; } };

  function reload() {
    try { sessionStorage.setItem('pixeltown-reloaded-for', newest); } catch (e) { /* private mode */ }
    try { if (typeof save === 'function' && typeof state !== 'undefined') save(); } catch (e) { /* keep going */ }
    // A new query string makes sure the page itself isn't served from cache.
    const q = new URLSearchParams(location.search);
    q.set('v', newest || String(Date.now()));
    location.replace(`${location.pathname}?${q}${location.hash}`);
  }

  function show() {
    if (shown || !box) return;
    shown = true;
    box.classList.remove('hidden');
    if (typeof Sound !== 'undefined') Sound.door();
  }

  async function check(back) {
    if (!online() || document.hidden) return;
    try {
      const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return;
      const v = await r.json();
      if (!v.build || v.build === running) return;
      newest = v.build;
      if ((idle() || back) && tried() !== newest) reload(); else show();
    } catch (e) { /* offline: try again later */ }
  }

  if (box) box.querySelector('button').addEventListener('click', reload);
  setTimeout(() => check(), 20000);
  setInterval(() => check(), 3 * 60000);
  // Back after five minutes or more away is a natural break to reload at.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    check(hiddenAt && Date.now() - hiddenAt > 5 * 60000);
  });
  addEventListener('online', () => check());
  return { check, running };
})();
