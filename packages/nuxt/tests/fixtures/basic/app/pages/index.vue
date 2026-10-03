<template>
  <main>
    <div id="contract-sentinel">phone-mask-nuxt:basic-ok</div>
    <div id="helper-flag">{{ helperFlag }}</div>
    <div id="directive-status">{{ hasDirective ? 'directive:yes' : 'directive:no' }}</div>
    <PhoneInput v-model="phone" country="US" />
    <input v-phone-mask="'US'" />
  </main>
</template>

<script setup lang="ts">
const phone = ref('');
const helperFlag = PMaskHelpers.getFlagEmoji('US');
const nuxtApp = useNuxtApp();
const hasDirective = computed(() => Boolean(nuxtApp.vueApp.directive('phone-mask')));
</script>
