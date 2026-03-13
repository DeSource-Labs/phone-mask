/// <reference types="vitest/globals" />
import { defineComponent, h, nextTick, ref } from 'vue';
import { render } from '@testing-library/vue';
import { usePhoneMask } from '../../src/composables/usePhoneMask';
import { install } from '../../src/index';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { tools, withSetup } from './setup/tools';

function setupUsePhoneMaskHarness(initialValue = '', options: UsePhoneMaskSetupOptions = {}) {
  const { attachRef = true } = options;
  const value = ref(initialValue);
  const onChange = vi.fn((nextDigits: string) => {
    value.value = nextDigits;
  });

  let api!: ReturnType<typeof usePhoneMask>;

  const Harness = defineComponent({
    setup() {
      api = usePhoneMask({
        value,
        detect: false,
        onChange
      });

      return () =>
        h('input', {
          ...(attachRef ? { ref: api.inputRef } : {}),
          'data-testid': 'phone-input'
        });
    }
  });

  const rendered = render(Harness);
  const input = rendered.getByTestId('phone-input') as HTMLInputElement;

  return {
    inputEl: input,
    onChange,
    getValue: () => value.value,
    unmount: rendered.unmount,
    api: {
      getDigits: () => api.digits.value,
      getFull: () => api.full.value,
      getFullFormatted: () => api.fullFormatted.value,
      isEmpty: () => api.isEmpty.value,
      shouldShowWarn: () => api.shouldShowWarn.value,
      setCountry: (countryCode: string) => api.setCountry(countryCode),
      clear: () => api.clear()
    }
  };
}

testUsePhoneMask(setupUsePhoneMaskHarness, tools);

describe('usePhoneMask', () => {
  it('removes native listeners on unmount when inputRef is manually assigned', async () => {
    const value = ref('');
    const onChange = vi.fn((nextDigits: string) => {
      value.value = nextDigits;
    });

    const input = document.createElement('input');
    const removeEventListenerSpy = vi.spyOn(input, 'removeEventListener');

    const { unmount } = withSetup(() => {
      const api = usePhoneMask({
        value,
        detect: false,
        onChange
      });

      api.inputRef.value = input;
      return api;
    });

    await nextTick();
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
  });
});

describe('vue package index', () => {
  it('install registers component and directive', () => {
    const app = {
      component: vi.fn(),
      directive: vi.fn()
    };

    install(app as never);

    expect(app.component).toHaveBeenCalledWith('PhoneInput', expect.anything());
    expect(app.directive).toHaveBeenCalledWith('phone-mask', expect.anything());
  });
});
