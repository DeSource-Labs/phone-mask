<template>
  <div class="examples-page">
    <div class="container">
      <header class="page-header">
        <h1>Interactive Examples</h1>
        <p>Try the examples and choose your framework in any code snippet</p>
        <div class="page-header__actions">
          <LiquidGlass actionable width="200">
            <NuxtLink class="link" to="/">← Back to Home</NuxtLink>
          </LiquidGlass>
          <Context7Button ref="context7Button" variant="big" :ready="context7Ready" @toggle="toggleContext7" />
        </div>
      </header>

      <!-- Playground -->
      <div class="playground">
        <h2>🎮 Live Playground</h2>
        <p>Adjust props in real-time and see the results instantly</p>

        <div class="playground-container">
          <div class="playground-controls">
            <div class="control-group">
              <label for="playground-country">Country Code</label>
              <select id="playground-country" v-model="playgroundCountry">
                <option :value="undefined">Not Selected</option>
                <option value="US">US</option>
                <option value="GB">GB</option>
                <option value="DE">DE</option>
                <option value="FR">FR</option>
                <option value="JP">JP</option>
                <option value="AU">AU</option>
                <option value="BR">BR</option>
                <option value="IN">IN</option>
              </select>
            </div>

            <div class="control-group">
              <label for="playground-size">Size</label>
              <select id="playground-size" v-model="playgroundSize">
                <option v-for="size in sizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>

            <div class="control-group">
              <label for="playground-theme">Theme</label>
              <select id="playground-theme" v-model="playgroundTheme">
                <option v-for="theme in themeOptions" :key="theme" :value="theme">
                  {{ theme }}
                </option>
              </select>
            </div>

            <div class="control-group checkbox-group">
              <label>
                <input v-model="playgroundDisabled" type="checkbox" />
                Disabled
              </label>
              <label>
                <input v-model="playgroundReadonly" type="checkbox" />
                Readonly
              </label>
              <label>
                <input v-model="playgroundShowCopy" type="checkbox" />
                Show Copy
              </label>
              <label>
                <input v-model="playgroundShowClear" type="checkbox" />
                Show Clear
              </label>
              <label>
                <input v-model="playgroundDetect" type="checkbox" @change="onPlaygroundDetectClick" />
                Auto Detect
              </label>
              <label>
                <input v-model="playgroundValidity" type="checkbox" />
                With Validity
              </label>
            </div>
          </div>

          <div class="playground-preview">
            <div class="preview-box">
              <PhoneInput
                id="phone-input-playground"
                v-model="playgroundPhone"
                :country="playgroundCountry"
                :size="playgroundSize"
                :theme="playgroundTheme"
                :disabled="playgroundDisabled"
                :readonly="playgroundReadonly"
                :show-copy="playgroundShowCopy"
                :show-clear="playgroundShowClear"
                :detect="playgroundDetect"
                :with-validity="playgroundValidity"
              />
            </div>

            <ExampleCode
              v-model:framework="selectedFramework"
              :code="playgroundCode"
              label="Playground"
              class="code-box"
            />
          </div>
        </div>
      </div>

      <!-- Example 1: Basic Usage -->
      <div class="example">
        <h2>1. Basic Usage</h2>
        <p>Simple phone input with country selector</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput id="phone-input-basic" v-model="basicPhone" />
            <div class="result">
              <span>Phone: {{ basicPhone || '—' }}</span>
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.basic" label="Basic usage" />
        </div>
      </div>

      <!-- Example 2: Validation -->
      <div class="example">
        <h2>2. Phone Validation</h2>
        <p>Real-time validation state tracking</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput
              id="phone-input-validation"
              v-model="validationPhone"
              @validation-change="isValidationValid = $event"
            />
            <div class="result">
              <span :class="isValidationValid ? 'success' : 'error'">
                {{
                  isValidationValid
                    ? '✓ Valid phone number'
                    : validationPhone
                      ? '⚠ Incomplete number'
                      : 'Enter a phone number'
                }}
              </span>
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.validation" label="Validation" />
        </div>
      </div>

      <!-- Example 3: Auto-detect Country -->
      <div class="example">
        <h2>3. Auto Country Detection</h2>
        <p>Automatically detect country from IP or browser locale</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput
              id="phone-input-detection"
              v-model="detectPhone"
              detect
              @country-change="handleDetectedCountry"
            />
            <div class="result">
              <span>Detected Country: {{ detectedCountryName || 'Auto-detecting...' }}</span>
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.detection" label="Country detection" />
        </div>
      </div>

      <!-- Example 4: Sizes -->
      <div class="example">
        <h2>4. Size Variants</h2>
        <p>Three size options: compact, normal, and large</p>

        <div class="example-container">
          <div class="demo">
            <div class="size-demos">
              <div>
                <span class="demo-caption">Compact</span>
                <PhoneInput id="phone-input-compact" v-model="sizePhone" size="compact" />
              </div>
              <div>
                <span class="demo-caption">Normal (default)</span>
                <PhoneInput id="phone-input-normal" v-model="sizePhone" size="normal" />
              </div>
              <div>
                <span class="demo-caption">Large</span>
                <PhoneInput id="phone-input-large" v-model="sizePhone" size="large" />
              </div>
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.sizes" label="Sizes" />
        </div>
      </div>

      <!-- Example 5: Themes -->
      <div class="example">
        <h2>5. Theme Modes</h2>
        <p>Auto, light, and dark themes</p>

        <div class="example-container">
          <div class="demo">
            <div class="theme-picker">
              <label>
                <input v-model="selectedTheme" type="radio" value="auto" />
                Auto
              </label>
              <label>
                <input v-model="selectedTheme" type="radio" value="light" />
                Light
              </label>
              <label>
                <input v-model="selectedTheme" type="radio" value="dark" />
                Dark
              </label>
            </div>
            <PhoneInput id="phone-input-theme-modes" v-model="themePhone" :theme="selectedTheme" />
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.themes" label="Themes" />
        </div>
      </div>

      <!-- Example 6: Actions (Copy & Clear) -->
      <div class="example">
        <h2>6. Copy & Clear Actions</h2>
        <p>Built-in copy and clear button functionality</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput
              id="phone-input-actions"
              v-model="actionPhone"
              show-copy
              show-clear
              @copy="handleCopy"
              @clear="() => (copyNotification = 'Input cleared')"
            />
            <div v-if="copyNotification" class="result success">
              {{ copyNotification }}
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.actions" label="Copy and clear" />
        </div>
      </div>

      <!-- Example 7: Disabled & Readonly -->
      <div class="example">
        <h2>7. Disabled & Readonly States</h2>
        <p>Control input interaction modes</p>

        <div class="example-container">
          <div class="demo">
            <div class="state-demos">
              <div>
                <span class="demo-caption">Disabled</span>
                <PhoneInput id="phone-input-disabled" v-model="disabledPhone" disabled />
              </div>
              <div>
                <span class="demo-caption">Readonly</span>
                <PhoneInput id="phone-input-readonly" v-model="readonlyPhone" readonly />
              </div>
            </div>
          </div>

          <ExampleCode
            v-model:framework="selectedFramework"
            :code="snippets.disabledAndReadonly"
            label="Disabled and readonly"
          />
        </div>
      </div>

      <!-- Example 8: Form Integration -->
      <div class="example">
        <h2>8. Form Integration</h2>
        <p>Use in forms with validation</p>

        <div class="example-container">
          <div class="demo">
            <form class="demo-form" @submit.prevent="handleFormSubmit">
              <input
                id="form-name"
                v-model="formData.name"
                name="name"
                type="text"
                placeholder="Full Name"
                autocomplete="name"
              />
              <input
                id="form-email"
                v-model="formData.email"
                name="email"
                type="email"
                placeholder="Email Address"
                autocomplete="email"
              />
              <PhoneInput
                id="form-phone"
                v-model="formData.phone"
                name="phone"
                @validation-change="handleFormValidation"
              />
              <span v-if="formErrors.phone" class="error">{{ formErrors.phone }}</span>
              <button type="submit">Submit</button>
            </form>
            <div class="result">
              <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
            </div>
          </div>

          <ExampleCode v-model:framework="selectedFramework" :code="snippets.form" label="Form" />
        </div>
      </div>

      <!-- Custom Input Examples -->
      <div class="directive-section">
        <h2>🎯 Custom Input Examples</h2>
        <p>
          Use directives in Vue and Angular, a hook in React, or actions and attachments in Svelte. Attachments require
          Svelte 5.29 or later.
        </p>

        <!-- Directive Example 1: Basic -->
        <div class="example">
          <h3>9. Basic Custom Input</h3>
          <p>Apply phone masking to any input element</p>

          <div class="example-container">
            <div class="demo">
              <input
                id="phone-input-basic-directive"
                v-model="directiveBasic"
                v-phone-mask
                class="custom-input"
                placeholder="Enter phone number"
              />
              <div class="result">
                <span>Value: {{ directiveBasic || '—' }}</span>
              </div>
            </div>

            <ExampleCode
              v-model:framework="selectedFramework"
              :code="snippets.directiveBasic"
              label="Basic custom input"
            />
          </div>
        </div>

        <!-- Directive Example 2: With Options -->
        <div class="example">
          <h3>10. Country and Change Events</h3>
          <p>Configure country and handle change events</p>

          <div class="example-container">
            <div class="demo">
              <select id="country-select-options-directive" v-model="directiveCountry" class="country-select">
                <option value="US">US</option>
                <option value="GB">GB</option>
                <option value="DE">DE</option>
                <option value="FR">FR</option>
              </select>
              <input
                id="phone-input-options-directive"
                v-phone-mask="{
                  country: directiveCountry,
                  onChange: handleDirectiveChange
                }"
                class="custom-input"
                placeholder="Enter phone number"
              />
              <div class="result">
                <span>Full: {{ directiveData.full || '—' }}</span>
                <span>Formatted: {{ directiveData.fullFormatted || '—' }}</span>
                <span>Digits: {{ directiveData.digits || '—' }}</span>
              </div>
            </div>

            <ExampleCode
              v-model:framework="selectedFramework"
              :code="snippets.directiveOptions"
              label="Custom input options"
            />
          </div>
        </div>

        <!-- Directive Example 3: Auto-detect -->
        <div class="example">
          <h3>11. Automatic Country Detection</h3>
          <p>Automatically detect country from IP/locale</p>

          <div class="example-container">
            <div class="demo">
              <input
                id="phone-input-detect-directive"
                v-model="directiveDetectPhone"
                v-phone-mask="{
                  detect: true,
                  onCountryChange: handleDirectiveCountryChange
                }"
                class="custom-input"
                placeholder="Auto-detecting country..."
              />
              <div class="result">
                <span>Detected Country: {{ directiveDetectedCountry || 'Detecting...' }}</span>
              </div>
            </div>

            <ExampleCode
              v-model:framework="selectedFramework"
              :code="snippets.directiveDetect"
              label="Custom input detection"
            />
          </div>
        </div>
      </div>

      <section class="formatting-section" aria-labelledby="formatting-heading">
        <h2 id="formatting-heading">🔤 Display Formatting</h2>
        <p>
          Format phone numbers for text, tables, and contact cards. Choose whether to show the country code and flag.
        </p>

        <div class="example-container">
          <div class="demo">
            <fieldset class="formatting-presets" aria-label="Sample phone numbers">
              <button
                v-for="sample in displaySamples"
                :key="sample.label"
                type="button"
                @click="
                  displayPhone = sample.value;
                  displayCountry = sample.country;
                "
              >
                {{ sample.label }}
              </button>
            </fieldset>
            <div class="control-group">
              <label for="display-phone">Phone number</label>
              <input id="display-phone" v-model="displayPhone" type="text" />
            </div>
            <div class="control-group">
              <label for="display-country">Country</label>
              <select id="display-country" v-model="displayCountry">
                <option :value="undefined">Auto-detect from + prefix</option>
                <option value="US">US</option>
                <option value="CA">CA</option>
                <option value="GB">GB</option>
                <option value="DE">DE</option>
                <option value="FR">FR</option>
              </select>
            </div>
            <div class="control-group checkbox-group">
              <label><input v-model="displayCode" type="checkbox" /> Show country code</label>
              <label><input v-model="displayFlag" type="checkbox" /> Show flag</label>
            </div>
            <div class="result">
              <label for="formatted-phone">Formatted phone</label>
              <output id="formatted-phone" for="display-phone display-country">{{ formattedPhone || '—' }}</output>
            </div>
            <p class="formatting-note">
              Choose a country for numbers without a country code. Complete numbers starting with + can be detected
              automatically; unrecognized values stay unchanged.
            </p>
          </div>
          <ExampleCode v-model:framework="selectedFramework" :code="displayCodeSnippet" label="Display formatting" />
        </div>
      </section>

      <!-- Resources -->
      <div class="resources">
        <h2>📖 Additional Resources</h2>
        <div class="resource-cards">
          <a class="resource-card" target="_blank" rel="noopener noreferrer" :href="Links.coreRepo">
            <h3>GitHub Repository</h3>
            <p>View source code and contribute</p>
          </a>
          <a
            v-for="item in LibItems"
            :key="item.id"
            class="resource-card"
            target="_blank"
            rel="noopener noreferrer"
            :href="DocLinks[item.id]"
          >
            <h3>{{ item.name }} Documentation</h3>
            <p>Learn more about the {{ item.name }} package</p>
          </a>
          <a class="resource-card" target="_blank" rel="noopener noreferrer" :href="Links.contributing">
            <h3>Contributing Guide</h3>
            <p>Help improve the library</p>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPhone } from '@desource/phone-mask-vue/core';
