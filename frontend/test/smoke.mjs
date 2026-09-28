import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const ROUTES = [
  '/', '/registration', '/monitoring', '/screening', '/timeline', '/copilot',
  '/referral', '/doctor', '/security', '/blockchain', '/architecture', '/business', '/settings', '/demo',
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

for (const route of ROUTES) {
  const url = `${BASE}/#${route}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  console.log(`Visited ${route} — title: ${await page.title()}`);
}

await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });

await browser.close();

if (errors.length) {
  console.log('\n--- ERRORS FOUND ---');
  for (const e of errors) console.log(e);
  process.exit(1);
} else {
  console.log('\nNo console errors across all routes.');
}
