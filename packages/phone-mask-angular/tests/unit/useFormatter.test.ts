/// <reference types="vitest/globals" />
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getCountry } from '@desource/phone-mask/kit';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { UseFormatterService } from '@src/services/internal/useFormatter.service';
import { tools } from './setup/tools';

let initialOptions: SetupOptions = {};

@Component({
  standalone: true,
  template: '',
  providers: [UseFormatterService]
})
class UseFormatterHostComponent {
  readonly service = inject(UseFormatterService);
  readonly countryCode = signal(initialOptions.countryCode ?? 'US');
  readonly value = signal(initialOptions.value ?? '');
  readonly onChange = vi.fn();
  readonly onPhoneChange = vi.fn();
  readonly onValidationChange = vi.fn();

  constructor() {
    this.service.configure({
      country: () => getCountry(this.countryCode(), 'en'),
      value: this.value,
      onChange: (digits) => this.onChange(digits),
      onPhoneChange: (phone) => this.onPhoneChange(phone),
      onValidationChange: (isComplete) => this.onValidationChange(isComplete)
    });
  }
}

function setup(options: SetupOptions = {}) {
  initialOptions = options;
  TestBed.configureTestingModule({ imports: [UseFormatterHostComponent] });
  const fixture = TestBed.createComponent(UseFormatterHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  const host = fixture.componentInstance;

  return {
    result: {
      digits: host.service.digits,
      displayPlaceholder: host.service.displayPlaceholder,
      displayValue: host.service.displayValue,
      full: host.service.full,
      fullFormatted: host.service.fullFormatted,
      isComplete: host.service.isComplete,
      isEmpty: host.service.isEmpty,
      shouldShowWarn: host.service.shouldShowWarn
    },
    unmount: () => fixture.destroy(),
    rerender: ({ value, countryCode }: SetupOptions) => {
      if (value !== undefined) host.value.set(value);
      if (countryCode !== undefined) host.countryCode.set(countryCode);
      fixture.detectChanges();
    },
    onChange: host.onChange,
    onPhoneChange: host.onPhoneChange,
    onValidationChange: host.onValidationChange
  };
}

testUseFormatter(setup, tools);

describe('UseFormatterService Angular scheduling', () => {
  it('keeps the first configuration when configure is called again', () => {
    initialOptions = { value: '2025550199', countryCode: 'US' };
    TestBed.configureTestingModule({ imports: [UseFormatterHostComponent] });
    const fixture = TestBed.createComponent(UseFormatterHostComponent);
    fixture.detectChanges();
    TestBed.tick();
    const host = fixture.componentInstance;
    const ignoredOnChange = vi.fn();

    host.service.configure({
      country: () => getCountry('GB', 'en'),
      value: () => '777',
      onChange: ignoredOnChange
    });

    expect(host.service.full()).toBe('+12025550199');
    expect(ignoredOnChange).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('exposes safe default formatter state before configure is called', () => {
    TestBed.configureTestingModule({ providers: [UseFormatterService] });
    const service = TestBed.inject(UseFormatterService);

    expect(service.country().id).toBe('US');
    expect(service.digits()).toBe('');
    expect(service.displayPlaceholder()).toBe('###-###-####');
    expect(service.full()).toBe('');
    expect(service.isEmpty()).toBe(true);
  });

  it('does not emit duplicate clamped values for the same raw and clamped pair', async () => {
    const { onChange, rerender, unmount } = setup({ value: '23456789011' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2345678901');

    await tools.act(async () => {
      rerender({ value: '23456789011' });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    unmount();
  });
});
