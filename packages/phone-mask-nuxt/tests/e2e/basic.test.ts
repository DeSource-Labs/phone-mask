import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { getBuildDir, getFixtureRoot } from './utils';

const fixtureRoot = getFixtureRoot('../fixtures/basic', import.meta.url);

await setup({
  rootDir: fixtureRoot
});

describe('Nuxt module contract: basic fixture', () => {
  it('renders page with module-provided component/directive/helpers', async () => {
    const html = await $fetch('/');

    expect(html).toContain('phone-mask-nuxt:basic-ok');
    expect(html).toContain('id="helper-flag">🇺🇸</div>');
    expect(html).toContain('id="directive-status">directive:yes</div>');
  });

  it('generates helper imports and PhoneInput component typing', async () => {
    const buildDir = getBuildDir();
    const importsDts = await readFile(resolve(buildDir, 'imports.d.ts'), 'utf8');
    const componentsDts = await readFile(resolve(buildDir, 'components.d.ts'), 'utf8');

    expect(importsDts).toContain('PMaskHelpers');
    expect(importsDts).toContain('vPhoneMaskSetCountry');
    expect(componentsDts).toContain('PhoneInput');
  });
});
