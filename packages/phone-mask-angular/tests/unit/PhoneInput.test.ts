/// <reference types="vitest/globals" />
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { testPhoneInput, type SetupFn } from '@common/tests/unit/PhoneInput';
import { PhoneInputComponent } from '@src/components/phone-input/phone-input.component';
import type { Size, Theme } from '@src/types';
import { tools } from './setup/tools';

@Component({
  standalone: true,
  imports: [PhoneInputComponent],
  template: `
    <desource-phone-input
      [value]="value"
      [id]="id"
      [name]="name"
      [detect]="detect"
      [showClear]="showClear"
      [showCopy]="showCopy"
      [disabled]="disabled"
      [readonly]="readonly"
      [country]="country"
      [disableDefaultStyles]="disableDefaultStyles"
      [dropdownClass]="dropdownClass"
      (valueChange)="handleValueChange($event)"
      (countryChange)="handleCountryChange($event)"
      (copy)="onCopy($event)"
      (focus)="onFocus($event)"
      (blur)="onBlur($event)"
    >
      @if (withCustomRenderers) {
        <ng-template #actionsBefore>
          <span data-testid="actions-before">Before</span>
        </ng-template>
        <ng-template #flag let-country="country">
          <span data-testid="flag-custom">{{ country.id }}</span>
        </ng-template>
        <ng-template #copySvg let-copied="copied">
          <span data-testid="copy-custom">{{ copied ? 'copied' : 'copy' }}</span>
        </ng-template>
        <ng-template #clearSvg>
          <span data-testid="clear-custom">clear</span>
        </ng-template>
      }
    </desource-phone-input>
  `
})
class PhoneInputHostComponent {
  value = '';
  id?: string;
  name?: string;
  detect = false;
  showClear = false;
  showCopy = true;
  disabled = false;
  readonly = false;
  country?: CountryKey | string;
  size: Size = 'normal';
  theme: Theme = 'auto';
  disableDefaultStyles = false;
  withCustomRenderers = false;
  dropdownClass = '';

  onChange = vi.fn();
  onCountryChange = vi.fn();
  onCopy = vi.fn();
  onFocus = vi.fn();
  onBlur = vi.fn();

  handleValueChange(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  handleCountryChange(country: MaskFull): void {
    this.onCountryChange(country);
  }
}

@Component({
  standalone: true,
  imports: [PhoneInputComponent, ReactiveFormsModule],
  template: '<desource-phone-input [formControl]="control" />'
})
class PhoneInputFormHostComponent {
  readonly control = new FormControl('');
}

const setup: SetupFn = async ({
  value = '',
  id,
  name,
  detect = false,
  showClear = false,
  showCopy = true,
  disabled = false,
  readonly = false,
  country,
  disableDefaultStyles = false,
  withCustomRenderers = false
} = {}) => {
  const result = await render(PhoneInputHostComponent, {
    componentProperties: {
      value,
      id,
      name,
      detect,
      showClear,
      showCopy,
      disabled,
      readonly,
      country,
      disableDefaultStyles,
      withCustomRenderers,
      dropdownClass: withCustomRenderers ? 'custom-dropdown' : ''
    }
  });

  const host = result.fixture.componentInstance;
  const ref = result.debugElement.query(By.directive(PhoneInputComponent))?.componentInstance as PhoneInputComponent;
  if (!ref) throw new Error('PhoneInput ref is not created');

  return {
    ref,
    onChange: host.onChange,
    onCountryChange: host.onCountryChange,
    onCopy: host.onCopy,
    onFocus: host.onFocus,
    onBlur: host.onBlur,
    container: result.container,
    unmount: () => result.fixture.destroy()
  };
};

testPhoneInput(setup, tools);

const renderComponent = async (componentProperties: Partial<PhoneInputHostComponent> = {}) => {
  const result = await render(PhoneInputHostComponent, {
    componentProperties
  });
  const ref = result.debugElement.query(By.directive(PhoneInputComponent))?.componentInstance as PhoneInputComponent;
  const input = result.container.querySelector('input') as HTMLInputElement;
  if (!ref || !input) throw new Error('PhoneInput component is not rendered');

  return {
    result,
    ref,
    input,
    root: result.container.querySelector('.phone-input') as HTMLDivElement,
    unmount: () => result.fixture.destroy()
  };
};

describe('PhoneInputComponent Angular API', () => {
  it('supports ControlValueAccessor writeValue, change, touched, and disabled APIs', async () => {
    const { result, ref, input, root, unmount } = await renderComponent();
    const onChange = vi.fn();
    const onTouched = vi.fn();

    ref.registerOnChange(onChange);
    ref.registerOnTouched(onTouched);

    ref.writeValue(2025550199);
    result.detectChanges();

    expect(ref.getDigits()).toBe('2025550199');
    expect(ref.getFullNumber()).toBe('+12025550199');
    expect(input.value).toBe('202-555-0199');
    expect(onChange).not.toHaveBeenCalled();

    input.dispatchEvent(new FocusEvent('blur'));
    expect(onTouched).toHaveBeenCalledOnce();

    ref.setDisabledState(true);
    result.detectChanges();
    expect(input.disabled).toBe(true);
    expect(root.className).toContain('is-disabled');

    ref.setDisabledState(false);
    result.detectChanges();
    expect(input.disabled).toBe(false);

    ref.clear();
    expect(onChange).toHaveBeenCalledWith('');

    unmount();
  });

  it('works as an Angular reactive forms value accessor', async () => {
    const result = await render(PhoneInputFormHostComponent);
    const host = result.fixture.componentInstance;
    const input = result.container.querySelector('input') as HTMLInputElement;

    host.control.setValue('2025550199');
    result.detectChanges();

    expect(input.value).toBe('202-555-0199');
    expect(host.control.value).toBe('2025550199');

    result.fixture.destroy();
  });

  it('rejects invalid country selections and truncates when country max digits shrink', async () => {
    const { result, ref, unmount } = await renderComponent({ value: '2025550199' });
    const onChange = vi.fn();

    ref.registerOnChange(onChange);
    expect(ref.selectCountry('INVALID')).toBe(false);
    expect(ref.getFullNumber()).toBe('+12025550199');

    await tools.act(async () => {
      expect(ref.selectCountry('AD')).toBe(true);
      result.detectChanges();
    });

    expect(ref.getFullNumber()).toMatch(/^\+376/);
    expect(ref.getDigits().length).toBeLessThan(10);
    expect(onChange).toHaveBeenCalledWith(ref.getDigits());

    unmount();
  });

  it('clears nullish values written through ControlValueAccessor', async () => {
    const { result, ref, input, unmount } = await renderComponent({ value: '2025550199' });

    ref.writeValue(null);
    result.detectChanges();

    expect(ref.getDigits()).toBe('');
    expect(ref.getFullNumber()).toBe('');
    expect(input.value).toBe('');

    unmount();
  });
});
