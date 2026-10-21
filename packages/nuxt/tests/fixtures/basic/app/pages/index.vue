<template>
  <main>
    <div id="contract-sentinel">phone-mask-nuxt:basic-ok</div>
    <div id="helper-flag">{{ helperFlag }}</div>
    <div id="directive-status">{{ hasDirective ? 'directive:yes' : 'directive:no' }}</div>
    <PhoneInput
      id="fixed-phone"
      v-model="phone"
      country="US"
      @country-change="countryName = $event.name"
      @change="formattedPhone = $event.fullFormatted"
      @validation-change="isValid = $event"
    />
    <div id="parent-country">{{ countryName || 'pending' }}</div>
    <div id="parent-phone">{{ formattedPhone || 'pending' }}</div>
    <div id="parent-value">{{ phone }}</div>
    <span v-if="isValid !== undefined" id="parent-validation">{{ isValid }}</span>
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
const phone = ref('202555012345');
const countryName = ref('');
const formattedPhone = ref('');
const isValid = ref<boolean>();
const selectablePhone = ref('4155552671');
const secondPhone = ref('6505551234');
const helperFlag = PMaskHelpers.getFlagEmoji('US');
const nuxtApp = useNuxtApp();
const hasDirective = computed(() => Boolean(nuxtApp.vueApp.directive('phone-mask')));
</script>
