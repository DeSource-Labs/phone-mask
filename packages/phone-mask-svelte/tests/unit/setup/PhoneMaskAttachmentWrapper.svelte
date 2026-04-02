<script lang="ts">
  import { phoneMaskAttachment as phoneMask } from '@src/directives/phoneMaskAttachment.svelte';
  import type { PhoneMaskBindingOptions } from '@src/types';

  let {
    tag = 'input',
    options,
    initialValue
  }: {
    tag?: 'input' | 'div';
    options?: string | PhoneMaskBindingOptions;
    initialValue?: string;
  } = $props();
</script>

<svelte:element this={tag} value={initialValue} {@attach phoneMask(options)} />
