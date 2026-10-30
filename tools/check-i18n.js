// Validate locale parity, interpolation, every translation reference and UI source coverage.
// Run: node tools/check-i18n.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const files = ['js/locales/ko.js', 'js/locales/en.js', 'js/i18n.js'];
const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const context = vm.createContext({ location: { search: '' } });
vm.runInContext(source, context);
const catalogs = context.PIXELTOWN_LOCALES;
const keys = Object.keys(catalogs.ko).sort();
assert.deepEqual(Object.keys(catalogs.en).sort(), keys);
const slots = text => [...text.matchAll(/\{(\d+)\}/g)].map(m => m[1]).sort().join(',');
for (const key of keys) {
  assert.equal(typeof catalogs.en[key], 'string', key);
  assert.equal(slots(catalogs.en[key]), slots(catalogs.ko[key]), `Interpolation mismatch: ${key}`);
  // The language picker deliberately shows Korean's native name in both languages.
  if (!['ui.language', 'ui.korean'].includes(key)) assert.ok(!/[가-힣]/.test(catalogs.en[key]), `Untranslated English: ${key}`);
}
const runtimeFiles = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'));
for (const file of runtimeFiles) {
  const text = fs.readFileSync(path.join(root, 'js', file), 'utf8');
  for (const match of text.matchAll(/I18n\.t\('([^']+)'/g)) assert.ok(keys.includes(match[1]), `Unknown key in ${file}: ${match[1]}`);
  for (const line of text.split('\n')) {
    if (line.trim().startsWith('//')) continue;
    assert.ok(!/[가-힣]/.test(line.split('//')[0]), `Hardcoded Korean in ${file}: ${line.trim()}`);
  }
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(!/[가-힣]/.test(html), 'Hardcoded Korean in index.html');
for (const match of html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g)) assert.ok(keys.includes(match[1]), `Unknown HTML key: ${match[1]}`);
const englishContext = vm.createContext({ location: { search: '?language=en' } });
vm.runInContext(source, englishContext);
assert.equal(vm.runInContext("I18n.t('account.mergedStarsFromThisDeviceInto', 7)", englishContext), 'Merged 7 stars from this device into your account');
assert.equal(vm.runInContext("I18n.t('game.heroHeading', '{1}', 'Princess')", englishContext), "Princess {1}'s");
assert.equal(vm.runInContext("I18n.t('game.heroHeading', '윤아', '공주')", context), '윤아 공주의');
console.log(`i18n OK: ${keys.length} messages per language; keys, placeholders and source coverage checked`);

for (const [pathname, search, saved, want] of [['/Phonics/en/', '?language=ko', 'ko', 'en'], ['/Phonics/ko/', '?language=en', 'en', 'ko'], ['/en/index.html', '', 'ko', 'en'], ['/Phonics/', '', 'en', 'en']]) {
  const c = vm.createContext({ location: { pathname, search }, localStorage: { getItem: () => saved } });
  vm.runInContext(source, c);
  assert.equal(vm.runInContext('I18n.language', c), want, pathname);
}
