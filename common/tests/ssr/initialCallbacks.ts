import { deepStrictEqual } from 'node:assert';

export function readInitialCallbacks(root: ParentNode = document) {
  return {
    country: root.querySelector('#parent-country')?.textContent ?? null,
    phone: root.querySelector('#parent-phone')?.textContent ?? null,
    value: root.querySelector('#parent-value')?.textContent ?? null,
    validation: root.querySelector('#parent-validation')?.textContent ?? null
  };
}

type CallbackState = ReturnType<typeof readInitialCallbacks>;

export async function checkInitialCallbacks({
  render,
  hydrate,
  callbacksDuringSsr = false,
  valueAfterHydration = '2025550123'
}: {
  render(): Promise<CallbackState>;
  hydrate(): Promise<CallbackState>;
  callbacksDuringSsr?: boolean;
  valueAfterHydration?: string;
}) {
  const resolved = {
    country: 'US',
    phone: '+1 202-555-0123',
    value: valueAfterHydration,
    validation: 'true'
  };
  const pending = {
    country: 'pending',
    phone: 'pending',
    value: '202555012345',
    validation: null
  };
  deepStrictEqual(await render(), callbacksDuringSsr ? resolved : pending);
  deepStrictEqual(await hydrate(), resolved);
}
