import { setup, $fetch, getBrowser, url, waitForHydration } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { expectGeneratedRegistrations, getFixtureRoot } from './utils';

const fixtureRoot = getFixtureRoot('../fixtures/basic', import.meta.url);

await setup({
  rootDir: fixtureRoot,
  browser: true
});

describe('Nuxt module contract: basic fixture', () => {
  it('renders page with module-provided component/directive/helpers', async () => {
    const html = await $fetch('/');

    expect(html).toContain('phone-mask-nuxt:basic-ok');
    expect(html).toContain('id="helper-flag">🇺🇸</div>');
    expect(html).toContain('id="directive-status">directive:yes</div>');
  });

  it('generates helper imports and PhoneInput component typing', async () => {
    await expectGeneratedRegistrations(true);
  });

  it('server-renders formatted phone inputs on repeated requests', async () => {
    for (let request = 0; request < 2; request++) {
      const html = await $fetch<string>('/');

      for (const [id, value] of [
        ['fixed-phone', '202-555-0123'],
        ['selectable-phone', '415-555-2671'],
        ['second-phone', '650-555-1234']
      ]) {
        const input = html.match(new RegExp(`<input\\b[^>]*id="${id}"[^>]*>`))?.[0];
        expect(input).toContain('type="tel"');
        expect(input).toContain(`value="${value}"`);
      }
      expect(html).not.toContain('role="dialog"');
      expect(html).toContain('id="parent-country">pending</div>');
      expect(html).toContain('id="parent-phone">pending</div>');
      expect(html).toContain('id="parent-value">202555012345</div>');
      expect(html).not.toContain('id="parent-validation"');
    }
  });

  it.each([
    { locale: 'en-US', colorScheme: 'light' as const },
    { locale: 'de-DE', colorScheme: 'dark' as const }
  ])('hydrates and handles country selection with $locale/$colorScheme defaults', async (options) => {
    const page = await (await getBrowser()).newPage(options);
    const diagnostics: string[] = [];
    const scripts = Promise.withResolvers<void>();
    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') diagnostics.push(message.text());
    });
    page.on('pageerror', (error) => diagnostics.push(error.message));

    // Hold client scripts so the handles refer to the original server-rendered inputs.
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script') await scripts.promise;
      await route.continue();
    });

    try {
      await page.goto(url('/'), { waitUntil: 'commit' });
      await page.locator('#second-phone').waitFor({ state: 'attached' });
      const originalInputs = await page.locator('.pi-input').elementHandles();
      expect(originalInputs).toHaveLength(3);
      expect(await page.locator('.desource-phone-dropdown').count()).toBe(0);

      scripts.resolve();
      await waitForHydration(page, url('/'), 'hydration');

      for (const input of originalInputs) {
        expect(await input.evaluate((node) => node.isConnected && document.getElementById(node.id) === node)).toBe(
          true
        );
      }
      expect(await Promise.all(originalInputs.map((input) => input.inputValue()))).toEqual([
        '202-555-0123',
        '415-555-2671',
        '650-555-1234'
      ]);
      await expect.poll(() => page.locator('#parent-value').textContent()).toBe('2025550123');
      await expect.poll(() => page.locator('#parent-phone').textContent()).toBe('+1 202-555-0123');
      await expect.poll(() => page.locator('#parent-validation').textContent()).toBe('true');
      await page.locator('#fixed-phone').fill('2125557890');
      await expect.poll(() => page.locator('#fixed-phone').inputValue()).toBe('212-555-7890');
      await expect.poll(() => page.locator('#parent-phone').textContent()).toBe('+1 212-555-7890');
      await expect.poll(() => page.locator(`.desource-phone-input.theme-${options.colorScheme}`).count()).toBe(3);
      const countryName = await page.evaluate(() =>
        new Intl.DisplayNames([navigator.language], { type: 'region' }).of('US')
      );
      await expect.poll(() => page.locator('#parent-country').textContent()).toBe(countryName);
      await expect.poll(() => page.locator('.pi-selector .country-name').textContent()).toBe(countryName);

      const selectors = page.locator('.pi-selector-btn[aria-controls]');
      await expect.poll(() => selectors.count()).toBe(2);
      const dialogIds = await selectors.evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute('aria-controls'))
      );
      expect(new Set(dialogIds).size).toBe(2);

      for (const [index, dialogId] of dialogIds.entries()) {
        expect(dialogId).toMatch(/^pi-dropdown-\d+$/);
        const dialog = page.locator(`#${dialogId}`);
        expect(await dialog.getAttribute('role')).toBe('dialog');
        await selectors.nth(index).click();
        await expect.poll(() => dialog.getByRole('option').count()).toBeGreaterThan(200);
        const search = dialog.getByRole('combobox');
        expect(await search.getAttribute('aria-controls')).toBe(await dialog.getByRole('listbox').getAttribute('id'));
        expect(await page.locator(`#${await search.getAttribute('aria-activedescendant')}`).count()).toBe(1);
        await search.fill('+49');
        await dialog.getByText('+49', { exact: true }).click();
        await expect.poll(() => selectors.nth(index).getAttribute('aria-expanded')).toBe('false');
        expect(await selectors.nth(index).locator('.pi-code').textContent()).toBe('+49');
      }
      expect(diagnostics).toEqual([]);
    } finally {
      scripts.resolve();
      await page.close();
    }
  });
});
