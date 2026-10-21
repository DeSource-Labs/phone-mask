import '@angular/compiler';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

if (!TestBed.platform) {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
    teardown: { destroyAfterEach: true }
  });
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
});

afterEach(() => {
  TestBed.resetTestingModule();
});
