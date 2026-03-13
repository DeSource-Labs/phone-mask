<script lang="ts">
  import PhoneInput from '@src/components/PhoneInput.svelte';

  let value = $state('2025550199');
</script>

{#snippet actionsbefore()}
  <span data-testid="actions-before">Before</span>
{/snippet}

{#snippet flag(country)}
  <span data-testid="flag-slot">{country.id}</span>
{/snippet}

{#snippet copysvg(copied)}
  <span data-testid="copy-slot">{copied ? 'copied' : 'copy'}</span>
{/snippet}

{#snippet clearsvg()}
  <span data-testid="clear-slot">Clear</span>
{/snippet}

<PhoneInput bind:value detect={false} showClear {actionsbefore} {flag} {copysvg} {clearsvg} />
