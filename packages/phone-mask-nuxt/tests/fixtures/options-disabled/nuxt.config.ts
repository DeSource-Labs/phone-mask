import { defineNuxtConfig } from 'nuxt/config';
import phoneMask from '../../../src/module';

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: [phoneMask],
  phoneMask: {
    css: false,
    component: false,
    directive: false,
    helpers: false
  }
});
