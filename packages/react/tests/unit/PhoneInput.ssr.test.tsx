import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { testPhoneInputSsr, type SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
import { PhoneInput } from '@src/components/PhoneInput';
import { usePhoneMask } from '@src/hooks/usePhoneMask';
import { tools } from './setup/tools';

const page = ({ value = '2025550123', detect = false, count = 1, customFlag, ...props }: SsrOptions) => (
  <main>
    <p id="before">Before</p>
    {Array.from({ length: count }, (_, index) => (
      <PhoneInput
        key={index}
        value={value}
        detect={detect}
        onChange={() => {}}
        {...props}
        renderFlag={
          customFlag
            ? (country) =>
                country.name.length > 15 ? <abbr title={country.name}>{country.name.slice(0, 15)}…</abbr> : country.name
            : undefined
        }
      />
    ))}
    <p id="after">After</p>
  </main>
);

let root: Root | undefined;
testPhoneInputSsr({
  render: (options) => renderToString(page(options)),
  hydrate: (container, options, onRecoverableError) =>
    tools.act(() => {
      root = hydrateRoot(container, page(options), { onRecoverableError });
    }),
  act: tools.act,
  unmount: () =>
    tools.act(() => {
      root?.unmount();
      root = undefined;
    })
});

it('preserves usePhoneMask input attributes when browser locale resolves after hydration', async () => {
  const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
  function Harness() {
    const { ref } = usePhoneMask({ value: '2025550123', detect: false, onChange: () => {} });
    return <input ref={ref} />;
  }
  const container = document.createElement('div');
  document.body.append(container);
  try {
    container.innerHTML = renderToString(<Harness />);
    const input = container.querySelector('input');
    await tools.act(() => {
      root = hydrateRoot(container, <Harness />);
    });
    expect(container.querySelector('input')).toBe(input);
    expect(input?.type).toBe('tel');
    expect(input?.inputMode).toBe('tel');
    expect(input?.value).toBe('202-555-0123');
  } finally {
    await tools.act(() => root?.unmount());
    root = undefined;
    container.remove();
    language.mockRestore();
  }
});
