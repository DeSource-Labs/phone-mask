import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { builtinModules } from 'node:module';
import { flushSync, hydrate, tick, unmount } from 'svelte';
import { testPhoneInputSsr, type SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
import SSR from './setup/SSR.svelte';

let vite: ViteDevServer;
let render: (options: SsrOptions) => string;
let component: ReturnType<typeof hydrate> | undefined;

beforeAll(async () => {
  vite = await createServer({
    root: process.cwd(),
    configFile: false,
    appType: 'custom',
    plugins: [svelte()],
    // Avoid native RegExp checks and optimizer timers inside Vitest's DOM VM.
    resolve: { builtins: builtinModules.flatMap((name) => [name, `node:${name}`]) },
    optimizeDeps: { noDiscovery: true, exclude: ['svelte'] },
    ssr: { noExternal: true, optimizeDeps: { noDiscovery: true, exclude: ['svelte'] } },
    // Match Vitest's client compilation, which omits HMR hydration anchors.
    server: { middlewareMode: true, hmr: false }
  });
  ({ render } = await vite.ssrLoadModule('./tests/unit/setup/renderSSR.ts'));
});

afterAll(async () => {
  await vite?.close();
});

testPhoneInputSsr({
  render: (options) => render(options),
  async hydrate(container, options) {
    component = hydrate(SSR, { target: container, props: options, recover: false });
    await tick();
  },
  async act(callback) {
    await callback();
    flushSync();
    await tick();
  },
  async unmount() {
    if (component) await unmount(component);
    component = undefined;
  }
});
