<script lang="ts">
  import { phoneMaskAction } from '@src/actions/phoneMask';
  import type { PhoneMaskActionOptions } from '@src/types';

  let {
    tag = 'input',
    options,
    initialValue
  }: {
    tag?: 'input' | 'div';
    options?: string | PhoneMaskActionOptions;
    initialValue?: string;
  } = $props();
</script>

<svelte:element this={tag} value={initialValue} use:phoneMaskAction={options} />

