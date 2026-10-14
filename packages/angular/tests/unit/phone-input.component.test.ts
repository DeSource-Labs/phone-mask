import { Component, signal, viewChild, type Type } from '@angular/core';
import type { CountryKey } from '@desource/phone-mask';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { fireEvent } from '@testing-library/dom';
import { PhoneInputComponent } from '@src/components/phone-input/phone-input.component';
import { testPhoneInput, type SetupOptions } from '@common/tests/unit/PhoneInput';
import { tools, trackFixture } from './setup/tools';

@Component({
  selector: 'test-custom-phone',
  imports: [PhoneInputComponent],
  template: `
    <phone-input
      value="2025550199"
      [detect]="false"
      [showClear]="showButtons()"
      [showCopy]="showButtons()"
      [flagTemplate]="flag"
      [copyTemplate]="copy"
      [clearTemplate]="clear"
      [actionsTemplate]="showActions() ? actions : undefined"
      dropdownClass="custom-dropdown"
      (phoneFocus)="onFocus($event)"
      (phoneBlur)="onBlur($event)"
    >
    </phone-input>
    <ng-template #actions><span data-testid="actions-before"></span></ng-template>
    <ng-template #flag><span data-testid="flag-custom"></span></ng-template>
    <ng-template #copy><span data-testid="copy-custom"></span></ng-template>
    <ng-template #clear><span data-testid="clear-custom"></span></ng-template>
  `
})
class CustomPhoneHost {
  showButtons = signal(true);
  showActions = signal(true);
  input = viewChild.required(PhoneInputComponent);
  onFocus = vi.fn();
  onBlur = vi.fn();
}

async function setup(options: SetupOptions = {}) {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const { withCustomRenderers, ...inputs } = options;
  if (withCustomRenderers) {
    const { fixture, container } = await render(CustomPhoneHost, {
      componentProperties: { onFocus, onBlur },
      autoDetectChanges: false
    });
    trackFixture(fixture);
    await fixture.whenStable();
    return {
      ref: fixture.componentInstance.input(),
      container,
      onChange,
      onCountryChange,
      onCopy,
      onFocus,
      onBlur,
      unmount: () => fixture.destroy()
    };
  }
  const { fixture, container } = await render(PhoneInputComponent, {
    inputs: { ...inputs, country: inputs.country as CountryKey | undefined },
    on: {
      valueChange: onChange,
      countryChange: onCountryChange,
      copied: onCopy,
      phoneFocus: onFocus,
      phoneBlur: onBlur
    },
    autoDetectChanges: false
  });
  trackFixture(fixture);
  await fixture.whenStable();
  return {
    ref: fixture.componentInstance,
    container,
    onChange,
    onCountryChange,
    onCopy,
    onFocus,
    onBlur,
    unmount: () => fixture.destroy()
  };
}

testPhoneInput(setup, tools);

it('reports touch on blur once through both Angular forms APIs', async () => {
  const touchedChange = vi.fn();
  const phoneBlur = vi.fn();
  const formTouched = vi.fn();
  const { fixture } = await render(PhoneInputComponent, {
    inputs: { country: 'US' },
    on: { touchedChange, phoneBlur },
    autoDetectChanges: false
  });
  fixture.componentInstance.registerOnTouched(formTouched);
  fixture.componentInstance.writeValue('2025550123');
  const input = screen.getByRole('textbox');
  fireEvent.focus(input);
  await fixture.whenStable();
  expect(touchedChange).not.toHaveBeenCalled();
  expect(formTouched).not.toHaveBeenCalled();

  fireEvent.blur(input);
  await fixture.whenStable();
  expect(touchedChange).toHaveBeenCalledExactlyOnceWith(true);
  expect(formTouched).toHaveBeenCalledOnce();
  expect(phoneBlur).toHaveBeenCalledOnce();
});

@Component({
  selector: 'test-reactive-form',
  imports: [PhoneInputComponent, ReactiveFormsModule],
  template: '<phone-input [formControl]="control" [detect]="false" (valueChange)="changed($event)" />'
})
class ReactiveFormHost {
  control = new FormControl('2025550123', { nonNullable: true });
  changed = vi.fn();
}

@Component({
  selector: 'test-country-form',
  imports: [PhoneInputComponent, ReactiveFormsModule],
  template:
    '<phone-input [formControl]="control" [country]="country()" [detect]="false" (valueChange)="changed($event)" />'
})
class CountryFormHost {
  control = new FormControl('', { nonNullable: true });
  country = signal<CountryKey>('US');
  changed = vi.fn();
}

@Component({
  selector: 'test-template-form',
  imports: [PhoneInputComponent, FormsModule],
  template: '<phone-input [(ngModel)]="value" [detect]="false" />'
})
class TemplateFormHost {
  value = signal('2025550123');
}

