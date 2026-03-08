/// <reference types="vitest/globals" />
import type { SetupFn } from './PhoneInput';
import type { TestTools } from './setup/tools';

export function testPhoneInputA11y(setup: SetupFn, { fireEvent, screen, waitFor }: TestTools): void {
  describe('PhoneInput a11y', () => {
    it('exposes accessible names and landmark roles', async () => {
      const { container, unmount } = await setup({
        value: '2025550199',
        detect: false,
        showClear: true
      });

      const group = container.querySelector<HTMLElement>('[role="group"]');
      expect(group?.getAttribute('aria-label')).toBe('Phone input with country selector');

      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-label')).toBe('Phone number');
      expect(input.getAttribute('aria-invalid')).not.toBeNull();

      const selectorButton = screen.getByRole('button', { name: /Selected country:/i });
      expect(selectorButton.getAttribute('aria-haspopup')).toBe('listbox');
      expect(selectorButton.getAttribute('aria-expanded')).toBe('false');

      const toolbar = container.querySelector<HTMLElement>('[role="toolbar"]');
      expect(toolbar?.getAttribute('aria-label')).toBe('Phone input actions');

      const liveRegion = container.querySelector<HTMLElement>('[role="status"]');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');

      const clearButton = container.querySelector<HTMLButtonElement>('.pi-btn-clear');
      expect(clearButton?.getAttribute('aria-label')).toBe('Clear phone number');

      unmount();
    });

    it('renders listbox semantics for the country picker', async () => {
      const { unmount } = await setup({
        value: '2025550199',
        detect: false
      });

      const selectorButton = screen.getByRole('button', { name: /Selected country:/i });
      await fireEvent.click(selectorButton);

      await waitFor(() => {
        if (!document.body.querySelector('[role="listbox"]')) {
          throw new Error('Country listbox is not rendered');
        }
      });

      expect(selectorButton.getAttribute('aria-expanded')).toBe('true');

      const searchInput = document.body.querySelector<HTMLInputElement>('.pi-search');
      expect(searchInput?.getAttribute('aria-label')).toBe('Search countries');

      const listbox = document.body.querySelector<HTMLElement>('[role="listbox"]');
      expect(listbox).not.toBeNull();

      const options = Array.from(document.body.querySelectorAll<HTMLElement>('.pi-option'));
      expect(options.length).toBeGreaterThan(0);
      for (const option of options.slice(0, 3)) {
        expect(option.getAttribute('role')).toBe('option');
        expect(option.hasAttribute('aria-selected')).toBe(true);
      }

      unmount();
    });

    it('links combobox/listbox semantics and restores focus on Escape', async () => {
      const { unmount } = await setup({
        value: '2025550199',
        detect: false
      });

      const selectorButton = screen.getByRole('button', { name: /Selected country:/i });
      await fireEvent.click(selectorButton);

      await waitFor(() => {
        if (!document.body.querySelector<HTMLElement>('[role="listbox"]')) {
          throw new Error('Country listbox is not rendered');
        }
      });

      const listbox = document.body.querySelector<HTMLElement>('[role="listbox"]');
      expect(listbox).not.toBeNull();
      expect(listbox?.id).toBeTruthy();
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
      expect(selectorButton.getAttribute('aria-controls')).toBe(listbox?.id);

      const searchInput = document.body.querySelector<HTMLInputElement>('.pi-search');
      expect(searchInput).not.toBeNull();
      expect(searchInput?.getAttribute('role')).toBe('combobox');
      expect(searchInput?.getAttribute('aria-controls')).toBe(listbox?.id);
      expect(searchInput?.getAttribute('aria-expanded')).toBe('true');

      const initialActive = searchInput?.getAttribute('aria-activedescendant');
      expect(initialActive).toBeTruthy();

      const optionCount = document.body.querySelectorAll('.pi-option').length;
      if (optionCount > 1 && searchInput) {
        await fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
        await waitFor(() => {
          const nextActive = searchInput.getAttribute('aria-activedescendant');
          if (!nextActive || nextActive === initialActive) {
            throw new Error('Active descendant did not move after ArrowDown');
          }
        });
      }

      if (searchInput) {
        await fireEvent.keyDown(searchInput, { key: 'Escape' });
      }

      // React/Svelte use closing animation state; emulate animation completion in jsdom.
      document.body.querySelector<HTMLElement>('.phone-dropdown')?.dispatchEvent(new Event('animationend'));

      await waitFor(() => {
        if (document.activeElement !== selectorButton) {
          throw new Error('Focus was not returned to selector trigger');
        }
      });

      unmount();
    });
  });
}
