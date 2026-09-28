import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/mobile-dashboard.png' });
// open mobile nav
const menuBtn = page.locator('button[aria-label="Open menu"]');
await menuBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/mobile-nav.png' });
await browser.close();
console.log(errors.length ? `ERRORS: ${errors.join(', ')}` : 'Mobile OK, no errors');