describe('PhoneInput Angular forms', () => {
  it('writes model values without echoing them and reports user edits as digits', async () => {
    const { fixture } = await render(ReactiveFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const values = vi.fn();
    host.control.valueChanges.subscribe(values);
    expect(input.value).toBe('202-555-0123');
    expect(host.changed).not.toHaveBeenCalled();

    host.control.setValue('4155550199');
    await fixture.whenStable();
    expect(input.value).toBe('415-555-0199');
    expect(values).toHaveBeenCalledExactlyOnceWith('4155550199');
    expect(host.changed).not.toHaveBeenCalled();

    fireEvent.input(input, { target: { value: '212-555-0144' } });
    await fixture.whenStable();
    expect(host.control.value).toBe('2125550144');
    expect(host.changed).toHaveBeenCalledExactlyOnceWith('2125550144');
    expect(host.control.dirty).toBe(true);
    expect(host.control.touched).toBe(false);

    fireEvent.blur(input);
    await fixture.whenStable();
    expect(host.control.touched).toBe(true);
  });

  it('honors updateOn blur without committing each keystroke', async () => {
    const control = new FormControl('2025550123', { nonNullable: true, updateOn: 'blur' });
    const { fixture } = await render(ReactiveFormHost, {
      componentProperties: { control },
      autoDetectChanges: false
    });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(input.value).toBe('415-555-0199');
    expect(control.value).toBe('2025550123');
    fireEvent.blur(input);
    await fixture.whenStable();
    expect(control.value).toBe('4155550199');
  });

  it('propagates disabled state and resets without user-change events', async () => {
    const { fixture } = await render(ReactiveFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    host.control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    host.control.enable();
    await fixture.whenStable();
    expect(input.disabled).toBe(false);
    host.control.reset('');
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(host.changed).not.toHaveBeenCalled();
  });

  it('supports two-way ngModel with signals', async () => {
    const { fixture } = await render(TemplateFormHost, { autoDetectChanges: false });
    await fixture.whenStable();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('202-555-0123');
    fireEvent.input(input, { target: { value: '415-555-0199' } });
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('4155550199');
    fixture.componentInstance.value.set('2125550144');
    await fixture.whenStable();
    expect(input.value).toBe('212-555-0144');
  });
});

@Component({
  selector: 'test-value-binding',
  imports: [PhoneInputComponent],
  template: '<phone-input [(value)]="value" [detect]="false" (valueChange)="changed($event)" />'
})
class ValueBindingHost {
  value = signal('2025550123');
  changed = vi.fn();
}

@Component({
  selector: 'test-phone-lifecycle',
  imports: [PhoneInputComponent],
  template: `
    @if (firstVisible()) {
      <phone-input id="first-phone" [detect]="false" />
    }
    <phone-input id="second-phone" [detect]="false" />
  `
})
class PhoneLifecycleHost {
  firstVisible = signal(true);
}

describe('PhoneInput signal bindings and lifecycle', () => {
  it('supports two-way value bindings without forms or feedback loops', async () => {
    const { fixture } = await render(ValueBindingHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('202-555-0123');
    expect(host.changed).not.toHaveBeenCalled();
    host.value.set('4155550199');
    await fixture.whenStable();
    expect(input.value).toBe('415-555-0199');
    expect(host.changed).not.toHaveBeenCalled();
    fireEvent.input(input, { target: { value: '212-555-0144' } });
    await fixture.whenStable();
    expect(host.value()).toBe('2125550144');
    expect(host.changed).toHaveBeenCalledExactlyOnceWith('2125550144');
  });

  it('keeps dropdown IDs distinct and removes each body portal with its component', async () => {
    const { fixture } = await render(PhoneLifecycleHost, { autoDetectChanges: false });
    await fixture.whenStable();
    const dropdowns = Array.from(document.body.querySelectorAll<HTMLElement>('.desource-phone-dropdown'));
    expect(dropdowns).toHaveLength(2);
    expect(dropdowns[0].id).not.toBe(dropdowns[1].id);
    const ids = Array.from(fixture.nativeElement.querySelectorAll('.pi-selector-btn'), (button) =>
      (button as HTMLElement).getAttribute('aria-controls')
    );
    expect(new Set(ids)).toEqual(new Set(dropdowns.map(({ id }) => id)));
    fixture.componentInstance.firstVisible.set(false);
    await fixture.whenStable();
    expect(document.body.querySelectorAll('.desource-phone-dropdown')).toHaveLength(1);
    expect(document.getElementById('second-phone')).not.toBeNull();
    fixture.destroy();
    expect(document.body.querySelectorAll('.desource-phone-dropdown')).toHaveLength(0);
  });
});

it('reserves input padding for custom actions even without copy or clear buttons', async () => {
  const { fixture } = await render(CustomPhoneHost, { autoDetectChanges: false });
  const root = fixture.nativeElement.querySelector('.desource-phone-input') as HTMLElement;
  expect(root.style.getPropertyValue('--pi-actions-count')).toBe('3');
  fixture.componentInstance.showButtons.set(false);
  await fixture.whenStable();
  expect(root.style.getPropertyValue('--pi-actions-count')).toBe('1');
  expect(screen.getByTestId('actions-before')).toBeDefined();
  fixture.componentInstance.showActions.set(false);
  await fixture.whenStable();
  expect(root.style.getPropertyValue('--pi-actions-count')).toBe('0');
  expect(screen.queryByTestId('actions-before')).toBeNull();
});

describe('PhoneInput country selection value ownership', () => {
  it.each([
    { name: 'Angular forms', host: ReactiveFormHost },
    { name: 'two-way value bindings', host: ValueBindingHost }
  ])('updates $name only when a selected country changes the digits', async ({ host }) => {
    const { fixture } = await render(host as Type<ReactiveFormHost | ValueBindingHost>, { autoDetectChanges: false });
    const component = fixture.componentInstance;
    const value = () => (component instanceof ReactiveFormHost ? component.control.value : component.value());
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(value()).toBe('2025550123');
    expect(component.changed).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Selected country:/ }));
    await fixture.whenStable();
    fireEvent.click(screen.getByRole('option', { name: /Andorra/ }));
    await fixture.whenStable();
    expect(value()).toBe('20255501');
    expect(input.value.replace(/\D/g, '')).toBe(value());
    expect(component.changed).toHaveBeenCalledExactlyOnceWith('20255501');

    fireEvent.click(screen.getByRole('button', { name: /Selected country:/ }));
    await fixture.whenStable();
    fireEvent.click(screen.getByRole('option', { name: /United Kingdom/ }));
    await fixture.whenStable();
    expect(value()).toBe('20255501');
    expect(component.changed).toHaveBeenCalledTimes(1);
  });
});

