<script setup lang="ts">
import { ref } from 'vue';
import { vPhoneMask } from '../../src';
import type { PMaskFull as MaskFull, PMaskPhoneNumber } from '../../src';

const country = ref<string>('US');
const phoneData = ref<PMaskPhoneNumber | null>(null);
const detectedCountry = ref<string>('');

function onChange(p: PMaskPhoneNumber) {
  phoneData.value = p;
  console.log('Directive change:', p);
}

function onCountryChange(c: MaskFull) {
  detectedCountry.value = c.name;
  console.log('Directive country change:', c);
}
</script>

<template>
  <section class="directive-demo" data-testid="directive">
    <h2 class="heading">v-phone-mask Directive</h2>
    <div class="controls">
      <select v-model="country" class="country-select" data-testid="country-select">
        <option value="US">🇺🇸 US +1</option>
        <option value="GB">🇬🇧 GB +44</option>
        <option value="DE">🇩🇪 DE +49</option>
        <option value="FR">🇫🇷 FR +33</option>
        <option value="JP">🇯🇵 JP +81</option>
        <option value="BR">🇧🇷 BR +55</option>
      </select>

      <input
        v-phone-mask="{ country, onChange, onCountryChange }"
        placeholder="Phone number"
        data-testid="phone-input"
        class="directive-input"
      />
    </div>
    <div class="meta">
      <div data-testid="meta-digits"><strong>Digits:</strong> {{ phoneData?.digits || '—' }}</div>
      <div data-testid="meta-full"><strong>Full:</strong> {{ phoneData?.full || '—' }}</div>
      <div data-testid="meta-formatted"><strong>Formatted:</strong> {{ phoneData?.fullFormatted || '—' }}</div>
      <div data-testid="meta-country"><strong>Country:</strong> {{ detectedCountry || '—' }}</div>
    </div>
  </section>
</template>

<style scoped>
.directive-demo {
  padding: 32px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
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

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.country-select {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  outline: none;
}

.country-select option {
  background: #1a1a2e;
  color: #fff;
}

.directive-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
  font-family: 'Nunito', sans-serif;
  outline: none;
}

.directive-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
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
</style>
