<template>
  <div
    ref="rootRef"
    aria-label="Phone input with country selector"
    role="group"
    :class="rootClasses"
    :style="rootStyles"
  >
    <!-- Country Selector -->
    <div class="pi-selector">
      <button
        type="button"
        class="pi-selector-btn"
        :class="{ 'no-dropdown': !hasDropdown || readonly }"
        :disabled="disabled"
        :tabindex="inactive || !hasDropdown ? -1 : undefined"
        :aria-label="`Selected country: ${selected.name}`"
        :aria-expanded="dropdownOpened"
        :aria-haspopup="hasDropdown ? 'listbox' : undefined"
        @click="toggleDropdown"
      >
        <span class="pi-flag" role="img" :aria-label="`${selected.name} flag`">
          <slot name="flag" :country="selected">{{ selected.flag }}</slot>
        </span>
        <span class="pi-code">{{ selected.code }}</span>
        <svg
          v-if="!inactive && hasDropdown"
          :class="['pi-chevron', { 'is-open': dropdownOpened }]"
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
        :aria-invalid="shouldShowWarn"
        @beforeinput="mask.handleBeforeInput"
        @input="onInput"
        @keydown="onKeydown"
        @paste="onPaste"
        @focus="onFocus"
        @blur="onBlur"
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
            :class="['pi-btn', { 'is-copied': copied }]"
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
            class="pi-btn"
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
          v-if="dropdownOpened"
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
              v-model="search"
              type="search"
              class="pi-search"
              aria-label="Search countries"
              :placeholder="searchPlaceholder"
              @keydown.down.prevent="focusNextOption(scrollFocusedIntoView)"
              @keydown.up.prevent="focusPrevOption(scrollFocusedIntoView)"
              @keydown.enter.prevent="chooseFocusedOption"
              @keydown.escape="closeDropdown"
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
                  'is-selected': c.id === selected.id
                }
              ]"
              :aria-selected="c.id === selected.id"
              :title="c.name"
              @click="onSelectCountry(c.id)"
              @mouseenter="focusedIndex = idx"
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
import { computed, onBeforeUnmount, nextTick, watch, useTemplateRef, shallowRef, type CSSProperties } from 'vue';

import { useCountrySelector } from '../composables/useCountrySelector';
import { useMask } from '../composables/useMask';
import { useClipboard } from '../composables/useClipboard';
import type { PhoneInputEmits, PhoneInputExposed, PhoneInputProps, PhoneInputSlots } from '../types';

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

const model = defineModel<string>();

const emit = defineEmits<PhoneInputEmits>();

const rootRef = useTemplateRef('rootRef');
const telRef = useTemplateRef('telRef');
const searchRef = useTemplateRef('searchRef');
const liveRef = useTemplateRef('liveRef');
const dropdownRef = useTemplateRef('dropdownRef');

const usedLocale = computed(() => {
  if (props.locale) return props.locale;
  if (typeof navigator !== 'undefined') {
    return navigator.language || (navigator as any).userLanguage || 'en';
  }
  return 'en';
});

const dropdownStyle = shallowRef<CSSProperties>({});

const countrySelector = useCountrySelector(usedLocale);
const {
  search,
  filteredCountries,
  focusedIndex,
  selected,
  dropdownOpened,
  hasDropdown,
  focusNextOption,
  focusPrevOption,
  chooseFocusedOption,
  closeDropdown
} = countrySelector;

const mask = useMask(selected, telRef);
const { digits, displayValue, displayPlaceholder, isComplete, isEmpty, shouldShowWarn, full, fullFormatted } = mask;

const { copied, copy, onUnmount: onClipboardUnmount } = useClipboard();

const inactive = computed(() => props.disabled || props.readonly);
const showCopyButton = computed(() => props.showCopy && !isEmpty.value && !props.disabled);
const showClearButton = computed(() => props.showClear && !isEmpty.value && !inactive.value);

const copyAriaLabel = computed(() => (copied.value ? 'Copied' : `Copy ${selected.value.code} ${displayValue.value}`));

const copyButtonTitle = computed(() => (copied.value ? 'Copied' : 'Copy phone number'));

const copyMessage = computed(() => (copied.value ? 'Phone number copied to clipboard' : ''));

const sizeClass = computed(() => `size-${props.size}`);
const themeClass = computed(() => {
  if (props.theme !== 'auto') return `theme-${props.theme}`;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'theme-dark';
  }
  return 'theme-light';
});

const rootClasses = computed(() => [
  'phone-input',
  sizeClass.value,
  themeClass.value,
  {
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-unstyled': props.disableDefaultStyles,
    'is-incomplete': props.withValidity && shouldShowWarn.value,
    'is-complete': props.withValidity && isComplete.value
  }
]);
const rootStyles = computed<CSSProperties>(() => ({
  '--pi-actions-count': +showCopyButton.value + +showClearButton.value + (slots['actions-before'] ? 1 : 0)
}));

