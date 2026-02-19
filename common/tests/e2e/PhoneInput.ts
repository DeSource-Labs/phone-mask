import { test, expect, type Locator } from '@playwright/test';

type PlaygroundControls = {
  readonly: string;
  disabled: string;
}

export function testPhoneInput(containerSelector: string, playgroundControls: PlaygroundControls) {
  // PhoneInput component selectors
  const COMPONENT_SELECTOR = '.phone-input';
  const COUNTRY_DROPDOWN_BTN_SELECTOR = '.pi-selector-btn';
  const COUNTRY_DROPDOWN_MENU_SELECTOR = '.phone-dropdown';
  const INPUT_SELECTOR = 'input.pi-input[type="tel"]';
  const COPY_BTN_SELECTOR = 'button.pi-btn-copy';
  const CLEAR_BTN_SELECTOR = 'button.pi-btn-clear';

  test.describe(`PhoneInput in ${containerSelector}`, () => {
    let container: Locator;
    let component: Locator;

    let phoneInput: Locator;
    let dropdownBtn: Locator;
    let dropdownMenu: Locator;

    test.beforeEach(async ({ page }) => {
      await page.goto('/');

      container = page.locator(containerSelector);
      component = container.locator(COMPONENT_SELECTOR);

      phoneInput = component.locator(INPUT_SELECTOR);
      dropdownBtn = component.locator(COUNTRY_DROPDOWN_BTN_SELECTOR);
      dropdownMenu = component.locator(COUNTRY_DROPDOWN_MENU_SELECTOR);
    });

    test.describe('readonly prop', () => {
      const DIGITS = '12345';

      test.beforeEach(async () => {
        await phoneInput.click();
        await phoneInput.pressSequentially(DIGITS);

        await container.locator(playgroundControls.readonly).check();
      });

      test('readonly checkbox adds readonly attribute to input', async () => {
        await expect(phoneInput).toHaveAttribute('readonly');
      });

      test('readonly prop adds is-readonly class to root element', async () => {
        await expect(component).toHaveClass(/is-readonly/);
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

      test('readonly input shows copy button', async () => {
        // showCopyButton = showCopy && !isEmpty && !disabled — readonly does not suppress it
        await expect(component.locator(COPY_BTN_SELECTOR)).toBeAttached();
      });

      test('readonly input hides clear button', async () => {
        // showClearButton = showClear && !isEmpty && !inactive — inactive=true when readonly
        await expect(component.locator(CLEAR_BTN_SELECTOR)).not.toBeAttached();
      });
    });

    test.describe('disabled prop', () => {
      const DIGITS = '12345';

      test.beforeEach(async () => {
        // Type digits before enabling disabled, so there is an existing value to test against
        await phoneInput.click();
        await phoneInput.pressSequentially(DIGITS);

        await container.locator(playgroundControls.disabled).check();
      });

      test('disabled checkbox adds disabled attribute to input', async () => {
        await expect(phoneInput).toBeDisabled();
      });

      test('disabled checkbox adds disabled attribute to selector button', async () => {
        await expect(dropdownBtn).toBeDisabled();
      });

      test('disabled prop adds is-disabled class to root element', async () => {
        await expect(component).toHaveClass(/is-disabled/);
      });

      test('disabled input does not allow typing new digits', async ({ page }) => {
        const valueBefore = await phoneInput.inputValue();
        // Force-click to bypass Playwright actionability check, then type
        await phoneInput.click({ force: true });
        await page.keyboard.type('9');
        await expect(phoneInput).toHaveValue(valueBefore);
      });

      test('disabled input does not allow deleting digits', async ({ page }) => {
        const valueBefore = await phoneInput.inputValue();
        await phoneInput.click({ force: true });
        await page.keyboard.press('Backspace');
        await expect(phoneInput).toHaveValue(valueBefore);
      });

      test('disabled country selector does not open dropdown', async () => {
        // force: true bypasses Playwright's actionability check on the disabled button;
        // the browser still suppresses onClick for disabled elements
        await dropdownBtn.click({ force: true });
        await expect(dropdownMenu).not.toBeAttached();
      });

      test('disabled input cannot be focused', async ({ page }) => {
        // Click elsewhere to lose focus
        await page.click('body');
        await expect(phoneInput).not.toBeFocused();

        // Unlike readonly, a disabled input must not gain focus on click
        await phoneInput.click({ force: true });
        await expect(phoneInput).not.toBeFocused();
      });

      test('disabled input hides copy button even when input has a value', async () => {
        await expect(component.locator(COPY_BTN_SELECTOR)).not.toBeAttached();
      });

      test('disabled input hides clear button', async () => {
        await expect(component.locator(CLEAR_BTN_SELECTOR)).not.toBeAttached();
      });
    });
  });
}


