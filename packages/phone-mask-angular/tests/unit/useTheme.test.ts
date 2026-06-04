/// <reference types="vitest/globals" />
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testUseTheme, type SetupOptions } from '@common/tests/unit/useTheme';
import { UseThemeService } from '@src/services/internal/useTheme.service';
import type { Theme } from '@src/types';
import { tools } from './setup/tools';

let initialOptions: SetupOptions = { theme: 'auto' };

@Component({
  selector: 'test-use-theme-host',
  standalone: true,
  template: '',
  providers: [UseThemeService]
})
class UseThemeHostComponent {
  readonly service = inject(UseThemeService);
  readonly theme = signal<Theme>(initialOptions.theme);

  constructor() {
    this.service.configure({ theme: this.theme });
  }
}

@Component({
  selector: 'test-unconfigured-use-theme-host',
  standalone: true,
  template: '',
  providers: [UseThemeService]
})
class UnconfiguredUseThemeHostComponent {
  readonly service = inject(UseThemeService);
}

function setup(options: SetupOptions) {
  initialOptions = options;
  TestBed.configureTestingModule({ imports: [UseThemeHostComponent] });
  const fixture = TestBed.createComponent(UseThemeHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  const host = fixture.componentInstance;

  return {
    result: {
      themeClass: host.service.themeClass
    },
    unmount: () => fixture.destroy(),
    rerender: ({ theme }: SetupOptions) => {
      host.theme.set(theme);
      fixture.detectChanges();
    }
  };
}

testUseTheme(setup, tools);

describe('UseThemeService Angular defaults', () => {
  it('uses auto theme before configure is called', () => {
    TestBed.configureTestingModule({ imports: [UnconfiguredUseThemeHostComponent] });
    const fixture = TestBed.createComponent(UnconfiguredUseThemeHostComponent);
    fixture.detectChanges();
    TestBed.tick();

    expect(fixture.componentInstance.service.themeClass()).toBe('theme-light');
    fixture.destroy();
  });
});
