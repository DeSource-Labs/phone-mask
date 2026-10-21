/*
 * country-code-emoji
 * Version: 2.3.0
 * Copyright (c) 2022 country-code-emoji Developers
 * License: https://github.com/thekelvinliu/country-code-emoji/blob/main/LICENSE
 */

const CC_REGEX = /^[a-z]{2}$/i; // Country code regex
const OFFSET = 127397; // Offset between uppercase ascii and regional indicator symbols

/**
 * Converts country ISO code to corresponding flag emoji.
 * Throws a TypeError if the input is not a valid ISO 3166-1 alpha-2 country code.
 *
 * @example getFlagEmoji('US') // "🇺🇸"
 * @param {string} cc - country code string
 * @returns {string} flag emoji
 */
export const getFlagEmoji = (cc: string): string => {
  if (!CC_REGEX.test(cc)) {
    const type = typeof cc;
    throw new TypeError(
      `cc argument must be an ISO 3166-1 alpha-2 string, but got '${type === 'string' ? cc : type}' instead.`
    );
  }

  const codePoints = [...cc.toUpperCase()].map((c) => (c.codePointAt(0) ?? 0) + OFFSET);
  return String.fromCodePoint(...codePoints);
};

/** INTERNAL: Converts country ISO code to flag emoji without validation */
export const ccToEmoji = (cc: string): string =>
  String.fromCodePoint(cc.charCodeAt(0) + OFFSET, cc.charCodeAt(1) + OFFSET);
