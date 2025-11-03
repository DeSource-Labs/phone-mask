export type FormatResult = {
  display: string;
  map: number[];
};

/** Ensure mask is an array of strings */
export function toArray<T>(mask: T | T[]): T[] {
  return Array.isArray(mask) ? mask : [mask];
}

/** Count number of placeholders (#) in a mask string */
export function countPlaceholders(maskStr: string): number {
  return (maskStr.match(/#/g) || []).length;
}

/** Remove country code prefix (e.g., +1 ) from a mask string */
export function removeCountryCodePrefix(maskStr: string): string {
  return maskStr.replace(/^\+\d+\s?/, '');
}

/** Pick the most suitable mask variant based on typed digits count */
export function pickMaskVariant(variants: string[], typedDigitsCount: number): string {
  if (variants.length === 1) return variants[0]!;

  const withCounts = variants.map((m) => ({
    mask: m,
    count: countPlaceholders(m)
  }));

  // Find the smallest mask that can accommodate the typed digits
  const candidates = withCounts.filter((v) => v.count >= typedDigitsCount).sort((a, b) => a.count - b.count);

  if (candidates.length > 0) return candidates[0]!.mask;

  // If no mask is large enough, return the largest available
  const fallback = withCounts.sort((a, b) => b.count - a.count)[0];
  return fallback ? fallback.mask : variants[0]!;
}

/** Formatting with mapping for efficient position tracking */
export function formatDigitsWithMap(maskTemplate: string, digitStr: string): FormatResult {
  let output = '';
  const map: number[] = [];
  let digitIndex = 0;
  const digitLength = digitStr.length;
  const templateLength = maskTemplate.length;

  for (let i = 0; i < templateLength; i++) {
    const char = maskTemplate[i];

    if (char === '#') {
      if (digitIndex < digitLength) {
        output += digitStr[digitIndex];
        map.push(digitIndex);
        digitIndex++;
      } else {
        break; // No more digits to insert
      }
    } else {
      // Only add separator if we have output or will fill next placeholder
      const nextHashIndex = maskTemplate.indexOf('#', i + 1);
      const hasMoreDigits = digitIndex < digitLength;
      const willFillNext = nextHashIndex !== -1 && hasMoreDigits;

      if (output.length > 0 || willFillNext) {
        output += char;
        map.push(-1);
      }
    }
  }

  return { display: output, map };
}
