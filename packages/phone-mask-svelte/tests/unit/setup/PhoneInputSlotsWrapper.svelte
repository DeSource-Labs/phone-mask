<script lang="ts">
  import PhoneInput from '@src/components/PhoneInput.svelte';
  import type { PhoneNumber } from '@src/types';

  let {
    initialValue = '2025550199',
    onfocus,
    onblur,
    onchange,
    oncountrychange,
    oncopy
  }: {
    initialValue?: string;
    onfocus?: (e: FocusEvent) => void;
    onblur?: (e: FocusEvent) => void;
    onchange?: (value: PhoneNumber) => void;
    oncountrychange?: (country: { id: string; code: string; name: string; flag: string; mask: string | string[] }) => void;
    oncopy?: (value: string) => void;
  } = $props();

  let value = $state(initialValue);
</script>

{#snippet actionsbefore()}
  <span data-testid="actions-before">Before</span>
{/snippet}

{#snippet flag(country)}
  <span data-testid="flag-custom">{country.id}</span>
{/snippet}

{#snippet copysvg(copied)}
  <span data-testid="copy-custom">{copied ? 'copied' : 'copy'}</span>
{/snippet}

{#snippet clearsvg()}
  <span data-testid="clear-custom">Clear</span>
{/snippet}

<PhoneInput
  bind:value
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
