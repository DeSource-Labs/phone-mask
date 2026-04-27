/// <reference types="vitest/globals" />

class TestToggleEvent extends Event {
  declare readonly oldState: 'open' | 'closed';
  declare readonly newState: 'open' | 'closed';
  declare readonly source: Element | null;

  constructor(
    type: string,
    init: EventInit & {
      oldState: 'open' | 'closed';
      newState: 'open' | 'closed';
      source?: Element | null;
    }
  ) {
    super(type, init);
    this.oldState = init.oldState;
    this.newState = init.newState;
    this.source = init.source ?? null;
  }
}

export const OPEN_ATTR = 'data-popover-open';

const openPopovers: HTMLElement[] = [];

function removeOpenPopover(popover: HTMLElement) {
  const index = openPopovers.indexOf(popover);
  if (index !== -1) openPopovers.splice(index, 1);
}

if (!('ToggleEvent' in globalThis)) {
  Object.defineProperty(globalThis, 'ToggleEvent', {
    value: TestToggleEvent,
    configurable: true
  });
}

if (!('showPopover' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    value(this: HTMLElement, options?: { source?: HTMLElement }) {
      if (this.hasAttribute(OPEN_ATTR)) {
        throw new DOMException('Popover is already open', 'InvalidStateError');
      }

      this.dispatchEvent(
        new TestToggleEvent('beforetoggle', {
          oldState: 'closed',
          newState: 'open',
          source: options?.source ?? null
        })
      );
      this.setAttribute(OPEN_ATTR, '');
      openPopovers.push(this);
      this.dispatchEvent(
        new TestToggleEvent('toggle', {
          oldState: 'closed',
          newState: 'open',
          source: options?.source ?? null
        })
      );
    },
    configurable: true
  });
}

if (!('hidePopover' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    value(this: HTMLElement) {
      if (!this.hasAttribute(OPEN_ATTR)) {
        throw new DOMException('Popover is already closed', 'InvalidStateError');
      }

      this.dispatchEvent(
        new TestToggleEvent('beforetoggle', {
          oldState: 'open',
          newState: 'closed'
        })
      );
      this.removeAttribute(OPEN_ATTR);
      removeOpenPopover(this);
      this.dispatchEvent(
        new TestToggleEvent('toggle', {
          oldState: 'open',
          newState: 'closed'
        })
      );
    },
    configurable: true
  });
}

globalThis.addEventListener(
  'keydown',
  (event) => {
    if ((event as KeyboardEvent).key !== 'Escape') return;

    openPopovers.at(-1)?.hidePopover();
  },
  true
);

export function attachLightDismiss(dropdownEl: HTMLElement, selectorEl: HTMLElement) {
  const onWindowClick = (event: Event) => {
    if (!dropdownEl.hasAttribute(OPEN_ATTR)) return;

    const target = event.target;
    if (target instanceof Node && (dropdownEl.contains(target) || selectorEl.contains(target))) return;

    dropdownEl.hidePopover();
  };

  globalThis.addEventListener('click', onWindowClick, true);

  return () => {
    globalThis.removeEventListener('click', onWindowClick, true);
  };
}

afterEach(() => {
  openPopovers.splice(0);
  document.querySelectorAll(`[${OPEN_ATTR}]`).forEach((el) => {
    el.removeAttribute(OPEN_ATTR);
  });
});
