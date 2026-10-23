import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { fireEvent } from '@testing-library/dom';
import { usePhoneMask } from '@src/services/usePhoneMask.service';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { tools, withSetup, stabilize } from './setup/tools';

async function setup(initialValue = '', { attachRef = true, detect = false }: UsePhoneMaskSetupOptions = {}) {
  const value = signal(initialValue);
  const onChange = vi.fn((digits: string) => value.set(digits));
  const inputEl = document.createElement('input');
  document.body.append(inputEl);
  const input = signal<HTMLInputElement | null>(attachRef ? inputEl : null);
  const { raw: api, unmount } = withSetup(() => usePhoneMask({ value, input, detect, onChange }));
  await stabilize();
  return {
    inputEl,
    onChange,
    getValue: value,
    setInputRef: input.set,
    unmount: () => {
      unmount();
      inputEl.remove();
    },
    api: {
      getDigits: api.digits,
      getCountry: () => api.country().id,
      getFull: api.full,
      getFullFormatted: api.fullFormatted,
      isEmpty: api.isEmpty,
      shouldShowWarn: api.shouldShowWarn,
      setCountry: api.setCountry,
      clear: api.clear
    }
  };
}

testUsePhoneMask(setup, tools);

it('provides formatting state without an input element', async () => {
  const value = signal('2025550123');
  const onChange = vi.fn((digits: string) => value.set(digits));
  const { raw: mask, unmount } = withSetup(() => usePhoneMask({ value, country: 'US', onChange }));
  await stabilize();
  expect(mask.displayValue()).toBe('202-555-0123');
  expect(onChange).not.toHaveBeenCalled();
  await tools.act(() => mask.clear());
  expect(mask.isEmpty()).toBe(true);
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  unmount();
});

it('removes native listeners when its injection scope is destroyed', async () => {
  const { inputEl, unmount } = await setup();
  const remove = vi.spyOn(inputEl, 'removeEventListener');
  unmount();
  for (const event of ['beforeinput', 'input', 'keydown', 'paste']) {
    expect(remove).toHaveBeenCalledWith(event, expect.any(Function));
  }
});

it.each(['readOnly', 'disabled'] as const)(
  'ignores editing events while %s and resumes when enabled',
  async (property) => {
    const { inputEl, onChange, getValue, unmount } = await setup('2025550123');
    inputEl[property] = true;
    inputEl.setSelectionRange(0, inputEl.value.length);
    await tools.fireEvent.keyDown(inputEl, { key: 'Backspace' });
    await tools.act(() => {
      fireEvent.paste(inputEl, { clipboardData: { getData: () => '4155550199' } });
    });
    expect(getValue()).toBe('2025550123');
    expect(inputEl.value).toBe('202-555-0123');
    expect(onChange).not.toHaveBeenCalled();

    inputEl[property] = false;
    await tools.act(() => {
      fireEvent.paste(inputEl, { clipboardData: { getData: () => '4155550199' } });
    });
    expect(getValue()).toBe('4155550199');
    expect(inputEl.value).toBe('415-555-0199');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('4155550199');
    unmount();
  }
);

it('uses replacement input state and detaches listeners from the old input', async () => {
  const { inputEl, setInputRef, onChange, getValue, unmount } = await setup('2025550123');
  const replacement = document.createElement('input');
  replacement.readOnly = true;
  await tools.act(() => setInputRef(replacement));
  expect(replacement.value).toBe('202-555-0123');

  inputEl.setSelectionRange(0, inputEl.value.length);
  await tools.fireEvent.keyDown(inputEl, { key: 'Backspace' });
  replacement.setSelectionRange(0, replacement.value.length);
  await tools.fireEvent.keyDown(replacement, { key: 'Backspace' });
  expect(onChange).not.toHaveBeenCalled();
  expect(getValue()).toBe('2025550123');

  replacement.readOnly = false;
  await tools.fireEvent.keyDown(replacement, { key: 'Backspace' });
  expect(getValue()).toBe('');
  expect(replacement.value).toBe('');
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  unmount();
});

it('detaches a missing input and restores its current value when reattached', async () => {
  const { inputEl, setInputRef, onChange, getValue, api, unmount } = await setup('2025550123');
  const remove = vi.spyOn(inputEl, 'removeEventListener');
  await tools.act(() => setInputRef(null));
  for (const event of ['beforeinput', 'input', 'keydown', 'paste']) {
    expect(remove).toHaveBeenCalledWith(event, expect.any(Function));
  }
  await tools.fireEvent.input(inputEl, { target: { value: '4155550199' } });
  expect(getValue()).toBe('2025550123');
  expect(onChange).not.toHaveBeenCalled();

  await tools.act(() => api.clear());
  await tools.act(() => setInputRef(inputEl));
  expect(inputEl.value).toBe('');
  expect(getValue()).toBe('');
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  unmount();
});

@Component({
  selector: 'test-headless-query',
  template: '@if (visible()) { <input #tel [readonly]="readOnly()" /> }'
})
class QueryInputHost {
  readonly visible = signal(true);
  readonly readOnly = signal(false);
  readonly value = signal('2025550123');
  readonly input = viewChild<ElementRef<HTMLInputElement>>('tel');
  readonly onChange = vi.fn((value: string) => this.value.set(value));
  readonly mask = usePhoneMask({
    value: this.value,
    input: () => this.input()?.nativeElement,
    country: 'US',
    detect: false,
    onChange: this.onChange
  });
}

it('follows an optional view query through removal and recreation without a synchronization effect', async () => {
  const { fixture } = await render(QueryInputHost, { autoDetectChanges: false });
  const host = fixture.componentInstance;
  const original = screen.getByRole('textbox') as HTMLInputElement;
  expect(original.value).toBe('202-555-0123');

  host.visible.set(false);
  await fixture.whenStable();
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.input(original, { target: { value: '4155550199' } });
  expect(host.onChange).not.toHaveBeenCalled();

  host.value.set('7911123456');
  host.readOnly.set(true);
  host.visible.set(true);
  await fixture.whenStable();
  const replacement = screen.getByRole('textbox') as HTMLInputElement;
  expect(replacement).not.toBe(original);
  expect(replacement.value).toBe('791-112-3456');
  replacement.setSelectionRange(0, replacement.value.length);
  fireEvent.keyDown(replacement, { key: 'Backspace' });
  await fixture.whenStable();
  expect(host.onChange).not.toHaveBeenCalled();

  host.readOnly.set(false);
  await fixture.whenStable();
  fireEvent.keyDown(replacement, { key: 'Backspace' });
  await fixture.whenStable();
  expect(host.onChange).toHaveBeenCalledExactlyOnceWith('');
  fixture.destroy();
  fireEvent.input(replacement, { target: { value: '4155550199' } });
  expect(host.onChange).toHaveBeenCalledTimes(1);
});
