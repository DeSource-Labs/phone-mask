<template>
  <div class="examples-page">
    <div class="container">
      <header class="page-header">
        <h1>Interactive Examples</h1>
        <p>Explore real-world use cases and copy-paste code snippets</p>
        <LiquidGlass actionable width="200">
          <NuxtLink class="link" to="/">← Back to Home</NuxtLink>
        </LiquidGlass>
      </header>

      <!-- Playground -->
      <div class="playground">
        <h2>🎮 Live Playground</h2>
        <p>Adjust props in real-time and see the results instantly</p>

        <div class="playground-container">
          <div class="playground-controls">
            <div class="control-group">
              <label>Country Code</label>
              <select v-model="playgroundCountry">
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
              <label>Size</label>
              <select v-model="playgroundSize">
                <option v-for="size in sizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>

            <div class="control-group">
              <label>Theme</label>
              <select v-model="playgroundTheme">
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

            <div class="code-box">
              <button class="copy-btn" @click="copyCode('playground')">
                {{ copiedSnippet === 'playground' ? '✓ Copied!' : '📋 Copy' }}
              </button>
              <pre><code>{{ playgroundCode }}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Example 1: Basic Usage -->
      <div class="example">
        <h2>1. Basic Usage</h2>
        <p>Simple phone input with country selector</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput v-model="basicPhone" />
            <div class="result">
              <span>Phone: {{ basicPhone || '—' }}</span>
            </div>
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('basic')">
              {{ copiedSnippet === 'basic' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.basic }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Example 2: Validation -->
      <div class="example">
        <h2>2. Phone Validation</h2>
        <p>Real-time validation state tracking</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput v-model="validationPhone" @validation-change="isValidationValid = $event" />
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

          <div class="code">
            <button class="copy-btn" @click="copyCode('validation')">
              {{ copiedSnippet === 'validation' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.validation }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Example 3: Auto-detect Country -->
      <div class="example">
        <h2>3. Auto Country Detection</h2>
        <p>Automatically detect country from IP or browser locale</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput v-model="detectPhone" detect @country-change="handleDetectedCountry" />
            <div class="result">
              <span>Detected Country: {{ detectedCountryName || 'Auto-detecting...' }}</span>
            </div>
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('detection')">
              {{ copiedSnippet === 'detection' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.detection }}</code></pre>
          </div>
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
                <label>Compact</label>
                <PhoneInput v-model="sizePhone" size="compact" />
              </div>
              <div>
                <label>Normal (default)</label>
                <PhoneInput v-model="sizePhone" size="normal" />
              </div>
              <div>
                <label>Large</label>
                <PhoneInput v-model="sizePhone" size="large" />
              </div>
            </div>
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('sizes')">
              {{ copiedSnippet === 'sizes' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.sizes }}</code></pre>
          </div>
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
            <PhoneInput v-model="themePhone" :theme="selectedTheme" />
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('themes')">
              {{ copiedSnippet === 'themes' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.themes }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Example 6: Actions (Copy & Clear) -->
      <div class="example">
        <h2>6. Copy & Clear Actions</h2>
        <p>Built-in copy and clear button functionality</p>

        <div class="example-container">
          <div class="demo">
            <PhoneInput
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

          <div class="code">
            <button class="copy-btn" @click="copyCode('actions')">
              {{ copiedSnippet === 'actions' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.actions }}</code></pre>
          </div>
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
                <label>Disabled</label>
                <PhoneInput v-model="disabledPhone" disabled />
              </div>
              <div>
                <label>Readonly</label>
                <PhoneInput v-model="readonlyPhone" readonly />
              </div>
            </div>
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('disabledAndReadonly')">
              {{ copiedSnippet === 'disabledAndReadonly' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.disabledAndReadonly }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Example 8: Form Integration -->
      <div class="example">
        <h2>8. Form Integration</h2>
        <p>Use in forms with validation</p>

        <div class="example-container">
          <div class="demo">
            <form class="demo-form" @submit.prevent="handleFormSubmit">
              <input v-model="formData.name" type="text" placeholder="Full Name" />
              <input v-model="formData.email" type="email" placeholder="Email Address" />
              <PhoneInput v-model="formData.phone" @validation-change="handleFormValidation" />
              <span v-if="formErrors.phone" class="error">{{ formErrors.phone }}</span>
              <button type="submit">Submit</button>
            </form>
            <div class="result">
              <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
            </div>
          </div>

          <div class="code">
            <button class="copy-btn" @click="copyCode('form')">
              {{ copiedSnippet === 'form' ? '✓ Copied!' : '📋 Copy' }}
            </button>
            <pre><code>{{ snippets.form }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Directive Examples Section -->
      <div class="directive-section">
        <h2>🎯 Vue Directive Examples</h2>
        <p>Use <code>v-phone-mask</code> directive for custom inputs</p>

        <!-- Directive Example 1: Basic -->
        <div class="example">
          <h3>9. Basic Directive Usage</h3>
          <p>Apply phone masking to any input element</p>

          <div class="example-container">
            <div class="demo">
              <input v-model="directiveBasic" v-phone-mask class="custom-input" placeholder="Enter phone number" />
              <div class="result">
                <span>Value: {{ directiveBasic || '—' }}</span>
              </div>
            </div>

            <div class="code">
              <button class="copy-btn" @click="copyCode('directiveBasic')">
                {{ copiedSnippet === 'directiveBasic' ? '✓ Copied!' : '📋 Copy' }}
              </button>
              <pre><code>{{ snippets.directiveBasic }}</code></pre>
            </div>
          </div>
        </div>

        <!-- Directive Example 2: With Options -->
        <div class="example">
          <h3>10. Directive with Options</h3>
          <p>Configure country and handle change events</p>

          <div class="example-container">
            <div class="demo">
              <select v-model="directiveCountry" class="country-select">
                <option value="US">US</option>
                <option value="GB">GB</option>
                <option value="DE">DE</option>
                <option value="FR">FR</option>
              </select>
              <input
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

            <div class="code">
              <button class="copy-btn" @click="copyCode('directiveOptions')">
                {{ copiedSnippet === 'directiveOptions' ? '✓ Copied!' : '📋 Copy' }}
              </button>
              <pre><code>{{ snippets.directiveOptions }}</code></pre>
            </div>
          </div>
        </div>

        <!-- Directive Example 3: Auto-detect -->
        <div class="example">
          <h3>11. Directive with Auto-detect</h3>
          <p>Automatically detect country from IP/locale</p>

          <div class="example-container">
            <div class="demo">
              <input
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

            <div class="code">
              <button class="copy-btn" @click="copyCode('directiveDetect')">
                {{ copiedSnippet === 'directiveDetect' ? '✓ Copied!' : '📋 Copy' }}
              </button>
              <pre><code>{{ snippets.directiveDetect }}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Resources -->
      <div class="resources">
        <h2>📖 Additional Resources</h2>
        <div class="resource-cards">
          <a class="resource-card" target="_blank" rel="noopener noreferrer" :href="Links.coreRepo">
            <h3>GitHub Repository</h3>
            <p>View source code and contribute</p>
          </a>
          <a class="resource-card" target="_blank" rel="noopener noreferrer" :href="DocLinks.vue">
            <h3>Vue Documentation</h3>
            <p>Learn more about the Vue package</p>
          </a>
          <a class="resource-card" target="_blank" rel="noopener noreferrer" :href="DocLinks.nuxt">
            <h3>Nuxt Documentation</h3>
            <p>Learn more about the Nuxt package</p>
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
/* eslint-disable no-useless-escape */
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

// Code snippets
const snippets: Record<string, string> = {
  basic: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
<\/script>

<template>
  <PhoneInput v-model="phone" />
</template>`,

  validation: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
const isValid = ref(false)

function onValidation(valid: boolean) {
  isValid.value = valid
}
<\/script>

<template>
  <PhoneInput
    v-model="phone"
    @validation-change="onValidation"
  />
  <p v-if="!isValid && phone" class="error">
    Please enter a complete phone number
  </p>
</template>`,

  detection: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
const countryName = ref('')

function onCountry(country: PMaskFull) {
  countryName.value = country.name
}
<\/script>

<template>
  <PhoneInput
    v-model="phone"
    detect
    @country-change="onCountry"
  />
  <p>Detected: {{ countryName }}</p>
</template>`,

  sizes: `<template>
  <!-- Compact -->\n  <PhoneInput v-model="phone" size="compact" />

  <!-- Normal (default) -->\n  <PhoneInput v-model="phone" size="normal" />

  <!-- Large -->\n  <PhoneInput v-model="phone" size="large" />
</template>`,

  themes: `<template>
  <!-- Auto (system preference) -->\n  <PhoneInput v-model="phone" theme="auto" />

  <!-- Light -->\n  <PhoneInput v-model="phone" theme="light" />

  <!-- Dark -->\n  <PhoneInput v-model="phone" theme="dark" />
</template>`,

  actions: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')

function handleCopy(value: string) {
  console.log('Copied:', value)
}

function handleClear() {
  console.log('Input cleared')
}
<\/script>

<template>
  <PhoneInput
    v-model="phone"
    show-copy
    show-clear
    @copy="handleCopy"
    @clear="handleClear"
  />
</template>`,

  disabledAndReadonly: `<script setup lang="ts">
import { ref } from 'vue'
const disabledPhone = ref('1234567890')
const readonlyPhone = ref('9876543210')
<\/script>

<template>
  <PhoneInput v-model="disabledPhone" disabled />
  <PhoneInput v-model="readonlyPhone" readonly />
</template>`,

  form: `<script setup lang="ts">
import { ref } from 'vue'

const formData = ref({
  name: '',
  email: '',
  phone: ''
})

const formErrors = ref({ phone: '' })

function onValidation(isValid: boolean) {
  formErrors.value.phone = isValid
    ? ''
    : 'Invalid phone'
}

function handleSubmit() {
  if (!formErrors.value.phone) {
    console.log(formData.value)
  }
}
<\/script>

<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="formData.name"
      placeholder="Name"
    />
    <input
      v-model="formData.email"
      type="email"
    />
    <PhoneInput
      v-model="formData.phone"
      @validation-change="onValidation"
    />
    <span v-if="formErrors.phone" class="error">
      {{ formErrors.phone }}
    </span>

    <button type="submit">Submit</button>
  </form>
</template>`,

  directiveBasic: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
<\/script>

<template>
  <input v-model="phone" v-phone-mask />
</template>`,

  directiveOptions: `<script setup lang="ts">
import { ref } from 'vue'

const country = ref('GB')
const phoneData = ref<PMaskPhoneNumber>({
  full: '',
  formatted: '',
  digits: ''
})

function onChange(data: PMaskPhoneNumber) {
  phoneData.value = data
}
<\/script>

<template>
  <input
    v-phone-mask="{
      country: country,
      onChange
    }"
  />
  <p>Full: {{ phoneData.full }}</p>
  <p>Formatted: {{ phoneData.formatted }}</p>
  <p>Digits: {{ phoneData.digits }}</p>
</template>`,

  directiveDetect: `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
const detected = ref('')

function onCountryChange(country: PMaskFull) {
  detected.value = country.name
}
<\/script>

<template>
  <input
    v-model="phone"
    v-phone-mask="{
      detect: true,
      onCountryChange,
    }"
  />
  <p v-if="detected">Country: {{ detected }}</p>
</template>`
};

const copiedSnippet = ref('');

const copyCode = async (key: string) => {
  try {
    const snippet = snippets[key];
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    copiedSnippet.value = key;
    setTimeout(() => {
      copiedSnippet.value = '';
    }, 2_000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const playgroundCode = computed(() => {
  const props = [];

  if (playgroundCountry.value) props.push(`country="${playgroundCountry.value}"`);
  if (playgroundSize.value !== 'normal') props.push(`size="${playgroundSize.value}"`);
  if (playgroundTheme.value !== 'auto') props.push(`theme="${playgroundTheme.value}"`);
  if (playgroundDisabled.value) props.push('disabled');
  if (playgroundReadonly.value) props.push('readonly');
  if (!playgroundShowCopy.value) props.push(':show-copy="false"');
  if (playgroundShowClear.value) props.push('show-clear');
  if (!playgroundValidity.value) props.push(':with-validity="false"');
  if (playgroundDetect.value) props.push('detect');

  return `<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('${playgroundPhone.value}')
<\/script>

<template>
  <PhoneInput
    v-model="phone"${props.length > 0 ? '\n    ' + props.join('\n    ') : ''}
  />
</template>`;
});

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

.link {
  padding: 1rem 2rem;
}

.playground,
.example,
.resources,
.directive-section {
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
.directive-section h2 {
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.playground h2,
.resources h2,
.directive-section h2 {
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
.directive-section > p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.directive-section {
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
  grid-template-columns: 300px 1fr;
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
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.demo {
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
.state-demos label {
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
  background: rgba(102, 126, 234, 0.8);
  color: white;
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  text-align: center;
}

.demo-form button:hover {
  background: rgba(102, 126, 234, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
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

.code {
  position: relative;
}

.code-box {
  position: relative;
}

.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.8);
  color: white;
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.copy-btn:hover {
  background: rgba(102, 126, 234, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.code pre,
.code-box pre {
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  padding: 1.5rem;
  padding-top: 3rem;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
  user-select: text;
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
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
@media (max-width: 640px) {
  .code pre,
  .code-box pre {
    padding: 1rem;
    padding-top: 2.5rem;
    font-size: 0.75rem;
  }
  .playground,
  .example,
  .resources,
  .directive-section {
    padding: 1rem;
  }
}
@media (max-width: 480px) {
  .code pre,
  .code-box pre {
    text-wrap: wrap;
    padding: 0.5rem;
    padding-top: 2.5rem;
    font-size: 0.625rem;
  }
  .demo {
    padding: 0.5rem;
  }
}
</style>
