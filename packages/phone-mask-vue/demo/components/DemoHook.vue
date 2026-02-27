<script setup lang="ts">
import { ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { usePhoneMask } from '../../src';
import type { PMaskFull as MaskFull, PMaskPhoneNumber } from '../../src';

const value = ref('');
const country = ref<string>('GB');

function onPhoneChange(p: PMaskPhoneNumber) {
  console.log('Hook change:', p);
}

function onCountryChange(c: MaskFull) {
  country.value = c.code;
}

const { inputRef, digits, full, fullFormatted, isComplete, setCountry, clear } = usePhoneMask({
  value,
  country,
  detect: false,
  onChange: (d) => {
    value.value = d;
  },
  onPhoneChange,
  onCountryChange
});

function setInputRef(el: Element | ComponentPublicInstance | null) {
  inputRef.value = el as HTMLInputElement | null;
}
</script>

<template>
  <section class="hook-demo" data-testid="hook">
    <h2 class="heading">usePhoneMask Composable</h2>
    <div class="controls">
      <input :ref="setInputRef" type="tel" placeholder="Phone number" data-testid="phone-input" class="hook-input" />
      <button class="btn" data-testid="control-country-us" @click="setCountry('US')">US</button>
      <button class="btn" data-testid="control-country-de" @click="setCountry('DE')">DE</button>
      <button class="btn" data-testid="control-clear" @click="clear()">Clear</button>
    </div>
    <div class="meta">
      <div data-testid="meta-digits"><strong>Digits:</strong> {{ digits || '—' }}</div>
      <div data-testid="meta-full"><strong>Full:</strong> {{ full || '—' }}</div>
      <div data-testid="meta-formatted"><strong>Formatted:</strong> {{ fullFormatted || '—' }}</div>
      <div data-testid="meta-valid"><strong>Valid:</strong> {{ isComplete ? 'Yes' : 'No' }}</div>
    </div>
  </section>
</template>

<style scoped>
.hook-demo {
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

.hook-input {
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

.hook-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Nunito', sans-serif;
  transition: all 0.2s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.15);
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
