export type ExampleFramework = 'vue' | 'react' | 'svelte' | 'angular';

export interface PlaygroundOptions {
  value: string;
  country?: string;
  size: 'compact' | 'normal' | 'large';
  theme: 'auto' | 'light' | 'dark';
  disabled: boolean;
  readonly: boolean;
  showCopy: boolean;
  showClear: boolean;
  detect: boolean;
  withValidity: boolean;
}

const indent = (source: string, spaces: number) => source.replace(/^./gm, ' '.repeat(spaces) + '$&');

function vue(template: string, state = "const phone = ref('');") {
  return `<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css';

${state}
</script>

<template>
${indent(template, 2)}
</template>`;
}

function react(template: string, state = "const [phone, setPhone] = useState('');") {
  return `'use client';

import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/assets/lib.css';

export default function Example() {
${indent(state, 2)}

  return (
    <>
${indent(template, 6)}
    </>
  );
}`;
}

function svelte(template: string, state = "let phone = $state('');") {
  return `<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import '@desource/phone-mask-svelte/assets/lib.css';

${indent(state, 2)}
</script>

${template}`;
}

function angular(template: string, state = "readonly phone = signal('');") {
  return `// Add to src/styles.css:
// @import '@desource/phone-mask-angular/assets/lib.css';

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PhoneInputComponent } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [PhoneInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
${indent(template, 4)}
  \`
})
export class Example {
${indent(state, 2)}
}`;
}

function vueExamples() {
  return {
    basic: vue(`<PhoneInput v-model="phone" />
<p>Phone: {{ phone || '—' }}</p>`),
    validation: vue(
      `<PhoneInput v-model="phone" @validation-change="isValid = $event" />
<p>{{ isValid ? 'Valid phone number' : phone ? 'Incomplete number' : 'Enter a phone number' }}</p>`,
      "const phone = ref('');\nconst isValid = ref(false);"
    ),
    detection: vue(
      `<PhoneInput v-model="phone" detect @country-change="countryName = $event.name" />
<p>Detected Country: {{ countryName || 'Auto-detecting...' }}</p>`,
      "const phone = ref('');\nconst countryName = ref('');"
    ),
    sizes: vue(`<PhoneInput v-model="phone" size="compact" />
<PhoneInput v-model="phone" size="normal" />
<PhoneInput v-model="phone" size="large" />`),
    themes: vue(
      `<label v-for="theme in themes" :key="theme">
  <input v-model="selectedTheme" type="radio" name="theme" :value="theme" />
  {{ theme }}
</label>
<PhoneInput v-model="phone" :theme="selectedTheme" />`,
      `const phone = ref('');
const themes = ['auto', 'light', 'dark'] as const;
const selectedTheme = ref<(typeof themes)[number]>('light');`
    ),
    actions: vue(
      `<PhoneInput
  v-model="phone"
  show-copy
  show-clear
  @copy="notification = 'Copied: ' + $event"
  @clear="notification = 'Input cleared'"
/>
<p role="status">{{ notification }}</p>`,
      "const phone = ref('');\nconst notification = ref('');"
    ),
    disabledAndReadonly: vue(
      `<PhoneInput v-model="disabledPhone" disabled />
<PhoneInput v-model="readonlyPhone" readonly />`,
      "const disabledPhone = ref('1234567890');\nconst readonlyPhone = ref('9876543210');"
    ),
    form: vue(
      `<form @submit.prevent="submit">
  <input v-model="form.name" name="name" autocomplete="name" aria-label="Full Name" placeholder="Full Name" />
  <input v-model="form.email" name="email" type="email" autocomplete="email" aria-label="Email Address" placeholder="Email Address" />
  <PhoneInput v-model="form.phone" name="phone" @validation-change="isValid = $event" />
  <p v-if="attempted && !isValid">Please enter a complete phone number</p>
  <button type="submit">Submit</button>
</form>`,
      `const form = ref({ name: '', email: '', phone: '' });
const isValid = ref(false);
const attempted = ref(false);

function submit() {
  attempted.value = true;
  if (isValid.value) console.log(form.value);
}`
    )
  };
}

