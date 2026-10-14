import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { renderApplication } from '@angular/platform-server';
import bootstrap from './main.server';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const browserDirectory = resolve(serverDirectory, '../browser');
const document = await readFile(resolve(serverDirectory, 'index.server.html'), 'utf8');
let geoRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (...args) => {
  geoRequests++;
  return originalFetch(...args);
};

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
  '.ico': 'image/x-icon'
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost:5174');
  try {
    if (url.pathname === '/' || url.pathname === '/ssr') {
      const before = geoRequests;
      const html = await renderApplication(bootstrap, { document, url: url.href, allowedHosts: ['localhost'] });
      response.setHeader('Content-Type', 'text/html');
      response.setHeader('X-SSR-GeoIP-Requests', geoRequests - before);
      response.end(html);
      return;
    }
    const path = resolve(browserDirectory, `.${decodeURIComponent(url.pathname)}`);
    if (!path.startsWith(browserDirectory + sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(path);
    response.setHeader('Content-Type', contentTypes[extname(path)] ?? 'application/octet-stream');
    response.end(content);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Server render failed');
  }
});

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) server.listen(5174, '127.0.0.1');
