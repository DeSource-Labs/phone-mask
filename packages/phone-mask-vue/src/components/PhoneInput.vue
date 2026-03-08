<template>
  <div
    ref="rootRef"
    aria-label="Phone input with country selector"
    role="group"
    :class="rootClasses"
    :style="rootStyles"
  >
    <!-- Country Selector -->
    <div ref="selectorRef" class="pi-selector">
      <button
        type="button"
        class="pi-selector-btn"
        :class="{ 'no-dropdown': !hasDropdown || readonly }"
        :disabled="disabled"
        :tabindex="inactive || !hasDropdown ? -1 : undefined"
        :aria-label="`Selected country: ${country.name}`"
        :aria-expanded="dropdownOpen"
        :aria-haspopup="hasDropdown ? 'listbox' : undefined"
        @click="toggleDropdown"
      >
        <span class="pi-flag" role="img" :aria-label="`${country.name} flag`">
          <slot name="flag" :country="country">{{ country.flag }}</slot>
        </span>
        <span class="pi-code">{{ country.code }}</span>
        <svg
          v-if="!inactive && hasDropdown"
          :class="['pi-chevron', { 'is-open': dropdownOpen }]"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Input Container -->
    <div class="pi-input-wrap">
      <!-- Phone Input -->
      <input
        ref="telRef"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        class="pi-input"
        :placeholder="displayPlaceholder"
        :value="displayValue"
        :disabled="disabled"
        :readonly="readonly"
        aria-label="Phone number"
        :aria-invalid="incomplete"
        @beforeinput="handleBeforeInput"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- Action Buttons -->
      <div class="pi-actions" role="toolbar" aria-label="Phone input actions">
        <Transition name="fade-scale">
          <slot name="actions-before"></slot>
        </Transition>

        <Transition name="fade-scale">
          <button
            v-if="showCopyButton"
            type="button"
            :class="['pi-btn', 'pi-btn-copy', { 'is-copied': copied }]"
            :aria-label="copyAriaLabel"
            :title="copyButtonTitle"
            @click="onCopyClick"
          >
            <slot v-if="slots['copy-svg']" name="copy-svg" :copied="copied"></slot>
            <svg v-else-if="!copied" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13.5 5.5V13.5H5.5V5.5H13.5ZM13.5 4H5.5C4.67 4 4 4.67 4 5.5V13.5C4 14.33 4.67 15 5.5 15H13.5C14.33 15 15 14.33 15 13.5V5.5C15 4.67 14.33 4 13.5 4ZM10.5 1H2.5V11H4V2.5H10.5V1Z"
                fill="currentColor"
              />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6.5 11.5L3 8L4.06 6.94L6.5 9.38L11.94 3.94L13 5L6.5 11.5Z" fill="currentColor" />
            </svg>
          </button>
        </Transition>

        <Transition name="fade-scale">
          <button
            v-if="showClearButton"
            type="button"
            class="pi-btn pi-btn-clear"
            :aria-label="clearButtonLabel"
            :title="clearButtonLabel"
            @click="onClearClick"
          >
            <svg v-if="!slots['clear-svg']" width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"
                fill="currentColor"
              />
            </svg>
            <slot v-else name="clear-svg"></slot>
          </button>
        </Transition>
      </div>
    </div>

    <!-- Country Dropdown -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="dropdownOpen"
          ref="dropdownRef"
          class="phone-dropdown"
          :class="[dropdownClass, themeClass]"
          role="dialog"
          aria-modal="false"
          aria-label="Select country"
          :style="dropdownStyle"
        >
          <div class="pi-search-wrap">
            <input
              ref="searchRef"
              :value="search"
              type="search"
              class="pi-search"
              aria-label="Search countries"
              :placeholder="searchPlaceholder"
              @keydown="handleSearchKeydown"
              @input="handleSearchChange"
            />
          </div>
          <ul class="pi-options" role="listbox" :aria-activedescendant="`option-${focusedIndex}`" tabindex="-1">
            <li
              v-for="(c, idx) in filteredCountries"
              :id="`option-${idx}`"
              :key="c.id"
              role="option"
              :class="[
                'pi-option',
                {
                  'is-focused': idx === focusedIndex,
                  'is-selected': c.id === country.id
                }
              ]"
              :aria-selected="c.id === country.id"
              :title="c.name"
              @click="selectCountry(c.id)"
              @mouseenter="setFocusedIndex(idx)"
            >
              <span class="pi-flag" role="img" :aria-label="`${c.name} flag`">
                <slot name="flag" :country="c">{{ c.flag }}</slot>
              </span>
              <span class="pi-opt-name">{{ c.name }}</span>
              <span class="pi-opt-code">{{ c.code }}</span>
            </li>
            <li v-if="filteredCountries.length === 0" class="pi-empty">
              {{ noResultsText }}
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>

    <!-- Screen reader announcements -->
    <div ref="liveRef" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, useTemplateRef, type CSSProperties } from 'vue';

