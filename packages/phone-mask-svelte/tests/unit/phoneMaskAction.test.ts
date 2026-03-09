/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import type { PhoneMaskActionElement, PhoneMaskActionOptions } from '@src/types';
import PhoneMaskActionWrapper from './setup/PhoneMaskActionWrapper.svelte';
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
  async (options?: string | PhoneMaskActionOptions) => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const mergeParams = (opts?: string | PhoneMaskActionOptions): string | PhoneMaskActionOptions | undefined =>
      typeof opts === 'object' ? { ...opts, onChange, onCountryChange } : opts;

    const { container, rerender, unmount } = render(PhoneMaskActionWrapper, {
      props: { tag: elTag, options: mergeParams(options), initialValue: elValue }
    });

    await flushPromises();

    const el = container.firstElementChild as PhoneMaskActionElement;

    const update = async (newOptions?: string | PhoneMaskActionOptions) => {
      await rerender({ options: mergeParams(newOptions) });
    };

    return {
      el,
      onChange,
      onCountryChange,
      unmount,
      update
    };
  };

describe('phoneMaskAction', () => {
  testPhoneMaskBinding(
    setup,
    {
      stateKey: '__phoneMaskActionState',
      warnMessage: '[phoneMaskAction] Action can only be used on input elements',
      detectByGeoIpMock: detectByGeoIp as ReturnType<typeof vi.fn>
    },
    tools
  );
});
