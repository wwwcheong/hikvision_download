const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.error('Failed to load page. Is the server running?');
    process.exit(1);
  }

  // 1. Fill Connection Form
  console.log('Filling connection form...');
  await page.locator('input').and(page.getByLabel('IP Address')).fill('192.168.99.73');
  await page.locator('input').and(page.getByLabel('Port')).fill('84');
  await page.locator('input').and(page.getByLabel('Username')).fill('admin');
  await page.locator('input').and(page.getByLabel('Password')).fill('mcin@3012');
  
  console.log('Clicking Connect...');
  await page.getByRole('button', { name: 'Connect' }).click();

  // Wait for connection
  console.log('Waiting for connection (up to 30s)...');
  await page.waitForSelector('text=/Connected: \\d+\\.\\d+\\.\\d+\\.\\d+/', { timeout: 30000 });
  await page.waitForTimeout(2000); // Wait for channels to load

  // 2. Fill Search Form
  console.log('Filling search form...');
  
  const fillMuiInput = async (label, value) => {
    console.log(`Filling ${label} with ${value}...`);
    // Find the container that has the label
    const container = page.locator('.MuiStack-root > div').filter({ has: page.locator(`label:has-text("${label}")`) }).first();
    await container.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(value);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500); // Small wait between inputs
  };

  await fillMuiInput('Start Date', '01/29/2026');
  await fillMuiInput('End Date', '01/29/2026');
  await fillMuiInput('Start Time', '00:05');
  await fillMuiInput('End Time', '23:55');

  console.log('Clicking Search...');
  await page.getByRole('button', { name: 'Search' }).click();

  // 3. Verify Results
  console.log('Waiting for results message...');
  
  // Wait for either the results message or an error
  const resultsFoundLocator = page.locator('text=/Found \\d+ recordings/');
  const errorLocator = page.locator('.MuiAlert-message');
  
  await Promise.race([
    resultsFoundLocator.waitFor({ state: 'visible', timeout: 90000 }),
    errorLocator.waitFor({ state: 'visible', timeout: 90000 })
  ]);

  if (await errorLocator.isVisible()) {
    const errorText = await errorLocator.textContent();
    throw new Error(`Search failed with error: ${errorText}`);
  }

  const resultsText = await resultsFoundLocator.textContent();
  console.log(`Results summary: ${resultsText}`);

  // Total count across all cameras (observed 112 in previous run)
  const totalCountMatch = resultsText.match(/Found (\d+) recordings/);
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0;
  
  if (totalCount < 71) {
    throw new Error(`Expected at least 71 recordings (for Shop_Front28), but found only ${totalCount} total.`);
  }

  console.log('Verifying recording list formatted timestamps for Shop_Front28...');
  
  // Verify a specific row for Shop_Front28 after 7:00 AM
  const lateRecordingRow = page.locator('tr').filter({ hasText: 'Shop_Front28' }).filter({ hasText: '2026-01-29 09:25:19' }).first();
  await lateRecordingRow.waitFor({ state: 'visible', timeout: 10000 });
  console.log('SUCCESS: Found Shop_Front28 recording after 7:00 AM (09:25:19)');

  const veryLateRecordingRow = page.locator('tr').filter({ hasText: 'Shop_Front28' }).filter({ hasText: '2026-01-29 20:08:49' }).first();
  await veryLateRecordingRow.waitFor({ state: 'visible', timeout: 10000 });
  console.log('SUCCESS: Found Shop_Front28 recording at 8:08 PM (20:08:49)');

  const rowCount = await page.locator('table tbody tr').count();
  console.log(`UI Table has ${rowCount} total recordings displayed.`);

  if (rowCount === totalCount) {
    console.log('Integration test PASSED!');
  } else {
    console.log(`Integration test FAILED: Table rows (${rowCount}) do not match summary (${totalCount}).`);
    process.exit(1);
  }
  
  await browser.close();
})().catch(err => {
  console.error('Integration test FAILED:', err);
  process.exit(1);
});

// Helper for expect-like behavior
async function expect(locator) {
    return {
        toBeVisible: async (options) => {
            await locator.waitFor({ state: 'visible', ...options });
        }
    }
}