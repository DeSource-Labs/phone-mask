<script lang="ts">
import { PhoneInput } from '../../src';
import type {
  PCountryKey as CountryKey,
  PMaskFull as MaskFull,
  PhoneInputSize as Size,
  PhoneInputTheme as Theme
} from '../../src';

let digits = $state('');
let country = $state<CountryKey | undefined>(undefined);
let locale = $state<string | undefined>(undefined);
let detect = $state(true);
let showCopy = $state(true);
let showClear = $state(true);
let size = $state<Size>('normal');
let theme = $state<Theme>('dark');
let withValidity = $state(true);
let disabled = $state(false);
let readonly = $state(false);
let searchPlaceholder = $state('');
let noResultsText = $state('');
let clearButtonLabel = $state('');
let dropdownClass = $state('');
let disableDefaultStyles = $state(false);

function onDetectChange(checked: boolean) {
  detect = checked;
  if (checked) country = undefined;
}

function onCountryChange(c: MaskFull) {
  console.log('Country:', c.name);
}

function onValidationChange(v: boolean) {
  console.log('Valid:', v);
}
</script>

<section class="playground" data-testid="playground">
  <h2 class="heading">Component Playground</h2>

  <div class="playground-grid">
    <!-- Preview Panel -->
    <div class="panel preview-panel">
      <h3 class="subheading">Preview</h3>
      <div class="preview-area">
        <PhoneInput
          bind:value={digits}
          {country}
          {locale}
          {detect}
          {showCopy}
          {showClear}
          {size}
          {theme}
          {withValidity}
          {disabled}
          {readonly}
          searchPlaceholder={searchPlaceholder || undefined}
          noResultsText={noResultsText || undefined}
          clearButtonLabel={clearButtonLabel || undefined}
          dropdownClass={dropdownClass || undefined}
          {disableDefaultStyles}
          data-testid="phone-input"
          oncountrychange={onCountryChange}
          onvalidationchange={onValidationChange}
        />
        <div class="meta">
          <div>
            <strong data-testid="phone-input-value">Value:</strong>
            {digits || '—'}
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="panel controls-panel" data-testid="phone-input-props">
      <h3 class="subheading">Props</h3>

      <div class="control-group">
        <label class="label">
          <span>Country:</span>
          <select
            value={country ?? ''}
            class="select"
            data-testid="props-country"
            onchange={(e) => { country = ((e.target as HTMLSelectElement).value as CountryKey) || undefined; }}
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
            value={locale ?? ''}
            class="select"
            data-testid="props-locale"
            onchange={(e) => { locale = (e.target as HTMLSelectElement).value || undefined; }}
          >
            <option value="">Not Selected</option>
            <option value="en-US">English (US)</option>
            <option value="de-DE">German</option>
            <option value="ru-RU">Russian</option>
          </select>
        </label>

        <label class="label">
          <span>Size:</span>
          <select
            value={size}
            class="select"
            data-testid="props-size"
            onchange={(e) => { size = (e.target as HTMLSelectElement).value as Size; }}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label class="label">
          <span>Theme:</span>
          <select
            value={theme}
            class="select"
            data-testid="props-theme"
            onchange={(e) => { theme = (e.target as HTMLSelectElement).value as Theme; }}
          >
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
            value={searchPlaceholder}
            oninput={(e) => { searchPlaceholder = (e.target as HTMLInputElement).value; }}
            type="text"
            class="input"
            data-testid="props-search-placeholder"
            placeholder="Search country or code..."
          />
        </label>

        <label class="label">
          <span>No results text:</span>
          <input
            value={noResultsText}
            oninput={(e) => { noResultsText = (e.target as HTMLInputElement).value; }}
            type="text"
            class="input"
            data-testid="props-no-results-text"
            placeholder="No countries found"
          />
        </label>

        <label class="label">
          <span>Clear button label:</span>
          <input
            value={clearButtonLabel}
            oninput={(e) => { clearButtonLabel = (e.target as HTMLInputElement).value; }}
            type="text"
            class="input"
            data-testid="props-clear-button-label"
            placeholder="Clear phone number"
          />
        </label>

        <label class="label">
          <span>Dropdown class:</span>
          <input
            value={dropdownClass}
            oninput={(e) => { dropdownClass = (e.target as HTMLInputElement).value; }}
            type="text"
            class="input"
            data-testid="props-dropdown-class"
            placeholder="my-custom-class"
          />
        </label>
      </div>

      <div class="control-group">
        <label class="checkbox-label" data-testid="props-detect">
          <input
            type="checkbox"
            checked={detect}
            class="checkbox"
            onchange={(e) => onDetectChange((e.target as HTMLInputElement).checked)}
          />
          <span>Auto-detect country</span>
        </label>

        <label class="checkbox-label" data-testid="props-show-copy">
          <input
            type="checkbox"
            checked={showCopy}
            class="checkbox"
            onchange={(e) => { showCopy = (e.target as HTMLInputElement).checked; }}
          />
          <span>Show copy button</span>
        </label>

        <label class="checkbox-label" data-testid="props-show-clear">
          <input
            type="checkbox"
            checked={showClear}
            class="checkbox"
            onchange={(e) => { showClear = (e.target as HTMLInputElement).checked; }}
          />
          <span>Show clear button</span>
        </label>

        <label class="checkbox-label" data-testid="props-with-validity">
          <input
            type="checkbox"
            checked={withValidity}
            class="checkbox"
            onchange={(e) => { withValidity = (e.target as HTMLInputElement).checked; }}
          />
          <span>Show validity indicators</span>
        </label>

        <label class="checkbox-label" data-testid="props-disabled">
          <input
            type="checkbox"
            checked={disabled}
            class="checkbox"
            onchange={(e) => { disabled = (e.target as HTMLInputElement).checked; }}
          />
          <span>Disabled</span>
        </label>

        <label class="checkbox-label" data-testid="props-readonly">
          <input
            type="checkbox"
            checked={readonly}
            class="checkbox"
            onchange={(e) => { readonly = (e.target as HTMLInputElement).checked; }}
          />
          <span>Readonly</span>
        </label>

        <label class="checkbox-label" data-testid="props-disable-default-styles">
          <input
            type="checkbox"
            checked={disableDefaultStyles}
            class="checkbox"
            onchange={(e) => { disableDefaultStyles = (e.target as HTMLInputElement).checked; }}
          />
          <span>Disable default styles</span>
        </label>
      </div>
    </div>
  </div>
</section>

<style>
.playground {
  padding: 32px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.heading {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #fff;
}

.subheading {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.playground-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
}

.preview-area {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.meta {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 14px;
  display: grid;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.select,
.input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
}

.select {
  cursor: pointer;
}

.select :global(option) {
  color: #000;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #a0a0ff;
}
</style>
