/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import dataJson from '@src/data.json';
import { getFlagEmoji } from '@src/country-code-emodji';
import { Masks, MasksBase, MasksBaseMap, MasksMap, MasksWithFlag, MasksWithFlagMap } from '@src/entries';
import type { CountryKey } from '@src/data-types';

function splitBaseMask(baseMask: string) {
  const splitAt = baseMask.indexOf(' ');
  if (splitAt <= 0 || splitAt === baseMask.length - 1) {
    throw new Error(`Invalid base mask: ${baseMask}`);
  }
  return {
    code: baseMask.slice(0, splitAt),
    mask: baseMask.slice(splitAt + 1)
  };
}

describe('entries parity', () => {
  it('preserves country order and shared mask arrays across export shapes', () => {
    expect(Masks.map(({ id }) => id)).toEqual(Object.keys(dataJson));
    expect(MasksBase.map(({ id }) => id)).toEqual(Object.keys(dataJson));
    expect(MasksWithFlag.map(({ id }) => id)).toEqual(Object.keys(dataJson));

    for (const [index, entry] of Masks.entries()) {
      expect(entry.mask).toBe(MasksMap[entry.id].mask);
      expect(entry.mask).toBe(MasksWithFlag[index].mask);
      expect(entry.mask).toBe(MasksWithFlagMap[entry.id].mask);
      expect(MasksBase[index].mask).toBe(MasksBaseMap[entry.id]);
      expect(MasksBase[index].mask).not.toBe(entry.mask);
      expect(entry).not.toBe(MasksMap[entry.id]);
      expect(MasksWithFlag[index]).not.toBe(MasksWithFlagMap[entry.id]);
    }
  });

  it('keeps entries exports in sync with data.json source of truth', () => {
    const expectedBaseMap = Object.entries(dataJson).reduce<Record<CountryKey, string[]>>(
      (acc, [id, value]) => {
        acc[id as CountryKey] = Array.isArray(value) ? value : [value];
        return acc;
      },
      {} as Record<CountryKey, string[]>
    );

    const expectedMaskMap = Object.entries(expectedBaseMap).reduce<
      Record<CountryKey, { code: string; mask: string[] }>
    >(
      (acc, [id, baseMasks]) => {
        const parts = baseMasks.map(splitBaseMask);
        const code = parts[0]?.code ?? '';
        expect(parts.every((part) => part.code === code)).toBe(true);

        acc[id as CountryKey] = {
          code,
          mask: parts.map((part) => part.mask)
        };
        return acc;
      },
      {} as Record<CountryKey, { code: string; mask: string[] }>
    );

    const expectedWithFlagMap = Object.entries(expectedMaskMap).reduce<
      Record<CountryKey, { code: string; mask: string[]; flag: string }>
    >(
      (acc, [id, value]) => {
        acc[id as CountryKey] = {
          ...value,
          flag: getFlagEmoji(id)
        };
        return acc;
      },
      {} as Record<CountryKey, { code: string; mask: string[]; flag: string }>
    );

    expect(MasksBaseMap).toEqual(expectedBaseMap);
    expect(MasksMap).toEqual(expectedMaskMap);
    expect(MasksWithFlagMap).toEqual(expectedWithFlagMap);

    expect(Object.fromEntries(MasksBase.map((entry) => [entry.id, entry.mask]))).toEqual(MasksBaseMap);
    expect(Object.fromEntries(Masks.map((entry) => [entry.id, { code: entry.code, mask: entry.mask }]))).toEqual(
      MasksMap
    );
    expect(
      Object.fromEntries(
        MasksWithFlag.map((entry) => [entry.id, { code: entry.code, mask: entry.mask, flag: entry.flag }])
      )
    ).toEqual(MasksWithFlagMap);
  });
});
