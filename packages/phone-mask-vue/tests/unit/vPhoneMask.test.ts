/// <reference types="vitest/globals" />
import { nextTick } from 'vue';
import { render } from '@testing-library/vue';
import type { DirectiveHTMLInputElement, PMaskDirectiveOptions } from '@src/types';
import { vPhoneMask } from '@src/directives/vPhoneMask';
import VPhoneMaskWrapper from './setup/VPhoneMaskWrapper.vue';
import { tools } from './setup/tools';
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
  testPhoneMaskBinding(
    setup,
    {
      stateKey: '__phoneMaskState',
      warnMessage: '[v-phone-mask] Directive can only be used on input elements',
      detectByGeoIpMock: detectByGeoIp as ReturnType<typeof vi.fn>
    },
    tools
  );
});
