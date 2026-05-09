import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
  type AfterViewInit,
  type OnDestroy
} from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  PhoneInputComponent,
  UseCountryService,
  UseFormatterService,
  UseInputHandlersService,
  UsePhoneMaskService,
  type PhoneInputSize,
  type PhoneInputTheme
} from '../../src/public-api';

@Component({
  selector: 'demo-hook',
  standalone: true,
  template: `
    <section class="section" data-testid="hook">
      <h2>UsePhoneMask Service</h2>
      <div class="controls row">
        <input #phoneInput type="tel" placeholder="Phone number" class="input" data-testid="phone-input" />
        <button class="btn" type="button" data-testid="control-country-us" (click)="setCountry('US')">US</button>
        <button class="btn" type="button" data-testid="control-country-de" (click)="setCountry('DE')">DE</button>
        <button class="btn" type="button" data-testid="control-clear" (click)="clear()">Clear</button>
      </div>
      <div class="meta">
        <div data-testid="meta-digits"><strong>Digits:</strong> {{ mask.digits() || '—' }}</div>
        <div data-testid="meta-full"><strong>Full:</strong> {{ mask.full() || '—' }}</div>
        <div data-testid="meta-formatted"><strong>Formatted:</strong> {{ mask.fullFormatted() || '—' }}</div>
        <div data-testid="meta-valid"><strong>Valid:</strong> {{ mask.isComplete() ? 'Yes' : 'No' }}</div>
      </div>
    </section>
  `,
  providers: [UseCountryService, UseFormatterService, UseInputHandlersService, UsePhoneMaskService]
})
class DemoHookComponent implements AfterViewInit, OnDestroy {
  protected readonly mask = inject(UsePhoneMaskService);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('phoneInput');
  private readonly value = signal('');

