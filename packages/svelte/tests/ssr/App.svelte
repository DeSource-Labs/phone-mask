<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';

  let fixed = $state('2025550123');
  let detected = $state('4155552671');
  let selectable = $state('6505551234');
</script>

<PhoneInput id="fixed-phone" country="US" bind:value={fixed} />
<PhoneInput id="detected-phone" bind:value={detected} />
<PhoneInput id="selectable-phone" detect={false} bind:value={selectable}>
  {#snippet flag(country)}
    <span class="country-name">
      {#if country.name.length > 15}
        <abbr title={country.name}>{country.name.slice(0, 15)}…</abbr>
      {:else}
        {country.name}
      {/if}
    </span>
  {/snippet}
</PhoneInput>
