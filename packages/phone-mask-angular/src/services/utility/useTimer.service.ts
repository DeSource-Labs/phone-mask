import { DestroyRef, Injectable, inject } from '@angular/core';

@Injectable()
export class UseTimerService {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clear());
  }

  set(callback: () => void, delay: number): void {
    this.clear();
    this.timer = setTimeout(callback, delay);
  }

  clear(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
