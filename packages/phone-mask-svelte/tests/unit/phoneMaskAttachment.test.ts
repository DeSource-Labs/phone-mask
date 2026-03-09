/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import type { PhoneMaskAttachmentElement, PhoneMaskAttachmentOptions } from '@src/types';
import PhoneMaskAttachmentWrapper from './setup/PhoneMaskAttachmentWrapper.svelte';
import { tools, flushPromises } from './setup/tools.svelte';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask';

const setup =
  (elTag: 'input' | 'div' = 'input', elValue?: string) =>
  async (options?: string | PhoneMaskAttachmentOptions) => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const mergeParams = (
      opts?: string | PhoneMaskAttachmentOptions
    ): string | PhoneMaskAttachmentOptions | undefined =>
      typeof opts === 'object' ? { ...opts, onChange, onCountryChange } : opts;

    const { container, rerender, unmount } = render(PhoneMaskAttachmentWrapper, {
      props: { tag: elTag, options: mergeParams(options), initialValue: elValue }
    });

    await flushPromises();

    const el = container.firstElementChild as PhoneMaskAttachmentElement;

    const update = async (newOptions?: string | PhoneMaskAttachmentOptions) => {
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
    setup,
    {
      stateKey: '__phoneMaskState',
      warnMessage: '[phoneMask] Attachment can only be used on input elements',
      detectByGeoIpMock: detectByGeoIp as ReturnType<typeof vi.fn>
    },
    tools
  );
});
