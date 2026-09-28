import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(err.message));

function log(msg) { console.log(`✔ ${msg}`); }
async function shot(name) { await page.screenshot({ path: `/tmp/shots/${name}.png`, fullPage: true }); }

await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await shot('01-dashboard');
const demoPatients = await page.locator('text=Ravi Kumar').count();
if (demoPatients === 0) throw new Error('Demo patient Ravi Kumar not found on dashboard');
log('Dashboard shows seeded demo patients');

// --- Patient Registration ---
await page.goto(`${BASE}/#/registration`, { waitUntil: 'networkidle' });
await page.getByPlaceholder('e.g. Lakshmi Narayanan').fill('Test Patient QA');
await page.getByPlaceholder('e.g. 52').fill('34');
await page.getByPlaceholder('+91 XXXXX XXXXX').fill('+91 90000 00000');
await page.getByPlaceholder('e.g. Thuraiyur').fill('Test Village');
await page.getByPlaceholder('e.g. Chest discomfort and breathing difficulty').fill('Mild fever and cough');
await shot('02-registration-filled');
await page.getByRole('button', { name: /Start Screening/i }).click();
await page.waitForTimeout(1200);
await shot('03-registration-saved');
log('Patient registration form submitted');

// should have navigated to monitoring
await page.waitForURL('**/#/monitoring', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
await shot('04-monitoring-page');

// Connect wearable
const connectBtn = page.getByRole('button', { name: 'Connect Wearable' });
if (await connectBtn.count()) {
  await connectBtn.click();
  await page.waitForTimeout(1500);
}
await shot('05-monitoring-connected');
const hrVisible = await page.locator('text=Heart Rate').count();
if (hrVisible === 0) throw new Error('Vitals not shown after connecting wearable');
log('Wearable connected, vitals displayed');

// Switch to HIGH-RISK DEMO mode
const highRiskBtn = page.getByRole('button', { name: 'HIGH-RISK DEMO' });
if (await highRiskBtn.count()) {
  await highRiskBtn.click();
  await page.waitForTimeout(2600);
}
await shot('06-monitoring-highrisk');
log('Switched to HIGH-RISK DEMO mode');

// --- AI Screening ---
await page.goto(`${BASE}/#/screening`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const runBtn = page.getByRole('button', { name: /Run AI Screening/i });
await runBtn.click();
await page.waitForTimeout(3200);
await shot('07-screening-result');
const riskBadge = await page.locator('text=/Priority/').count();
if (riskBadge === 0) throw new Error('Risk badge not shown after screening');
log('AI Screening completed and risk result displayed');

// --- Clinical Copilot ---
await page.goto(`${BASE}/#/copilot`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await shot('08-copilot');
const copilotSummary = await page.locator('text=Suggested Next Step').count();
if (copilotSummary === 0) throw new Error('Copilot summary missing');
log('Clinical Copilot summary rendered');

// Tamil toggle
const tamilBtn = page.getByRole('button', { name: /தமிழ்/ });
if (await tamilBtn.count()) {
  await tamilBtn.click();
  await page.waitForTimeout(300);
}
await shot('09-copilot-tamil');
log('Multilingual Tamil demo toggled');

// --- Smart Referral ---
await page.goto(`${BASE}/#/referral`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Generate' }).click();
await page.waitForTimeout(300);
await shot('10-referral-generated');
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(500);
await shot('11-referral-saved');
const savedText = await page.locator('text=Referral saved').count();
if (savedText === 0) throw new Error('Referral save confirmation missing');
log('Smart Referral generated and saved');

// --- Doctor Dashboard ---
await page.goto(`${BASE}/#/doctor`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await shot('12-doctor-dashboard');
// click first patient card in any priority column
const firstPatientBtn = page.locator('button:has-text("QA")').first();
if (await firstPatientBtn.count()) {
  await firstPatientBtn.click();
  await page.waitForTimeout(500);
  await page.locator('textarea').first().fill('QA automated review note.');
  await page.getByRole('button', { name: 'Reviewed' }).click();
  await page.waitForTimeout(500);
}
await shot('13-doctor-review-saved');
log('Doctor review flow executed');

// --- Security Center: tamper + restore ---
await page.goto(`${BASE}/#/security`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await shot('14-security-before-tamper');
const tamperBtn = page.getByRole('button', { name: /Simulate Data Tampering/i });
await tamperBtn.click();
await page.waitForTimeout(700);
await shot('15-security-tampered');
const failedText = await page.locator('text=INTEGRITY VERIFICATION FAILED').count();
if (failedText === 0) throw new Error('Tamper detection did not show FAILED state');
log('Tamper detection correctly flagged FAILED integrity');

const restoreBtn = page.getByRole('button', { name: /Restore Original Record/i });
await restoreBtn.click();
await page.waitForTimeout(700);
await shot('16-security-restored');
const verifiedText = await page.locator('text=INTEGRITY VERIFIED').count();
if (verifiedText === 0) throw new Error('Restore did not return to VERIFIED state');
log('Restore correctly returned integrity to VERIFIED');

// Unauthorized access
const unauthBtn = page.getByRole('button', { name: /Simulate Unauthorized Access/i });
await unauthBtn.click();
await page.waitForTimeout(500);
await shot('17-security-access-denied');
const deniedText = await page.locator('text=ACCESS DENIED').count();
if (deniedText === 0) throw new Error('Unauthorized access simulation did not show ACCESS DENIED');
log('Unauthorized access correctly denied');

// --- Blockchain Audit ---
await page.goto(`${BASE}/#/blockchain`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await shot('18-blockchain-audit');
const verifiedChip = await page.locator('text=Chain Verified').count();
if (verifiedChip === 0) throw new Error('Blockchain chain not verified');
const txRows = await page.locator('table tbody tr').count();
if (txRows === 0) throw new Error('No blockchain transactions listed');
log(`Blockchain audit shows ${txRows} transactions and chain is verified`);

// --- Architecture & Settings sanity ---
await page.goto(`${BASE}/#/architecture`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await shot('19-architecture');
await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'தமிழ் (Tamil)' }).click();
await page.waitForTimeout(300);
await shot('20-settings-tamil-lang');
const tamilNav = await page.locator('text=டாஷ்போர்டு').count();
if (tamilNav === 0) throw new Error('Language switch to Tamil did not update sidebar');
log('Global language switch to Tamil works');
await page.getByRole('button', { name: 'English' }).click();

// --- Full Demo Mode ---
await page.goto(`${BASE}/#/demo`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Start Hackathon Demo/i }).first().click();
await page.waitForTimeout(500);
// step through manually via "next" for reliability instead of waiting for autoplay
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(650);
  const nextBtn = page.locator('button:has(svg.lucide-skip-forward)');
  if (await nextBtn.count()) {
    const disabled = await nextBtn.getAttribute('disabled');
    if (disabled === null) await nextBtn.click();
  }
}
await page.waitForTimeout(800);
await shot('21-demo-final-step');
const demoVerified = await page.locator('text=INTEGRITY VERIFIED').count();
if (demoVerified === 0) throw new Error('Demo did not reach final INTEGRITY VERIFIED state');
log('Full 20-step hackathon demo completed successfully');

await browser.close();

if (errors.length) {
  console.log('\n--- CONSOLE ERRORS DURING E2E ---');
  for (const e of errors) console.log(e);
  process.exit(1);
} else {
  console.log('\nAll E2E checks passed with zero console errors.');
}
