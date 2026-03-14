<script lang="ts">
  import { tick } from 'svelte';
  import { useCountry } from '../composables/internal/useCountry.svelte';
  import { useFormatter } from '../composables/internal/useFormatter.svelte';
  import { useValidationHint } from '../composables/internal/useValidationHint.svelte';
  import { useInputHandlers } from '../composables/internal/useInputHandlers.svelte';
  import { useCountrySelector } from '../composables/internal/useCountrySelector.svelte';
  import { useCopyAction } from '../composables/internal/useCopyAction.svelte';
  import { useTheme } from '../composables/internal/useTheme.svelte';

  import type { PhoneInputProps } from '../types';

  let {
    value = $bindable(''),
    country: propCountry,
    detect = true,
    locale: propLocale,
    size = 'normal',
    theme = 'auto',
    disabled = false,
    readonly = false,
    showCopy = true,
    showClear = false,
    withValidity = true,
    searchPlaceholder = 'Search country or code...',
    noResultsText = 'No countries found',
    clearButtonLabel = 'Clear phone number',
    dropdownClass = '',
    disableDefaultStyles = false,
    onchange,
    oncountrychange,
    onvalidationchange,
    onfocus,
    onblur,
    oncopy,
    onclear,
    flag,
    copysvg,
    clearsvg,
    actionsbefore,
    class: extraClass,
    ...restProps
  }: PhoneInputProps = $props();

  // --- Refs ---
  let rootEl = $state<HTMLDivElement | null>(null);
  let telEl = $state<HTMLInputElement | null>(null);
  let liveEl = $state<HTMLDivElement | null>(null);
  let dropdownEl = $state<HTMLDivElement | null>(null);
  let searchEl = $state<HTMLInputElement | null>(null);
  let selectorEl = $state<HTMLDivElement | null>(null);

  // --- Composables (keep as objects to preserve reactive getter chains) ---
  const countryData = useCountry({
    country: () => propCountry,
    locale: () => propLocale,
    detect: () => detect,
    onCountryChange: (...args) => oncountrychange?.(...args)
  });

  const formatterData = useFormatter({
    country: () => countryData.country,
    value: () => value,
    onChange: (v) => (value = v),
    onPhoneChange: (...args) => onchange?.(...args),
    onValidationChange: (...args) => onvalidationchange?.(...args)
  });

  const validationHint = useValidationHint();

  const inactive = $derived(disabled || readonly);
  const incomplete = $derived(validationHint.showValidationHint && formatterData.shouldShowWarn);
  const showCopyButton = $derived(showCopy && !formatterData.isEmpty && !disabled);
  const showClearButton = $derived(showClear && !formatterData.isEmpty && !inactive);

  const copyData = useCopyAction({
    liveRef: () => liveEl,
    fullFormatted: () => formatterData.fullFormatted,
    onCopy: (...args) => oncopy?.(...args)
  });

  const focusInput = () => tick().then(() => telEl?.focus());

  const selectorData = useCountrySelector({
    rootRef: () => rootEl,
    dropdownRef: () => dropdownEl,
    searchRef: () => searchEl,
    selectorRef: () => selectorEl,
    locale: () => countryData.locale,
    countryOption: () => propCountry,
    inactive: () => inactive,
    onSelectCountry: countryData.setCountry,
    onAfterSelect: focusInput
  });

  const inputHandlers = useInputHandlers({
    formatter: () => formatterData.formatter,
    digits: () => formatterData.digits,
    inactive: () => inactive,
    onChange: (v) => (value = v),
    scheduleValidationHint: validationHint.scheduleValidationHint
  });

  const handleFocus = (e: FocusEvent) => {
    validationHint.clearValidationHint(false);
    selectorData.closeDropdown();
    onfocus?.(e);
  };

  const handleBlur = (e: FocusEvent) => onblur?.(e);

  export function focus() { focusInput(); }
  export function blur() { telEl?.blur(); }
  export function clear() {
    value = '';
    validationHint.clearValidationHint();
    onclear?.();
  }
  export function selectCountry(code?: string | null) { countryData.setCountry(code); }
  export function getFullNumber() { return formatterData.full; }
  export function getFullFormattedNumber() { return formatterData.fullFormatted; }
  export function getDigits() { return formatterData.digits; }
  export function isValid() { return formatterData.isComplete; }
  export function isComplete() { return formatterData.isComplete; }

  const handleClearClick = () => { clear(); focusInput(); };
  const handleOptionClick = (e: MouseEvent) => {
    const code = (e.currentTarget as HTMLLIElement | null)?.dataset.country;
    if (code) selectorData.selectCountry(code);
  };
  const handleOptionKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const code = (e.currentTarget as HTMLLIElement | null)?.dataset.country;
    if (code) selectorData.selectCountry(code);
  };
  const handleOptionMouseEnter = (e: MouseEvent) => {
    const index = Number((e.currentTarget as HTMLLIElement | null)?.dataset.index);
    if (!Number.isNaN(index)) selectorData.setFocusedIndex(index);
  };

  const themeData = useTheme({
    theme: () => theme,
  });

  const rootClasses = $derived(
    ['phone-input', `size-${size}`, themeData.themeClass,
      disabled && 'is-disabled',
      readonly && 'is-readonly',
      disableDefaultStyles && 'is-unstyled',
      withValidity && incomplete && 'is-incomplete',
      withValidity && formatterData.isComplete && 'is-complete',
      extraClass
    ].filter(Boolean).join(' ')
  );

  const actionsCount = $derived(+showCopyButton + +showClearButton + (actionsbefore ? 1 : 0));

  // Portal action — appends dropdown to document.body
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }
</script>

