/// <reference types="vitest/globals" />
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { testPhoneInput, type SetupFn } from '@common/tests/unit/PhoneInput';
import { PhoneInputComponent } from '../../src/components/phone-input/phone-input.component';
import type { PhoneNumber, Size, Theme } from '../../src/types';
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

  handlePhoneChange(_phone: PhoneNumber): void {}
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
