import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { useTestContext } from '@nuxt/test-utils/e2e';
import { expect } from 'vitest';

export const getFixtureRoot = (fixturePath: string, fromUrl: string) => fileURLToPath(new URL(fixturePath, fromUrl));

export const getBuildDir = () => {
  const { options, nuxt } = useTestContext();
  if (nuxt?.options.buildDir) {
    return nuxt.options.buildDir;
  }

  const configuredBuildDir = (options.nuxtConfig.buildDir as string | undefined) ?? '.nuxt';
  return isAbsolute(configuredBuildDir) ? configuredBuildDir : resolve(options.rootDir, configuredBuildDir);
};

export async function expectGeneratedRegistrations(enabled: boolean) {
  const buildDir = getBuildDir();
  const [importsDts, componentsDts] = await Promise.all([
    readFile(resolve(buildDir, 'imports.d.ts'), 'utf8'),
    readFile(resolve(buildDir, 'components.d.ts'), 'utf8')
  ]);

  for (const [contents, symbol] of [
    [importsDts, 'PMaskHelpers'],
    [importsDts, 'vPhoneMaskSetCountry'],
    [componentsDts, 'PhoneInput']
  ]) {
    const assertion = expect(contents);
    (enabled ? assertion : assertion.not).toContain(symbol);
  }
}
