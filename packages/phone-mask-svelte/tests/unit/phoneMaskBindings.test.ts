/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import type { PhoneMaskBindingElement, PhoneMaskBindingOptions } from '@src/types';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';

import PhoneMaskAttachmentWrapper from './setup/PhoneMaskAttachmentWrapper.svelte';
import PhoneMaskActionWrapper from './setup/PhoneMaskActionWrapper.svelte';
import { tools, flushPromises } from './setup/tools.svelte';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask';

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
  testPhoneMaskBinding(
    setup(PhoneMaskActionWrapper),
    {
      warnMessage: '[phoneMaskAction] Action can only be used on input elements',
      detectByGeoIpMock: vi.mocked(detectByGeoIp)
    },
    tools
  );
});