import { getComponentExamples, getPlaygroundCode, type ExampleFramework } from '~/data/component-examples';
import { getCustomExamples, getDisplayCode } from '~/data/custom-examples';

const context7Button = useTemplateRef<Context7ButtonExpose>('context7Button');
const { context7Ready, toggleContext7 } = useContext7([context7Button]);

// Example states
const basicPhone = ref('');
const validationPhone = ref('');
const isValidationValid = ref(false);
const detectPhone = ref('');
const detectedCountryName = ref('');
const sizePhone = ref('');
const themePhone = ref('');
const selectedTheme = ref<'auto' | 'light' | 'dark'>('light');
const actionPhone = ref('');
const copyNotification = ref('');
const disabledPhone = ref('1234567890');
const readonlyPhone = ref('9876543210');

// Form example
const formData = ref({ name: '', email: '', phone: '' });
const formErrors = ref({ phone: '' });

// Directive examples
const directiveBasic = ref('');
const directiveCountry = ref('GB');
const directiveData = ref({ full: '', fullFormatted: '', digits: '' });
const directiveDetectPhone = ref('');
const directiveDetectedCountry = ref<string>('');

// Playground
const playgroundPhone = ref('');
const playgroundCountry = ref<PCountryKey | undefined>(undefined);
const playgroundSize = ref<'compact' | 'normal' | 'large'>('normal');
const playgroundTheme = ref<'auto' | 'light' | 'dark'>('auto');
const playgroundDisabled = ref(false);
const playgroundReadonly = ref(false);
const playgroundShowCopy = ref(true);
const playgroundShowClear = ref(false);
const playgroundDetect = ref(true);
const playgroundValidity = ref(true);

