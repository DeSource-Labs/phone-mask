// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TestTools {
  act: (fn: () => void | Promise<void>) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toValue: (val: any) => any;
}
