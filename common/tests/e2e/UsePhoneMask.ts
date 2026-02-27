import { test, expect, type Locator } from '@playwright/test';

type UsePhoneMaskControls = {
  setCountryUs: string;
  setCountryDe: string;
  clear: string;
};

type UsePhoneMaskMeta = {
  digits: string;
  full: string;
  formatted: string;
  valid: string;
};

export function testUsePhoneMask(containerSelector: string, controls: UsePhoneMaskControls, meta: UsePhoneMaskMeta) {
  const INPUT_SELECTOR = '[data-testid="phone-input"]';

  // US (+1): mask (###) ###-#### — exactly 10 digit slots
  const US_DIGITS = '2015551234';
  const US_PARTIAL_DIGITS = '20155';

  test.describe('usePhoneMask', () => {
    let container: Locator;
    let phoneInput: Locator;

    // Control buttons
    let setCountryUsBtn: Locator;
    let setCountryDeBtn: Locator;
    let clearBtn: Locator;

    // Meta display (reactive output values from the composable)
    let metaDigits: Locator;
    let metaFull: Locator;
    let metaFormatted: Locator;
    let metaValid: Locator;

    test.beforeEach(async ({ page }) => {
      await page.goto('/');

      container = page.locator(containerSelector);
      phoneInput = container.locator(INPUT_SELECTOR);

      setCountryUsBtn = container.locator(controls.setCountryUs);
      setCountryDeBtn = container.locator(controls.setCountryDe);
      clearBtn = container.locator(controls.clear);

      metaDigits = container.locator(meta.digits);
      metaFull = container.locator(meta.full);
      metaFormatted = container.locator(meta.formatted);
      metaValid = container.locator(meta.valid);
    });

    test.describe('initial state', () => {
      test('input is empty', async () => {
        await expect(phoneInput).toHaveValue('');
      });

      test('digits meta shows — when input is empty', async () => {
        await expect(metaDigits).toContainText('—');
      });

      test('full meta shows — when input is empty', async () => {
        await expect(metaFull).toContainText('—');
      });

      test('formatted meta shows — when input is empty', async () => {
        await expect(metaFormatted).toContainText('—');
      });

      test('valid meta shows No when input is empty', async () => {
        await expect(metaValid).toContainText('No');
      });
    });

    test.describe('input attributes', () => {
      test('input has type tel', async () => {
        await expect(phoneInput).toHaveAttribute('type', 'tel');
      });

      test('input has inputmode tel', async () => {
        await expect(phoneInput).toHaveAttribute('inputmode', 'tel');
      });

      test('input placeholder is set from the country mask', async () => {
        const placeholder = await phoneInput.getAttribute('placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder).toContain('#');
      });

      test('placeholder updates when country changes', async () => {
        // Initial country is GB — switching to US must change the placeholder
        const placeholderBefore = await phoneInput.getAttribute('placeholder');

        await setCountryUsBtn.click();

        const placeholderAfter = await phoneInput.getAttribute('placeholder');
        expect(placeholderAfter).toBeTruthy();
        expect(placeholderAfter).not.toEqual(placeholderBefore);
      });
    });

    test.describe('typing', () => {
      test.beforeEach(async () => {
        await setCountryUsBtn.click();
        await phoneInput.click();
        await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
      });

      test('input has a formatted display value after typing', async () => {
        const value = await phoneInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      });

      test('digits meta shows raw typed digits', async () => {
        await expect(metaDigits).toContainText(US_PARTIAL_DIGITS);
      });

      test('full meta contains country code followed by digits', async () => {
        await expect(metaFull).toContainText(`+1${US_PARTIAL_DIGITS}`);
      });

      test('formatted meta contains country code', async () => {
        await expect(metaFormatted).toContainText('+1');
      });

      test('valid is No for partial input', async () => {
        await expect(metaValid).toContainText('No');
      });
    });

    test.describe('complete number', () => {
      test.beforeEach(async () => {
        await setCountryUsBtn.click();
        await phoneInput.click();
        await phoneInput.pressSequentially(US_DIGITS);
      });

      test('valid is Yes when all US digit slots are filled', async () => {
        await expect(metaValid).toContainText('Yes');
      });

      test('digits meta shows all typed digits', async () => {
        await expect(metaDigits).toContainText(US_DIGITS);
      });

      test('full meta contains country code and all digits', async () => {
        await expect(metaFull).toContainText(`+1${US_DIGITS}`);
      });

      test('formatted meta contains country code', async () => {
        await expect(metaFormatted).toContainText('+1');
      });
    });

    test.describe('setCountry', () => {
      test('US placeholder contains mask pattern', async () => {
        await setCountryUsBtn.click();
        const placeholder = await phoneInput.getAttribute('placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder).toContain('#');
      });

      test('DE placeholder contains mask pattern', async () => {
        await setCountryDeBtn.click();
        const placeholder = await phoneInput.getAttribute('placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder).toContain('#');
      });

      test('US and DE placeholders differ', async () => {
        await setCountryUsBtn.click();
        const usPlaceholder = await phoneInput.getAttribute('placeholder');

        await setCountryDeBtn.click();
        const dePlaceholder = await phoneInput.getAttribute('placeholder');

        expect(usPlaceholder).not.toEqual(dePlaceholder);
      });

      test('switching country from US to DE updates full meta country code', async () => {
        await setCountryUsBtn.click();
        await phoneInput.click();
        await phoneInput.pressSequentially('20155');
        await expect(metaFull).toContainText('+1');

        await setCountryDeBtn.click();
        await expect(metaFull).toContainText('+49');
      });

      test('digits are preserved when switching country', async () => {
        await setCountryUsBtn.click();
        await phoneInput.click();
        await phoneInput.pressSequentially('20155');
        await expect(metaDigits).toContainText('20155');

        await setCountryDeBtn.click();
        await expect(metaDigits).toContainText('20155');
      });
    });

    test.describe('clear', () => {
      test.beforeEach(async () => {
        await setCountryUsBtn.click();
        await phoneInput.click();
        await phoneInput.pressSequentially(US_PARTIAL_DIGITS);
      });

      test('clicking clear empties the input', async () => {
        await clearBtn.click();
        await expect(phoneInput).toHaveValue('');
      });

      test('digits meta shows — after clear', async () => {
        await clearBtn.click();
        await expect(metaDigits).toContainText('—');
      });

      test('full meta shows — after clear', async () => {
        await clearBtn.click();
        await expect(metaFull).toContainText('—');
      });

      test('formatted meta shows — after clear', async () => {
        await clearBtn.click();
        await expect(metaFormatted).toContainText('—');
      });

      test('valid meta shows No after clear', async () => {
        await clearBtn.click();
        await expect(metaValid).toContainText('No');
      });
    });
  });
}
