/// <reference types="vitest/globals" />
import { Component, ElementRef, inject, signal, viewChild, type AfterViewInit, type OnDestroy } from '@angular/core';
import { render } from '@testing-library/angular';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { UsePhoneMaskService } from '../../src/services/usePhoneMask.service';
import { tools } from './setup/tools';

@Component({
  standalone: true,
  template: '<input #phoneInput />',
  providers: [UsePhoneMaskService]
})
class UsePhoneMaskHostComponent implements AfterViewInit, OnDestroy {
  readonly mask = inject(UsePhoneMaskService);
  readonly value = signal('');
  attachRef = true;
  onChange = vi.fn();
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('phoneInput');

  constructor() {
    this.mask.configure({
      value: this.value,
      detect: () => false,
      onChange: (digits) => {
        this.value.set(digits);
        this.onChange(digits);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.attachRef) {
      this.mask.connect(this.inputRef()?.nativeElement ?? null);
    }
  }

  ngOnDestroy(): void {
    this.mask.connect(null);
  }
}

async function setup(initialValue = '', options: UsePhoneMaskSetupOptions = {}) {
  const attachRef = options.attachRef ?? true;
  const result = await render(UsePhoneMaskHostComponent, {
    detectChangesOnRender: false,
    componentProperties: { attachRef }
  });

  const host = result.fixture.componentInstance;
  host.value.set(initialValue);
  result.detectChanges();
  if (attachRef) host.mask.connect(result.container.querySelector('input'));
  await tools.act(async () => {});

  const inputEl = result.container.querySelector('input') as HTMLInputElement;

  return {
    inputEl,
    onChange: host.onChange,
    getValue: () => host.value(),
    unmount: () => result.fixture.destroy(),
    api: {
      getDigits: () => host.mask.digits(),
      getFull: () => host.mask.full(),
      getFullFormatted: () => host.mask.fullFormatted(),
      isEmpty: () => host.mask.isEmpty(),
      shouldShowWarn: () => host.mask.shouldShowWarn(),
      setCountry: (countryCode: string) => host.mask.setCountry(countryCode),
      clear: () => host.mask.clear()
    }
  };
}

testUsePhoneMask(setup, tools);
