/// <reference types="vitest/globals" />
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import { detectCountryFromLocale } from '@desource/phone-mask/kit';
import { testPhoneMaskBinding } from '@common/tests/unit/phoneMaskBinding';
import { PhoneMaskDirective } from '@src/phone-mask.directive';
import { COUNTRY_DETECTION } from '@src/services/internal/useCountry.service';
import type { DirectiveHTMLInputElement, PhoneMaskDirectiveInput, PhoneMaskDirectiveOptions } from '@src/types';
import { tools } from './setup/tools';

const countryDetection = {
  detectByGeoIp: vi.fn().mockResolvedValue(null),
  detectCountryFromLocale
};

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

@Component({
  standalone: true,
  imports: [PhoneMaskDirective, ReactiveFormsModule],
  template: '<input phoneMask [formControl]="control" />'
})
class PhoneMaskDirectiveFormHostComponent {
  readonly control = new FormControl('');
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
      providers: [{ provide: COUNTRY_DETECTION, useValue: countryDetection }],
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
      detectByGeoIpMock: countryDetection.detectByGeoIp
    },
    tools
  );

  const renderDirective = async (value = '', options?: PhoneMaskDirectiveInput, tag: 'input' | 'div' = 'input') => {
    const result = await render(PhoneMaskDirectiveHostComponent, {
      imports: [PhoneMaskDirective],
      providers: [{ provide: COUNTRY_DETECTION, useValue: countryDetection }],
      componentProperties: {
        tag,
        value,
        options
      }
    });

    await flushAngular(result.detectChanges);

    const el = result.container.querySelector(tag) as DirectiveHTMLInputElement;
    const directive = result.debugElement.query(By.directive(PhoneMaskDirective)).injector.get(PhoneMaskDirective);

    return {
      el,
      directive,
      unmount: () => result.fixture.destroy()
    };
  };

  it('keeps defensive ControlValueAccessor methods inert on non-input hosts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { directive, unmount } = await renderDirective('', undefined, 'div');

    expect(() => directive.writeValue('2025550199')).not.toThrow();
    expect(() => directive.setDisabledState(true)).not.toThrow();

    unmount();
    warn.mockRestore();
  });

  it('uses default touched callback until ControlValueAccessor registers one', async () => {
    const { el, unmount } = await renderDirective();

    expect(() => el.dispatchEvent(new Event('blur'))).not.toThrow();

    unmount();
  });

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

    directive.writeValue(null);
    expect(el.value).toBe('');

    el.dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalledOnce();

    const beforeInput = new InputEvent('beforeinput', {
      data: '7',
      inputType: 'insertText',
      bubbles: true,
      cancelable: true
    });

    el.dispatchEvent(beforeInput);
    expect(beforeInput.defaultPrevented).toBe(false);

    directive.clear();
    expect(onChange).toHaveBeenCalledWith('');
    expect(directive.getDigits()).toBe('');

    unmount();
  });

  it('works as an Angular reactive forms value accessor', async () => {
    const result = await render(PhoneMaskDirectiveFormHostComponent, {
      providers: [{ provide: COUNTRY_DETECTION, useValue: countryDetection }]
    });
    const host = result.fixture.componentInstance;
    const el = result.container.querySelector('input') as HTMLInputElement;

    host.control.setValue('2025550199');
    await flushAngular(result.detectChanges);

    expect(el.value).toBe('202-555-0199');
    expect(host.control.value).toBe('2025550199');

    result.fixture.destroy();
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
