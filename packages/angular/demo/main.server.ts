import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { App } from './app';
import { appConfig } from './app.config';

const config = mergeApplicationConfig(appConfig, { providers: [provideServerRendering()] });

export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
