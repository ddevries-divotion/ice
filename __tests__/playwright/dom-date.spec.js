import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('ice.dom date and tsIso8601ToTimestamp', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
    await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
  });

  test('dom.date formats a timestamp', async ({ page }) => {
    const result = await page.evaluate(() => window.ice.dom.date('Y-m-d', 946684800000)); // 2000-01-01
    expect(result).toBe('2000-01-01');
  });

  test('dom.date formats ISO 8601 string', async ({ page }) => {
    const result = await page.evaluate(() => window.ice.dom.date('Y-m-d', null, '2000-01-01T00:00:00Z'));
    expect(result).toBe('2000-01-01');
  });

  test('dom.tsIso8601ToTimestamp parses ISO 8601', async ({ page }) => {
    const ts = await page.evaluate(() => window.ice.dom.tsIso8601ToTimestamp('2000-01-01T00:00:00Z'));
    // Should be close to 946684800000 (Jan 1, 2000 UTC)
    expect(Math.abs(ts - 946684800000)).toBeLessThan(1000); // allow 1s drift
  });

  test('dom.tsIso8601ToTimestamp returns null for invalid', async ({ page }) => {
    const ts = await page.evaluate(() => window.ice.dom.tsIso8601ToTimestamp('not-a-date'));
    expect(ts).toBeNull();
  });
});
