<script lang="ts">
  import { phoneMask } from '@src/attachments/phoneMask.svelte';
  import type { PhoneMaskAttachmentOptions } from '@src/types';

  let {
    tag = 'input',
    options,
    initialValue
  }: {
    tag?: 'input' | 'div';
    options?: string | PhoneMaskAttachmentOptions;
    initialValue?: string;
  } = $props();
</script>

<svelte:element this={tag} value={initialValue} {@attach phoneMask(options)} />

