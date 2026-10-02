import { testUsePhoneMask } from '../../../../common/tests/e2e/UsePhoneMask';

const HOOK_SELECTOR = '[data-testid="hook"]';

const SET_COUNTRY_US_SELECTOR = '[data-testid="control-country-us"]';
const SET_COUNTRY_DE_SELECTOR = '[data-testid="control-country-de"]';
const CLEAR_SELECTOR = '[data-testid="control-clear"]';

const META_DIGITS_SELECTOR = '[data-testid="meta-digits"]';
const META_FULL_SELECTOR = '[data-testid="meta-full"]';
const META_FORMATTED_SELECTOR = '[data-testid="meta-formatted"]';
const META_VALID_SELECTOR = '[data-testid="meta-valid"]';

testUsePhoneMask(
  HOOK_SELECTOR,
  {
    setCountryUs: SET_COUNTRY_US_SELECTOR,
    setCountryDe: SET_COUNTRY_DE_SELECTOR,
    clear: CLEAR_SELECTOR
  },
  {
    digits: META_DIGITS_SELECTOR,
    full: META_FULL_SELECTOR,
    formatted: META_FORMATTED_SELECTOR,
    valid: META_VALID_SELECTOR
  }
);
