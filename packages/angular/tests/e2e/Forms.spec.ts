import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('reactive forms exchange digits, propagate touched, reset, and disabled state', async ({ page }) => {
  const form = page.getByTestId('forms');
  const input = form.locator('input.pi-input').first();
  await expect(input).toHaveValue('202-555-0123');
  await input.fill('4155552671');
  await expect(input).toHaveValue('415-555-2671');
  await expect(page.getByTestId('form-value')).toHaveText('4155552671');
  await input.press('Tab');
  await expect(page.getByTestId('form-touched')).toHaveText('true');
  await page.getByTestId('form-disable').click();
  await expect(input).toBeDisabled();
  await page.getByTestId('form-enable').click();
  await expect(input).toBeEnabled();
  await page.getByTestId('form-reset').click();
  await expect(input).toHaveValue('202-555-0123');
  await form.locator('.pi-btn-clear').click();
  await expect(page.getByTestId('form-value')).toHaveText('');
});

test('template-driven forms and the directive emit digits', async ({ page }) => {
  await page.getByTestId('forms').locator('input.pi-input').last().fill('2125557890');
  await expect(page.getByTestId('model-value')).toHaveText('2125557890');
  const input = page.getByRole('textbox', { name: 'Directive phone input' });
  await input.fill('6505551234');
  await expect(input).toHaveValue('650-555-1234');
  await expect(page.getByTestId('directive-value')).toHaveText('6505551234');
});

test('the pipe formats a display value', async ({ page }) => {
  await expect(page.getByTestId('pipe')).toContainText('+1 234 567 8888');
});

test('choosing a shorter country mask updates the form value with the displayed digits', async ({ page }) => {
  const form = page.getByTestId('forms');
  await page.getByTestId('form-country-unlock').click();
  const selector = form.locator('.pi-selector-btn').first();
  await expect(selector).toHaveAttribute('aria-haspopup', 'dialog');
  await selector.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').fill('Andorra');
  await dialog.getByRole('option', { name: /Andorra/ }).click();
  await expect(form.locator('input.pi-input').first()).toHaveValue('2025 5501');
  await expect(page.getByTestId('form-value')).toHaveText('20255501');
});
