/// <reference types="vitest/globals" />
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testUseTimer } from '@common/tests/unit/useTimer';
import { UseTimerService } from '@src/services/utility/useTimer.service';
import { tools } from './setup/tools';

@Component({
  standalone: true,
  template: '',
  providers: [UseTimerService]
})
class UseTimerHostComponent {
  readonly service = inject(UseTimerService);
}

function setup() {
  TestBed.configureTestingModule({ imports: [UseTimerHostComponent] });
  const fixture = TestBed.createComponent(UseTimerHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  return {
    result: fixture.componentInstance.service,
    unmount: () => fixture.destroy()
  };
}

testUseTimer(setup, tools);
