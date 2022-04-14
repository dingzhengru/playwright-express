const { test, expect } = require('@playwright/test');

test.describe('Google', () => {
  test('Search', async ({ page }) => {
    console.log('process.env.REQUEST_BODY', process.env.REQUEST_BODY);
    const search = JSON.parse(process.env.REQUEST_BODY).q || '';

    await page.goto('https://google.com');
    await page.fill('input[name="q"]', search);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `screenshots/google-search.png` });
  });
});
