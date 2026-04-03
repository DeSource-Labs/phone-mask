import type { ShallowRef } from 'vue';

interface Context7WidgetApi {
  toggle: () => void;
  close: () => void;
  isOpen: () => boolean;
  host?: HTMLElement | null;
  shadowRoot?: ShadowRoot | null;
}

export type Context7ButtonExpose = {
  triggerRef: Readonly<ShallowRef<HTMLButtonElement | null>>;
};

type RootRef = Readonly<ShallowRef<Context7ButtonExpose | null>>;

const context7ThemeStyleId = 'phone-mask-context7-theme';

const context7ThemeCssBase = `
.c7-panel {
  border-radius: 24px !important;
  border: 1px solid rgba(148, 163, 184, 0.28) !important;
  background:
    radial-gradient(140% 80% at 0% 0%, rgba(79, 70, 229, 0.16), transparent 52%),
    radial-gradient(140% 80% at 100% 100%, rgba(56, 189, 248, 0.12), transparent 56%),
    rgba(6, 10, 18, 0.88) !important;
  backdrop-filter: blur(22px) saturate(135%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06),
    0 24px 72px rgba(0, 0, 0, 0.58),
    0 0 0 1px rgba(255, 255, 255, 0.03) !important;
}

.c7-header,
.c7-input-area,
.c7-footer {
  background: rgba(4, 8, 16, 0.34) !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}

.c7-header-title {
  color: #f8fafc !important;
  letter-spacing: 0.01em;
}

.c7-close {
  color: #cbd5e1 !important;
}

.c7-close:hover {
  color: #ffffff !important;
}

.c7-msg.assistant,
.c7-tool-call {
  background: rgba(148, 163, 184, 0.14) !important;
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #e2e8f0 !important;
}

.c7-msg.user {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(37, 99, 235, 0.95)) !important;
}

.c7-input {
  background: rgba(6, 10, 18, 0.62) !important;
  border: 1px solid rgba(129, 140, 248, 0.42) !important;
  color: #f8fafc !important;
}

.c7-input::placeholder {
  color: #94a3b8 !important;
}

.c7-input:focus {
  border-color: rgba(129, 140, 248, 0.76) !important;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2) !important;
}

.c7-send {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.98), rgba(59, 130, 246, 0.98)) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 8px 20px rgba(37, 99, 235, 0.35) !important;
}

.c7-send:hover {
  opacity: 1 !important;
  filter: brightness(1.08);
}

.c7-msg.assistant code {
  background: rgba(51, 65, 85, 0.68) !important;
  color: #f8fafc !important;
}

.c7-msg.assistant pre,
.c7-tool-content pre {
  background: rgba(2, 6, 23, 0.94) !important;
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.c7-msg.error {
  background: rgba(220, 38, 38, 0.12) !important;
  border: 1px solid rgba(220, 38, 38, 0.24) !important;
  color: #fecaca !important;
}

.c7-powered {
  color: #cbd5e1 !important;
}

.c7-powered:hover {
  color: #ffffff !important;
}

.c7-powered .c7-logo path:not(:last-child) {
  fill: #000000 !important;
}
`;

const maxReadyCheckAttempts = 300; // ~ from 100ms up to capped backoff, then give up
const initialReadyCheckDelayMs = 100;
const maxReadyCheckDelayMs = 5000;

export function useContext7(rootRefs: Array<RootRef>) {
  let readyCheckAttempts = 0;
  let readyCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const context7Ready = ref(false);

  const getContext7Widget = (): Context7WidgetApi | undefined => {
    const globalWithWidget = globalThis as typeof globalThis & { Context7Widget?: Context7WidgetApi };
    return globalWithWidget.Context7Widget;
  };

  const applyContext7Theme = (widget: Context7WidgetApi): boolean => {
    const root = widget.shadowRoot;
    if (!root) return false;

    const existing = root.getElementById(context7ThemeStyleId) as HTMLStyleElement | null;
    const cssText = context7ThemeCssBase;

    if (existing) {
      if (existing.textContent !== cssText) {
        existing.textContent = cssText;
      }
      return true;
    }

    const style = document.createElement('style');
    style.id = context7ThemeStyleId;
    style.textContent = cssText;
    root.appendChild(style);
    return true;
  };

  const checkContext7Ready = () => {
    const widget = getContext7Widget();

    if (widget && applyContext7Theme(widget)) {
      context7Ready.value = true;
      readyCheckAttempts = 0;
      return;
    }

    // Widget not available or theming failed – retry with bounded backoff
    readyCheckAttempts += 1;

    if (readyCheckAttempts >= maxReadyCheckAttempts) {
      // Give up to avoid an infinite loop; mark as not ready
      context7Ready.value = false;
      return;
    }

    const backoffFactor = Math.pow(2, readyCheckAttempts - 1);
    const delay = Math.min(initialReadyCheckDelayMs * backoffFactor, maxReadyCheckDelayMs);

    context7Ready.value = false;
    readyCheckTimeoutId = setTimeout(checkContext7Ready, delay);
  };

  const toggleContext7 = () => {
    getContext7Widget()?.toggle();
  };

  const isTriggerElement = (target: Node) => {
    return rootRefs.some((rootRef) => {
      const triggerRef = rootRef.value?.triggerRef;
      if (!triggerRef) return false;

      if (triggerRef instanceof HTMLElement) {
        return triggerRef.contains(target);
      }

      if (triggerRef?.value) {
        const element = triggerRef.value;
        return element instanceof HTMLElement ? element.contains(target) : false;
      }

      return false;
    });
  };

  const handleDocumentPointerDown = (event: PointerEvent) => {
    const widget = getContext7Widget();
    if (!widget?.isOpen()) return;

    const target = event.target as Node | null;
    if (!target) return;
    if (isTriggerElement(target)) return;
    if (target instanceof Element && target.closest('.context7__button')) return;
    if (widget.host && event.composedPath().includes(widget.host)) return;

    widget.close();
  };

  onMounted(() => {
    checkContext7Ready();
    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  });

  onBeforeUnmount(() => {
    if (readyCheckTimeoutId !== null) {
      clearTimeout(readyCheckTimeoutId);
    }
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
  });

  return {
    context7Ready,
    toggleContext7
  };
}
