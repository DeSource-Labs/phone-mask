/*
 * country-code-emoji
 * Version: 2.3.0
 * Copyright (c) 2022 country-code-emoji Developers
 * License: https://github.com/thekelvinliu/country-code-emoji/blob/main/LICENSE
 */

const CC_REGEX = /^[a-z]{2}$/i; // Country code regex
const OFFSET = 127397; // Offset between uppercase ascii and regional indicator symbols

/**
 * Convert country code to corresponding flag emoji
 * @param {string} cc - country code string
 * @returns {string} flag emoji
 */
export const countryCodeEmoji = (cc: string): string => {
  if (!CC_REGEX.test(cc)) {
    const type = typeof cc;
    throw new TypeError(
      `cc argument must be an ISO 3166-1 alpha-2 string, but got '${type === 'string' ? cc : type}' instead.`
    );
  }

  const codePoints = [...cc.toUpperCase()].map((c) => (c.codePointAt(0) ?? 0) + OFFSET);
  return String.fromCodePoint(...codePoints);
};
