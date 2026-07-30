<template>
  <div
    ref="rootRef"
    data-desource-phone-mask="input"
    aria-label="Phone input"
    role="group"
    :class="rootClasses"
    :style="rootStyles"
  >
    <!-- Country Selector -->
    <div class="pi-selector">
      <button
        ref="selectorRef"
        type="button"
        class="pi-selector-btn"
        :class="{ 'no-dropdown': !canOpenDropdown }"
        :disabled="disabled"
        :tabindex="canOpenDropdown ? undefined : -1"
        :aria-label="`Selected country: ${country.name}`"
        :aria-expanded="canOpenDropdown && dropdownOpen"
        :aria-haspopup="canOpenDropdown ? 'dialog' : undefined"
        :aria-controls="canOpenDropdown ? dropdownElementId : undefined"
        @pointerdown="handleSelectorPointerDown"
        @keydown="handleSelectorKeydown"
        @click="toggleDropdown"
      >
        <span class="pi-flag" role="img" :aria-label="`${country.name} flag`">
          <slot name="flag" :country="country">{{ country.flag }}</slot>
        </span>
        <span class="pi-code">{{ country.code }}</span>
        <svg
          v-if="canOpenDropdown"
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
        :id="id"
        ref="telRef"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        class="pi-input"
        :name="name"
        :placeholder="displayPlaceholder"
        :value="displayValue"
        :disabled="disabled"
        :readonly="readonly"
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
        <slot name="actions-before"></slot>

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
      </div>
    </div>

    <!-- Country Dropdown -->
    <Teleport to="body">
      <div
        v-if="renderDropdown"
        :id="dropdownElementId"
        ref="dropdownRef"
        class="phone-dropdown"
        data-desource-phone-mask="dropdown"
        :class="[{ 'is-open': dropdownOpen, 'is-unstyled': disableDefaultStyles }, dropdownClass, themeClass]"
        role="dialog"
        aria-modal="false"
        aria-label="Country"
      >
        <template v-if="dropdownOpen">
          <div class="pi-search-wrap">
            <input
              ref="searchRef"
              name="search"
              type="search"
              class="pi-search"
              aria-label="Search"
              :aria-controls="listboxId"
              :aria-activedescendant="activeOptionId"
              :placeholder="searchPlaceholder"
              :value="search"
              @keydown="handleSearchKeydown"
              @input="handleSearchChange"
            />
          </div>
          <ul :id="listboxId" class="pi-options" role="listbox" tabindex="-1">
            <li
              v-for="(c, idx) in filteredCountries"
              :id="getOptionId(idx)"
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
        </template>
      </div>
    </Teleport>

    <!-- Screen reader announcements -->
    <div ref="liveRef" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, useTemplateRef, type CSSProperties } from 'vue';

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
const selectorRef = useTemplateRef<HTMLButtonElement>('selectorRef');
/** Generate unique IDs for ARIA attributes; use useId once we stop supporting Vue < 3.5.0 */
const dropdownId = getCurrentInstance()?.uid ?? 0;
const dropdownElementId = `pi-dropdown-${dropdownId}`;
const listboxId = `pi-options-${dropdownId}`;
const getOptionId = (idx: number) => `pi-option-${dropdownId}-${idx}`;

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
  filteredCountries,
  hasDropdown,
  closeDropdown,
  toggleDropdown,
  selectCountry,
  setFocusedIndex,
  handleSearchChange,
  handleSearchKeydown,
  handleSelectorPointerDown,
  handleSelectorKeydown
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

const activeOptionId = computed(() =>
  dropdownOpen.value && filteredCountries.value[focusedIndex.value] ? getOptionId(focusedIndex.value) : undefined
);
const canOpenDropdown = computed(() => hasDropdown.value && !inactive.value);
const renderDropdown = computed(() => hasDropdown.value && (!inactive.value || dropdownOpen.value));

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

const rootStyles = computed(
  () =>
    ({
      '--pi-actions-count': +showCopyButton.value + +showClearButton.value + (slots['actions-before'] ? 1 : 0)
    }) as CSSProperties
);
</script>
