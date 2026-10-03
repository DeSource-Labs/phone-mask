import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { expectGeneratedRegistrations, getFixtureRoot } from './utils';

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
    await expectGeneratedRegistrations(true);
  });
});
