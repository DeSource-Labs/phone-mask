import { test, expect, type Locator } from '@playwright/test';

type PlaygroundControls = {
  country: string;
  readonly: string;
  disabled: string;
  showCopy: string;
  showClear: string;
  withValidity: string;
  detect: string;
  locale: string;
  size: string;
  theme: string;
  searchPlaceholder: string;
  noResultsText: string;
  clearButtonLabel: string;
  dropdownClass: string;
  disableDefaultStyles: string;
};

export function testPhoneInput(containerSelector: string, playgroundControls: PlaygroundControls) {
  // PhoneInput component selectors
  const COMPONENT_SELECTOR = '.phone-input';
  const COUNTRY_DROPDOWN_BTN_SELECTOR = '.pi-selector-btn';
  const COUNTRY_DROPDOWN_MENU_SELECTOR = '.phone-dropdown';
  const INPUT_SELECTOR = 'input.pi-input[type="tel"]';
  const COPY_BTN_SELECTOR = 'button.pi-btn-copy';
  const CLEAR_BTN_SELECTOR = 'button.pi-btn-clear';
  const CHEVRON_SELECTOR = '.pi-chevron';
  const DROPDOWN_SEARCH_SELECTOR = 'input.pi-search[type="search"]';
  const DROPDOWN_NO_RESULTS_SELECTOR = '.pi-empty';

  const DIGITS = '12345';

  test.describe(`PhoneInput`, () => {
    let container: Locator;
    let component: Locator;

    let phoneInput: Locator;
    let dropdownBtn: Locator;
    let dropdownMenu: Locator;
    let copyBtn: Locator;
    let clearBtn: Locator;
    let chevron: Locator;

    // Playground controls
    let readonlyControl: Locator;
    let disabledControl: Locator;
    let showCopyControl: Locator;
    let showClearControl: Locator;
    let withValidityControl: Locator;
    let detectControl: Locator;
    let countrySelect: Locator;
    let localeSelect: Locator;
    let sizeSelect: Locator;
    let themeSelect: Locator;
    let searchPlaceholderInput: Locator;
    let noResultsTextInput: Locator;
    let clearButtonLabelInput: Locator;
    let dropdownClassInput: Locator;
    let disableDefaultStylesControl: Locator;

    test.beforeEach(async ({ page }) => {
      await page.goto('/');

      container = page.locator(containerSelector);
      component = container.locator(COMPONENT_SELECTOR);
      phoneInput = component.locator(INPUT_SELECTOR);
      dropdownBtn = component.locator(COUNTRY_DROPDOWN_BTN_SELECTOR);
      dropdownMenu = page.locator(COUNTRY_DROPDOWN_MENU_SELECTOR);
      copyBtn = component.locator(COPY_BTN_SELECTOR);
      clearBtn = component.locator(CLEAR_BTN_SELECTOR);
      chevron = component.locator(CHEVRON_SELECTOR);

      readonlyControl = container.locator(playgroundControls.readonly);
      disabledControl = container.locator(playgroundControls.disabled);
      showCopyControl = container.locator(playgroundControls.showCopy);
      showClearControl = container.locator(playgroundControls.showClear);
      withValidityControl = container.locator(playgroundControls.withValidity);
      detectControl = container.locator(playgroundControls.detect);
      countrySelect = container.locator(playgroundControls.country);
      localeSelect = container.locator(playgroundControls.locale);
      sizeSelect = container.locator(playgroundControls.size);
      themeSelect = container.locator(playgroundControls.theme);
      searchPlaceholderInput = container.locator(playgroundControls.searchPlaceholder);
      noResultsTextInput = container.locator(playgroundControls.noResultsText);
      clearButtonLabelInput = container.locator(playgroundControls.clearButtonLabel);
      dropdownClassInput = container.locator(playgroundControls.dropdownClass);
      disableDefaultStylesControl = container.locator(playgroundControls.disableDefaultStyles);
    });

    test.describe('props', () => {
      test.describe('readonly', () => {
        test.beforeEach(async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);

          await readonlyControl.check();
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

        test('readonly country selector does not open dropdown', async () => {
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
          await expect(copyBtn).toBeAttached();
        });

        test('readonly input hides clear button', async () => {
          // showClearButton = showClear && !isEmpty && !inactive — inactive=true when readonly
          await expect(clearBtn).not.toBeAttached();
        });
      });

      test.describe('disabled', () => {
        test.beforeEach(async () => {
          // Type digits before enabling disabled, so there is an existing value to test against
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);

          await disabledControl.check();
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
          await expect(copyBtn).not.toBeAttached();
        });

        test('disabled input hides clear button', async () => {
          await expect(clearBtn).not.toBeAttached();
        });
      });

      test.describe('showCopy', () => {
        test.beforeEach(async () => {
          await showCopyControl.check();
        });

        test('copy button is hidden when input is empty', async () => {
          await expect(copyBtn).not.toBeAttached();
        });

        test('copy button is visible when showCopy=true and input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await expect(copyBtn).toBeAttached();
        });

        test('unchecking showCopy hides copy button even when input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await showCopyControl.uncheck();
          await expect(copyBtn).not.toBeAttached();
        });

        test('re-checking showCopy restores copy button when input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await showCopyControl.uncheck();
          await showCopyControl.check();
          await expect(copyBtn).toBeAttached();
        });

        test('copy button remains visible when readonly=true and showCopy=true', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await readonlyControl.check();
          await expect(copyBtn).toBeAttached();
        });

        test('copy button is hidden when disabled=true regardless of showCopy=true', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await disabledControl.check();
          await expect(copyBtn).not.toBeAttached();
        });
      });

      test.describe('showClear', () => {
        test.beforeEach(async () => {
          await showClearControl.check();
        });

        test('clear button is hidden when input is empty', async () => {
          await expect(clearBtn).not.toBeAttached();
        });

        test('clear button is visible when showClear=true and input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await expect(clearBtn).toBeAttached();
        });

        test('unchecking showClear hides clear button even when input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await showClearControl.uncheck();
          await expect(clearBtn).not.toBeAttached();
        });

        test('re-checking showClear restores clear button when input has value', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await showClearControl.uncheck();
          await showClearControl.check();
          await expect(clearBtn).toBeAttached();
        });

        test('clear button is hidden when readonly=true and showClear=true', async () => {
          // inactive = disabled || readonly → showClearButton=false when readonly
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await readonlyControl.check();
          await expect(clearBtn).not.toBeAttached();
        });

        test('clear button is hidden when disabled=true and showClear=true', async () => {
          // inactive = disabled || readonly → showClearButton=false when disabled
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await disabledControl.check();
          await expect(clearBtn).not.toBeAttached();
        });

        test('clicking clear button empties input and hides clear button', async () => {
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
          await clearBtn.click();
          await expect(phoneInput).toHaveValue('');
          // isEmpty=true after clearing → button hides itself
          await expect(clearBtn).not.toBeAttached();
        });
      });

      test.describe('withValidity', () => {
        // Playground default: withValidity=true (checked)
        // Use US country for deterministic mask: "+1 ###-###-####" = 10 digits
        const US_COMPLETE_DIGITS = '2015551234'; // 10 digits — fills US mask
        const US_PARTIAL_DIGITS = '20155'; // 5 digits — clearly incomplete for US

        test.describe('is-complete class', () => {
          test.beforeEach(async () => {
            // Lock to US so we know exactly how many digits complete the mask
            await countrySelect.selectOption('US');
          });

          test('is-complete class absent when input is empty', async () => {
            await expect(component).not.toHaveClass(/is-complete/);
          });

          test('is-complete class appears immediately when all US digits are entered', async () => {
            // is-complete is computed synchronously from isComplete — no timer involved
            await phoneInput.click();
            await phoneInput.pressSequentially(US_COMPLETE_DIGITS);
            await expect(component).toHaveClass(/is-complete/);
          });

          test('is-complete class absent when only partial digits are entered', async () => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
            await expect(component).not.toHaveClass(/is-complete/);
          });

          test('unchecking withValidity removes is-complete class even with complete number', async () => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_COMPLETE_DIGITS);
            await withValidityControl.uncheck();
            await expect(component).not.toHaveClass(/is-complete/);
          });

          test('re-checking withValidity restores is-complete class when number is complete', async () => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_COMPLETE_DIGITS);
            await withValidityControl.uncheck();
            await withValidityControl.check();
            await expect(component).toHaveClass(/is-complete/);
          });
        });

        test.describe('is-incomplete class', () => {
          test.beforeEach(async () => {
            await countrySelect.selectOption('US');
          });

          test('is-incomplete class absent on fresh page load', async () => {
            await expect(component).not.toHaveClass(/is-incomplete/);
          });

          test('is-incomplete class absent immediately after typing partial digits (timer not yet fired)', async () => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
            // The 500ms validation hint timer has not fired yet
            await expect(component).not.toHaveClass(/is-incomplete/);
          });

          test('is-incomplete class appears after validation timer fires on partial input', async ({ page }) => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
            // Wait for the 500ms hint timer to fire (600ms buffer for reliability)
            await page.waitForTimeout(600);
            await expect(component).toHaveClass(/is-incomplete/);
          });

          test('is-incomplete class disappears and is-complete appears when number becomes complete', async ({ page }) => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
            await page.waitForTimeout(600);
            await expect(component).toHaveClass(/is-incomplete/);
            // Type the remaining 5 digits to complete the US number
            await phoneInput.pressSequentially('51234');
            await expect(component).not.toHaveClass(/is-incomplete/);
            await expect(component).toHaveClass(/is-complete/);
          });

          test('unchecking withValidity removes is-incomplete class after timer has fired', async ({ page }) => {
            await phoneInput.click();
            await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
            await page.waitForTimeout(600);
            await expect(component).toHaveClass(/is-incomplete/);
            await withValidityControl.uncheck();
            await expect(component).not.toHaveClass(/is-incomplete/);
          });

          test('no validity classes when withValidity=false even with complete number', async () => {
            await withValidityControl.uncheck();
            await phoneInput.click();
            await phoneInput.pressSequentially(US_COMPLETE_DIGITS);
            await expect(component).not.toHaveClass(/is-complete/);
            await expect(component).not.toHaveClass(/is-incomplete/);
          });
        });
      });

      test.describe('detect', () => {
        // Playground default: detect=true (checked)
        // detect only controls GeoIP/locale detection on init — hasDropdown stays true
        // regardless of detect value (hasDropdown=false only when country prop is set)
        // Tests are structural only — do not assert which country is selected (GeoIP is non-deterministic in CI)

        test('selector button shows chevron with detect=true', async () => {
          // chevron is present when !inactive && hasDropdown
          await expect(chevron).toBeAttached();
        });

        test('selector button does not have no-dropdown class with detect=true', async () => {
          // no-dropdown class is added only when !hasDropdown || readonly
          await expect(dropdownBtn).not.toHaveClass(/no-dropdown/);
        });

        test('country dropdown can be opened with detect=true', async () => {
          await dropdownBtn.click();
          await expect(dropdownMenu).toBeAttached();
        });

        test('unchecking detect still shows chevron (detect=false does not disable dropdown)', async () => {
          // KEY BOUNDARY: detect controls detection, not dropdown availability
          await detectControl.uncheck();
          await expect(chevron).toBeAttached();
        });

        test('unchecking detect does not add no-dropdown class to selector button', async () => {
          await detectControl.uncheck();
          await expect(dropdownBtn).not.toHaveClass(/no-dropdown/);
        });

        test('country dropdown can be opened with detect=false', async () => {
          await detectControl.uncheck();
          await dropdownBtn.click();
          await expect(dropdownMenu).toBeAttached();
        });

        test('re-checking detect restores normal state with chevron present', async () => {
          await detectControl.uncheck();
          await detectControl.check();
          await expect(chevron).toBeAttached();
        });
      });

      test.describe('locale', () => {
        const DROPDOWN_OPTION_SELECTOR = '.pi-option';

        test('locale=en-US shows country names in English', async () => {
          await localeSelect.selectOption('en-US');
          await dropdownBtn.click();
          await expect(dropdownMenu).toBeAttached();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Germany', { exact: false })).toBeAttached();
        });

        test('locale=de-DE shows country names in German', async () => {
          await localeSelect.selectOption('de-DE');
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Deutschland', { exact: false })).toBeAttached();
        });

        test('locale=ru-RU shows country names in Russian', async () => {
          await localeSelect.selectOption('ru-RU');
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Германия', { exact: false })).toBeAttached();
        });

        test('switching locale updates country names in open dropdown', async ({ page }) => {
          await localeSelect.selectOption('de-DE');
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Deutschland', { exact: false })).toBeAttached();

          await page.keyboard.press('Escape');
          await localeSelect.selectOption('en-US');
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Germany', { exact: false })).toBeAttached();
          await expect(dropdownMenu.locator(DROPDOWN_OPTION_SELECTOR).getByText('Deutschland', { exact: false })).not.toBeAttached();
        });
      });

      test.describe('size', () => {
        test('size=normal adds size-normal class to root element', async () => {
          await sizeSelect.selectOption('normal');
          await expect(component).toHaveClass(/size-normal/);
        });

        test('size=compact adds size-compact class to root element', async () => {
          await sizeSelect.selectOption('compact');
          await expect(component).toHaveClass(/size-compact/);
        });

        test('size=compact removes size-normal class', async () => {
          await sizeSelect.selectOption('compact');
          await expect(component).not.toHaveClass(/size-normal/);
        });

        test('size=large adds size-large class to root element', async () => {
          await sizeSelect.selectOption('large');
          await expect(component).toHaveClass(/size-large/);
        });

        test('size=large removes size-normal class', async () => {
          await sizeSelect.selectOption('large');
          await expect(component).not.toHaveClass(/size-normal/);
        });

        test('switching from compact to large updates size class', async () => {
          await sizeSelect.selectOption('compact');
          await sizeSelect.selectOption('large');
          await expect(component).toHaveClass(/size-large/);
          await expect(component).not.toHaveClass(/size-compact/);
        });

        test('switching back to normal restores size-normal class', async () => {
          await sizeSelect.selectOption('large');
          await sizeSelect.selectOption('normal');
          await expect(component).toHaveClass(/size-normal/);
          await expect(component).not.toHaveClass(/size-large/);
        });
      });

      test.describe('theme', () => {
        test('theme=light adds theme-light class to root element', async () => {
          await themeSelect.selectOption('light');
          await expect(component).toHaveClass(/theme-light/);
        });

        test('theme=dark adds theme-dark class to root element', async () => {
          await themeSelect.selectOption('dark');
          await expect(component).toHaveClass(/theme-dark/);
        });

        test('theme=light removes theme-dark class', async () => {
          await themeSelect.selectOption('dark');
          await themeSelect.selectOption('light');
          await expect(component).not.toHaveClass(/theme-dark/);
        });

        test('theme=dark removes theme-light class', async () => {
          await themeSelect.selectOption('light');
          await themeSelect.selectOption('dark');
          await expect(component).not.toHaveClass(/theme-light/);
        });

        test('theme=auto resolves to theme-light or theme-dark based on system preference', async () => {
          // auto is resolved at render time — never leaves theme-auto on the element
          await themeSelect.selectOption('auto');
          const classes = await component.getAttribute('class') ?? '';
          const hasLight = classes.includes('theme-light');
          const hasDark = classes.includes('theme-dark');
          expect(hasLight || hasDark).toBeTruthy();
          expect(hasLight && hasDark).toBeFalsy();
        });

        test('theme=dark applies theme-dark class to dropdown menu', async () => {
          await themeSelect.selectOption('dark');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/theme-dark/);
        });

        test('theme=light applies theme-light class to dropdown menu', async () => {
          await themeSelect.selectOption('light');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/theme-light/);
        });

        test('switching theme updates dropdown menu class', async ({ page }) => {
          await themeSelect.selectOption('dark');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/theme-dark/);

          await page.keyboard.press('Escape');
          await themeSelect.selectOption('light');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/theme-light/);
        });
      });

      test.describe('searchPlaceholder', () => {
        test('default placeholder is shown in dropdown search input', async () => {
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR)).toHaveAttribute(
            'placeholder',
            'Search country or code...'
          );
        });

        test('custom placeholder is shown in dropdown search input', async () => {
          await searchPlaceholderInput.fill('Find a country');
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR)).toHaveAttribute(
            'placeholder',
            'Find a country'
          );
        });

        test('clearing custom placeholder reverts to default', async () => {
          await searchPlaceholderInput.fill('Find a country');
          await searchPlaceholderInput.clear();
          await dropdownBtn.click();
          await expect(dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR)).toHaveAttribute(
            'placeholder',
            'Search country or code...'
          );
        });
      });

      test.describe('noResultsText', () => {
        // A query that matches no country name or dial code
        const NO_MATCH_QUERY = 'xqzxqz';

        test('default no-results text is shown when search matches nothing', async () => {
          await dropdownBtn.click();
          await dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR).fill(NO_MATCH_QUERY);
          await expect(dropdownMenu.locator(DROPDOWN_NO_RESULTS_SELECTOR)).toHaveText('No countries found');
        });

        test('custom no-results text is shown when search matches nothing', async () => {
          await noResultsTextInput.fill('Nothing here!');
          await dropdownBtn.click();
          await dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR).fill(NO_MATCH_QUERY);
          await expect(dropdownMenu.locator(DROPDOWN_NO_RESULTS_SELECTOR)).toHaveText('Nothing here!');
        });

        test('clearing custom no-results text reverts to default', async () => {
          await noResultsTextInput.fill('Nothing here!');
          await noResultsTextInput.clear();
          await dropdownBtn.click();
          await dropdownMenu.locator(DROPDOWN_SEARCH_SELECTOR).fill(NO_MATCH_QUERY);
          await expect(dropdownMenu.locator(DROPDOWN_NO_RESULTS_SELECTOR)).toHaveText('No countries found');
        });
      });

      test.describe('clearButtonLabel', () => {
        test.beforeEach(async () => {
          await showClearControl.check();
          await phoneInput.click();
          await phoneInput.pressSequentially(DIGITS);
        });

        test('default label is used as aria-label on clear button', async () => {
          await expect(clearBtn).toHaveAttribute('aria-label', 'Clear phone number');
        });

        test('default label is used as title on clear button', async () => {
          await expect(clearBtn).toHaveAttribute('title', 'Clear phone number');
        });

        test('custom label is applied as aria-label on clear button', async () => {
          await clearButtonLabelInput.fill('Remove phone');
          await expect(clearBtn).toHaveAttribute('aria-label', 'Remove phone');
        });

        test('custom label is applied as title on clear button', async () => {
          await clearButtonLabelInput.fill('Remove phone');
          await expect(clearBtn).toHaveAttribute('title', 'Remove phone');
        });

        test('clearing custom label reverts aria-label to default', async () => {
          await clearButtonLabelInput.fill('Remove phone');
          await clearButtonLabelInput.clear();
          await expect(clearBtn).toHaveAttribute('aria-label', 'Clear phone number');
        });
      });

      test.describe('dropdownClass', () => {
        test('dropdown has no custom class when dropdownClass is empty', async () => {
          await dropdownBtn.click();
          // Only built-in classes present — no custom class
          await expect(dropdownMenu).not.toHaveClass(/my-custom-class/);
        });

        test('custom class is added to dropdown menu', async () => {
          await dropdownClassInput.fill('my-custom-class');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/my-custom-class/);
        });

        test('multiple classes can be set via dropdownClass', async () => {
          await dropdownClassInput.fill('class-a class-b');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/class-a/);
          await expect(dropdownMenu).toHaveClass(/class-b/);
        });

        test('clearing dropdownClass removes the custom class from dropdown', async ({ page }) => {
          await dropdownClassInput.fill('my-custom-class');
          await dropdownBtn.click();
          await expect(dropdownMenu).toHaveClass(/my-custom-class/);

          await page.keyboard.press('Escape');
          await dropdownClassInput.clear();
          await dropdownBtn.click();
          await expect(dropdownMenu).not.toHaveClass(/my-custom-class/);
        });
      });

      test.describe('disableDefaultStyles', () => {
        test('is-unstyled class absent by default', async () => {
          await expect(component).not.toHaveClass(/is-unstyled/);
        });

        test('checking disableDefaultStyles adds is-unstyled class to root element', async () => {
          await disableDefaultStylesControl.check();
          await expect(component).toHaveClass(/is-unstyled/);
        });

        test('unchecking disableDefaultStyles removes is-unstyled class', async () => {
          await disableDefaultStylesControl.check();
          await disableDefaultStylesControl.uncheck();
          await expect(component).not.toHaveClass(/is-unstyled/);
        });
      });
    });
  });
}
