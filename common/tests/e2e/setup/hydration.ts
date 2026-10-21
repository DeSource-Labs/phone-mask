import type { Page } from '@playwright/test';

export async function prepareHydration(page: Page, scriptUrl: string) {
  const diagnostics: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') diagnostics.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.push(error.message));
  let geoRequests = 0;
  await page.route('https://ipapi.co/json/', async (route) => {
    geoRequests++;
    await route.fulfill({ json: { country_code: 'DE' } });
  });
  let release!: () => void;
  const scripts = new Promise<void>((resolve) => (release = resolve));
  await page.route(scriptUrl, async (route) => {
    await scripts;
    await route.continue();
  });
  return { diagnostics, release, getGeoRequests: () => geoRequests };
}
