// Load both locale files before this script (also works when opened via file://).
// Interface language is a device preference, separate from learning progress.
const I18n = (() => {
  const storageKey = 'pixeltown-language';
  const catalogs = globalThis.PIXELTOWN_LOCALES;
  let language = 'ko';
  try { if (localStorage.getItem(storageKey) === 'en') language = 'en'; } catch (e) { /* private mode */ }

  function t(key, ...values) {
    const message = catalogs[language][key];
    if (typeof message !== 'string') throw new Error(`Missing ${language} translation: ${key}`);
    // One pass: a player's name containing {0} must never become another parameter.
    return message.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match);
  }

  function apply(root = document) {
    document.documentElement.lang = language;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    for (const attr of ['title', 'placeholder', 'aria-label']) {
      root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
    }
    const select = document.getElementById('language-select');
    if (select) select.value = language;
  }

  function set(next) {
    if ((next !== 'en' && next !== 'ko') || next === language) return;
    language = next;
    try { localStorage.setItem(storageKey, next); } catch (e) {
      // A URL fallback keeps language selection usable when storage is unavailable.
      const url = new URL(location.href);
      url.searchParams.set('language', next);
      location.replace(url.href);
      return;
    }
    // Scene names and item labels are built on boot. Reload from the login screen
    // so canvas text, data tables and DOM all use the same language.
    const url = new URL(location.href);
    if (url.searchParams.has('language')) {
      url.searchParams.set('language', next);
      location.replace(url.href);
    } else location.reload();
  }

  if (typeof location !== 'undefined') {
    const requested = /[?&]language=(en|ko)\b/.exec(location.search);
    if (requested) language = requested[1];
  }
  if (typeof document !== 'undefined') {
    apply();
    document.getElementById('language-select').addEventListener('change', e => set(e.target.value));
  }
  return { t, set, apply, get language() { return language; } };
})();
