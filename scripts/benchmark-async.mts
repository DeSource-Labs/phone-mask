/** Retry failed operations with a 300 ms linear backoff between attempts. */
export async function retry<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts must be a positive integer');
  }

  const run = async (attempt: number): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, 300 * attempt));
      return run(attempt + 1);
    }
  };

  return run(1);
}

/** Preserve result order while limiting active operations. Use a limit of 1 for shared files. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('limit must be a positive integer');
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    if (nextIndex >= items.length) return;
    const currentIndex = nextIndex;
    nextIndex += 1;
    results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    return worker();
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
