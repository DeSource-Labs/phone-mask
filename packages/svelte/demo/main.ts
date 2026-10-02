import { mount } from 'svelte';
import '../src/style.scss';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('root')!
});

export default app;
