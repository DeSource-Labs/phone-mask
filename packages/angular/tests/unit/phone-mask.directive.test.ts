import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { fireEvent } from '@testing-library/dom';
import { PhoneMaskDirective } from '@src/phone-mask.directive';
import type { PhoneMaskDirectiveOptions } from '@src/types';

@Component({
  selector: 'test-directive-form',
  imports: [PhoneMaskDirective, ReactiveFormsModule],
  template: '<input [phoneMask]="options()" [formControl]="control" (phoneChange)="changed($event)" />'
})
class DirectiveFormHost {
  options = signal<string | PhoneMaskDirectiveOptions>({ country: 'US', detect: false });
  control = new FormControl('2025550123', { nonNullable: true });
  changed = vi.fn();
}

@Component({
  selector: 'test-directive-model',
  imports: [PhoneMaskDirective, FormsModule],
  template: '<input phoneMask="US" [(ngModel)]="value" />'
})
class DirectiveModelHost {
  value = signal('2025550123');
}

describe('PhoneMaskDirective', () => {
  it('formats the initial form value and configures telephone input attributes', async () => {
    const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
    await fixture.whenStable();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('tel');
    expect(input.inputMode).toBe('tel');
    expect(input.placeholder).toBe('###-###-####');
    expect(input.value).toBe('202-555-0123');
    expect(fixture.componentInstance.control.value).toBe('2025550123');
  });

  it('emits phone details while storing digits in the Angular form', async () => {
    const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const host = fixture.componentInstance;
    host.changed.mockClear();
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(input.value).toBe('415-555-0199');
    expect(host.control.value).toBe('4155550199');
    expect(host.changed).toHaveBeenLastCalledWith({
      digits: '4155550199',
      full: '+14155550199',
      fullFormatted: '+1 415-555-0199'
    });
    expect(host.control.dirty).toBe(true);
    fireEvent.blur(input);
    await fixture.whenStable();
    expect(host.control.touched).toBe(true);
  });

  it('updates options and external values without emitting a second form change', async () => {
    const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const values = vi.fn();
    host.control.valueChanges.subscribe(values);
    host.options.set('GB');
    host.control.setValue('7911123456');
    await fixture.whenStable();
    expect(input.value).toBe('791 112 3456');
    expect(values).toHaveBeenCalledExactlyOnceWith('7911123456');
    host.control.reset('');
    await fixture.whenStable();
    expect(input.value).toBe('');
  });

  it('changes country before storing a longer pasted international number in the form', async () => {
    const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const countryChanged = vi.fn();
    host.options.set({ country: 'US', detect: false, onCountryChange: countryChanged });
    await fixture.whenStable();
    countryChanged.mockClear();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const values = vi.fn();
    host.control.valueChanges.subscribe(values);
    input.setSelectionRange(3, 5);
    fireEvent.paste(input, { clipboardData: { getData: () => '+49 1512 3456789' } });
    await fixture.whenStable();
    expect(input.value.replace(/\D/g, '')).toBe('15123456789');
    expect(input.selectionStart).toBe(input.value.length);
    expect(host.control.value).toBe('15123456789');
    expect(values).toHaveBeenCalledExactlyOnceWith('15123456789');
    expect(countryChanged).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'DE' }));
    expect(host.changed).toHaveBeenLastCalledWith(expect.objectContaining({ full: '+4915123456789' }));
  });

  it('honors disabled controls and deferred blur updates', async () => {
    const control = new FormControl('2025550123', { nonNullable: true, updateOn: 'blur' });
    const { fixture } = await render(DirectiveFormHost, { componentProperties: { control }, autoDetectChanges: false });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    control.enable();
    await fixture.whenStable();
    expect(input.disabled).toBe(false);
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(control.value).toBe('2025550123');
    fireEvent.blur(input);
    await fixture.whenStable();
    expect(control.value).toBe('4155550199');
  });

  it('supports two-way ngModel and a string country option', async () => {
    const { fixture } = await render(DirectiveModelHost, { autoDetectChanges: false });
    await fixture.whenStable();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('202-555-0123');
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('4155550199');
  });
});

@Component({
  selector: 'test-directive-disabled',
  imports: [PhoneMaskDirective],
  template:
    '<input phoneMask="US" value="2025550123" [disabled]="disabled()" [readonly]="readonly()" (valueChange)="changed($event)" />'
})
class DisabledDirectiveHost {
  disabled = signal(true);
  readonly = signal(false);
  changed = vi.fn();
}

describe('PhoneMaskDirective native inputs', () => {
  it('preserves static value, disabled and readonly attributes without Angular forms', async () => {
    const { fixture } = await render('<input phoneMask="US" value="2025550123" disabled readonly />', {
      imports: [PhoneMaskDirective],
      autoDetectChanges: false
    });
    await fixture.whenStable();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('202-555-0123');
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it('reacts to disabled and readonly bindings and ignores edits while inactive', async () => {
    const { fixture } = await render(DisabledDirectiveHost, { autoDetectChanges: false });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const host = fixture.componentInstance;
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(host.changed).not.toHaveBeenCalled();
    host.disabled.set(false);
    host.readonly.set(true);
    await fixture.whenStable();
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    fireEvent.input(input, { target: { value: '212-555-0123' } });
    await fixture.whenStable();
    expect(host.changed).not.toHaveBeenCalled();
    host.readonly.set(false);
    await fixture.whenStable();
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(host.changed).toHaveBeenCalledExactlyOnceWith('4155550199');
  });

  it('clamps an oversized model for display without writing it back into the form', async () => {
    const control = new FormControl('2025550123456789', { nonNullable: true });
    const changed = vi.fn();
    control.valueChanges.subscribe(changed);
    const { fixture } = await render(DirectiveFormHost, { componentProperties: { control }, autoDetectChanges: false });
    await fixture.whenStable();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('202-555-0123');
    expect(control.value).toBe('2025550123456789');
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps country normalization local and does not restore discarded digits when the mask expands', async () => {
    const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const changed = vi.fn();
    host.control.valueChanges.subscribe(changed);

    host.options.set('AD');
    await fixture.whenStable();
    expect(input.value.replace(/\D/g, '')).toBe('20255501');
    host.options.set('GB');
    await fixture.whenStable();
    expect(input.value.replace(/\D/g, '')).toBe('20255501');
    expect(host.control.value).toBe('2025550123');
    expect(host.control.pristine).toBe(true);
    expect(changed).not.toHaveBeenCalled();

    host.control.setValue('2025550123');
    await fixture.whenStable();
    expect(input.value).toBe('202 555 0123');
    expect(changed).toHaveBeenCalledExactlyOnceWith('2025550123');
  });

  it.each(['value-first', 'country-first'] as const)(
    'normalizes a batched country and form value against the final country (%s)',
    async (order) => {
      const { fixture } = await render(DirectiveFormHost, { autoDetectChanges: false });
      const host = fixture.componentInstance;
      const value = '15123456789';
      if (order === 'value-first') host.control.setValue(value);
      host.options.set('DE');
      if (order === 'country-first') host.control.setValue(value);
      await fixture.whenStable();
      expect((screen.getByRole('textbox') as HTMLInputElement).value.replace(/\D/g, '')).toBe(value);
      expect(host.control.value).toBe(value);
      expect(host.control.pristine).toBe(true);
    }
  );
});