const onPlaygroundDetectClick = () => {
  if (playgroundDetect.value) {
    playgroundCountry.value = undefined;
  }
};

const sizeOptions = ['compact', 'normal', 'large'] as const;
const themeOptions = ['auto', 'light', 'dark'] as const;

// One selection controls every code example on this page.
const selectedFramework = ref<ExampleFramework>('vue');

function forFrameworks<T>(create: (framework: ExampleFramework) => T) {
  return { vue: create('vue'), react: create('react'), svelte: create('svelte'), angular: create('angular') };
}

const allSnippets = forFrameworks((framework) => ({
  ...getComponentExamples(framework),
  ...getCustomExamples(framework)
}));
const snippets = Object.fromEntries(
  (Object.keys(allSnippets.vue) as (keyof typeof allSnippets.vue)[]).map(
    (key) => [key, forFrameworks((framework) => allSnippets[framework][key])] as const
  )
);
const playgroundCode = computed(() =>
  forFrameworks((framework) =>
    getPlaygroundCode(framework, {
      value: playgroundPhone.value,
      country: playgroundCountry.value,
      size: playgroundSize.value,
      theme: playgroundTheme.value,
      disabled: playgroundDisabled.value,
      readonly: playgroundReadonly.value,
      showCopy: playgroundShowCopy.value,
      showClear: playgroundShowClear.value,
      detect: playgroundDetect.value,
      withValidity: playgroundValidity.value
    })
  )
);

