import { expect, test } from '@playwright/test';

const origin = 'http://localhost:5174';
const values = ['202-555-0123', '415-555-2671', '650-555-1234'];

test('repeated SSR requests render formatted HTML without GeoIP requests', async ({ request }) => {
  await Promise.all(
    [0, 1].map(async () => {
      const response = await request.get(`${origin}/ssr`);
      expect(response.ok()).toBe(true);
      expect(response.headers()['x-ssr-geoip-requests']).toBe('0');
      const html = await response.text();
      for (const value of values) expect(html).toContain(`value="${value}"`);
      expect(html).toMatch(/<input(?=[^>]*id="directive-phone")(?=[^>]*value="202-555-0123")[^>]*>/);
      expect(html).toContain('Selected country: United States');
      expect(html).toContain('theme-light');
      expect(html).not.toContain('role="dialog"');
      expect(html).not.toContain('ngSkipHydration');
      const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
    })
  );
});

for (const options of [
  { locale: 'en-US', colorScheme: 'light' },
  { locale: 'de-DE', colorScheme: 'dark' }
] as const) {
  test(`hydrates ${options.locale}/${options.colorScheme} without replacing inputs`, async ({ browser }) => {
    const page = await browser.newPage(options);
    const diagnostics: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') diagnostics.push(message.text());
    });
    page.on('pageerror', (error) => diagnostics.push(error.message));
    let geoRequests = 0;
    await page.route('https://ipapi.co/json/', async (route) => {
      geoRequests++;
      await route.fulfill({ json: { country_code: 'DE' } });
    });
    let release!: () => void;
    const scripts = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/main.js', async (route) => {
      await scripts;
      await route.continue();
    });
    try {
      await page.goto(`${origin}/ssr`, { waitUntil: 'commit' });
      await page.locator('#selectable-phone').waitFor();
      const originalInputs = await page.locator('input.pi-input, #directive-phone').elementHandles();
      expect(originalInputs).toHaveLength(4);
      release();
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      const preserved = await Promise.all(
        originalInputs.map((input) => input.evaluate((node) => document.getElementById(node.id) === node))
      );
      expect(preserved).toEqual([true, true, true, true]);
      await expect(page.locator(`.desource-phone-input.theme-${options.colorScheme}`)).toHaveCount(3);
      await expect(page.locator('.pi-selector-btn').first()).toHaveAttribute(
        'aria-label',
        `Selected country: ${options.locale === 'de-DE' ? 'Vereinigte Staaten' : 'United States'}`
      );
      await expect.poll(() => geoRequests).toBe(1);
      await expect(page.locator('.desource-phone-input').nth(1).locator('.pi-code')).toHaveText('+49');
      await expect(page.locator('#fixed-phone')).toHaveValue(values[0]);
      await expect(page.locator('#selectable-phone')).toHaveValue(values[2]);
      await expect(page.locator('#directive-phone')).toHaveValue(values[0]);
      await expect(page.locator('.pi-selector .country-name')).toHaveText(
        options.locale === 'de-DE' ? 'Vereinigte Staaten'.slice(0, 15) + '…' : 'United States'
      );
      if (options.locale === 'de-DE') {
        await expect(page.locator('.pi-selector .country-name abbr')).toHaveAttribute('title', 'Vereinigte Staaten');
      }
      await page.locator('#fixed-phone').fill('2125557890');
      await expect(page.locator('#fixed-phone')).toHaveValue('212-555-7890');
      await page.locator('#directive-phone').fill('6505551234');
      await expect(page.locator('#directive-phone')).toHaveValue('650-555-1234');

      const selector = page.locator('.pi-selector-btn').last();
      await selector.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((element) => element.parentElement === document.body)).toBe(true);
      await expect(selector).toHaveAttribute('aria-controls', (await dialog.getAttribute('id'))!);
      const search = dialog.getByRole('searchbox');
      await search.press('ArrowDown');
      const activeId = await search.getAttribute('aria-activedescendant');
      await expect(dialog.locator(`[id="${activeId}"][role="option"]`)).toHaveCount(1);
      await search.fill('+49');
      await dialog.getByText('+49', { exact: true }).click();
      await expect(selector).toHaveAttribute('aria-expanded', 'false');
      await expect(selector.locator('.pi-code')).toHaveText('+49');
      expect(diagnostics).toEqual([]);
      expect(await page.evaluate(() => 'Zone' in globalThis)).toBe(false);
    } finally {
      release();
      await page.close();
    }
  });
}
