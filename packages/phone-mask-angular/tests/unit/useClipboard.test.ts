/// <reference types="vitest/globals" />
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testUseClipboard, type SetupOptions } from '@common/tests/unit/useClipboard';
import { UseClipboardService } from '@src/services/utility/useClipboard.service';
import { tools } from './setup/tools';

let initialOptions: SetupOptions = {};

@Component({
  standalone: true,
  template: '',
  providers: [UseClipboardService]
})
class UseClipboardHostComponent {
  readonly service = inject(UseClipboardService);
}

function setup(options: SetupOptions = {}) {
  initialOptions = options;
  TestBed.configureTestingModule({ imports: [UseClipboardHostComponent] });
  const fixture = TestBed.createComponent(UseClipboardHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  const host = fixture.componentInstance;

  return {
    result: {
      copied: host.service.copied,
      isCopying: host.service.isCopying,
      copy: (text: string) => host.service.copy(text, initialOptions.delay)
    },
    service: host.service,
    unmount: () => fixture.destroy()
  };
}

testUseClipboard(setup, tools);

describe('UseClipboardService Angular fallback', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses textarea fallback when navigator.clipboard is unavailable', async () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true
    });

    const { result, unmount } = setup();

    await tools.act(async () => {
      await result.copy('  +1 234-567-8901  ');
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(tools.toValue(result.copied)).toBe(true);
    unmount();
  });

  it('returns false when textarea fallback cannot copy', async () => {
    const execCommand = vi.fn(() => false);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true
    });

    const { result, unmount } = setup();
    let copied = true;

    await tools.act(async () => {
      copied = await result.copy('+1 234-567-8901');
    });

    expect(copied).toBe(false);
    expect(tools.toValue(result.copied)).toBe(false);
    unmount();
  });

  it('returns false when neither clipboard API nor document body is available', async () => {
    const { result, service, unmount } = setup();
    let copied = true;

    (service as unknown as { document: Document | null }).document = null;

    await tools.act(async () => {
      copied = await result.copy('+1 234-567-8901');
    });

    expect(copied).toBe(false);
    expect(tools.toValue(result.copied)).toBe(false);
    unmount();
  });
});
