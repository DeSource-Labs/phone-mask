<script lang="ts">
  import PhoneInput from '@src/components/PhoneInput.svelte';
  import type { PhoneNumber } from '@src/types';
  import type { MaskFull } from '@desource/phone-mask';

  let {
    initialValue = '2025550199',
    id,
    name,
    onfocus,
    onblur,
    onchange,
    oncountrychange,
    oncopy
  }: {
    initialValue?: string;
    id?: string;
    name?: string;
    onfocus?: (e: FocusEvent) => void;
    onblur?: (e: FocusEvent) => void;
    onchange?: (value: PhoneNumber) => void;
    oncountrychange?: (country: MaskFull) => void;
    oncopy?: (value: string) => void;
  } = $props();

  let value = $derived.by(() => initialValue);
</script>

{#snippet actionsbefore()}
  <span data-testid="actions-before">Before</span>
{/snippet}

{#snippet flag(country: MaskFull)}
  <span data-testid="flag-custom">{country.id}</span>
{/snippet}

{#snippet copysvg(copied: boolean)}
  <span data-testid="copy-custom">{copied ? 'copied' : 'copy'}</span>
{/snippet}

{#snippet clearsvg()}
  <span data-testid="clear-custom">Clear</span>
{/snippet}

<PhoneInput
  bind:value
  {id}
  {name}
  detect={false}
  showClear
  showCopy
  dropdownClass="custom-dropdown"
  {actionsbefore}
  {flag}
  {copysvg}
  {clearsvg}
  {onfocus}
  {onblur}
  {onchange}
  {oncountrychange}
  {oncopy}
/>
