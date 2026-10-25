// Stamps a new build id before a deploy: the <meta name="build"> and the ?v=
// on every script and stylesheet in index.html, and version.json, which
// js/update.js polls so open tabs know to reload.
// Run: node tools/stamp.js            (id from the current UTC time)
//      node tools/stamp.js 20261025a  (your own id)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const build = process.argv[2] || new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<meta name="build" content="[^"]*">/, `<meta name="build" content="${build}">`);
// Local files only (not the Google Fonts link).
html = html.replace(/((?:src|href)="(?!https?:)[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"/g, `$1?v=${build}"`);
fs.writeFileSync(file, html);
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ build, at: new Date().toISOString() }) + '\n');
console.log('build', build);
