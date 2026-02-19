import { test, expect, type Locator } from '@playwright/test';

const COMPONENT_SELECTOR = '.phone-input';
const COUNTRY_DROPDOWN_BTN_SELECTOR = '.pi-selector-btn';
const COUNTRY_DROPDOWN_MENU_SELECTOR = '.phone-dropdown';

const INPUT_SELECTOR = 'input.pi-input[type="tel"]';

const READONLY_SELECTOR = '[data-testid="props-readonly"] input[type="checkbox"]';

test.describe('PhoneInput component in Playground', () => {
  const PLAYGROUND_SELECTOR = '[data-testid="playground"]';

  let container: Locator;
  let component: Locator;

  let phoneInput: Locator;
  let dropdownBtn: Locator;
  let dropdownMenu: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    container = page.locator(PLAYGROUND_SELECTOR);
    component = container.locator(COMPONENT_SELECTOR);

    phoneInput = component.locator(INPUT_SELECTOR);
    dropdownBtn = component.locator(COUNTRY_DROPDOWN_BTN_SELECTOR);
    dropdownMenu = component.locator(COUNTRY_DROPDOWN_MENU_SELECTOR);
  });

  test.describe('readonly prop', () => {
    const DIGITS = '12345';

    test.beforeEach(async ({ page }) => {
      await phoneInput.click();
      await phoneInput.pressSequentially(digits);

      await container.locator(READONLY_SELECTOR).check();
    });

    test('readonly checkbox adds readonly attribute to input', async () => {
      await expect(phoneInput).toHaveAttribute('readonly');
    });

    test('readonly input does not allow typing new digits', async () => {
      const valueBefore = await phoneInput.inputValue();
      await phoneInput.pressSequentially('9');
      await expect(phoneInput).toHaveValue(valueBefore);
    });

    test('readonly input does not allow deleting digits', async ({ page }) => {
      const valueBefore = await phoneInput.inputValue();
      await phoneInput.click();
      await page.keyboard.press('Backspace');
      await expect(phoneInput).toHaveValue(valueBefore);
    });

    test('readonly country selector does not open dropdown', async ({ page }) => {
      await dropdownBtn.click();
      await expect(dropdownMenu).not.toBeAttached();
    });

    test('readonly input can be focused', async ({ page }) => {
      // Click elsewhere to lose focus
      await page.click('body');
      await expect(phoneInput).not.toBeFocused();

      await phoneInput.click();
      await expect(phoneInput).toBeFocused();
    });
  });
});
