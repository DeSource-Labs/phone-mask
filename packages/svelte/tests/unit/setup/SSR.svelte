<script lang="ts">
  import type { SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
  import type { MaskFull } from '@desource/phone-mask';
  import PhoneInput from '@src/components/PhoneInput.svelte';

  let { value = '2025550123', detect = false, locale, theme, count = 1, customFlag = false }: SsrOptions = $props();
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
    <PhoneInput {value} {detect} {locale} {theme} flag={customFlag ? flag : undefined} />
  {/each}
  <p id="after">After</p>
</main>
