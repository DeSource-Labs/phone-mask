import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

const vite = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  appType: 'custom',
  plugins: [svelte()],
  server: { port: 5174, strictPort: true },
  ssr: { noExternal: ['@desource/phone-mask-svelte'] }
});

Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true });

vite.middlewares.use(async (request, response, next) => {
  if (request.url !== '/') return next();
  try {
    const { render } = await vite.ssrLoadModule('svelte/server');
    const { default: App } = await vite.ssrLoadModule('./App.svelte');
    const fetch = globalThis.fetch;
    let geoRequests = 0;
    globalThis.fetch = async () => {
      geoRequests++;
      return Response.json({ country_code: 'US' });
    };
    let rendered;
    try {
      rendered = render(App);
    } finally {
      globalThis.fetch = fetch;
    }
    const html = await vite.transformIndexHtml(
      '/',
      `<!doctype html><html><head>${rendered.head}</head><body><div id="app">${rendered.body}</div><script type="module" src="/client.ts"></script></body></html>`
    );
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('X-SSR-GeoIP-Requests', geoRequests);
    response.end(html);
  } catch (error) {
    next(error);
  }
});

await vite.listen();