import { useCountry } from '../composables/internal/useCountry';
import { useFormatter } from '../composables/internal/useFormatter';
import { useValidationHint } from '../composables/internal/useValidationHint';
import { useInputHandlers } from '../composables/internal/useInputHandlers';
import { useCountrySelector } from '../composables/internal/useCountrySelector';
import { useCopyAction } from '../composables/internal/useCopyAction';
import { useTheme } from '../composables/internal/useTheme';
import type { PhoneInputEmits, PhoneInputExposed, PhoneInputProps, PhoneInputSlots, PhoneNumber } from '../types';

const props = withDefaults(defineProps<PhoneInputProps>(), {
  detect: true,
  size: 'normal',
  theme: 'auto',
  showCopy: true,
  showClear: false,
  withValidity: true,
  disabled: false,
  readonly: false,
  searchPlaceholder: 'Search country or code...',
  noResultsText: 'No countries found',
  clearButtonLabel: 'Clear phone number',
  disableDefaultStyles: false
});

const slots = defineSlots<PhoneInputSlots>();

const emit = defineEmits<PhoneInputEmits>();

const model = defineModel<string>({ default: '' });

const onChange = (v: string) => {
  model.value = v;
};

const { country, setCountry, locale } = useCountry({
  country: () => props.country,
  locale: () => props.locale,
  detect: () => props.detect,
  onCountryChange: (c) => emit('country-change', c)
});

const {
  digits,
  formatter,
  displayPlaceholder,
  displayValue,
  full,
  fullFormatted,
  isComplete,
  isEmpty,
  shouldShowWarn
} = useFormatter({
  country,
  value: model,
  onChange,
  onPhoneChange: (data: PhoneNumber) => emit('change', data),
  onValidationChange: (complete: boolean) => emit('validation-change', complete)
});

const { showValidationHint, clearValidationHint, scheduleValidationHint } = useValidationHint();

const rootRef = useTemplateRef('rootRef');
const telRef = useTemplateRef('telRef');
const liveRef = useTemplateRef('liveRef');
const dropdownRef = useTemplateRef<HTMLDivElement>('dropdownRef');
const searchRef = useTemplateRef<HTMLInputElement>('searchRef');
const selectorRef = useTemplateRef<HTMLDivElement>('selectorRef');

const inactive = computed(() => props.disabled || props.readonly);
const incomplete = computed(() => showValidationHint.value && shouldShowWarn.value);
const showCopyButton = computed(() => props.showCopy && !isEmpty.value && !props.disabled);
const showClearButton = computed(() => props.showClear && !isEmpty.value && !inactive.value);

const { copied, copyAriaLabel, copyButtonTitle, onCopyClick } = useCopyAction({
  liveRef,
  fullFormatted,
  onCopy: (v) => emit('copy', v)
});

const focusInput = () => nextTick(() => telRef.value?.focus());

const {
  dropdownOpen,
  search,
  focusedIndex,
  dropdownStyle,
  filteredCountries,
  hasDropdown,
  closeDropdown,
  toggleDropdown,
  selectCountry,
  setFocusedIndex,
  handleSearchChange,
  handleSearchKeydown
} = useCountrySelector({
  rootRef,
  dropdownRef,
  searchRef,
  selectorRef,
  locale,
  countryOption: () => props.country,
  inactive,
  onSelectCountry: setCountry,
  onAfterSelect: focusInput
});

