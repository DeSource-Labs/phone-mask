import { createApp } from 'vue';
import { vPhoneMask } from '../src';
import App from './App.vue';

const app = createApp(App);
app.directive('phone-mask', vPhoneMask);
app.mount('#root');
