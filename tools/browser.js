// Starts Chromium for the checks in tools/: CHROMIUM if set, else the one
// at /opt/pw-browsers (a dev container), else Playwright's own download
// (npx playwright install chromium, as in .github/workflows/ci.yml).

const fs = require('fs');
const { chromium } = require('playwright');

const LOCAL = '/opt/pw-browsers/chromium';

function launch(opts = {}) {
  const executablePath = process.env.CHROMIUM || (fs.existsSync(LOCAL) ? LOCAL : undefined);
  return chromium.launch(Object.assign({ executablePath }, opts));
}

module.exports = { launch };