// Display formatting
const displayPhone = ref('+12345678888');
const displayCountry = ref<PCountryKey>();
const displayCode = ref(true);
const displayFlag = ref(false);
const displaySamples: { label: string; value: string; country?: PCountryKey }[] = [
  { label: 'With country code', value: '+12345678888' },
  { label: 'Without country code', value: '2345678888', country: 'US' },
  { label: 'Already formatted', value: '+44 740 012 3456', country: 'GB' }
];
const formattedPhone = computed(() =>
  formatPhone(displayPhone.value, displayCountry.value, {
    code: displayCode.value,
    flag: displayFlag.value
  })
);
const displayCodeSnippet = computed(() =>
  forFrameworks((framework) =>
    getDisplayCode(framework, {
      value: displayPhone.value,
      country: displayCountry.value,
      code: displayCode.value,
      flag: displayFlag.value
    })
  )
);

const handleCopy = (value: string) => {
  copyNotification.value = `Copied: ${value}`;
  setTimeout(() => {
    copyNotification.value = '';
  }, 3_000);
};

const handleDetectedCountry = (country: PMaskFull) => {
  detectedCountryName.value = country.name;
};

const handleFormValidation = (isValid: boolean) => {
  formErrors.value.phone = isValid ? '' : 'Please enter a complete phone number';
};

