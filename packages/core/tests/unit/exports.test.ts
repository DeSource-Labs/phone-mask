/// <reference types="vitest/globals" />
import * as root from '../../src';
import * as kit from '../../src/kit';

describe('public exports', () => {
  it('keeps the root entry focused on mask data', () => {
    expect(typeof root.MasksFull).toBe('function');
    expect(typeof root.getFlagEmoji).toBe('function');
    expect('createPhoneFormatter' in root).toBe(false);
    expect('processInput' in root).toBe(false);
  });

  it('exposes behavior utilities from the kit subpath', () => {
    expect(typeof kit.createPhoneFormatter).toBe('function');
    expect(typeof kit.processInput).toBe('function');
    expect(typeof kit.filterCountries).toBe('function');
  });
});
