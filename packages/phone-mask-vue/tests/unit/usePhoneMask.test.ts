/// <reference types="vitest/globals" />
import { defineComponent, h, nextTick, ref } from 'vue';
import { render } from '@testing-library/vue';
import { usePhoneMask } from '../../src/composables/usePhoneMask';
import { install } from '../../src/index';
import { withSetup } from './setup/tools';

function setupUsePhoneMaskHarness(initialValue = '') {
  const value = ref(initialValue);
  const onChange = vi.fn((nextDigits: string) => {
    value.value = nextDigits;
  });
  const onPhoneChange = vi.fn();
  const onCountryChange = vi.fn();

  let api!: ReturnType<typeof usePhoneMask>;

  const Harness = defineComponent({
    setup() {
      api = usePhoneMask({
        value,
        detect: false,
        onChange,
        onPhoneChange,
        onCountryChange
      });

      return () =>
        h('input', {
          ref: api.inputRef,
          'data-testid': 'phone-input'
        });
    }
  });

  const rendered = render(Harness);
  const input = rendered.getByTestId('phone-input') as HTMLInputElement;

  return {
    ...rendered,
    api,
    input,
    value,
    onChange,
    onPhoneChange,
    onCountryChange
  };
}

describe('usePhoneMask', () => {
  it('sets tel attributes and syncs formatted display to input element', async () => {
    const { api, input, unmount } = setupUsePhoneMaskHarness('20255501');

    await nextTick();

    expect(input.getAttribute('type')).toBe('tel');
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.getAttribute('placeholder')).toBe('###-###-####');
    expect(input.value).toBe('202-555-01');

    expect(api.digits.value).toBe('20255501');
    expect(api.full.value).toBe('+120255501');
    expect(api.fullFormatted.value).toBe('+1 202-555-01');
    expect(api.isEmpty.value).toBe(false);
    expect(api.shouldShowWarn.value).toBe(true);

    unmount();
  });

  it('handles native input events', async () => {
    const { input, onChange, unmount } = setupUsePhoneMaskHarness('');

    await nextTick();

    input.value = '202-555-0199';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(onChange).toHaveBeenCalledWith('2025550199');
    unmount();
  });

  it('supports clear() and setCountry()', async () => {
    const { api, value, onChange, unmount } = setupUsePhoneMaskHarness('2025550199');

    await nextTick();
    expect(api.full.value).toBe('+12025550199');

    expect(api.setCountry('DE')).toBe(true);
    await nextTick();
    expect(api.full.value).toBe('+492025550199');
    expect(api.fullFormatted.value).toContain('+49');

    api.clear();
    await nextTick();

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(value.value).toBe('');
    expect(api.isEmpty.value).toBe(true);

    unmount();
  });

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
