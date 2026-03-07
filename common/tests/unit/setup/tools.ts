export interface TestTools {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toValue: (val: any) => any;
  act: (fn: () => void | Promise<void>) => Promise<void>;
  waitFor: (fn: () => void) => Promise<void>;
  screen: {
    getByRole(role: string, options?: { name?: RegExp | string }): HTMLElement;
  };
  fireEvent: {
    click(element: Element): void;
    mouseEnter(element: Element): void;
  };
}
