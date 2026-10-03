import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { expectGeneratedRegistrations, getFixtureRoot } from './utils';

const fixtureRoot = getFixtureRoot('../fixtures/options-disabled', import.meta.url);

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
    await expectGeneratedRegistrations(false);
  });
});
