import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const COMPONENT = '[data-testid="playground"] .desource-phone-input';
const DROPDOWN = '.desource-phone-dropdown.is-open';

async function scan(page: Page, selector = `${COMPONENT}, ${DROPDOWN}`) {
  const dropdown = page.locator(DROPDOWN);
  if (await dropdown.count()) await expect(dropdown).toHaveCSS('opacity', '1');
  const { violations, incomplete } = await new AxeBuilder({ page }).include(selector).analyze();
  if (incomplete.length) {
    await test.info().attach('axe-needs-review', {
      body: JSON.stringify(incomplete, null, 2),
      contentType: 'application/json'
    });
  }
  expect(violations).toEqual([]);
}

export function testAccessibility() {
  test.describe('Accessibility', () => {
    test.use({ locale: 'en-US', reducedMotion: 'reduce' });

    test.beforeEach(async ({ page }) => {
      await page.route('https://ipapi.co/json/', (route) => route.fulfill({ json: { country_code: 'US' } }));
      await page.goto('/');
      await page.getByTestId('props-detect').locator('input').uncheck();
      await page.getByTestId('props-locale').selectOption('en-US');
      await expect(page.locator(COMPONENT).locator('.pi-selector-btn')).toHaveAccessibleName(
        'Selected country: United States +1'
      );
    });

    for (const theme of ['light', 'dark']) {
      test.describe(theme, () => {
        test.beforeEach(async ({ page }) => {
          await page.getByTestId('props-theme').selectOption(theme);
        });

        test('empty input has a label and passes axe', async ({ page }) => {
          await expect(page.locator(COMPONENT).locator('.pi-input')).toHaveAccessibleName('Phone number');
          await scan(page);
        });

        test('complete input and actions pass axe', async ({ page }) => {
          await page.locator(COMPONENT).locator('.pi-input').fill('2025550123');
          await expect(page.locator(COMPONENT)).toHaveClass(/is-complete/);
          await scan(page);
        });

        test('incomplete input exposes invalid state and passes axe', async ({ page }) => {
          const input = page.locator(COMPONENT).locator('.pi-input');
          await input.fill('202');
          await expect(input).toHaveAttribute('aria-invalid', 'true');
          await scan(page);
        });

        test('open dropdown, filtered results, and search clearing pass axe', async ({ page }) => {
          await page.locator(COMPONENT).locator('.pi-selector-btn').press('Enter');
          const dropdown = page.locator(DROPDOWN);
          const search = dropdown.getByRole('combobox');
          const clear = dropdown.getByRole('button', { name: 'Clear search' });
          await expect(search).toBeFocused();
          await expect(search).toHaveJSProperty('type', 'text');
          await expect(clear).toHaveCount(0);
          const countryCount = await dropdown.getByRole('option').count();
          // Bring the selected option into view so contrast checks cover its background.
          await dropdown.getByRole('option', { selected: true }).scrollIntoViewIfNeeded();
          await scan(page);
          await search.fill('Germany');
          await expect(dropdown.getByRole('option')).toHaveCount(1);
          await expect(dropdown.getByRole('option')).toBeInViewport();
          await expect(clear).toBeVisible();
          await scan(page);
          await clear.click();
          await expect(search).toHaveValue('');
          await expect(search).toBeFocused();
          await expect(dropdown.getByRole('option')).toHaveCount(countryCount);
          await expect(clear).toHaveCount(0);
        });

        test('empty search results update an existing live region and pass axe', async ({ page }) => {
          await page.locator(COMPONENT).locator('.pi-selector-btn').press('Enter');
          const dropdown = page.locator(DROPDOWN);
          const search = dropdown.getByRole('combobox');
          const status = dropdown.getByRole('status');
          await expect(search).toBeFocused();
          const countryCount = await dropdown.getByRole('option').count();
          await expect(status).toHaveCount(1);
          await expect(status).toHaveText('');
          await expect(status).not.toHaveClass(/pi-empty/);
          await expect(status).not.toHaveCSS('display', 'none');
          await expect(status).toHaveCSS('visibility', 'visible');
          const originalStatus = await status.elementHandle();

          await search.fill('no-such-country');
          await expect(status).toHaveText('No countries found');
          await expect(status).toHaveClass(/pi-empty/);
          await expect(status).toBeVisible();
          await search.press('Tab');
          const clear = dropdown.getByRole('button', { name: 'Clear search' });
          await expect(clear).toBeFocused();
          await scan(page);

          await clear.press('Enter');
          await expect(search).toHaveValue('');
          await expect(search).toBeFocused();
          await expect(clear).toHaveCount(0);
          await expect(dropdown.getByRole('option')).toHaveCount(countryCount);
          await expect(status).toHaveText('');
          await expect(status).not.toHaveClass(/pi-empty/);
          await search.fill('no-such-country-again');
          await expect(status).toHaveText('No countries found');
          // Recreating a populated region can pass axe but miss the live announcement.
          expect(await originalStatus!.evaluate((node) => node.isConnected)).toBe(true);
          await expect(search).toBeFocused();
        });

        for (const state of ['readonly', 'disabled']) {
          test(`${state} input passes axe`, async ({ page }) => {
            await page.locator(COMPONENT).locator('.pi-input').fill('2025550123');
            await page.getByTestId(`props-${state}`).locator('input').check();
            await scan(page);
          });
        }
      });
    }

    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      test(`${key} opens the selector; Escape and selection restore focus`, async ({ page }) => {
        const component = page.locator(COMPONENT);
        const button = component.locator('.pi-selector-btn');
        const dropdown = page.locator(DROPDOWN);
        const search = dropdown.locator('.pi-search');
        await button.press(key);
        await expect(search).toBeFocused();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(dropdown).toHaveAttribute('id', (await button.getAttribute('aria-controls'))!);
        await search.press('Escape');
        await expect(dropdown).toHaveCount(0);
        await expect(button).toBeFocused();
        await expect(button).toHaveAttribute('aria-expanded', 'false');

        await button.press(key);
        await search.fill('Germany');
        await search.press('ArrowDown');
        const option = dropdown.getByRole('option');
        await expect(option).toHaveCount(1);
        await expect(search).toHaveAttribute('aria-activedescendant', (await option.getAttribute('id'))!);
        await search.press('Enter');
        await expect(dropdown).toHaveCount(0);
        await expect(button).toHaveAccessibleName('Selected country: Germany +49');
        await expect(component.locator('.pi-input')).toBeFocused();
      });
    }

    test('Tab reaches input and actions; copy announces success; clear restores focus', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const component = page.locator(COMPONENT);
      const input = component.locator('.pi-input');
      const copy = component.locator('.pi-btn-copy');
      const clear = component.locator('.pi-btn-clear');
      await input.fill('2025550123');
      const icon = copy.locator('svg');
      const path = icon.locator('path');
      const originalPath = await path.elementHandle();
      const defaultShape = (await path.getAttribute('d'))!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await component.locator('.pi-selector-btn').focus();
      await page.keyboard.press('Tab');
      await expect(input).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(copy).toBeFocused();
      await page.keyboard.press('Enter');
      const status = component.getByRole('status');
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toHaveText('Phone number copied to clipboard');
      await expect(path).not.toHaveAttribute('d', defaultShape);
      await expect(copy).toHaveAttribute('title', 'Copy phone number');
      await expect(path).toHaveAttribute('d', defaultShape);
      expect(await originalPath!.evaluate((node) => node.isConnected)).toBe(true);
      await page.keyboard.press('Tab');
      await expect(clear).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('');
    });

    test('headless input preserves its accessible name when formatting', async ({ page }) => {
      const input = page.getByTestId('hook').getByTestId('phone-input');
      await expect(input).toHaveAccessibleName('Custom phone input');
      await page.getByTestId('control-country-us').click();
      await input.fill('2025550123');
      await expect(input).toHaveValue('202-555-0123');
      await expect(input).toHaveAccessibleName('Custom phone input');
      await scan(page, '[data-testid="hook"]');
    });
  });
}