function reactExamples() {
  return {
    basic: react(`<PhoneInput value={phone} onChange={setPhone} />
<p>Phone: {phone || '—'}</p>`),
    validation: react(
      `<PhoneInput value={phone} onChange={setPhone} onValidationChange={setIsValid} />
<p>{isValid ? 'Valid phone number' : phone ? 'Incomplete number' : 'Enter a phone number'}</p>`,
      "const [phone, setPhone] = useState('');\nconst [isValid, setIsValid] = useState(false);"
    ),
    detection: react(
      `<PhoneInput value={phone} onChange={setPhone} detect onCountryChange={(country) => setCountryName(country.name)} />
<p>Detected Country: {countryName || 'Auto-detecting...'}</p>`,
      "const [phone, setPhone] = useState('');\nconst [countryName, setCountryName] = useState('');"
    ),
    sizes: react(`<PhoneInput value={phone} onChange={setPhone} size="compact" />
<PhoneInput value={phone} onChange={setPhone} size="normal" />
<PhoneInput value={phone} onChange={setPhone} size="large" />`),
    themes: react(
      `{themes.map((theme) => (
  <label key={theme}>
    <input type="radio" name="theme" checked={selectedTheme === theme} onChange={() => setSelectedTheme(theme)} />
    {theme}
  </label>
))}
<PhoneInput value={phone} onChange={setPhone} theme={selectedTheme} />`,
      `const [phone, setPhone] = useState('');
const themes = ['auto', 'light', 'dark'] as const;
const [selectedTheme, setSelectedTheme] = useState<(typeof themes)[number]>('light');`
    ),
    actions: react(
      `<PhoneInput
  value={phone}
  onChange={setPhone}
  showCopy
  showClear
  onCopy={(value) => setNotification('Copied: ' + value)}
  onClear={() => setNotification('Input cleared')}
/>
<p role="status">{notification}</p>`,
      "const [phone, setPhone] = useState('');\nconst [notification, setNotification] = useState('');"
    ),
    disabledAndReadonly: react(
      `<PhoneInput value={disabledPhone} onChange={setDisabledPhone} disabled />
<PhoneInput value={readonlyPhone} onChange={setReadonlyPhone} readonly />`,
      "const [disabledPhone, setDisabledPhone] = useState('1234567890');\nconst [readonlyPhone, setReadonlyPhone] = useState('9876543210');"
    ),
    form: react(
      `<form onSubmit={(event) => {
  event.preventDefault();
  setAttempted(true);
  if (isValid) console.log(form);
}}>
  <input name="name" autoComplete="name" aria-label="Full Name" placeholder="Full Name" value={form.name}
    onChange={(event) => setForm({ ...form, name: event.target.value })} />
  <input name="email" type="email" autoComplete="email" aria-label="Email Address" placeholder="Email Address" value={form.email}
    onChange={(event) => setForm({ ...form, email: event.target.value })} />
  <PhoneInput name="phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))}
    onValidationChange={setIsValid} />
  {attempted && !isValid && <p>Please enter a complete phone number</p>}
  <button type="submit">Submit</button>
</form>`,
      `const [form, setForm] = useState({ name: '', email: '', phone: '' });
const [isValid, setIsValid] = useState(false);
const [attempted, setAttempted] = useState(false);`
    )
  };
}

