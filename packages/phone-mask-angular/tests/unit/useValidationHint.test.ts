/// <reference types="vitest/globals" />
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testUseValidationHint } from '@common/tests/unit/useValidationHint';
import { UseValidationHintService } from '@src/services/internal/useValidationHint.service';
import { tools } from './setup/tools';

@Component({
  standalone: true,
  template: '',
  providers: [UseValidationHintService]
})
class UseValidationHintHostComponent {
  readonly service = inject(UseValidationHintService);
}

function setup() {
  TestBed.configureTestingModule({ imports: [UseValidationHintHostComponent] });
  const fixture = TestBed.createComponent(UseValidationHintHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  return {
    result: fixture.componentInstance.service,
    unmount: () => fixture.destroy()
  };
}

testUseValidationHint(setup, tools);
