/**
 * Represents the return value of fireEvent methods across different testing libraries.
 *
 * Svelte: Promise<boolean>
 * Vue: Promise<void>
 * React: boolean
 */
type FireEventReturn = Promise<boolean> | Promise<void> | boolean;

export type MaybeRef<T> = T | { value: T };

export interface TestTools {
  toValue: <T>(val: MaybeRef<T>) => T;
  act: (fn: () => void | Promise<void>) => Promise<void>;
  waitFor: (fn: () => void) => Promise<void>;
  screen: {
    getByRole(role: string, options?: { name?: RegExp | string }): HTMLElement;
  };
  fireEvent: {
    click(element: Element): FireEventReturn;
    mouseEnter(element: Element): FireEventReturn;
    input(element: Element, options: { target: { value: string } }): FireEventReturn;
    keyDown(element: Element, options: { key: string }): FireEventReturn;
    focus(element: Element): FireEventReturn;
    blur(element: Element): FireEventReturn;
  };
}
