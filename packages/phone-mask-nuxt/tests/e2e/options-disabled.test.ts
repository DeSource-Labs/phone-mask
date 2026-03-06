import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

const fixtureRoot = fileURLToPath(new URL('../fixtures/options-disabled', import.meta.url));
const getBuildDir = () => {
  const { options, nuxt } = useTestContext();
  if (nuxt?.options.buildDir) {
    return nuxt.options.buildDir;
  }

  const configuredBuildDir = (options.nuxtConfig.buildDir as string | undefined) ?? '.nuxt';
  return configuredBuildDir.startsWith('/') ? configuredBuildDir : resolve(options.rootDir, configuredBuildDir);
};

await setup({
  rootDir: fixtureRoot
});

describe('Nuxt module contract: disabled options fixture', () => {
  it('renders without directive registration when options disable it', async () => {
    const html = await $fetch('/');

    expect(html).toContain('phone-mask-nuxt:options-off-ok');
    expect(html).toContain('id="directive-status">directive:no</div>');
  });

  it('does not generate helper imports or PhoneInput component typing', async () => {
    const buildDir = getBuildDir();
    const importsDts = await readFile(resolve(buildDir, 'imports.d.ts'), 'utf8');
    const componentsDts = await readFile(resolve(buildDir, 'components.d.ts'), 'utf8');

    expect(importsDts).not.toContain('PMaskHelpers');
    expect(importsDts).not.toContain('vPhoneMaskSetCountry');
    expect(componentsDts).not.toContain('PhoneInput');
  });
});
