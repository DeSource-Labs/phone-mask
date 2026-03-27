/// <reference types="vitest/globals" />

interface CoreModuleLike {
  getFlagEmoji?: unknown;
  countPlaceholders?: unknown;
  formatDigitsWithMap?: unknown;
  pickMaskVariant?: unknown;
  removeCountryCodePrefix?: unknown;
}

interface IndexContractOptions {
  suiteName: string;
  indexModule: Record<string, unknown>;
  coreModule: CoreModuleLike;
  expectedDefinedExports?: string[];
  expectedFunctionExports?: string[];
}

export function testIndexImports({
  suiteName,
  indexModule,
  coreModule,
  expectedDefinedExports = [],
  expectedFunctionExports = []
}: IndexContractOptions): void {
  describe(`${suiteName} package index`, () => {
    it('exports expected root bindings', () => {
      for (const exportName of expectedDefinedExports) {
        expect(indexModule[exportName]).toBeDefined();
      }
      for (const exportName of expectedFunctionExports) {
        expect(typeof indexModule[exportName]).toBe('function');
      }
    });

    it('re-exports core utilities from dedicated core subpath', () => {
      expect(typeof coreModule.getFlagEmoji).toBe('function');
      expect(typeof coreModule.countPlaceholders).toBe('function');
      expect(typeof coreModule.formatDigitsWithMap).toBe('function');
      expect(typeof coreModule.pickMaskVariant).toBe('function');
      expect(typeof coreModule.removeCountryCodePrefix).toBe('function');
    });
  });
}
