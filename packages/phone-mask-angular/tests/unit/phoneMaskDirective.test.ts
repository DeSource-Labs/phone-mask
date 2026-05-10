/// <reference types="vitest/globals" />
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import { detectByGeoIp } from '@desource/phone-mask/kit';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';
import { PhoneMaskDirective } from '@src/phone-mask.directive';
import type { DirectiveHTMLInputElement, PhoneMaskDirectiveInput, PhoneMaskDirectiveOptions } from '@src/types';
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

  const renderDirective = async (value = '', options?: PhoneMaskDirectiveInput) => {
    const result = await render(PhoneMaskDirectiveHostComponent, {
      imports: [PhoneMaskDirective],
      componentProperties: {
        tag: 'input',
        value,
        options
      }
    });

    await flushAngular(result.detectChanges);

    const el = result.container.querySelector('input') as DirectiveHTMLInputElement;
    const directive = result.debugElement.query(By.directive(PhoneMaskDirective)).injector.get(PhoneMaskDirective);

    return {
      el,
      directive,
      unmount: () => result.fixture.destroy()
    };
  };

  it('supports ControlValueAccessor change, touched, and disabled APIs', async () => {
    const { el, directive, unmount } = await renderDirective('2025550199', { country: 'US' });
    const onChange = vi.fn();
    const onTouched = vi.fn();

    directive.registerOnChange(onChange);
    directive.registerOnTouched(onTouched);

    directive.setDisabledState(true);
    expect(el.disabled).toBe(true);

    directive.setDisabledState(false);
    expect(el.disabled).toBe(false);

    el.dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalledOnce();

    directive.clear();
    expect(onChange).toHaveBeenCalledWith('');
    expect(directive.getDigits()).toBe('');

    unmount();
  });

  it('supports writeValue, getters, and invalid country handling', async () => {
    const { el, directive, unmount } = await renderDirective('', { country: 'US' });
    const onChange = vi.fn();

    directive.registerOnChange(onChange);
    directive.writeValue(2025550199);

    expect(directive.getDigits()).toBe('2025550199');
    expect(directive.getFullNumber()).toBe('+12025550199');
    expect(directive.getFullFormattedNumber()).toBe('+1 202-555-0199');
    expect(directive.isComplete()).toBe(true);
    expect(directive.isValid()).toBe(true);
    expect(el.value).toBe('202-555-0199');
    expect(onChange).not.toHaveBeenCalled();

    expect(directive.selectCountry('INVALID')).toBe(false);
    expect(directive.getFullNumber()).toBe('+12025550199');

    unmount();
  });

  it('truncates digits when selecting a country with a shorter mask', async () => {
    const { directive, unmount } = await renderDirective('2025550199');
    const onChange = vi.fn();

    directive.registerOnChange(onChange);
    await tools.act(async () => {
      expect(directive.selectCountry('AD')).toBe(true);
    });

    expect(directive.getDigits().length).toBeLessThan(10);
    expect(onChange).toHaveBeenCalledWith(directive.getDigits());
    expect(directive.getFullNumber()).toMatch(/^\+376/);

    unmount();
  });

  it('binding state setCountry returns false when state is removed before update finishes', async () => {
    const { el, unmount } = await setup('input')({ country: 'US' });
    const setCountry = el.__phoneMaskState?.setCountry;

    delete el.__phoneMaskState;

    expect(setCountry?.('GB')).toBe(false);

    unmount();
  });
});
