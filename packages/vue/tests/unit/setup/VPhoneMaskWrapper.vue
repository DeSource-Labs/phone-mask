<template>
  <component :is="tag" v-phone-mask="options" :value="initialValue" />
</template>

<script setup lang="ts">
import type { PMaskDirectiveOptions } from '@src/types';

defineProps<{
  tag?: 'input' | 'div';
  options?: string | PMaskDirectiveOptions;
  initialValue?: string;
}>();
</script>
