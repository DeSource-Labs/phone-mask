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
    unmount: () => fixture.destroy()
  };
}

testUseClipboard(setup, tools);
