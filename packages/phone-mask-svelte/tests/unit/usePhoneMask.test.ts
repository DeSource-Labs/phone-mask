/// <reference types="vitest/globals" />
import { usePhoneMask } from '../../src/composables/usePhoneMask.svelte';
import { testUsePhoneMask } from '@common/tests/unit/usePhoneMask';
import { createState, tools, withSetup } from './setup/tools.svelte';

function setup(initialValue = '') {
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
    api.inputRef = inputEl;
    return api;
  });

  return {
    inputEl,
    onChange,
    getValue: () => valueState.value,
    unmount,
    api: {
      getDigits: () => result.digits,
      getFull: () => result.full,
      getFullFormatted: () => result.fullFormatted,
      isEmpty: () => result.isEmpty,
      shouldShowWarn: () => result.shouldShowWarn,
      setCountry: (countryCode: string) => result.setCountry(countryCode),
      clear: () => result.clear()
    }
  };
}

testUsePhoneMask(setup, tools);

describe('usePhoneMask (Svelte)', () => {
  it('handles lifecycle when inputRef is never assigned', async () => {
    const valueState = createState('202');
    const onChange = vi.fn((nextDigits: string) => {
      valueState.value = nextDigits;
    });

    const { result, unmount } = withSetup(() =>
      usePhoneMask({
        value: () => valueState.value,
        detect: () => false,
        onChange
      })
    );

    expect(result.digits).toBe('202');

    result.clear();
    expect(onChange).toHaveBeenCalledWith('');

    valueState.value = '2025550199';
    await tools.act(async () => {});
    expect(result.full).toBe('+12025550199');

    unmount();
  });
});
