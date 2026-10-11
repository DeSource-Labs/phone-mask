import { createSSRApp, h, type App } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { testPhoneInputSsr, type SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
import { PhoneInput } from '@src/index';
import { act } from './setup/tools';

const page = ({ value = '2025550123', detect = false, count = 1, customFlag, ...props }: SsrOptions) => ({
  render: () =>
    h('main', [
      h('p', { id: 'before' }, 'Before'),
      ...Array.from({ length: count }, () =>
        h(
          PhoneInput,
          { modelValue: value, detect, ...props },
          customFlag
            ? {
                flag: ({ country }: { country: { name: string } }) =>
                  country.name.length > 15
                    ? h('abbr', { title: country.name }, country.name.slice(0, 15) + '…')
                    : country.name
              }
            : undefined
        )
      ),
      h('p', { id: 'after' }, 'After')
    ])
});

let app: App | undefined;
testPhoneInputSsr({
  render: (options) => renderToString(createSSRApp(page(options))),
  hydrate: (container, options) =>
    act(() => {
      app = createSSRApp(page(options));
      app.mount(container);
    }),
  act,
  unmount: async () => {
    app?.unmount();
    app = undefined;
  }
});
