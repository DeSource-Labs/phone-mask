import type { ExampleFramework } from './component-examples';

interface CustomExamples {
  directiveBasic: string;
  directiveOptions: string;
  directiveDetect: string;
}

export interface DisplayOptions {
  value: string;
  country?: string;
  code: boolean;
  flag: boolean;
}

const customExamples: Record<ExampleFramework, CustomExamples> = {
  vue: {
    directiveBasic: `<script setup lang="ts">
import { ref } from 'vue';
import { vPhoneMask, type PMaskPhoneNumber } from '@desource/phone-mask-vue';

const digits = ref('');
const onChange = (phone: PMaskPhoneNumber) => { digits.value = phone.digits; };
</script>

<template>
  <label for="phone">Phone number</label>
  <input id="phone" type="tel" autocomplete="tel"
    v-phone-mask="{ country: 'US', onChange }" />
  <p>Digits: {{ digits }}</p>
</template>`,
    directiveOptions: `<script setup lang="ts">
import { ref } from 'vue';
import { vPhoneMask, type PMaskPhoneNumber } from '@desource/phone-mask-vue';

const country = ref('GB');
const phoneData = ref<PMaskPhoneNumber>({ digits: '', full: '', fullFormatted: '' });
const onChange = (phone: PMaskPhoneNumber) => { phoneData.value = phone; };
</script>

<template>
  <label for="country">Country</label>
  <select id="country" v-model="country">
    <option value="US">United States</option>
    <option value="GB">United Kingdom</option>
    <option value="DE">Germany</option>
  </select>
  <label for="phone">Phone number</label>
  <input id="phone" type="tel" autocomplete="tel"
    v-phone-mask="{ country, onChange }" />
  <p>Full: {{ phoneData.full }}</p>
  <p>Formatted: {{ phoneData.fullFormatted }}</p>
  <p>Digits: {{ phoneData.digits }}</p>
</template>`,
    directiveDetect: `<script setup lang="ts">
import { ref } from 'vue';
import { vPhoneMask, type PMaskFull } from '@desource/phone-mask-vue';

const countryName = ref('');
const onCountryChange = (country: PMaskFull) => { countryName.value = country.name; };
</script>

<template>
  <label for="phone">Phone number</label>
  <input id="phone" type="tel" autocomplete="tel"
    v-phone-mask="{ detect: true, onCountryChange }" />
  <p>Country: {{ countryName || 'Detecting…' }}</p>
</template>`
  },
  react: {
    directiveBasic: `'use client';

import { useState } from 'react';
import { usePhoneMask } from '@desource/phone-mask-react';

export default function CustomPhone() {
  const [digits, setDigits] = useState('');
  const { ref } = usePhoneMask({ value: digits, onChange: setDigits, country: 'US' });

  return (
    <>
      <label htmlFor="phone">Phone number</label>
      <input id="phone" ref={ref} type="tel" autoComplete="tel" />
      <p>Digits: {digits}</p>
    </>
  );
}`,
    directiveOptions: `'use client';

import { useState } from 'react';
import { usePhoneMask, type PhoneNumber } from '@desource/phone-mask-react';

export default function CustomPhone() {
  const [digits, setDigits] = useState('');
  const [country, setCountry] = useState('GB');
  const [phoneData, setPhoneData] = useState<PhoneNumber>({
    digits: '', full: '', fullFormatted: ''
  });
  const { ref } = usePhoneMask({
    value: digits, onChange: setDigits, country, onPhoneChange: setPhoneData
  });

  return (
    <>
      <label htmlFor="country">Country</label>
      <select id="country" value={country} onChange={(event) => setCountry(event.target.value)}>
        <option value="US">United States</option>
        <option value="GB">United Kingdom</option>
        <option value="DE">Germany</option>
      </select>
      <label htmlFor="phone">Phone number</label>
      <input id="phone" ref={ref} type="tel" autoComplete="tel" />
      <p>Full: {phoneData.full}</p>
      <p>Formatted: {phoneData.fullFormatted}</p>
      <p>Digits: {phoneData.digits}</p>
    </>
  );
}`,
    directiveDetect: `'use client';

import { useState } from 'react';
import { usePhoneMask } from '@desource/phone-mask-react';

export default function CustomPhone() {
  const [digits, setDigits] = useState('');
  const { ref, country } = usePhoneMask({
    value: digits, onChange: setDigits, detect: true
  });

  return (
    <>
      <label htmlFor="phone">Phone number</label>
      <input id="phone" ref={ref} type="tel" autoComplete="tel" />
      <p>Country: {country.name}</p>
    </>
  );
}`
  },
  svelte: {
    directiveBasic: `<script lang="ts">
  import {
    phoneMaskAction, phoneMaskAttachment, type PMaskPhoneNumber
  } from '@desource/phone-mask-svelte';

  let actionDigits = $state('');
  let attachmentDigits = $state('');
  const onActionChange = (phone: PMaskPhoneNumber) => { actionDigits = phone.digits; };
  const onAttachmentChange = (phone: PMaskPhoneNumber) => { attachmentDigits = phone.digits; };
</script>

<!-- Action alternative: all Svelte 5 versions. -->
<label for="action-phone">Phone number (action)</label>
<input id="action-phone" type="tel" autocomplete="tel"
  use:phoneMaskAction={{ country: 'US', onChange: onActionChange }} />
<p>Digits: {actionDigits}</p>

<!-- Attachment alternative: Svelte 5.29+. -->
<label for="attachment-phone">Phone number (attachment)</label>
<input id="attachment-phone" type="tel" autocomplete="tel"
  {@attach phoneMaskAttachment({ country: 'US', onChange: onAttachmentChange })} />
<p>Digits: {attachmentDigits}</p>`,
    directiveOptions: `<script lang="ts">
  import {
    phoneMaskAction, phoneMaskAttachment, type PMaskPhoneNumber
  } from '@desource/phone-mask-svelte';

  let country = $state('GB');
  let actionData = $state<PMaskPhoneNumber>({ digits: '', full: '', fullFormatted: '' });
  let attachmentData = $state<PMaskPhoneNumber>({ digits: '', full: '', fullFormatted: '' });
  const onActionChange = (phone: PMaskPhoneNumber) => { actionData = phone; };
  const onAttachmentChange = (phone: PMaskPhoneNumber) => { attachmentData = phone; };
</script>

<label for="country">Country</label>
<select id="country" bind:value={country}>
  <option value="US">United States</option>
  <option value="GB">United Kingdom</option>
  <option value="DE">Germany</option>
</select>

<!-- Action alternative: all Svelte 5 versions. -->
<label for="action-phone">Phone number (action)</label>
<input id="action-phone" type="tel" autocomplete="tel"
  use:phoneMaskAction={{ country, onChange: onActionChange }} />
<p>Full: {actionData.full}</p>
<p>Formatted: {actionData.fullFormatted}</p>
<p>Digits: {actionData.digits}</p>

<!-- Attachment alternative: Svelte 5.29+. -->
<label for="attachment-phone">Phone number (attachment)</label>
<input id="attachment-phone" type="tel" autocomplete="tel"
  {@attach phoneMaskAttachment({ country, onChange: onAttachmentChange })} />
<p>Full: {attachmentData.full}</p>
<p>Formatted: {attachmentData.fullFormatted}</p>
<p>Digits: {attachmentData.digits}</p>`,
    directiveDetect: `<script lang="ts">
  import {
    phoneMaskAction, phoneMaskAttachment, type PMaskFull
  } from '@desource/phone-mask-svelte';

  let actionCountry = $state('');
  let attachmentCountry = $state('');
  const onActionCountry = (country: PMaskFull) => { actionCountry = country.name; };
  const onAttachmentCountry = (country: PMaskFull) => { attachmentCountry = country.name; };
</script>

<!-- Action alternative: all Svelte 5 versions. -->
<label for="action-phone">Phone number (action)</label>
<input id="action-phone" type="tel" autocomplete="tel"
  use:phoneMaskAction={{ detect: true, onCountryChange: onActionCountry }} />
<p>Country: {actionCountry || 'Detecting…'}</p>

<!-- Attachment alternative: Svelte 5.29+. -->
<label for="attachment-phone">Phone number (attachment)</label>
<input id="attachment-phone" type="tel" autocomplete="tel"
  {@attach phoneMaskAttachment({ detect: true, onCountryChange: onAttachmentCountry })} />
<p>Country: {attachmentCountry || 'Detecting…'}</p>`
  },
  angular: {
    directiveBasic: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PhoneMaskDirective } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-custom-phone',
  standalone: true,
  imports: [PhoneMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <label for="phone">Phone number</label>
    <input id="phone" type="tel" autocomplete="tel" phoneMask="US" [(value)]="digits" />
    <p>Digits: {{ digits() }}</p>
  \`
})
export class CustomPhone {
  readonly digits = signal('');
}`,
    directiveOptions: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PhoneMaskDirective, type PhoneNumber } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-custom-phone',
  standalone: true,
  imports: [PhoneMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <label for="country">Country</label>
    <select id="country" #countrySelect [value]="country()"
      (change)="country.set(countrySelect.value)">
      <option value="US">United States</option>
      <option value="GB">United Kingdom</option>
      <option value="DE">Germany</option>
    </select>
    <label for="phone">Phone number</label>
    <input id="phone" type="tel" autocomplete="tel"
      [phoneMask]="{ country: country(), onChange }" />
    <p>Full: {{ phoneData().full }}</p>
    <p>Formatted: {{ phoneData().fullFormatted }}</p>
    <p>Digits: {{ phoneData().digits }}</p>
  \`
})
export class CustomPhone {
  readonly country = signal('GB');
  readonly phoneData = signal<PhoneNumber>({ digits: '', full: '', fullFormatted: '' });
  readonly onChange = (phone: PhoneNumber) => this.phoneData.set(phone);
}`,
    directiveDetect: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PhoneMaskDirective, type PMaskFull } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-custom-phone',
  standalone: true,
  imports: [PhoneMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <label for="phone">Phone number</label>
    <input id="phone" type="tel" autocomplete="tel"
      [phoneMask]="{ detect: true, onCountryChange }" />
    <p>Country: {{ countryName() || 'Detecting…' }}</p>
  \`
})
export class CustomPhone {
  readonly countryName = signal('');
  readonly onCountryChange = (country: PMaskFull) => this.countryName.set(country.name);
}`
  }
};