function svelteExamples() {
  return {
    basic: svelte(`<PhoneInput bind:value={phone} />
<p>Phone: {phone || '—'}</p>`),
    validation: svelte(
      `<PhoneInput bind:value={phone} onvalidationchange={(valid) => (isValid = valid)} />
<p>{isValid ? 'Valid phone number' : phone ? 'Incomplete number' : 'Enter a phone number'}</p>`,
      "let phone = $state('');\nlet isValid = $state(false);"
    ),
    detection: svelte(
      `<PhoneInput bind:value={phone} detect oncountrychange={(country) => (countryName = country.name)} />
<p>Detected Country: {countryName || 'Auto-detecting...'}</p>`,
      "let phone = $state('');\nlet countryName = $state('');"
    ),
    sizes: svelte(`<PhoneInput bind:value={phone} size="compact" />
<PhoneInput bind:value={phone} size="normal" />
<PhoneInput bind:value={phone} size="large" />`),
    themes: svelte(
      `{#each themes as theme (theme)}
  <label>
    <input type="radio" name="theme" bind:group={selectedTheme} value={theme} />
    {theme}
  </label>
{/each}
<PhoneInput bind:value={phone} theme={selectedTheme} />`,
      `let phone = $state('');
const themes = ['auto', 'light', 'dark'] as const;
let selectedTheme = $state<(typeof themes)[number]>('light');`
    ),
    actions: svelte(
      `<PhoneInput
  bind:value={phone}
  showCopy
  showClear
  oncopy={(value) => (notification = 'Copied: ' + value)}
  onclear={() => (notification = 'Input cleared')}
/>
<p role="status">{notification}</p>`,
      "let phone = $state('');\nlet notification = $state('');"
    ),
    disabledAndReadonly: svelte(
      `<PhoneInput bind:value={disabledPhone} disabled />
<PhoneInput bind:value={readonlyPhone} readonly />`,
      "let disabledPhone = $state('1234567890');\nlet readonlyPhone = $state('9876543210');"
    ),
    form: svelte(
      `<form onsubmit={submit}>
  <input bind:value={form.name} name="name" autocomplete="name" aria-label="Full Name" placeholder="Full Name" />
  <input bind:value={form.email} name="email" type="email" autocomplete="email" aria-label="Email Address" placeholder="Email Address" />
  <PhoneInput bind:value={form.phone} name="phone" onvalidationchange={(valid) => (isValid = valid)} />
  {#if attempted && !isValid}<p>Please enter a complete phone number</p>{/if}
  <button type="submit">Submit</button>
</form>`,
      `let form = $state({ name: '', email: '', phone: '' });
let isValid = $state(false);
let attempted = $state(false);

function submit(event: SubmitEvent) {
  event.preventDefault();
  attempted = true;
  if (isValid) console.log($state.snapshot(form));
}`
    )
  };
}

