<template>
  <main>
    <div id="contract-sentinel">phone-mask-nuxt:basic-ok</div>
    <div id="helper-flag">{{ helperFlag }}</div>
    <div id="directive-status">{{ hasDirective ? 'directive:yes' : 'directive:no' }}</div>
    <PhoneInput id="fixed-phone" v-model="phone" country="US" />
    <PhoneInput id="selectable-phone" v-model="selectablePhone" :detect="false">
      <template #flag="{ country }">
        <span class="country-name">{{ country.name }}</span>
      </template>
    </PhoneInput>
    <PhoneInput id="second-phone" v-model="secondPhone" :detect="false" />
    <input v-phone-mask="'US'" />
  </main>
</template>

<script setup lang="ts">
const phone = ref('2025550123');
const selectablePhone = ref('4155552671');
const secondPhone = ref('6505551234');
const helperFlag = PMaskHelpers.getFlagEmoji('US');
const nuxtApp = useNuxtApp();
const hasDirective = computed(() => Boolean(nuxtApp.vueApp.directive('phone-mask')));
</script>
