import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });

// wait for service worker to activate
const swState = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.ready;
  return reg.active ? reg.active.state : 'no-active-worker';
});
console.log('Service worker state:', swState);

// check manifest link present
const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
console.log('Manifest linked:', manifestHref);

// check installability-relevant meta tags
const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
const appleCapable = await page.getAttribute('meta[name="apple-mobile-web-app-capable"]', 'content');
console.log('theme-color:', themeColor, '| apple-mobile-web-app-capable:', appleCapable);

await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/pwa-online.png' });

// Now go fully offline and reload
await context.setOffline(true);
await page.reload({ waitUntil: 'load' }).catch((e) => console.log('reload error (expected if not cached):', e.message));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/pwa-offline.png' });

const bodyText = await page.textContent('body').catch(() => '');
const stillWorks = bodyText && bodyText.includes('EMD-TS');
console.log('App still renders while fully offline:', stillWorks);

// try navigating to another route while offline
await page.goto(`${BASE}/#/dashboard-does-not-exist`, { waitUntil: 'load' }).catch(() => {});
await page.waitForTimeout(500);
const stillOk = (await page.textContent('body').catch(() => '')).includes('EMD-TS');
console.log('SPA shell still serves while offline on unknown route:', stillOk);

await context.setOffline(false);
await browser.close();

if (!stillWorks) {
  console.log('FAIL: app did not work offline');
  process.exit(1);
}
if (errors.length) {
  console.log('Errors:', errors);
}
console.log('\nPWA offline check PASSED');