function angularExamples() {
  return {
    basic: angular(`<phone-input [value]="phone()" (valueChange)="phone.set($event)" />
<p>Phone: {{ phone() || '—' }}</p>`),
    validation: angular(
      `<phone-input [value]="phone()" (valueChange)="phone.set($event)" (validationChange)="isValid.set($event)" />
<p>{{ isValid() ? 'Valid phone number' : phone() ? 'Incomplete number' : 'Enter a phone number' }}</p>`,
      "readonly phone = signal('');\nreadonly isValid = signal(false);"
    ),
    detection: angular(
      `<phone-input [value]="phone()" (valueChange)="phone.set($event)" detect (countryChange)="countryName.set($event.name)" />
<p>Detected Country: {{ countryName() || 'Auto-detecting...' }}</p>`,
      "readonly phone = signal('');\nreadonly countryName = signal('');"
    ),
    sizes: angular(`<phone-input [value]="phone()" (valueChange)="phone.set($event)" size="compact" />
<phone-input [value]="phone()" (valueChange)="phone.set($event)" size="normal" />
<phone-input [value]="phone()" (valueChange)="phone.set($event)" size="large" />`),
    themes: angular(
      `@for (theme of themes; track theme) {
  <label>
    <input type="radio" name="theme" [checked]="selectedTheme() === theme" (change)="selectedTheme.set(theme)" />
    {{ theme }}
  </label>
}
<phone-input [value]="phone()" (valueChange)="phone.set($event)" [theme]="selectedTheme()" />`,
      `readonly phone = signal('');
readonly themes = ['auto', 'light', 'dark'] as const;
readonly selectedTheme = signal<(typeof this.themes)[number]>('light');`
    ),
    actions: angular(
      `<phone-input
  [value]="phone()"
  (valueChange)="phone.set($event)"
  showCopy
  showClear
  (copied)="notification.set('Copied: ' + $event)"
  (cleared)="notification.set('Input cleared')"
/>
<p role="status">{{ notification() }}</p>`,
      "readonly phone = signal('');\nreadonly notification = signal('');"
    ),
    disabledAndReadonly: angular(
      `<phone-input [value]="disabledPhone()" (valueChange)="disabledPhone.set($event)" disabled />
<phone-input [value]="readonlyPhone()" (valueChange)="readonlyPhone.set($event)" readonly />`,
      "readonly disabledPhone = signal('1234567890');\nreadonly readonlyPhone = signal('9876543210');"
    ),
    form: angular(
      `<form (submit)="submit($event)">
  <input #nameInput name="name" autocomplete="name" aria-label="Full Name" placeholder="Full Name"
    [value]="name()" (input)="name.set(nameInput.value)" />
  <input #emailInput name="email" type="email" autocomplete="email" aria-label="Email Address" placeholder="Email Address"
    [value]="email()" (input)="email.set(emailInput.value)" />
  <phone-input name="phone" [value]="phone()" (valueChange)="phone.set($event)" (validationChange)="isValid.set($event)" />
  @if (attempted() && !isValid()) { <p>Please enter a complete phone number</p> }
  <button type="submit">Submit</button>
</form>`,
      `readonly name = signal('');
readonly email = signal('');
readonly phone = signal('');
readonly isValid = signal(false);
readonly attempted = signal(false);

submit(event: Event) {
  event.preventDefault();
  this.attempted.set(true);
  if (this.isValid()) {
    console.log({ name: this.name(), email: this.email(), phone: this.phone() });
  }
}`
    )
  };
}

export function getComponentExamples(framework: ExampleFramework) {
  switch (framework) {
    case 'vue':
      return vueExamples();
    case 'react':
      return reactExamples();
    case 'svelte':
      return svelteExamples();
    case 'angular':
      return angularExamples();
  }
}

export function getPlaygroundCode(framework: ExampleFramework, options: PlaygroundOptions) {
  // Escaping '<' keeps a pasted value from closing a Vue or Svelte script block.
  const value = JSON.stringify(options.value).replaceAll('<', '\\u003c');
  const attributes = [
    ...(options.country ? [['country', options.country] as const] : []),
    ['size', options.size],
    ['theme', options.theme],
    ['disabled', options.disabled],
    ['readonly', options.readonly],
    ['showCopy', options.showCopy],
    ['showClear', options.showClear],
    ['detect', options.detect],
    ['withValidity', options.withValidity]
  ] as const;
  const props = attributes
    .map(([name, setting]) => {
      if (typeof setting === 'string') {
        const escaped = setting.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
        return `${name}="${escaped}"`;
      }
      if (framework === 'vue') return `:${name.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}="${setting}"`;
      if (framework === 'angular') return `[${name}]="${setting}"`;
      return `${name}={${setting}}`;
    })
    .join('\n  ');

  switch (framework) {
    case 'vue':
      return vue(`<PhoneInput\n  v-model="phone"\n  ${props}\n/>`, `const phone = ref(${value});`);
    case 'react':
      return react(
        `<PhoneInput\n  value={phone}\n  onChange={setPhone}\n  ${props}\n/>`,
        `const [phone, setPhone] = useState(${value});`
      );
    case 'svelte':
      return svelte(`<PhoneInput\n  bind:value={phone}\n  ${props}\n/>`, `let phone = $state(${value});`);
    case 'angular':
      return angular(
        `<phone-input\n  [value]="phone()"\n  (valueChange)="phone.set($event)"\n  ${props}\n/>`,
        `readonly phone = signal(${value});`
      );
  }
}
