/// <reference types="vitest/globals" />
import type { TestTools } from './tools';

export function deferGeoIp({ act, waitFor }: Pick<TestTools, 'act' | 'waitFor'>) {
  const cacheKey = '@desource/phone-mask:geo';
  const cached = localStorage.getItem(cacheKey);
  localStorage.removeItem(cacheKey);
  let resolveResponse!: (response: Response) => void;
  const response = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });
  const fetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(response);

  return {
    fetch,
    resolve: (country: string) =>
      act(async () => {
        resolveResponse(new Response(JSON.stringify({ country_code: country })));
        await waitFor(() => expect(localStorage.getItem(cacheKey)).toContain(country));
      }),
    restore: () => {
      fetch.mockRestore();
      if (cached === null) localStorage.removeItem(cacheKey);
      else localStorage.setItem(cacheKey, cached);
    }
  };
}