const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
  formatter,
  digits,
  inactive,
  onChange,
  scheduleValidationHint
});

const handleFocus = (e: FocusEvent) => {
  clearValidationHint(false);
  closeDropdown();
  emit('focus', e);
};

const handleBlur = (e: FocusEvent) => emit('blur', e);

const clear = () => {
  onChange('');
  clearValidationHint();
  emit('clear');
};

const onClearClick = () => {
  clear();
  focusInput();
};

defineExpose<PhoneInputExposed>({
  focus: focusInput,
  blur: () => telRef.value?.blur(),
  clear,
  selectCountry,
  getFullNumber: () => full.value,
  getFullFormattedNumber: () => fullFormatted.value,
  getDigits: () => digits.value,
  isValid: () => isComplete.value,
  isComplete: () => isComplete.value
});

const { themeClass } = useTheme({
  theme: () => props.theme
});

const rootClasses = computed(() => [
  'phone-input',
  `size-${props.size}`,
  themeClass.value,
  {
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-unstyled': props.disableDefaultStyles,
    'is-incomplete': props.withValidity && incomplete.value,
    'is-complete': props.withValidity && isComplete.value
  }
]);

const rootStyles = computed<CSSProperties>(() => ({
  '--pi-actions-count': +showCopyButton.value + +showClearButton.value + (slots['actions-before'] ? 1 : 0)
}));
</script>

<style lang="scss">
// Global resets within component scope
.phone-input,
.phone-dropdown {
  // CSS custom properties
  --pi-bg: #ffffff;
  --pi-fg: #111827;
  --pi-muted: #6b7280;
  --pi-border: #e5e7eb;
  --pi-border-hover: #d1d5db;
  --pi-border-focus: #3b82f6;
  --pi-radius: 8px;
  --pi-padding: 12px;
  --pi-font-size: 16px;
  --pi-height: 44px;
  --pi-actions-size: 32px;
  --pi-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --pi-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
  --pi-warning: #f59e0b;
  --pi-warning-light: #fbbf24;
  --pi-success: #10b981;
  --pi-focus-ring: 3px solid rgb(59 130 246 / 0.15);
  --pi-focus-ring-warning: 3px solid rgb(245 158 11 / 0.15);
  --pi-focus-ring-success: 3px solid rgb(16 185 129 / 0.15);
  --pi-disabled-bg: #f9fafb;
  --pi-disabled-fg: #9ca3af;

  // Theme variants
  &.theme-dark {
    --pi-bg: #1f2937;
    --pi-fg: #f9fafb;
    --pi-muted: #9ca3af;
    --pi-border: #374151;
    --pi-border-hover: #4b5563;
    --pi-border-focus: #60a5fa;
    --pi-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
    --pi-shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 10px 10px -5px rgb(0 0 0 / 0.2);
    --pi-warning: #fbbf24;
    --pi-warning-light: #fcd34d;
    --pi-focus-ring: 3px solid rgb(96 165 250 / 0.2);
    --pi-focus-ring-warning: 3px solid rgb(251 191 24 / 0.2);
    --pi-focus-ring-success: 3px solid rgb(16 185 129 / 0.2);
    --pi-disabled-bg: #374151;
  }

  // Reset styles
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button,
  input {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    &:disabled {
      cursor: not-allowed;
    }
  }

  input {
    outline: none;
    &::placeholder {
      opacity: 0.5;
    }
    &:disabled {
      cursor: not-allowed;
    }
  }
}
</style>

<style scoped lang="scss">
// Root (dropdown shares some variables because of teleport)
.phone-input,
.phone-dropdown {
  font-size: var(--pi-font-size);
  background: var(--pi-bg);
  color: var(--pi-fg);
  border-radius: var(--pi-radius);
  border: 1px solid var(--pi-border);
}

