<script lang="ts">
  import { phoneMaskAction as phoneMask } from '@src/directives/phoneMaskAction';
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

<svelte:element this={tag} value={initialValue} use:phoneMask={options} />