it('clamps externally written form values without treating normalization as a user edit', async () => {
  const control = new FormControl('2025550123456789', { nonNullable: true });
  const changed = vi.fn();
  control.valueChanges.subscribe(changed);
  const { fixture } = await render(ReactiveFormHost, {
    componentProperties: { control },
    autoDetectChanges: false
  });
  await fixture.whenStable();
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('202-555-0123');
  expect(control.value).toBe('2025550123456789');
  expect(changed).not.toHaveBeenCalled();
  expect(fixture.componentInstance.changed).not.toHaveBeenCalled();
  expect(control.pristine).toBe(true);
});

it('does not restore discarded digits when an external country expands the mask', async () => {
  const valueChange = vi.fn();
  const formChange = vi.fn();
  const { fixture } = await render(PhoneInputComponent, {
    inputs: { value: '2025550123', country: 'US', detect: false },
    on: { valueChange },
    autoDetectChanges: false
  });
  const component = fixture.componentInstance;
  component.registerOnChange(formChange);
  const input = screen.getByRole('textbox') as HTMLInputElement;

  fixture.componentRef.setInput('country', 'AD');
  await fixture.whenStable();
  expect(component.getDigits()).toBe('20255501');
  fixture.componentRef.setInput('country', 'GB');
  await fixture.whenStable();
  expect(component.getDigits()).toBe('20255501');
  expect(input.value.replace(/\D/g, '')).toBe('20255501');
  expect(component.value()).toBe('2025550123');
  expect(valueChange).not.toHaveBeenCalled();
  expect(formChange).not.toHaveBeenCalled();

  component.writeValue('2025550123');
  await fixture.whenStable();
  expect(component.getDigits()).toBe('2025550123');
  expect(input.value).toBe('202 555 0123');
  expect(valueChange).not.toHaveBeenCalled();
  expect(formChange).not.toHaveBeenCalled();
});

it.each(['value-first', 'country-first'] as const)(
  'normalizes a batched country and form value against the final country (%s)',
  async (order) => {
    const { fixture } = await render(CountryFormHost, { autoDetectChanges: false });
    const host = fixture.componentInstance;
    const value = '15123456789';
    if (order === 'value-first') host.control.setValue(value);
    host.country.set('DE');
    if (order === 'country-first') host.control.setValue(value);
    await fixture.whenStable();
    expect((screen.getByRole('textbox') as HTMLInputElement).value.replace(/\D/g, '')).toBe(value);
    expect(host.control.value).toBe(value);
    expect(host.changed).not.toHaveBeenCalled();
  }
);