<div bind:this={rootEl} class={rootClasses} {...restProps}
  style:--pi-actions-count={actionsCount}
  role="group" aria-label="Phone input with country selector">

  <!-- Country Selector -->
  <div bind:this={selectorEl} class="pi-selector">
    <button type="button"
      class="pi-selector-btn"
      class:no-dropdown={!selectorData.hasDropdown || readonly}
      {disabled}
      tabindex={inactive || !selectorData.hasDropdown ? -1 : undefined}
      aria-label="Selected country: {countryData.country.name}"
      aria-expanded={selectorData.dropdownOpen}
      aria-haspopup={selectorData.hasDropdown ? 'listbox' : undefined}
      onclick={selectorData.toggleDropdown}>
      <span class="pi-flag" role="img" aria-label="{countryData.country.name} flag">
        {#if flag}{@render flag(countryData.country)}{:else}{countryData.country.flag}{/if}
      </span>
      <span class="pi-code">{countryData.country.code}</span>
      {#if !inactive && selectorData.hasDropdown}
        <svg class="pi-chevron" class:is-open={selectorData.dropdownOpen}
          width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </button>
  </div>

  <!-- Input -->
  <div class="pi-input-wrap">
    <input bind:this={telEl} type="tel" inputmode="tel"
      autocomplete="tel-national" autocorrect="off"
      autocapitalize="off" spellcheck="false"
      class="pi-input"
      placeholder={formatterData.displayPlaceholder}
      value={formatterData.displayValue}
      {disabled} readonly={readonly}
      aria-invalid={incomplete}
      onbeforeinput={inputHandlers.handleBeforeInput}
      oninput={inputHandlers.handleInput}
      onkeydown={inputHandlers.handleKeydown}
      onpaste={inputHandlers.handlePaste}
      onfocus={handleFocus}
      onblur={handleBlur} />

    <!-- Actions -->
    <div class="pi-actions" role="toolbar" aria-label="Phone input actions">
      {#if actionsbefore}
        {@render actionsbefore()}
      {/if}

      {#if showCopyButton}
        <button type="button"
          class="pi-btn pi-btn-copy" class:is-copied={copyData.copied}
          aria-label={copyData.copyAriaLabel} title={copyData.copyButtonTitle}
          onclick={copyData.onCopyClick}>
          {#if copysvg}
            {@render copysvg(copyData.copied)}
          {:else if copyData.copied}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6.5 11.5L3 8L4.06 6.94L6.5 9.38L11.94 3.94L13 5L6.5 11.5Z" fill="currentColor"/>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.5 5.5V13.5H5.5V5.5H13.5ZM13.5 4H5.5C4.67 4 4 4.67 4 5.5V13.5C4 14.33 4.67 15 5.5 15H13.5C14.33 15 15 14.33 15 13.5V5.5C15 4.67 14.33 4 13.5 4ZM10.5 1H2.5V11H4V2.5H10.5V1Z" fill="currentColor"/>
            </svg>
          {/if}
        </button>
      {/if}

      {#if showClearButton}
        <button type="button"
          class="pi-btn pi-btn-clear"
          aria-label={clearButtonLabel} title={clearButtonLabel}
          onclick={handleClearClick}>
          {#if clearsvg}
            {@render clearsvg()}
          {:else}
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
            </svg>
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>

<!-- Dropdown — portaled to body -->
{#if selectorData.dropdownOpen}
  <div use:portal bind:this={dropdownEl}
    class="phone-dropdown {dropdownClass} {themeData.themeClass}"
    class:is-closing={selectorData.isClosing}
    style:position="absolute"
    style:top={selectorData.dropdownStyle.top}
    style:left={selectorData.dropdownStyle.left}
    style:width={selectorData.dropdownStyle.width}
    role="dialog" aria-modal="false" aria-label="Select country"
    onanimationend={selectorData.handleDropdownAnimationEnd}>
    <div class="pi-search-wrap">
      <input bind:this={searchEl} type="search" class="pi-search"
        aria-label="Search countries" placeholder={searchPlaceholder}
        value={selectorData.search}
        onkeydown={selectorData.handleSearchKeydown}
        oninput={selectorData.handleSearchChange} />
    </div>
    <ul class="pi-options" role="listbox"
      aria-activedescendant="option-{selectorData.focusedIndex}" tabindex="-1">
      {#each selectorData.filteredCountries as c, idx (c.id)}
        <li id="option-{idx}" role="option"
          data-country={c.id}
          data-index={idx}
          class="pi-option"
          class:is-focused={idx === selectorData.focusedIndex}
          class:is-selected={c.id === countryData.country.id}
          aria-selected={c.id === countryData.country.id}
          title={c.name}
          onclick={handleOptionClick}
          onkeydown={handleOptionKeydown}
          onmouseenter={handleOptionMouseEnter}>
          <span class="pi-flag" role="img" aria-label="{c.name} flag">
            {#if flag}{@render flag(c)}{:else}{c.flag}{/if}
          </span>
          <span class="pi-opt-name">{c.name}</span>
          <span class="pi-opt-code">{c.code}</span>
        </li>
      {:else}
        <li class="pi-empty">{noResultsText}</li>
      {/each}
    </ul>
  </div>
{/if}

<!-- Screen reader live region -->
<div bind:this={liveEl} class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
