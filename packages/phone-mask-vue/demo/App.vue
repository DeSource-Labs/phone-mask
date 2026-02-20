<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput } from '../src';
import type {
  PCountryKey as CountryKey,
  PMaskFull as MaskFull,
  PhoneInputSize as Size,
  PhoneInputTheme as Theme,
  PMaskPhoneNumber
} from '../src';

const digits = ref('');
const country = ref<CountryKey | undefined>(undefined);
const locale = ref<string | undefined>(undefined);
const detect = ref(true);
const showCopy = ref(true);
const showClear = ref(true);
const size = ref<Size>('normal');
const theme = ref<Theme>('dark');
const withValidity = ref(true);
const disabled = ref(false);
const readonly = ref(false);

function onDetectChange(checked: boolean) {
  detect.value = checked;
  if (checked) country.value = undefined;
}

function onCountryChange(c: MaskFull) {
  console.log('Country:', c.name);
}

function onValidationChange(v: boolean) {
  console.log('Valid:', v);
}

function onChange(e: PMaskPhoneNumber) {
  digits.value = e.digits;
}
</script>

<template>
  <main class="app-main">
    <header class="app-header">
      <h1 class="app-title">@desource/phone-mask-vue</h1>
      <p class="app-subtitle">Interactive Component Demo &amp; Playground</p>
    </header>

    <div class="app-content">
      <section class="playground" data-testid="playground">
        <h2 class="heading">Component Playground</h2>

        <div class="playground-grid">
          <!-- Preview Panel -->
          <div class="panel preview-panel">
            <h3 class="subheading">Preview</h3>
            <div class="preview-area">
              <PhoneInput
                :value="digits"
                :country="country"
                :locale="locale"
                :detect="detect"
                :show-copy="showCopy"
                :show-clear="showClear"
                :size="size"
                :theme="theme"
                :with-validity="withValidity"
                :disabled="disabled"
                :readonly="readonly"
                data-testid="phone-input"
                @change="onChange"
                @country-change="onCountryChange"
                @validation-change="onValidationChange"
              />
              <div class="meta">
                <div>
                  <strong data-testid="phone-input-value">Value:</strong>
                  {{ digits || '—' }}
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
                  :value="country ?? ''"
                  class="select"
                  data-testid="props-country"
                  @change="country = (($event.target as HTMLSelectElement).value as CountryKey) || undefined"
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
                  :value="locale ?? ''"
                  class="select"
                  data-testid="props-locale"
                  @change="locale = ($event.target as HTMLSelectElement).value || undefined"
                >
                  <option value="">Not Selected</option>
                  <option value="en-US">English (US)</option>
                  <option value="de-DE">German</option>
                  <option value="ru-RU">Russian</option>
                </select>
              </label>

              <label class="label">
                <span>Size:</span>
                <select v-model="size" class="select" data-testid="props-size">
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </label>

              <label class="label">
                <span>Theme:</span>
                <select v-model="theme" class="select" data-testid="props-theme">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>

            <div class="control-group">
              <label class="checkbox-label" data-testid="props-detect">
                <input
                  type="checkbox"
                  :checked="detect"
                  class="checkbox"
                  @change="onDetectChange(($event.target as HTMLInputElement).checked)"
                />
                <span>Auto-detect country</span>
              </label>

              <label class="checkbox-label" data-testid="props-show-copy">
                <input v-model="showCopy" type="checkbox" class="checkbox" />
                <span>Show copy button</span>
              </label>

              <label class="checkbox-label" data-testid="props-show-clear">
                <input v-model="showClear" type="checkbox" class="checkbox" />
                <span>Show clear button</span>
              </label>

              <label class="checkbox-label" data-testid="props-with-validity">
                <input v-model="withValidity" type="checkbox" class="checkbox" />
                <span>Show validity indicators</span>
              </label>

              <label class="checkbox-label" data-testid="props-disabled">
                <input v-model="disabled" type="checkbox" class="checkbox" />
                <span>Disabled</span>
              </label>

              <label class="checkbox-label" data-testid="props-readonly">
                <input v-model="readonly" type="checkbox" class="checkbox" />
                <span>Readonly</span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="app-footer">
      <p>Tip: Open console to see event logs</p>
    </footer>
  </main>
</template>

<style scoped>
.app-main {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #0f0f1e 100%);
  color: #fff;
  font-family: 'Nunito', sans-serif;
  overflow: auto;
  padding: 40px 20px;
}

.app-header {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto 48px;
}

.app-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff 0%, #a0a0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 18px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
}

.app-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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

.select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  cursor: pointer;
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

.app-footer {
  margin-top: 48px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  font-weight: 300;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  max-width: 1200px;
  margin: 48px auto 0;
}
</style>