  constructor() {
    this.mask.configure({
      value: this.value,
      detect: () => false,
      onChange: (digits) => this.value.set(digits)
    });
    this.mask.setCountry('GB');
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mask.connect(this.inputRef()?.nativeElement ?? null));
  }

  ngOnDestroy(): void {
    this.mask.connect(null);
  }

  protected setCountry(country: CountryKey): void {
    this.mask.setCountry(country);
  }

  protected clear(): void {
    this.mask.clear();
    this.value.set('');
  }
}

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [PhoneInputComponent, DemoHookComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="app-main">
      <header class="app-header">
        <h1>@desource/phone-mask-angular</h1>
        <p>Interactive component and service playground</p>
      </header>

      <section class="section" data-testid="playground">
        <h2>Component Playground</h2>
        <div class="grid">
          <div class="panel">
            <h3>Preview</h3>
            <div class="preview">
              <desource-phone-input
                #playgroundPhone
                data-testid="phone-input"
                [value]="digits()"
                [country]="country()"
                [locale]="locale()"
                [detect]="detect()"
                [showCopy]="showCopy()"
                [showClear]="showClear()"
                [size]="size()"
                [theme]="theme()"
                [withValidity]="withValidity()"
                [disabled]="disabled()"
                [readonly]="readonly()"
                [searchPlaceholder]="searchPlaceholder() || 'Search country or code...'"
                [noResultsText]="noResultsText() || 'No countries found'"
                [clearButtonLabel]="clearButtonLabel() || 'Clear phone number'"
                [dropdownClass]="dropdownClass() || ''"
                [disableDefaultStyles]="disableDefaultStyles()"
                (valueChange)="digits.set($event)"
                (countryChange)="onCountryChange($event)"
                (validationChange)="onValidationChange($event)"
              />
              <div class="meta">
                <div><strong data-testid="phone-input-value">Value:</strong> {{ digits() || '—' }}</div>
              </div>
            </div>
          </div>

          <div class="panel" data-testid="phone-input-props">
            <h3>Props</h3>
            <div class="control-group">
              <label class="label">
                <span>Country:</span>
                <select
                  class="select"
                  data-testid="props-country"
                  [value]="country() ?? ''"
                  (change)="setCountryOption($event)"
                >
                  <option value="">Not Selected</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="UA">Ukraine</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="JP">Japan</option>
                </select>
              </label>

              <label class="label">
                <span>Locale:</span>
                <select
                  class="select"
                  data-testid="props-locale"
                  [value]="locale() ?? ''"
                  (change)="setLocaleOption($event)"
                >
                  <option value="">Not Selected</option>
                  <option value="en-US">English (US)</option>
                  <option value="de-DE">German</option>
                  <option value="ru-RU">Russian</option>
                </select>
              </label>

              <label class="label">
                <span>Size:</span>
                <select class="select" data-testid="props-size" [value]="size()" (change)="setSizeOption($event)">
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </label>

              <label class="label">
                <span>Theme:</span>
                <select class="select" data-testid="props-theme" [value]="theme()" (change)="setThemeOption($event)">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>

            <div class="control-group">
              <label class="label">
                <span>Search placeholder:</span>
                <input
                  class="input"
                  type="text"
                  data-testid="props-search-placeholder"
                  placeholder="Search country or code..."
                  [value]="searchPlaceholder()"
                  (input)="searchPlaceholder.set($any($event.target).value)"
                />
              </label>

              <label class="label">
                <span>No results text:</span>
                <input
                  class="input"
                  type="text"
                  data-testid="props-no-results-text"
                  placeholder="No countries found"
                  [value]="noResultsText()"
                  (input)="noResultsText.set($any($event.target).value)"
                />
              </label>

              <label class="label">
                <span>Clear button label:</span>
                <input
                  class="input"
                  type="text"
                  data-testid="props-clear-button-label"
                  placeholder="Clear phone number"
                  [value]="clearButtonLabel()"
                  (input)="clearButtonLabel.set($any($event.target).value)"
                />
              </label>

              <label class="label">
                <span>Dropdown class:</span>
                <input
                  class="input"
                  type="text"
                  data-testid="props-dropdown-class"
                  placeholder="custom-dropdown"
                  [value]="dropdownClass()"
                  (input)="dropdownClass.set($any($event.target).value)"
                />
              </label>
            </div>

            <div class="control-group">
              <label class="checkbox-label" data-testid="props-detect">
                <input type="checkbox" class="checkbox" [checked]="detect()" (change)="setDetect($event)" />
                <span>Auto-detect country</span>
              </label>
              <label class="checkbox-label" data-testid="props-show-copy">
                <input
                  type="checkbox"
                  class="checkbox"
                  [checked]="showCopy()"
                  (change)="showCopy.set($any($event.target).checked)"
                />
                <span>Show copy button</span>
              </label>
              <label class="checkbox-label" data-testid="props-show-clear">
                <input
                  type="checkbox"
                  class="checkbox"
                  [checked]="showClear()"
                  (change)="showClear.set($any($event.target).checked)"
                />
                <span>Show clear button</span>
              </label>
              <label class="checkbox-label" data-testid="props-with-validity">
                <input
                  type="checkbox"
                  class="checkbox"
                  [checked]="withValidity()"
                  (change)="withValidity.set($any($event.target).checked)"
                />
                <span>Show validity indicators</span>
              </label>
              <label class="checkbox-label" data-testid="props-disabled">
                <input type="checkbox" class="checkbox" [checked]="disabled()" (change)="setDisabled($event)" />
                <span>Disabled</span>
              </label>
              <label class="checkbox-label" data-testid="props-readonly">
                <input
                  type="checkbox"
                  class="checkbox"
                  [checked]="readonly()"
                  (change)="readonly.set($any($event.target).checked)"
                />
                <span>Readonly</span>
              </label>
              <label class="checkbox-label" data-testid="props-disable-default-styles">
                <input
                  type="checkbox"
                  class="checkbox"
                  [checked]="disableDefaultStyles()"
                  (change)="disableDefaultStyles.set($any($event.target).checked)"
                />
                <span>Disable default styles</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <demo-hook />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      .app-main {
        min-height: 100vh;
        width: 100vw;
        background: #101014;
        color: #ffffff;
        font-family: Arial, sans-serif;
        padding: 40px 20px;
      }

      .app-header,
      .section {
        max-width: 1200px;
        margin: 0 auto 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.06);
        padding: 28px;
      }

      .app-header {
        text-align: center;
      }

      h1,
      h2,
      h3,
      p {
        margin-top: 0;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }

      .panel,
      .preview,
      .meta {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.18);
        padding: 20px;
      }

      .meta {
        display: grid;
        gap: 6px;
        margin-top: 16px;
        font-size: 14px;
      }

      .control-group,
      .controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }

      .row {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .select,
      .input,
      .btn {
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        font: inherit;
        padding: 9px 12px;
      }

      .select option {
        color: #000000;
      }

      .input::placeholder {
        color: rgba(255, 255, 255, 0.45);
      }

      .btn {
        cursor: pointer;
        font-weight: 600;
      }
    `
  ]
})
export class AppComponent {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly playgroundPhone = viewChild<PhoneInputComponent>('playgroundPhone');

  protected readonly digits = signal('');
  protected readonly country = signal<CountryKey | undefined>(undefined);
  protected readonly locale = signal<string | undefined>(undefined);
  protected readonly detect = signal(true);
  protected readonly showCopy = signal(true);
  protected readonly showClear = signal(true);
  protected readonly size = signal<PhoneInputSize>('normal');
  protected readonly theme = signal<PhoneInputTheme>('dark');
  protected readonly withValidity = signal(true);
  protected readonly disabled = signal(false);
  protected readonly readonly = signal(false);
  protected readonly searchPlaceholder = signal('');
  protected readonly noResultsText = signal('');
  protected readonly clearButtonLabel = signal('');
  protected readonly dropdownClass = signal('');
  protected readonly disableDefaultStyles = signal(false);

  protected setDetect(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.detect.set(checked);
    if (checked) this.country.set(undefined);
  }

  protected setDisabled(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.disabled.set(checked);
    this.playgroundPhone()?.setDisabledState(checked);
    this.changeDetector.detectChanges();
  }

  protected setCountryOption(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.country.set((value as CountryKey) || undefined);
  }

  protected setLocaleOption(event: Event): void {
    this.locale.set((event.target as HTMLSelectElement).value || undefined);
  }

  protected setSizeOption(event: Event): void {
    this.size.set((event.target as HTMLSelectElement).value as PhoneInputSize);
  }

  protected setThemeOption(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value as PhoneInputTheme);
  }

  protected onCountryChange(_country: MaskFull): void {}

  protected onValidationChange(_valid: boolean): void {}
}
