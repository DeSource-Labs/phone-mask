import { testPhoneInput } from '../../../../common/tests/e2e/PhoneInput';

const PLAYGROUND_SELECTOR = '[data-testid="playground"]';

const READONLY_SELECTOR = '[data-testid="props-readonly"] input[type="checkbox"]';
const DISABLED_SELECTOR = '[data-testid="props-disabled"] input[type="checkbox"]';

testPhoneInput(PLAYGROUND_SELECTOR, {
  readonly: READONLY_SELECTOR,
  disabled: DISABLED_SELECTOR
});

