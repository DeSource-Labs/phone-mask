import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable()
export class UseClipboardService {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT, { optional: true });

  readonly copied = signal(false);

  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resetTimer) clearTimeout(this.resetTimer);
    });
  }

  async copy(value: string, resetDelay = 1_800): Promise<boolean> {
    if (!value) return false;

    const success = await this.writeText(value);
    if (!success) return false;

    this.copied.set(true);

    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.copied.set(false);
      this.cdr.markForCheck();
    }, resetDelay);

    return true;
  }

  private async writeText(value: string): Promise<boolean> {
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(value);
        return true;
      }

      if (!this.document?.body) return false;

      const textarea = this.document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      this.document.body.appendChild(textarea);
      textarea.select();
      const copied = this.document.execCommand('copy');
      textarea.remove();

      return copied;
    } catch {
      return false;
    }
  }
}
