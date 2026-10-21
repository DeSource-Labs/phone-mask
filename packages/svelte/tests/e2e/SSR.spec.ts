import { test, expect } from '@playwright/test';
import { prepareHydration } from '@common/tests/e2e/setup/hydration';

const origin = 'http://localhost:5174';
const values = ['202-555-0123', '415-555-2671', '650-555-1234'];

test('renders formatted inputs with unique IDs and no GeoIP requests on repeated SSR requests', async ({ request }) => {
  for (let index = 0; index < 2; index++) {
    const response = await request.get(origin);
    expect(response.ok()).toBe(true);
    expect(response.headers()['x-ssr-geoip-requests']).toBe('0');
    const html = await response.text();
    for (const value of values) expect(html).toContain(`value="${value}"`);
    expect(html).toContain('United States');
    expect(html).toContain('theme-light');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('aria-controls=');
    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  }
});

for (const options of [
  { locale: 'en-US', colorScheme: 'light' },
  { locale: 'de-DE', colorScheme: 'dark' }
] as const) {
  test(`hydrates ${options.locale}/${options.colorScheme} without replacing inputs or reporting mismatches`, async ({
    browser
  }) => {
    const page = await browser.newPage(options);
    const { diagnostics, release, getGeoRequests } = await prepareHydration(page, '**/client.ts');
    try {
      await page.goto(origin, { waitUntil: 'commit' });
      await page.locator('#selectable-phone').waitFor();
      const originalInputs = await page.locator('.pi-input').elementHandles();
      expect(originalInputs).toHaveLength(3);
      release();
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      for (const input of originalInputs) {
        expect(
          await input.evaluate((node) => node instanceof HTMLInputElement && document.getElementById(node.id) === node)
        ).toBe(true);
      }
      for (const [index, value] of ['202-555-0123', '415 5 552671', '650-555-1234'].entries())
        await expect(page.locator('.pi-input').nth(index)).toHaveValue(value);
      await expect(page.locator(`.desource-phone-input.theme-${options.colorScheme}`)).toHaveCount(3);
      await expect(page.locator('.pi-selector .country-name')).toHaveText(
        options.locale === 'de-DE' ? 'Vereinigte Staaten'.slice(0, 15) + '…' : 'United States'
      );
      if (options.locale === 'de-DE') {
        await expect(page.locator('.pi-selector .country-name abbr')).toHaveAttribute('title', 'Vereinigte Staaten');
      }
      await expect(page.locator('.pi-selector-btn').first()).toHaveAttribute(
        'aria-label',
        `Selected country: ${options.locale === 'de-DE' ? 'Vereinigte Staaten' : 'United States'}`
      );
      await expect.poll(getGeoRequests).toBe(1);
      await expect(page.locator('.desource-phone-input').nth(1).locator('.pi-code')).toHaveText('+49');

      const selectors = page.locator('.pi-selector-btn[aria-haspopup="dialog"]');
      const ids = await selectors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-controls')));
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) await expect(page.locator(`body > #${id}[role="dialog"]`)).toHaveCount(1);

      await page.locator('#fixed-phone').fill('2125557890');
      await expect(page.locator('#fixed-phone')).toHaveValue('212-555-7890');
      await selectors.last().click();
      const dialog = page.locator(`#${ids[1]}`);
      const search = dialog.getByRole('searchbox');
      const listbox = dialog.getByRole('listbox');
      await expect(search).toHaveAttribute('aria-controls', (await listbox.getAttribute('id'))!);
      await search.press('ArrowDown');
      const activeId = await search.getAttribute('aria-activedescendant');
      await expect(listbox.locator(`[id="${activeId}"][role="option"]`)).toHaveCount(1);
      await search.fill('+49');
      await dialog.getByText('+49', { exact: true }).click();
      await expect(selectors.last()).toHaveAttribute('aria-expanded', 'false');
      await expect(selectors.last().locator('.pi-code')).toHaveText('+49');
      expect(diagnostics).toEqual([]);
    } finally {
      release();
      await page.close();
    }
  });
}
