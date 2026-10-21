import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';
import { appConfig } from './app.config';

const app = await bootstrapApplication(App, appConfig);
await app.whenStable();
document.documentElement.dataset.hydrated = 'true';
