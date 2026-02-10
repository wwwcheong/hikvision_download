const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    
    console.log('--- Test 1: Standard Sequential Load ---');
    const page1 = await context.newPage();
    await page1.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page1.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 });
    
    const isBlocked1 = await page1.locator('text=Hikvision Downloader is already open in another tab').isVisible();
    if (isBlocked1) throw new Error('Page 1 should be active.');
    console.log('Page 1 is active.');

    const page2 = await context.newPage();
    await page2.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page2.locator('text=Hikvision Downloader is already open in another tab').waitFor({ state: 'visible', timeout: 5000 });
    console.log('Page 2 is blocked.');

    console.log('Closing Page 1 and waiting (should remain blocked)...');
    await page1.close();
    await page2.waitForTimeout(3000);
    const isBlocked2 = await page2.locator('text=Hikvision Downloader is already open in another tab').isVisible();
    if (!isBlocked2) throw new Error('Page 2 should remain blocked after Page 1 is closed (no auto-unblock).');
    console.log('Page 2 correctly remained blocked.');

    console.log('Refreshing Page 2 (should become active)...');
    await page2.reload({ waitUntil: 'networkidle' });
    await page2.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 });
    const isBlocked2AfterReload = await page2.locator('text=Hikvision Downloader is already open in another tab').isVisible();
    if (isBlocked2AfterReload) throw new Error('Page 2 should be active after manual refresh.');
    console.log('Page 2 is now active.');
    await page2.close();

    console.log('--- Test 2: Simultaneous Load (Race Condition) ---');
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    
    console.log('Opening two pages simultaneously...');
    await Promise.all([
      pageA.goto(BASE_URL),
      pageB.goto(BASE_URL)
    ]);

    // Wait for both to finish checking
    await Promise.all([
      pageA.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 }),
      pageB.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 })
    ]);

    const isBlockedA = await pageA.locator('text=Hikvision Downloader is already open in another tab').isVisible();
    const isBlockedB = await pageB.locator('text=Hikvision Downloader is already open in another tab').isVisible();

    console.log(`Page A Blocked: ${isBlockedA}, Page B Blocked: ${isBlockedB}`);

    if (isBlockedA && isBlockedB) {
      throw new Error('Both pages blocked! One must be active.');
    }
    if (!isBlockedA && !isBlockedB) {
      throw new Error('Both pages active! Exactly one must be blocked.');
    }
    console.log('SUCCESS: Exactly one page is active in simultaneous load.');

  } finally {
    await browser.close();
  }
  console.log('All multi-tab tests PASSED!');
})().catch(err => {
  console.error('Multi-tab test FAILED:', err);
  process.exit(1);
});