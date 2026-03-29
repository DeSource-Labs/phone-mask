import { defineNuxtModule, createResolver, isNuxtMajorVersion, addPlugin, addImports, addComponent } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';
import { fileURLToPath } from 'url';

export interface ModuleOptions {
  css?: boolean; // Whether to include default CSS, default true
  component?: boolean; // Whether to register the PhoneInput component, default true
  directive?: boolean; // Whether to register the v-phone-mask directive, default true
  types?: boolean; // Whether to include TypeScript types, default true
  helpers?: boolean; // Whether to register shared helpers, default false
  composable?: boolean; // Whether to include the usePhoneMask composable, default false
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'phoneMask',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },
  defaults: {
    css: true,
    component: true,
    directive: true,
    types: true,
    helpers: false,
    composable: false
  },
  async setup(options, nuxt) {
    // Configure transpilation
    const { resolve } = createResolver(import.meta.url);
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url));
    // Transpile runtime
    nuxt.options.build.transpile.push(runtimeDir);

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ types: '@desource/phone-mask-nuxt' });
    });
    // Add runtime plugin before the router plugin
    // https://github.com/nuxt/framework/issues/9130
    nuxt.hook('modules:done', () => {
      if (!isNuxtMajorVersion(2, nuxt) && options.directive) {
        addPlugin(resolve(runtimeDir, 'plugin.phone-mask'));
      }
    });
    // Add enabled imports (helpers, composable, types)
    const shared = resolve(runtimeDir, 'shared');
    if (options.helpers) {
      addImports([
        { name: 'vPhoneMaskSetCountry', from: shared },
        { name: 'PMaskHelpers', from: shared },
        { name: 'vPhoneMask', from: shared },
      ]);
    }
    if (options.composable) {
      addImports({ name: 'usePhoneMask', from: shared });
    }
    if (options.types) {
      addImports([
        { name: 'PCountryKey', from: shared, type: true },
        { name: 'PMaskBase', from: shared, type: true },
        { name: 'PMaskBaseMap', from: shared, type: true },
        { name: 'PMask', from: shared, type: true },
        { name: 'PMaskMap', from: shared, type: true },
        { name: 'PMaskWithFlag', from: shared, type: true },
        { name: 'PMaskWithFlagMap', from: shared, type: true },
        { name: 'PMaskFull', from: shared, type: true },
        { name: 'PMaskFullMap', from: shared, type: true },
        { name: 'PMaskPhoneNumber', from: shared, type: true }
      ]);
    }
    // Add component
    if (options.component) {
      const componentDir = resolve(runtimeDir, 'component');
      addComponent({
        name: 'PhoneInput',
        filePath: componentDir,
        mode: 'client'
      });
    }
    // Add CSS
    if (options.css) {
      nuxt.options.css.unshift('@desource/phone-mask-vue/assets/lib.css');
    }
  }
});

export default module;
