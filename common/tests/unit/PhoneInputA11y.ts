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
  });
}
