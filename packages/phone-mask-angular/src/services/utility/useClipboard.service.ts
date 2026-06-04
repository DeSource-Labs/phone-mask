import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable()
export class UseClipboardService {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT, { optional: true });

  readonly copied = signal(false);
  readonly isCopying = signal(false);

  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resetTimer) clearTimeout(this.resetTimer);
    });
  }

  async copy(value: string, resetDelay = 1_800): Promise<boolean> {
    if (this.isCopying()) return false;

    const text = value.trim();
    if (!text) return false;

    this.isCopying.set(true);

    try {
      const success = await this.writeText(text);
      if (!success) return false;

      this.copied.set(true);

      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        this.copied.set(false);
        this.cdr.markForCheck();
      }, resetDelay);

      return true;
    } finally {
      this.isCopying.set(false);
    }
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
    } catch (err) {
      console.warn('Copy failed', err);
      return false;
    }
  }
}
