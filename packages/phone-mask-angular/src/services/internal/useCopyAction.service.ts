import { ChangeDetectorRef, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { UseClipboardService } from '../utility/useClipboard.service';

interface UseCopyActionOptions {
  fullFormatted: () => string;
  liveElement?: () => HTMLElement | null | undefined;
  onCopy?: (value: string) => void;
}

const DELAY = 1_800;

@Injectable()
export class UseCopyActionService {
  private readonly clipboard = inject(UseClipboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private fullFormattedGetter = () => '';
  private liveElementGetter: () => HTMLElement | null | undefined = () => undefined;
  private onCopy: ((value: string) => void) | undefined;
  private liveTimer: ReturnType<typeof setTimeout> | undefined;

  readonly copied = signal(false);
  readonly copyAriaLabel = computed(() => (this.copied() ? 'Copied' : `Copy ${this.fullFormattedGetter()}`));
  readonly copyButtonTitle = computed(() => (this.copied() ? 'Copied' : 'Copy phone number'));

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.liveTimer) clearTimeout(this.liveTimer);
    });
  }

  configure(options: UseCopyActionOptions): void {
    this.fullFormattedGetter = options.fullFormatted;
    this.liveElementGetter = options.liveElement ?? this.liveElementGetter;
    this.onCopy = options.onCopy;
  }

  async onCopyClick(): Promise<void> {
    const value = this.fullFormattedGetter().trim();
    const success = await this.clipboard.copy(value, DELAY);

    if (!success) return;

    this.copied.set(true);
    this.onCopy?.(value);
    this.announceToScreenReader('Phone number copied to clipboard');

    setTimeout(() => {
      this.copied.set(false);
      this.cdr.markForCheck();
    }, DELAY);
  }

  private announceToScreenReader(message: string): void {
    const live = this.liveElementGetter();
    if (!live) return;

    live.textContent = message;
    if (this.liveTimer) clearTimeout(this.liveTimer);
    this.liveTimer = setTimeout(() => {
      live.textContent = '';
    }, DELAY);
  }
}
