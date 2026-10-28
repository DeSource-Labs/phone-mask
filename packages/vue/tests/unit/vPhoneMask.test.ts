/// <reference types="vitest/globals" />
import { nextTick } from 'vue';
import { render } from '@testing-library/vue';
import type { DirectiveHTMLInputElement, PMaskDirectiveOptions } from '@src/types';
import { vPhoneMask } from '@src/directives/vPhoneMask';
import VPhoneMaskWrapper from './setup/VPhoneMaskWrapper.vue';
import { tools } from './setup/tools';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';
import { makePasteEvent } from '@common/tests/unit/setup/paste';

vi.mock('@desource/phone-mask/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask/kit')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask/kit';

const setup =
  (elTag: 'input' | 'div' = 'input', elValue?: string) =>
  async (options?: string | PMaskDirectiveOptions) => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const mergeParams = (opts?: string | PMaskDirectiveOptions): string | PMaskDirectiveOptions | undefined =>
      typeof opts === 'object' ? { ...opts, onChange, onCountryChange } : opts;

    const { container, rerender, unmount } = render(VPhoneMaskWrapper, {
      props: { tag: elTag, options: mergeParams(options), initialValue: elValue },
      global: {
        directives: { phoneMask: vPhoneMask }
      }
    });

    await nextTick();

    const el = container.firstElementChild as DirectiveHTMLInputElement;

    const update = async (newOptions?: string | PMaskDirectiveOptions) => {
      await rerender({ options: mergeParams(newOptions) });
    };

    return {
      el,
      onChange,
      onCountryChange,
      update,
      unmount
    };
  };

describe('vPhoneMask directive', () => {
  it('keeps an explicitly selected initial country when pending GeoIP detection completes', async () => {
    let resolveGeo!: (country: string) => void;
    vi.mocked(detectByGeoIp).mockImplementationOnce(() => new Promise((resolve) => (resolveGeo = resolve)));
    const { el, update, unmount } = await setup('input')({ detect: true });
    await update({ country: 'US', detect: true });

    await tools.act(() => {
      resolveGeo('DE');
    });

    expect(el.__phoneMaskState?.country.id).toBe('US');
    unmount();
  });

  it('does not repeat the country callback when options reflect a detected country', async () => {
    const { el, onCountryChange, update, unmount } = await setup('input')({ country: 'US' });
    onCountryChange.mockClear();

    await tools.act(() => {
      el.dispatchEvent(makePasteEvent('+7 12345 6 77 88'));
    });
    await update({ country: 'KZ' });

    expect(onCountryChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'KZ' }));
    unmount();
  });

  it('preserves pasted country on unrelated updates and observes mutated country options', async () => {
    const options = { country: 'US', locale: 'en' };
    const { container, rerender, unmount } = render(VPhoneMaskWrapper, {
      props: { tag: 'input', options },
      global: { directives: { phoneMask: vPhoneMask } }
    });
    await nextTick();
    const input = container.firstElementChild as DirectiveHTMLInputElement;
    await tools.act(() => {
      input.dispatchEvent(makePasteEvent('+7 123 456 7788'));
    });

    options.locale = 'fr';
    await rerender({ options, initialValue: '1234567788' });
    expect(input.__phoneMaskState?.country.id).toBe('KZ');

    options.country = 'FR';
    await rerender({ options, initialValue: '123456789' });
    expect(input.__phoneMaskState?.country.id).toBe('FR');
    unmount();
  });

  testPhoneMaskBinding(
    setup,
    {
      warnMessage: '[v-phone-mask] Directive can only be used on input elements',
      detectByGeoIpMock: vi.mocked(detectByGeoIp)
    },
    tools
  );
});
