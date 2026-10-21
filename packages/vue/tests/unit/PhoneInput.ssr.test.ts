import { createSSRApp, h, ref, type App, type Ref } from 'vue';
import type { MaskFull } from '@desource/phone-mask';
import type { PhoneNumber } from '@src/types';
import { renderToString } from 'vue/server-renderer';
import { testPhoneInputSsr, type SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
import { PhoneInput } from '@src/index';
import { act } from './setup/tools';

const page = ({
  value = '2025550123',
  detect = false,
  count = 1,
  customFlag,
  observeCallbacks,
  onNotify,
  ...props
}: SsrOptions) => ({
  setup() {
    const model = ref(value);
    const country = ref('pending');
    const phone = ref('pending');
    const validation = ref<boolean>();
    const update = <T>(state: Ref<T>, value: T) => {
      state.value = value;
      onNotify?.();
    };
    const callbacks = observeCallbacks
      ? {
          'onUpdate:modelValue': (value: string) => update(model, value),
          onCountryChange: (value: MaskFull) => update(country, value.id),
          onChange: (value: PhoneNumber) => update(phone, value.fullFormatted),
          onValidationChange: (value: boolean) => update(validation, value)
        }
      : {};

    return () =>
      h('main', [
        h('p', { id: 'before' }, 'Before'),
        ...Array.from({ length: count }, () =>
          h(
            PhoneInput,
            { modelValue: model.value, detect, ...props, ...callbacks },
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
        observeCallbacks &&
          h('div', [
            h('span', { id: 'parent-country' }, country.value),
            h('span', { id: 'parent-phone' }, phone.value),
            h('span', { id: 'parent-value' }, model.value),
            validation.value !== undefined && h('span', { id: 'parent-validation' }, String(validation.value))
          ]),
        h('p', { id: 'after' }, 'After')
      ]);
  }
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
