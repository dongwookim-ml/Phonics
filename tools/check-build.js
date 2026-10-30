// What GitHub Pages serves (main) must carry a build id from tools/stamp.js:
// the <meta name="build"> in index.html is not 'dev', version.json has the
// same id, and every local script and stylesheet asks for ?v=<that id>, so a
// tablet never mixes old and new files and js/update.js can tell a new
// version is out. CI runs this on pushes to main.
// Run: node tools/check-build.js

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const problems = [];
const meta = /<meta name="build" content="([^"]*)">/.exec(html);
const build = meta && meta[1];
if (!build) problems.push('index.html has no <meta name="build">');
else if (build === 'dev') problems.push('index.html is not stamped (build "dev"): run node tools/stamp.js and commit index.html and version.json');
let version = null;
try { version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')); } catch (e) { problems.push('no readable version.json'); }
if (version && build && version.build !== build) problems.push(`version.json says ${version.build}, index.html says ${build}`);
for (const m of html.matchAll(/(?:src|href)="(?!https?:)([^"]+\.(?:js|css))(\?v=[^"]*)?"/g)) {
  if (m[2] !== `?v=${build}`) problems.push(`${m[1]} has ${m[2] || 'no ?v='} instead of ?v=${build}`);
}
for (const locale of ['en', 'ko']) {
  const expected = html.replace('<head>', '<head>\n  <base href="../">').replace(/<html lang="[^"]*">/, `<html lang="${locale}">`);
  if (!fs.existsSync(path.join(root, locale, 'index.html')) || fs.readFileSync(path.join(root, locale, 'index.html'), 'utf8') !== expected) problems.push(`${locale}/index.html is stale: run node tools/stamp.js`);
}
for (const p of problems) console.log(`FAIL ${p}`);
console.log(problems.length ? `${problems.length} problem(s)` : `build ${build} OK`);
process.exit(problems.length ? 1 : 0);