.phone-input {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;

  &:focus-within {
    outline: var(--pi-focus-ring);
  }

  &.is-incomplete {
    border-color: var(--pi-warning);
    &:focus-within {
      outline: var(--pi-focus-ring-warning);
    }
  }

  &.is-complete {
    border-color: var(--pi-success);
    &:focus-within {
      outline: var(--pi-focus-ring-success);
    }
  }

  &.is-disabled {
    background: var(--pi-disabled-bg);
    color: var(--pi-disabled-fg);
  }

  &.is-readonly {
    cursor: default;
  }

  // Size variants
  &.size-compact {
    --pi-font-size: 14px;
    --pi-height: 36px;
    --pi-padding: 10px;
    --pi-actions-size: 24px;
  }

  &.size-large {
    --pi-font-size: 18px;
    --pi-height: 52px;
    --pi-padding: 16px;
    --pi-actions-size: 32px;
  }

  &.is-unstyled {
    all: initial;
    display: block;
  }
}

// Selector
.pi-selector {
  flex-shrink: 0;
}

.pi-selector-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: var(--pi-padding);
  padding-right: 0;
  min-height: var(--pi-height);
  border: 1px solid transparent;
  border-radius: var(--pi-radius) 0 0 var(--pi-radius);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &.no-dropdown {
    cursor: default;
  }

  &:focus-visible {
    border-color: var(--pi-border-focus);
    outline: none;
  }

  &:disabled > .pi-flag {
    opacity: 0.5;
  }
}

.pi-flag {
  font-size: 1.25em;
  line-height: 1;
  display: inline-flex;
}

.pi-chevron {
  margin-left: 2px;
  color: var(--pi-muted);
  transition: transform 200ms ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

// Input wrap
.pi-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

// Input
.pi-input {
  flex: 1;
  width: 100%;
  padding-left: var(--pi-padding);
  // Calc right padding based on number of action buttons + 2px gaps + base padding
  padding-right: calc((var(--pi-actions-size) + 2px) * var(--pi-actions-count) + var(--pi-padding));
  min-height: var(--pi-height);
  border-radius: 0 var(--pi-radius) var(--pi-radius) 0;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled):not(:read-only) {
    border-color: var(--pi-border-hover);
  }

  &:focus {
    border-color: var(--pi-border-focus);
    position: relative;
  }
}

// Actions
.pi-actions {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.pi-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--pi-actions-size);
  height: var(--pi-actions-size);
  background: transparent;
  color: var(--pi-muted);
  border: none;
  border-radius: 9999px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--pi-disabled-bg);
    color: var(--pi-fg);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:focus {
    outline: 1px solid var(--pi-border-focus);
    outline-offset: -1px;
  }

  &.is-copied {
    color: var(--pi-success);
    border-color: var(--pi-success);
  }

  svg {
    flex-shrink: 0;
  }
}

// Dropdown
.phone-dropdown {
  position: absolute;
  z-index: 9999;
  max-width: 400px;
  box-shadow: var(--pi-shadow-lg);
  overflow: hidden;
}

.pi-search-wrap {
  padding: 8px;
  border-bottom: 1px solid var(--pi-border);
}

.pi-search {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.875em;
  border: 1px solid var(--pi-border);
  border-radius: calc(var(--pi-radius) - 2px);
  background: var(--pi-bg);
  transition: border-color 150ms ease;

  &:focus {
    border-color: var(--pi-border-focus);
  }
}

.pi-options {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
  margin: 0;
  list-style: none;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--pi-border);
    border-radius: 4px;

    &:hover {
      background: var(--pi-border-hover);
    }
  }
}

.pi-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 100ms ease;

  &:hover,
  &.is-focused {
    background: var(--pi-disabled-bg);
  }

  &.is-selected {
    background: var(--pi-border);
    font-weight: 500;
  }
}

.pi-opt-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pi-opt-code {
  color: var(--pi-muted);
  font-size: 0.875em;
}

.pi-empty {
  padding: 12px;
  text-align: center;
  color: var(--pi-muted);
  font-size: 0.875em;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(8px);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// Screen reader only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// Responsive
@media (max-width: 480px) {
  .phone-input {
    --pi-padding: 8px;
    --pi-actions-size: 24px;
  }

  .size-compact {
    --pi-actions-size: 20px;
  }

  .phone-dropdown {
    left: 0;
    right: 0;
    max-width: none;
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