const emitModelUpdate = () => {
  if (model.value === digits.value) return;
  model.value = digits.value;
  emit('change', {
    full: full.value,
    fullFormatted: fullFormatted.value,
    digits: digits.value
  });
};

// Event handlers
const onInput = async (e: Event) => {
  if (inactive.value) return;
  mask.handleInput(e);
  await nextTick();
  emitModelUpdate();
};

const onKeydown = async (e: KeyboardEvent) => {
  if (inactive.value) return;
  mask.handleKeydown(e);
  await nextTick();
  emitModelUpdate();
};

const onPaste = async (e: ClipboardEvent) => {
  if (inactive.value) return;
  mask.handlePaste(e);
  // Emit after paste is processed
  await nextTick();
  emitModelUpdate();
};

const onFocus = (e: FocusEvent) => {
  mask.handleFocus();
  dropdownOpened.value = false;
  emit('focus', e);
};

const onBlur = (e: FocusEvent) => emit('blur', e);

const onSelectCountry = async (countryId: string) => {
  countrySelector.selectCountry(countryId);
  emit('country-change', selected.value);
  await nextTick();
  telRef.value?.focus();
};

const onCopyClick = async () => {
  const valueToCopy = fullFormatted.value;
  const success = await copy(valueToCopy);
  if (success) {
    emit('copy', valueToCopy);
  }
};

const onClearClick = async () => {
  mask.clear();
  model.value = '';
  emit('change', {
    full: '',
    fullFormatted: '',
    digits: ''
  });
  emit('clear');
  await nextTick();
  telRef.value?.focus();
};

const positionDropdown = (e?: Event | UIEvent) => {
  if (e?.type === 'scroll' && e.target && dropdownRef.value?.contains(e.target as Node)) return;

  const root = rootRef.value;
  if (!root) return;

  const rect = root.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom + window.scrollY + 8}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
  };
};

const removeDropdownListeners = () => {
  window.removeEventListener('scroll', positionDropdown, true);
  window.removeEventListener('click', onDocClick, true);
  window.removeEventListener('resize', positionDropdown);
};

const toggleDropdown = async () => {
  if (inactive.value || !hasDropdown.value) return;
  await countrySelector.toggleDropdown(searchRef);
  if (dropdownOpened.value) {
    positionDropdown();
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('click', onDocClick, true);
    window.addEventListener('resize', positionDropdown);
  } else {
    removeDropdownListeners();
  }
};

const scrollFocusedIntoView = async () => {
  await nextTick();
  const list = dropdownRef.value?.lastElementChild;
  if (!list) return;
  (list.children[focusedIndex.value] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
};

const onDocClick = (ev: MouseEvent) => {
  const dropdown = dropdownRef.value;
  const selector = rootRef.value?.firstChild;
  if (!(dropdown || selector)) return;
  const target = ev.target as Node | null;
  if (!target || dropdown?.contains(target) || selector?.contains(target)) return;
  dropdownOpened.value = false;
};

// Watchers
watch(
  model,
  (newValue) => {
    if (!newValue) {
      if (!isEmpty.value) mask.clear();
      return;
    }
    // Only update if different from current value
    const currentDigits = digits.value;
    if (newValue !== currentDigits) {
      // Extract digits from the incoming value
      const incomingDigits = newValue.replace(/\D/g, '');
      if (incomingDigits !== currentDigits) {
        digits.value = incomingDigits;
        mask.updateDisplayFromDigits();
      }
    }
  },
  { immediate: true }
);

watch(
  [() => props.country, () => props.detect],
  async ([country, detect]) => {
    await nextTick();
    await countrySelector.initCountry(country, detect, () => emit('country-change', selected.value));
  },
  { immediate: true }
);

watch(
  copyMessage,
  (val) => {
    if (liveRef.value && val) {
      liveRef.value.textContent = val;
    }
  },
  { flush: 'post' }
);

watch(
  isComplete,
  (valid) => {
    emit('validation-change', valid);
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  removeDropdownListeners();
  onClipboardUnmount();
});

defineExpose<PhoneInputExposed>({
  focus: () => telRef.value?.focus(),
  blur: () => telRef.value?.blur(),
  clear: mask.clear,
  selectCountry: countrySelector.selectCountry,
  getFullNumber: () => full.value,
  getFullFormattedNumber: () => fullFormatted.value,
  getDigits: () => digits.value,
  isValid: () => isComplete.value,
  isComplete: () => isComplete.value
});
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
