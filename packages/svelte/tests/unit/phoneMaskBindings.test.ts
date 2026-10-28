/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import type { PhoneMaskBindingElement, PhoneMaskBindingOptions } from '@src/types';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';
import { makePasteEvent } from '@common/tests/unit/setup/paste';
import { phoneMaskAction } from '@src/directives/phoneMaskAction';

import PhoneMaskAttachmentWrapper from './setup/PhoneMaskAttachmentWrapper.svelte';
import PhoneMaskActionWrapper from './setup/PhoneMaskActionWrapper.svelte';
import PhoneMaskReactiveAttachmentWrapper from './setup/PhoneMaskReactiveAttachmentWrapper.svelte';
import { tools, flushPromises } from './setup/tools.svelte';

vi.mock('@desource/phone-mask/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask/kit')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask/kit';

type Wrapper = typeof PhoneMaskActionWrapper | typeof PhoneMaskAttachmentWrapper;

const setup =
  (wrapper: Wrapper) =>
  (elTag: 'input' | 'div' = 'input', elValue?: string) =>
  async (options?: string | PhoneMaskBindingOptions) => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const mergeParams = (opts?: string | PhoneMaskBindingOptions): string | PhoneMaskBindingOptions | undefined =>
      typeof opts === 'object' ? { ...opts, onChange, onCountryChange } : opts;

    const { container, rerender, unmount } = render(wrapper, {
      props: { tag: elTag, options: mergeParams(options), initialValue: elValue }
    });

    await flushPromises();

    const el = container.firstElementChild as PhoneMaskBindingElement;

    const update = async (newOptions?: string | PhoneMaskBindingOptions) => {
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

describe('phoneMask attachment', () => {
  it('preserves detected country when onChange updates parent state', async () => {
    const { container, unmount } = render(PhoneMaskReactiveAttachmentWrapper);
    await flushPromises();
    const input = container.querySelector('input') as PhoneMaskBindingElement;

    await tools.act(() => {
      input.dispatchEvent(makePasteEvent('+7 123 456 7788'));
    });

    expect(input.__phoneMaskState?.country.id).toBe('KZ');
    expect(input.__phoneMaskState?.digits).toBe('1234567788');
    expect(input.value).toBe('123 456 7788');
    expect(container.querySelector('output')?.textContent).toBe('1234567788');
    unmount();
  });

  testPhoneMaskBinding(
    setup(PhoneMaskAttachmentWrapper),
    {
      warnMessage: '[phoneMaskAttachment] Attachment can only be used on input elements',
      detectByGeoIpMock: vi.mocked(detectByGeoIp)
    },
    tools
  );
});

describe('phoneMaskAction', () => {
  it('keeps an explicitly selected initial country when pending GeoIP detection completes', async () => {
    let resolveGeo!: (country: string) => void;
    vi.mocked(detectByGeoIp).mockImplementationOnce(() => new Promise((resolve) => (resolveGeo = resolve)));
    const { el, update, unmount } = await setup(PhoneMaskActionWrapper)('input')({ detect: true });
    await update({ country: 'US', detect: true });

    await tools.act(() => {
      resolveGeo('DE');
    });

    expect(el.__phoneMaskState?.country.id).toBe('US');
    unmount();
  });

  it('does not repeat the country callback when options reflect a detected country', async () => {
    const { el, onCountryChange, update, unmount } = await setup(PhoneMaskActionWrapper)('input')({ country: 'US' });
    onCountryChange.mockClear();

    await tools.act(() => {
      el.dispatchEvent(makePasteEvent('+7 123 456 7788'));
    });
    await update({ country: 'KZ' });

    expect(onCountryChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'KZ' }));
    unmount();
  });

  it('preserves pasted country on unrelated updates and observes mutated country options', async () => {
    const input = document.createElement('input') as PhoneMaskBindingElement;
    const options = { country: 'US', locale: 'en' };
    const action = phoneMaskAction(input, options);
    await flushPromises();
    await tools.act(() => {
      input.dispatchEvent(makePasteEvent('+7 123 456 7788'));
    });

    options.locale = 'fr';
    action.update(options);
    expect(input.__phoneMaskState?.country.id).toBe('KZ');

    options.country = 'FR';
    action.update(options);
    expect(input.__phoneMaskState?.country.id).toBe('FR');
    action.destroy();
  });

  testPhoneMaskBinding(
    setup(PhoneMaskActionWrapper),
    {
      warnMessage: '[phoneMaskAction] Action can only be used on input elements',
      detectByGeoIpMock: vi.mocked(detectByGeoIp)
    },
    tools
  );
});
