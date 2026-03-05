import { testPhoneInput } from '../../../../common/tests/e2e/PhoneInput';

const PLAYGROUND_SELECTOR = '[data-testid="playground"]';

const COUNTRY_SELECTOR = '[data-testid="props-country"]';
const READONLY_SELECTOR = '[data-testid="props-readonly"] input[type="checkbox"]';
const DISABLED_SELECTOR = '[data-testid="props-disabled"] input[type="checkbox"]';
const SHOW_COPY_SELECTOR = '[data-testid="props-show-copy"] input[type="checkbox"]';
const SHOW_CLEAR_SELECTOR = '[data-testid="props-show-clear"] input[type="checkbox"]';
const WITH_VALIDITY_SELECTOR = '[data-testid="props-with-validity"] input[type="checkbox"]';
const DETECT_SELECTOR = '[data-testid="props-detect"] input[type="checkbox"]';
const LOCALE_SELECTOR = '[data-testid="props-locale"]';
const SIZE_SELECTOR = '[data-testid="props-size"]';
const THEME_SELECTOR = '[data-testid="props-theme"]';
const SEARCH_PLACEHOLDER_SELECTOR = '[data-testid="props-search-placeholder"]';
const NO_RESULTS_TEXT_SELECTOR = '[data-testid="props-no-results-text"]';
const CLEAR_BUTTON_LABEL_SELECTOR = '[data-testid="props-clear-button-label"]';
const DROPDOWN_CLASS_SELECTOR = '[data-testid="props-dropdown-class"]';
const DISABLE_DEFAULT_STYLES_SELECTOR = '[data-testid="props-disable-default-styles"] input[type="checkbox"]';

testPhoneInput(PLAYGROUND_SELECTOR, {
  country: COUNTRY_SELECTOR,
  readonly: READONLY_SELECTOR,
  disabled: DISABLED_SELECTOR,
  showCopy: SHOW_COPY_SELECTOR,
  showClear: SHOW_CLEAR_SELECTOR,
  withValidity: WITH_VALIDITY_SELECTOR,
  detect: DETECT_SELECTOR,
  locale: LOCALE_SELECTOR,
  size: SIZE_SELECTOR,
  theme: THEME_SELECTOR,
  searchPlaceholder: SEARCH_PLACEHOLDER_SELECTOR,
  noResultsText: NO_RESULTS_TEXT_SELECTOR,
  clearButtonLabel: CLEAR_BUTTON_LABEL_SELECTOR,
  dropdownClass: DROPDOWN_CLASS_SELECTOR,
  disableDefaultStyles: DISABLE_DEFAULT_STYLES_SELECTOR
});
