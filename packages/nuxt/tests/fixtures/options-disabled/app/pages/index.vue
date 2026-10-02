<template>
  <main>
    <div id="contract-sentinel">phone-mask-nuxt:options-off-ok</div>
    <div id="directive-status">{{ hasDirective ? 'directive:yes' : 'directive:no' }}</div>
  </main>
</template>

<script setup lang="ts">
const nuxtApp = useNuxtApp();
const hasDirective = computed(() => Boolean(nuxtApp.vueApp.directive('phone-mask')));
</script>
