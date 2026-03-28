/// <reference types="vitest/globals" />
import { usePhoneMask } from '../../src/composables/usePhoneMask.svelte';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { createState, tools, withSetup } from './setup/tools.svelte';

function setup(initialValue = '', options: UsePhoneMaskSetupOptions = {}) {
  const { attachRef = true } = options;
  const valueState = createState(initialValue);
  const onChange = vi.fn((nextDigits: string) => {
    valueState.value = nextDigits;
  });
  const inputEl = document.createElement('input');

  const { result, unmount } = withSetup(() => {
    const api = usePhoneMask({
      value: () => valueState.value,
      detect: () => false,
      onChange
    });
    if (attachRef) {
      api.inputRef = inputEl;
    }
    return api;
  });

  return {
    inputEl,
    onChange,
    getValue: () => valueState.value,
    unmount,
    api: {
      getInputRef: () => result.inputRef,
      getDigits: () => result.digits,
      getFull: () => result.full,
      getFullFormatted: () => result.fullFormatted,
      isComplete: () => result.isComplete,
      isEmpty: () => result.isEmpty,
      getLocale: () => result.locale,
      shouldShowWarn: () => result.shouldShowWarn,
      setCountry: (countryCode: string) => result.setCountry(countryCode),
      clear: () => result.clear()
    }
  };
}

testUsePhoneMask(setup, tools);

describe('usePhoneMask (Svelte specifics)', () => {
  it('exposes inputRef, locale and isComplete getters', async () => {
    const { api, inputEl, unmount } = setup('2025550199');

    await tools.act(async () => {});

    expect(api.getInputRef()).toBe(inputEl);
    expect(api.getLocale().toLowerCase().startsWith('en')).toBe(true);
    expect(api.isComplete()).toBe(true);

    unmount();
  });
});
