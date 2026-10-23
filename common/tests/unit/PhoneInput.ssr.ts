/// <reference types="vitest/globals" />

import { checkInitialCallbacks, readInitialCallbacks } from '../ssr/initialCallbacks';

export interface SsrOptions {
  value?: string;
  detect?: boolean;
  locale?: string;
  theme?: 'light' | 'dark' | 'auto';
  count?: number;
  customFlag?: boolean;
  observeCallbacks?: boolean;
  onNotify?: () => void;
}

export interface SsrAdapter {
  render(options: SsrOptions): string | Promise<string>;
  hydrate(container: HTMLElement, options: SsrOptions, onError: (error: unknown) => void): Promise<void>;
  act(callback: () => void | Promise<void>): Promise<void>;
  unmount(): Promise<void>;
}

export function testPhoneInputSsr(adapter: SsrAdapter): void {
  describe('PhoneInput SSR', () => {
    let container: HTMLDivElement;
    let diagnostics: unknown[];
    const media = vi.fn();
    const fetch = vi.fn();

    beforeEach(() => {
      container = document.createElement('div');
      document.body.append(container);
      localStorage.clear();
      diagnostics = [];
      vi.spyOn(console, 'error').mockImplementation((...args) => diagnostics.push(args));
      vi.spyOn(console, 'warn').mockImplementation((...args) => diagnostics.push(args));
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      media.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
      fetch.mockImplementation(() => Promise.resolve(Response.json({ country_code: 'DE' })));
      vi.stubGlobal('matchMedia', media);
      vi.stubGlobal('fetch', fetch);
    });

    afterEach(async () => {
      try {
        await adapter.unmount();
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(diagnostics).toEqual([]);
      } finally {
        container.remove();
        localStorage.clear();
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
      }
    });

    const render = async (options: SsrOptions = {}) => {
      container.innerHTML = await adapter.render(options);
    };

    const hydrate = async (options: SsrOptions = {}) => {
      const nodes = [...container.querySelectorAll('input[type="tel"], #before, #after')];
      expect(nodes).toHaveLength((options.count ?? 1) + 2);
      await adapter.hydrate(container, options, (error) => diagnostics.push(error));
      const hydratedNodes = [...container.querySelectorAll('input[type="tel"], #before, #after')];
      expect(hydratedNodes).toHaveLength(nodes.length);
      hydratedNodes.forEach((node, index) => expect(node).toBe(nodes[index]));
      expect(diagnostics).toEqual([]);
    };

    it('renders formatted inputs on repeated SSR requests without browser effects', async () => {
      const options = { count: 2, detect: true };
      const responses = [await adapter.render(options), await adapter.render(options)];
      for (const html of responses) {
        container.innerHTML = html;
        const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type="tel"]')];
        expect(inputs.map((input) => input.value)).toEqual(['202-555-0123', '202-555-0123']);
        expect(container.querySelectorAll('.theme-light')).toHaveLength(2);
        expect(container.querySelectorAll('[aria-label="Selected country: United States +1"]')).toHaveLength(2);
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
      expect(fetch).not.toHaveBeenCalled();
      expect(media).not.toHaveBeenCalled();
    });

    it('preserves parent state during SSR and delivers initial client callbacks', async () => {
      const options = {
        value: '202555012345',
        detect: false,
        locale: 'en',
        observeCallbacks: true,
        onNotify: vi.fn()
      };
      await checkInitialCallbacks({
        async render() {
          await render(options);
          expect(options.onNotify).not.toHaveBeenCalled();
          expect(container.querySelector<HTMLInputElement>('.pi-input')?.value).toBe('202-555-0123');
          return readInitialCallbacks(container);
        },
        async hydrate() {
          await hydrate(options);
          expect(options.onNotify).toHaveBeenCalled();
          return readInitialCallbacks(container);
        }
      });
    });

    it('hydrates multiple inputs after earlier requests and keeps their portals interactive', async () => {
      const options = { count: 2, locale: 'en', theme: 'light' } as const;
      await adapter.render(options);
      await render(options);
      await hydrate(options);

      const selectors = [...container.querySelectorAll<HTMLButtonElement>('.pi-selector-btn')];
      expect(selectors).toHaveLength(2);
      const ids = selectors.map((selector) => selector.getAttribute('aria-controls'));
      expect(new Set(ids).size).toBe(2);
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);
      const selectGermany = async (selector: HTMLButtonElement) => {
        const dropdown = document.getElementById(selector.getAttribute('aria-controls')!)!;
        expect(dropdown?.parentElement).toBe(document.body);
        await adapter.act(() => selector.click());
        expect(selector.getAttribute('aria-expanded')).toBe('true');
        const search = dropdown.querySelector<HTMLInputElement>('input[type="search"]')!;
        const listbox = dropdown.querySelector('[role="listbox"]')!;
        expect(search.getAttribute('aria-controls')).toBe(listbox.id);
        await adapter.act(() => {
          search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        });
        const activeOption = document.getElementById(search.getAttribute('aria-activedescendant')!);
        expect(activeOption?.getAttribute('role')).toBe('option');
        expect(listbox.contains(activeOption)).toBe(true);
        const germany = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')].find(
          (option) => option.querySelector('.pi-opt-code')?.textContent === '+49'
        )!;
        await adapter.act(() => germany.click());
        expect(selector.getAttribute('aria-expanded')).toBe('false');
        expect(selector.querySelector('.pi-code')?.textContent).toBe('+49');
      };
      await selectGermany(selectors[0]);
      await selectGermany(selectors[1]);
    });

    it.each([false, true])('hydrates a different browser locale with custom flag=%s', async (customFlag) => {
      const options = { customFlag };
      await render(options);
      expect(container.querySelector('.pi-selector-btn')?.getAttribute('aria-label')).toBe(
        'Selected country: United States +1'
      );
      if (customFlag) expect(container.querySelector('.pi-flag abbr')).toBeNull();
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
      await hydrate(options);
      expect(container.querySelector('.pi-selector-btn')?.getAttribute('aria-label')).toBe(
        'Selected country: Vereinigte Staaten +1'
      );
      expect(container.querySelector<HTMLInputElement>('.pi-input')?.value).toBe('202-555-0123');
      if (customFlag) {
        expect(container.querySelector('.pi-flag abbr')?.getAttribute('title')).toBe('Vereinigte Staaten');
        expect(container.querySelector('.pi-flag')?.textContent?.trim()).toBe('Vereinigte Staa…');
      }
    });

    it('reads the system theme only after SSR and hydrates a dark browser', async () => {
      media.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
      await render();
      expect(media).not.toHaveBeenCalled();
      expect(container.querySelector('.desource-phone-input')?.classList.contains('theme-light')).toBe(true);
      await hydrate();
      expect(container.querySelector('.desource-phone-input')?.classList.contains('theme-dark')).toBe(true);
    });

    it('requests GeoIP only after SSR and applies the detected country', async () => {
      const options = { value: '', detect: true, locale: 'en' };
      await render(options);
      expect(fetch).not.toHaveBeenCalled();
      expect(container.querySelector('.pi-code')?.textContent).toBe('+1');
      await hydrate(options);
      await vi.waitFor(async () => {
        await adapter.act(() => {});
        expect(container.querySelector('.pi-code')?.textContent).toBe('+49');
      });
      expect(fetch).toHaveBeenCalledOnce();
    });
  });
}
