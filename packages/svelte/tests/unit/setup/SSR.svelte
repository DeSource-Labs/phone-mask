<script lang="ts">
  import type { SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
  import type { MaskFull } from '@desource/phone-mask';
  import PhoneInput from '@src/components/PhoneInput.svelte';

  let {
    value = '2025550123',
    detect = false,
    locale,
    theme,
    count = 1,
    customFlag = false,
    observeCallbacks,
    onNotify
  }: SsrOptions = $props();
  let country = $state('pending');
  let phone = $state('pending');
  let valid = $state<boolean>();
</script>

{#snippet flag(country: MaskFull)}
  {#if country.name.length > 15}
    <abbr title={country.name}>{country.name.slice(0, 15)}…</abbr>
  {:else}
    {country.name}
  {/if}
{/snippet}

<main>
  <p id="before">Before</p>
  {#each { length: count } as _, index (index)}
    <PhoneInput
      bind:value={
        () => value,
        (next) => {
          value = next;
          if (observeCallbacks) onNotify?.();
        }
      }
      {detect}
      {locale}
      {theme}
      flag={customFlag ? flag : undefined}
      oncountrychange={observeCallbacks
        ? (value) => {
            country = value.id;
            onNotify?.();
          }
        : undefined}
      onchange={observeCallbacks
        ? (value) => {
            phone = value.fullFormatted;
            onNotify?.();
          }
        : undefined}
      onvalidationchange={observeCallbacks
        ? (value) => {
            valid = value;
            onNotify?.();
          }
        : undefined}
    />
  {/each}
  {#if observeCallbacks}
    <p id="parent-country">{country}</p>
    <p id="parent-phone">{phone}</p>
    <p id="parent-value">{value}</p>
    {#if valid !== undefined}<span id="parent-validation">{String(valid)}</span>{/if}
  {/if}
  <p id="after">After</p>
</main>
