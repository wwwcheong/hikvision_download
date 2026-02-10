const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  console.log('Opening Page 1...');
  const page1 = await context.newPage();
  await page1.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for the checking screen to disappear or the app to load
  await page1.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 });

  // Verify Page 1 is active (no alert)
  const alert1 = page1.locator('text=Hikvision Downloader is already open in another tab');
  const isBlocked1 = await alert1.isVisible();
  if (isBlocked1) {
    throw new Error('Page 1 was blocked, but it should be the active leader.');
  }
  console.log('Page 1 is active.');

  console.log('Opening Page 2...');
  const page2 = await context.newPage();
  await page2.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Verify Page 2 is blocked
  console.log('Checking for block alert on Page 2...');
  const alert2 = page2.locator('text=Hikvision Downloader is already open in another tab');
  try {
    await alert2.waitFor({ state: 'visible', timeout: 10000 });
    console.log('SUCCESS: Page 2 is blocked as expected.');
  } catch (e) {
    throw new Error('Page 2 was not blocked by the MultiTabGuard.');
  }

  // Close Page 1 and refresh Page 2
  console.log('Closing Page 1 and refreshing Page 2...');
  await page1.close();
  await page2.reload({ waitUntil: 'networkidle' });
  
  // Wait for the checking screen to disappear
  await page2.waitForSelector('text=Checking for other active tabs...', { state: 'detached', timeout: 10000 });

  // Verify Page 2 is now active
  console.log('Checking if Page 2 is now active...');
  const alert3 = page2.locator('text=Hikvision Downloader is already open in another tab');
  const isBlocked3 = await alert3.isVisible();
  if (isBlocked3) {
    // With auto-unblock logic, it might take a moment.
    console.log('Page 2 still blocked, waiting for auto-unblock or retry...');
    await page2.waitForTimeout(3000); // Give it one more heartbeat cycle
    if (await alert3.isVisible()) {
        throw new Error('Page 2 is still blocked after Page 1 was closed and Page 2 was refreshed.');
    }
  }
  console.log('SUCCESS: Page 2 is now active.');

  await browser.close();
  console.log('Multi-tab test PASSED!');
})().catch(err => {
  console.error('Multi-tab test FAILED:', err);
  process.exit(1);
});