import { expect, test } from '@playwright/test';
import { prepareHydration } from '@common/tests/e2e/setup/hydration';
import { checkInitialCallbacks, readInitialCallbacks } from '@common/tests/ssr/initialCallbacks';

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
      expect(html).toContain('Selected country: United States +1');
      expect(html).toContain('theme-light');
      expect(html).toContain('+1 234 567 8888');
      expect(html).toContain('🇺🇸 234 567 8888');
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
    const { diagnostics, release, getGeoRequests } = await prepareHydration(page, '**/main.js');
    try {
      await page.goto(`${origin}/ssr`, { waitUntil: 'commit' });
      await page.locator('#selectable-phone').waitFor();
      const originalNodes = await page.locator('input.pi-input, #directive-phone, #parent-validation').elementHandles();
      expect(originalNodes).toHaveLength(5);
      await expect(page.getByTestId('pipe-full')).toHaveText('+1 234 567 8888');
      await expect(page.getByTestId('pipe-without-code')).toHaveText('🇺🇸 234 567 8888');
      const originalPipe = await page.getByTestId('pipe-full').elementHandle();
      await checkInitialCallbacks({
        render: () => page.evaluate(readInitialCallbacks, undefined),
        hydrate: async () => {
          release();
          await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
          return page.evaluate(readInitialCallbacks, undefined);
        },
        valueAfterHydration: '202555012345',
        callbacksDuringSsr: true
      });
      expect(await originalPipe!.evaluate((node) => node === document.querySelector('[data-testid="pipe-full"]'))).toBe(
        true
      );
      await expect(page.getByTestId('pipe-full')).toHaveText('+1 234 567 8888');
      await expect(page.getByTestId('pipe-without-code')).toHaveText('🇺🇸 234 567 8888');
      const preserved = await Promise.all(
        originalNodes.map((node) =>
          node.evaluate((element: Element) => document.getElementById(element.id) === element)
        )
      );
      expect(preserved).toEqual([true, true, true, true, true]);
      await expect(page.locator(`.desource-phone-input.theme-${options.colorScheme}`)).toHaveCount(3);
      await expect(page.locator('.pi-selector-btn').first()).toHaveAttribute(
        'aria-label',
        `Selected country: ${options.locale === 'de-DE' ? 'Vereinigte Staaten' : 'United States'} +1`
      );
      await expect.poll(getGeoRequests).toBe(1);
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
      const search = dialog.getByRole('combobox');
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
