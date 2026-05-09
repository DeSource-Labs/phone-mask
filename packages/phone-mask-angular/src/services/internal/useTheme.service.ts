import { ChangeDetectorRef, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { Theme } from '../../types';

@Injectable()
export class UseThemeService {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemDark = signal(false);
  private themeGetter: () => Theme = () => 'auto';
  private mediaQuery: MediaQueryList | undefined;

  readonly themeClass = computed(() => {
    const theme = this.themeGetter();
    if (theme === 'auto') return this.systemDark() ? 'theme-dark' : 'theme-light';
    return `theme-${theme}`;
  });

  constructor() {
    this.mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? undefined;
    if (this.mediaQuery) {
      this.systemDark.set(this.mediaQuery.matches);
      this.mediaQuery.addEventListener('change', this.handleThemeChange);
    }

    this.destroyRef.onDestroy(() => {
      this.mediaQuery?.removeEventListener('change', this.handleThemeChange);
    });
  }

  configure(options: { theme: () => Theme }): void {
    this.themeGetter = options.theme;
  }

  private readonly handleThemeChange = (event: MediaQueryListEvent) => {
    this.systemDark.set(event.matches);
    this.cdr.markForCheck();
  };
}
