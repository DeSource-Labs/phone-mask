/// <reference types="vitest/globals" />
import { Component, ElementRef, inject, signal, viewChild, type AfterViewInit, type OnDestroy } from '@angular/core';
import { render } from '@testing-library/angular';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { UsePhoneMaskService } from '@src/services/usePhoneMask.service';
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

@Component({
  standalone: true,
  template: '',
  providers: [UsePhoneMaskService]
})
class UnconfiguredUsePhoneMaskHostComponent {
  readonly mask = inject(UsePhoneMaskService);
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
      getDigits: () => host.mask.getDigits(),
      getFull: () => host.mask.full(),
      getFullFormatted: () => host.mask.fullFormatted(),
      isEmpty: () => host.mask.isEmpty(),
      shouldShowWarn: () => host.mask.shouldShowWarn(),
      getInputRef: () => host.mask.inputRef(),
      getFormatter: () => host.mask.getFormatter(),
      configureAgain: (onChange: (digits: string) => void) =>
        host.mask.configure({
          value: () => '999',
          onChange
        }),
      setCountry: (countryCode: string) => host.mask.setCountry(countryCode),
      clear: () => host.mask.clear()
    }
  };
}

testUsePhoneMask(setup, tools);

describe('UsePhoneMaskService Angular API', () => {
  it('exposes formatter helper and rejects invalid countries without resyncing input', async () => {
    const { api, inputEl, onChange, unmount } = await setup('2025550199');
    const ignoredOnChange = vi.fn();

    expect(api.getInputRef()).toBe(inputEl);
    expect(api.getFormatter().getPlaceholder()).toBe('###-###-####');
    expect(api.setCountry('INVALID')).toBe(false);
    expect(inputEl.value).toBe('202-555-0199');

    api.configureAgain(ignoredOnChange);
    api.clear();
    expect(onChange).toHaveBeenCalledWith('');
    expect(ignoredOnChange).not.toHaveBeenCalled();

    unmount();
  });

  it('keeps imperative helpers safe before configure is called', async () => {
    const { fixture } = await render(UnconfiguredUsePhoneMaskHostComponent, { detectChangesOnRender: false });
    const { mask } = fixture.componentInstance;

    expect(mask.inputRef()).toBeNull();
    mask.clear();

    fixture.destroy();
  });

  it('wires beforeinput, keydown, and paste listeners to the connected input', async () => {
    const { inputEl, onChange, unmount } = await setup('2025550199');

    await tools.act(async () => {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    });

    expect(onChange).toHaveBeenCalledWith('202555019');

    await tools.act(async () => {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(paste, 'clipboardData', {
        value: { getData: () => '88' },
        configurable: true
      });
      inputEl.dispatchEvent(paste);
    });

    expect(onChange).toHaveBeenCalledWith('2025550198');

    const beforeInput = new InputEvent('beforeinput', {
      data: '7',
      inputType: 'insertText',
      bubbles: true,
      cancelable: true
    });

    inputEl.dispatchEvent(beforeInput);
    expect(beforeInput.defaultPrevented).toBe(false);

    unmount();
  });
});
