/// <reference types="vitest/globals" />
import { Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { detectByGeoIp } from '@desource/phone-mask/kit';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';
import { PhoneMaskDirective } from '../../src/phone-mask.directive';
import type { DirectiveHTMLInputElement, PhoneMaskDirectiveInput, PhoneMaskDirectiveOptions } from '../../src/types';
import { tools } from './setup/tools';

vi.mock('@desource/phone-mask/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask/kit')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

@Component({
  standalone: true,
  imports: [PhoneMaskDirective],
  template: `
    @if (tag === 'input') {
      <input [phoneMask]="options" [phoneMaskValue]="value" (phoneMaskValueChange)="value = $event" />
    } @else {
      <div [phoneMask]="options"></div>
    }
  `
})
class PhoneMaskDirectiveHostComponent {
  tag: 'input' | 'div' = 'input';
  value = '';
  options?: PhoneMaskDirectiveInput;
}

const flushAngular = async (detectChanges: () => void) => {
  await Promise.resolve();
  await Promise.resolve();
  detectChanges();
};

const setup =
  (elTag: 'input' | 'div' = 'input', elValue?: string) =>
  async (options?: string | PhoneMaskDirectiveOptions) => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const mergeOptions = (opts?: string | PhoneMaskDirectiveOptions): string | PhoneMaskDirectiveOptions | undefined =>
      typeof opts === 'object' ? { ...opts, onChange, onCountryChange } : opts;

    const result = await render(PhoneMaskDirectiveHostComponent, {
      imports: [PhoneMaskDirective],
      componentProperties: {
        tag: elTag,
        value: elValue ?? '',
        options: mergeOptions(options)
      }
    });

    await flushAngular(result.detectChanges);

    const el = result.container.querySelector(elTag) as DirectiveHTMLInputElement;

    const update = async (newOptions?: string | PhoneMaskDirectiveOptions) => {
      const host = result.fixture.componentInstance;
      if (elTag === 'input') host.value = el.value;
      host.options = mergeOptions(newOptions);
      await flushAngular(result.detectChanges);
    };

    return {
      el,
      onChange,
      onCountryChange,
      update,
      unmount: () => result.fixture.destroy()
    };
  };

describe('PhoneMaskDirective', () => {
  testPhoneMaskBinding(
    setup,
    {
      warnMessage: '[phoneMask] Directive can only be used on input elements',
      detectByGeoIpMock: vi.mocked(detectByGeoIp)
    },
    tools
  );
});
