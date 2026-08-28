export type ExportOverheadOverride = {
  package: string;
  exports: string[];
};

export const EMPTY_BENCHMARK_DATA = 'N/A';
export const PACKAGE_STATS_INSTALL_TIMEOUT_MS = 120_000;
export const PHONE_ENGINE_PACKAGES = new Set([
  '@desource/phone-mask',
  'intl-tel-input',
  'libphonenumber-js',
  'google-libphonenumber',
  'awesome-phonenumber'
]);
export const EXPORT_OVERHEAD_OVERRIDES: Record<string, ExportOverheadOverride[]> = {
  'vue-tel-input': [{ package: 'libphonenumber-js', exports: ['parsePhoneNumberFromString'] }],
  '@desource/phone-mask-nuxt': [{ package: '@desource/phone-mask-vue', exports: ['install'] }]
};

export function isFiniteBenchmarkNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatBenchmarkKb(value: number | null | undefined): string {
  return isFiniteBenchmarkNumber(value) ? `${(value / 1024).toFixed(1)} KB` : EMPTY_BENCHMARK_DATA;
}

export function calculateComparableGzip(
  gzip: number | null | undefined,
  dataOverheadGzip: number | null | undefined
): number | null {
  return isFiniteBenchmarkNumber(gzip) && isFiniteBenchmarkNumber(dataOverheadGzip) ? gzip + dataOverheadGzip : null;
}
