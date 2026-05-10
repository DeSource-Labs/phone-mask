/// <reference types="vitest/globals" />
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DELAY, PHONE, testUseCopyAction, type SetupOptions } from '@common/tests/unit/useCopyAction';
import { UseCopyActionService } from '@src/services/internal/useCopyAction.service';
import { UseClipboardService } from '@src/services/utility/useClipboard.service';
import { tools } from './setup/tools';

let initialOptions: SetupOptions = { fullFormatted: '' };

@Component({
  standalone: true,
  template: '<div #live></div>',
  providers: [UseClipboardService, UseCopyActionService]
})
class UseCopyActionHostComponent {
  readonly service = inject(UseCopyActionService);
  readonly fullFormatted = signal(initialOptions.fullFormatted);
  readonly liveRef = viewChild<ElementRef<HTMLDivElement>>('live');
  readonly onCopy = vi.fn();
  disableLiveRef = initialOptions.disableLiveRef ?? false;

  constructor() {
    this.service.configure({
      fullFormatted: this.fullFormatted,
      liveElement: () => (this.disableLiveRef ? null : this.liveRef()?.nativeElement),
      onCopy: (value) => this.onCopy(value)
    });
  }
}

function setup(options: SetupOptions) {
  initialOptions = options;
  TestBed.configureTestingModule({ imports: [UseCopyActionHostComponent] });
  const fixture = TestBed.createComponent(UseCopyActionHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  const host = fixture.componentInstance;
  const el = fixture.nativeElement.querySelector('div') as HTMLDivElement;

  return {
    result: {
      copied: host.service.copied,
      copyAriaLabel: host.service.copyAriaLabel,
      copyButtonTitle: host.service.copyButtonTitle,
      onCopyClick: () => host.service.onCopyClick()
    },
    unmount: () => fixture.destroy(),
    rerender: ({ fullFormatted }: { fullFormatted: string }) => {
      host.fullFormatted.set(fullFormatted);
      fixture.detectChanges();
    },
    el,
    onCopy: host.onCopy
  };
}

testUseCopyAction(setup, tools);

describe('UseCopyActionService Angular live region timer', () => {
  it('replaces the pending live-region clear timer on repeated successful copy', async () => {
    const { result, el, unmount } = setup({ fullFormatted: PHONE });

    await tools.act(async () => {
      await result.onCopyClick();
    });

    await tools.act(async () => {
      vi.advanceTimersByTime(DELAY - 1);
      await result.onCopyClick();
    });

    await tools.act(async () => {
      vi.advanceTimersByTime(DELAY - 1);
    });

    expect(el.textContent).toBe('Phone number copied to clipboard');

    await tools.act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(el.textContent).toBe('');
    unmount();
  });
});