export function getCustomExamples(framework: ExampleFramework): CustomExamples {
  return customExamples[framework];
}

function quote(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function getDisplayCode(framework: ExampleFramework, options: DisplayOptions): string {
  const value = quote(options.value);
  const country = options.country ? quote(options.country) : 'undefined';
  const formatOptions = `{ code: ${JSON.stringify(options.code)}, flag: ${JSON.stringify(options.flag)} }`;

  switch (framework) {
    case 'vue':
      return `<script setup lang="ts">
import { formatPhone } from '@desource/phone-mask-vue/core';

const phone = ${value};
const country = ${country};
const options = ${formatOptions};
</script>

<template>
  <span>{{ formatPhone(phone, country, options) }}</span>
</template>`;
    case 'react':
      return `import { formatPhone } from '@desource/phone-mask-react/core';

export default function PhoneDisplay() {
  const phone = ${value};
  const country = ${country};
  const options = ${formatOptions};

  return <span>{formatPhone(phone, country, options)}</span>;
}`;
    case 'svelte':
      return `<script lang="ts">
  import { formatPhone } from '@desource/phone-mask-svelte/core';

  const phone = ${value};
  const country = ${country};
  const options = ${formatOptions};
</script>

<span>{formatPhone(phone, country, options)}</span>`;
    case 'angular':
      return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhonePipe } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-phone-display',
  standalone: true,
  imports: [PhonePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<span>{{ phone | phone: country: options }}</span>\`
})
export class PhoneDisplay {
  readonly phone = ${value};
  readonly country = ${country};
  readonly options = ${formatOptions};
}`;
  }
}
