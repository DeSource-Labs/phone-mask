import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  PhoneInputComponent,
  PhoneMaskDirective,
  PhonePipe,
  usePhoneMask,
  type Size,
  type Theme
} from '@desource/phone-mask-angular';
import type { CountryKey } from '@desource/phone-mask-angular/core';

@Component({
  selector: 'demo-app',
  imports: [FormsModule, ReactiveFormsModule, PhoneInputComponent, PhoneMaskDirective, PhonePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  readonly ssr = inject(DOCUMENT).location.pathname === '/ssr';
  readonly countries = ['US', 'GB', 'DE', 'FR', 'UA', 'CA', 'AU', 'JP'];
  readonly digits = signal('');
  readonly country = signal<CountryKey | undefined>(undefined);
  readonly locale = signal<string | undefined>(undefined);
  readonly detect = signal(true);
  readonly showCopy = signal(true);
  readonly showClear = signal(true);
  readonly size = signal<Size>('normal');
  readonly theme = signal<Theme>('dark');
  readonly withValidity = signal(true);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly searchPlaceholder = signal('');
  readonly noResultsText = signal('');
  readonly clearButtonLabel = signal('');
  readonly dropdownClass = signal('');
  readonly disableDefaultStyles = signal(false);
  readonly textControls = [
    { id: 'props-search-placeholder', label: 'Search placeholder', value: this.searchPlaceholder },
    { id: 'props-no-results-text', label: 'No results text', value: this.noResultsText },
    { id: 'props-clear-button-label', label: 'Clear label', value: this.clearButtonLabel },
    { id: 'props-dropdown-class', label: 'Dropdown class', value: this.dropdownClass }
  ];
  readonly toggles = [
    { id: 'props-show-copy', label: 'Show copy', value: this.showCopy },
    { id: 'props-show-clear', label: 'Show clear', value: this.showClear },
    { id: 'props-with-validity', label: 'Show validity', value: this.withValidity },
    { id: 'props-disabled', label: 'Disabled', value: this.disabled },
    { id: 'props-readonly', label: 'Readonly', value: this.readonly },
    { id: 'props-disable-default-styles', label: 'Disable default styles', value: this.disableDefaultStyles }
  ];
  readonly customInput = viewChild<ElementRef<HTMLInputElement>>('customInput');
  readonly customDigits = signal('');
  readonly mask = usePhoneMask({
    input: () => this.customInput()?.nativeElement,
    value: this.customDigits,
    onChange: (digits) => this.customDigits.set(digits),
    country: 'GB',
    detect: false
  });
  readonly phoneControl = new FormControl('2025550123', { nonNullable: true });
  readonly formCountry = signal<CountryKey | undefined>('US');
  readonly formValue = toSignal(this.phoneControl.valueChanges, { initialValue: this.phoneControl.value });
  readonly modelPhone = signal('');
  readonly directivePhone = signal('');

  setDetect(value: boolean) {
    this.detect.set(value);
    if (value) this.country.set(undefined);
  }
}
