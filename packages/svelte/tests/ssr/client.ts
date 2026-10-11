import { hydrate, tick } from 'svelte';
import App from './App.svelte';
import '@desource/phone-mask-svelte/assets/lib.css';

hydrate(App, { target: document.getElementById('app')! });
await tick();
document.documentElement.dataset.hydrated = 'true';
