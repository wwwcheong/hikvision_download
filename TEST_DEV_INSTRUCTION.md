# Integration Test Development Guide

This guide outlines the best practices and patterns for developing end-to-end integration tests for this project, based on lessons learned from setting up the Playwright test suite.

## 1. Test Architecture

Do not rely solely on `npm scripts` or `concurrently` for complex integration tests involving multiple servers. Instead, create a dedicated Node.js runner script.

**Why?**
- **Process Control:** You need precise control over starting, waiting for, and killing child processes (Frontend & Backend).
- **Environment Variables:** Easier to inject dynamic ports and URLs programmatically.
- **Cleanup:** Ensures all processes (including child processes of shells) are killed when the test finishes or fails.

### Runner Script Template (`run_integration_test.js`)

```javascript
const { spawn } = require('child_process');
const path = require('path');

async function run() {
  // 1. Start Backend
  const backend = spawn('node', ['backend/server.js'], {
    env: { ...process.env, PORT: '5003' },
    stdio: 'inherit'
  });

  // 2. Start Frontend (Target the binary directly)
  const vitePath = path.resolve(__dirname, 'frontend', 'node_modules', '.bin', 'vite');
  const frontend = spawn(vitePath, ['--port', '5173', '--host', '0.0.0.0', 'frontend'], {
    env: { ...process.env, VITE_BACKEND_URL: 'http://localhost:5003' },
    stdio: 'inherit'
  });

  // 3. Wait for Initialization
  console.log('Waiting for servers...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. Run Test
  const test = spawn('node', ['frontend/tests/your_test_file.cjs'], {
    stdio: 'inherit'
  });

  // 5. Cleanup on Exit
  test.on('exit', (code) => {
    backend.kill();
    frontend.kill();
    process.exit(code);
  });
}

run();
```

## 2. Playwright Configuration

### File Extension (`.cjs`)
If your project is ES Module-based (`"type": "module"` in `package.json`), name your Playwright test files with the **`.cjs`** extension (e.g., `integration_test.cjs`).
*   **Reason:** Playwright often uses `require()`, which throws errors in `.js` files within an ESM project.

### Browser Launch
Launch the browser in headless mode but keep `stdio` visible for debugging.

```javascript
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
```

## 3. Interacting with Material-UI (MUI)

MUI components often obscure standard HTML inputs, making direct interaction difficult.

### Problem: Click Interception / Strict Mode Violations
- `page.click('input')` often fails because the input is hidden or covered by a `fieldset` or `label`.
- `getByLabel(...)` often returns multiple elements (the container + the input), causing Playwright to error in strict mode.

### Solution: Interaction Helpers
Use a helper function to target the **container** and use **keyboard shortcuts** to manipulate values.

```javascript
const fillMuiInput = async (page, label, value) => {
  // Find the container div that holds the label
  const container = page.locator('.MuiStack-root > div')
      .filter({ has: page.locator(`label:has-text("${label}")`) })
      .first();
  
  await container.click();
  // Clear and Type
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200); // Allow UI to react
};
```

## 4. Robust Verification Strategies

### Flexible Text Matching
Do not wait for exact strings if numbers are dynamic. Use Regex.

```javascript
// Bad
await page.waitForSelector('text=Found 71 recordings');

// Good
const locator = page.locator('text=/Found \d+ recordings/');
await locator.waitFor({ state: 'visible' });
```

### Handling Duplicate Rows
Tables often contain repeated text (e.g., same timestamps). Use `.first()` or specific filtering to avoid "Strict mode violation" errors.

```javascript
// Bad - Fails if multiple rows match
await page.locator('text=2026-01-29 09:25:19').waitFor();

// Good - Filter by multiple columns + .first()
const row = page.locator('tr')
    .filter({ hasText: 'Camera Name' })
    .filter({ hasText: '2026-01-29 09:25:19' })
    .first(); // Take the first match if duplicates exist
    
await row.waitFor({ state: 'visible' });
```

### Race Conditions
When waiting for a result that might be an error, use `Promise.race`:

```javascript
const success = page.locator('.results-table');
const error = page.locator('.MuiAlert-colorError');

await Promise.race([
  success.waitFor({ state: 'visible' }),
  error.waitFor({ state: 'visible' })
]);

if (await error.isVisible()) {
  throw new Error(`Test failed: ${await error.textContent()}`);
}
```

## 5. Network & Troubleshooting

- **Zombie Processes:** Always check for rogue `node` or `vite` processes (`ps aux | grep node`) if you get `EADDRINUSE`.
- **Binding Host:** Use `--host 0.0.0.0` for Vite/Frontend to ensure it is reachable by the test runner in all environments.
- **Console Logs:** Hook into browser console logs for better visibility during headless runs.
    ```javascript
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    ```
