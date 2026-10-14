import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';
import { appConfig } from './app.config';

bootstrapApplication(App, appConfig).then(async (app) => {
  await app.whenStable();
  document.documentElement.dataset.hydrated = 'true';
});