const handleFormSubmit = () => {
  if (!formErrors.value.phone && formData.value.phone) {
    alert('Form submitted successfully!');
  }
};

const handleDirectiveChange = (data: PMaskPhoneNumber) => {
  directiveData.value = data;
};

const handleDirectiveCountryChange = (country: PMaskFull) => {
  directiveDetectedCountry.value = country.name;
};
</script>

<style scoped lang="scss">
.examples-page {
  pointer-events: all;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.page-header p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.page-header__actions {
  display: flex;
  justify-content: center;
  gap: 0.7rem;
}

.link {
  padding: 1rem 2rem;
}

.playground,
.example,
.resources,
.directive-section,
.formatting-section {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.playground h2,
.example h2,
.example h3,
.resources h2,
.directive-section h2,
.formatting-section h2 {
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.playground h2,
.resources h2,
.directive-section h2,
.formatting-section h2 {
  font-size: 1.75rem;
}

.example h2 {
  font-size: 1.5rem;
}

.example h3 {
  font-size: 1.25rem;
}

.playground p,
.example p,
.directive-section > p,
.formatting-section > p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.directive-section,
.formatting-section {
  border: 2px solid rgba(102, 126, 234, 0.5);
}

.directive-section > .example {
  background: none;
  backdrop-filter: none;
}

.directive-section > p code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: #a5b4fc;
  font-weight: 600;
}

.playground-container {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 2rem;
}

.playground-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.control-group input[type='text'],
.control-group select {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
}

.control-group select option {
  background: #1a1a2e;
  color: white;
}

.checkbox-group {
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.9);
}

.playground-preview {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-box {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.example-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
}

.demo {
  min-width: 0;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.size-demos,
.state-demos {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.size-demos > div,
.state-demos > div {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.size-demos label,
.state-demos label,
.size-demos .demo-caption,
.state-demos .demo-caption {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.theme-picker {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.theme-picker label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
}

.demo-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-form input[type='text'],
.demo-form input[type='email'] {
  padding: 0.75rem;
  border: 1px solid #374151;
  border-radius: 8px;
  font-size: 1rem;
  background: #1f2937;
  color: white;
  backdrop-filter: blur(10px);
}

.demo-form input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.demo-form button {
  padding: 0.75rem;
  background: rgba(67, 56, 202, 0.92);
  color: white;
  border: 1px solid rgba(129, 140, 248, 0.55);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  text-align: center;
}

.demo-form button:hover {
  background: rgba(55, 48, 163, 0.98);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(67, 56, 202, 0.45);
}

.custom-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
}

.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.custom-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.8);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.country-select {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
}

.country-select option {
  background: #1a1a2e;
  color: white;
}

.result {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.result.success {
  color: #4ade80;
  font-weight: 600;
}

.result .success {
  color: #4ade80;
  font-weight: 600;
}

.result .error {
  color: #fb7185;
  font-weight: 600;
}

.demo-form .error {
  color: #fb7185;
  font-size: 0.875rem;
}

.formatting-presets {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.formatting-section {
  min-height: 0;
}

.formatting-presets button {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(129, 140, 248, 0.55);
  border-radius: 6px;
  background: rgba(67, 56, 202, 0.92);
  color: white;
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

.formatting-presets button:hover {
  background: rgba(55, 48, 163, 0.98);
}

.formatting-note {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

.formatting-section output {
  overflow-wrap: anywhere;
}

.resource-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.resource-card {
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s;
}

.resource-card:hover {
  transform: translateY(-4px);
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

.resource-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: white;
}

.resource-card p {
  opacity: 0.9;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 880px) {
  .playground-container,
  .example-container {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
@media (max-width: 640px) {
  .playground,
  .example,
  .resources,
  .directive-section,
  .formatting-section {
    padding: 1rem;
  }
}
@media (max-width: 480px) {
  .page-header__actions {
    flex-direction: column;
    gap: 0.55rem;
  }
  .demo {
    padding: 0.5rem;
  }
}
@media (max-width: 320px) {
  .theme-picker {
    font-size: 0.75rem;
  }
}
</style>
