import { ChangeDetectorRef, DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable()
export class UseValidationHintService {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly showValidationHint = signal(false);

  private validationTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearValidationHint());
  }

  clearValidationHint(hideHint = true): void {
    if (hideHint) this.showValidationHint.set(false);
    if (this.validationTimer) clearTimeout(this.validationTimer);
    this.validationTimer = undefined;
  }

  scheduleValidationHint(delay: number): void {
    this.showValidationHint.set(false);
    if (this.validationTimer) clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => {
      this.showValidationHint.set(true);
      this.cdr.markForCheck();
    }, delay);
  }
}
