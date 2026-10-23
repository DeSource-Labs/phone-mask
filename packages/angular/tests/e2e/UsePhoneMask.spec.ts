import { testUsePhoneMask } from '@common/tests/e2e/UsePhoneMask';

testUsePhoneMask(
  '[data-testid="hook"]',
  {
    setCountryUs: '[data-testid="control-country-us"]',
    setCountryDe: '[data-testid="control-country-de"]',
    clear: '[data-testid="control-clear"]'
  },
  {
    digits: '[data-testid="meta-digits"]',
    full: '[data-testid="meta-full"]',
    formatted: '[data-testid="meta-formatted"]',
    valid: '[data-testid="meta-valid"]'
  }
);
