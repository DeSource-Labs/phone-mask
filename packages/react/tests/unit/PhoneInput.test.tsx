/// <reference types="vitest/globals" />
import { createRef, useState, type RefObject } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneInput } from '@src/components/PhoneInput';
import type { PhoneInputRef } from '@src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools, createResultProxy } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';
import type { CountryKey } from '@desource/phone-mask';

const setup: SetupFn = ({
  value = '',
  id,
  name,
  detect = false,
  showClear,
  showCopy,
  disabled,
  readonly,
  country,
  disableDefaultStyles,
  withCustomRenderers
} = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const inputRef = createRef<PhoneInputRef>();

  const customRenderProps = withCustomRenderers
    ? {
        dropdownClass: 'custom-dropdown',
        onFocus,
        onBlur,
        renderActionsBefore: () => <span data-testid="actions-before">Before</span>,
        renderFlag: (c: { id: string }) => <span data-testid="flag-custom">{c.id}</span>,
        renderCopySvg: (copied: boolean) => <span data-testid="copy-custom">{copied ? 'copied' : 'copy'}</span>,
        renderClearSvg: () => <span data-testid="clear-custom">clear</span>
      }
    : {
        onFocus,
        onBlur
      };

  function Harness() {
    const [digits, setDigits] = useState(value);
    return (
      <PhoneInput
        ref={inputRef}
        value={digits}
        id={id}
        name={name}
        onChange={(nextDigits) => {
          onChange(nextDigits);
          setDigits(nextDigits);
        }}
        onCountryChange={onCountryChange}
        onCopy={onCopy}
        detect={detect}
        showClear={showClear}
        showCopy={showCopy}
        disabled={disabled}
        readonly={readonly}
        country={country as CountryKey | undefined}
        disableDefaultStyles={disableDefaultStyles}
        {...customRenderProps}
      />
    );
  }

  const { container, unmount } = render(<Harness />);

  if (!inputRef.current) throw new Error('PhoneInput ref is not created');

  return {
    ref: createResultProxy(inputRef as RefObject<PhoneInputRef>),
    onChange,
    onCountryChange,
    onCopy,
    onFocus,
    onBlur,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);

afterEach(() => vi.restoreAllMocks());

it('keeps the imperative ref stable through dropdown and copy updates', async () => {
  const ref = vi.fn<(value: PhoneInputRef | null) => void>();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const props = { detect: false, value: '2025550199', locale: 'en', ref };
  const { rerender, unmount } = render(<PhoneInput {...props} />);
  const handle = ref.mock.calls.at(-1)![0]!;
  ref.mockClear();

  fireEvent.click(screen.getByRole('button', { name: /Selected country:/ }));
  const search = screen.getByRole('combobox');
  fireEvent.change(search, { target: { value: '+4' } });
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.mouseEnter(screen.getAllByRole('option')[0]!);
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  fireEvent.keyDown(search, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: /^Copy / }));
  await screen.findByRole('button', { name: 'Copied' });
  rerender(<PhoneInput {...props} theme="dark" />);

  expect(writeText).toHaveBeenCalledOnce();
  expect(ref).not.toHaveBeenCalled();
  expect(handle.getDigits()).toBe(props.value);

  rerender(<PhoneInput {...props} value="2025550100" />);
  expect(ref.mock.calls.at(-1)![0]!.getDigits()).toBe('2025550100');
  unmount();
  expect(ref).toHaveBeenLastCalledWith(null);
});

it('does not rebind dropdown listeners, reposition or refocus on search and parent updates', async () => {
  const props = { detect: false, locale: 'en' };
  const { container, rerender, unmount } = render(<PhoneInput {...props} />);
  fireEvent.keyDown(screen.getByRole('button', { name: /Selected country:/ }), { key: 'ArrowDown' });
  const search = screen.getByRole('combobox');
  await waitFor(() => expect(document.activeElement).toBe(search));
  const addListener = vi.spyOn(globalThis, 'addEventListener');
  const removeListener = vi.spyOn(globalThis, 'removeEventListener');
  const measure = vi.spyOn(container.firstElementChild!, 'getBoundingClientRect');
  const focus = vi.spyOn(search, 'focus');

  fireEvent.change(search, { target: { value: '+4' } });
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.mouseEnter(screen.getAllByRole('option')[0]!);
  rerender(<PhoneInput {...props} theme="dark" />);

  expect(addListener).not.toHaveBeenCalled();
  expect(removeListener).not.toHaveBeenCalled();
  expect(measure).not.toHaveBeenCalled();
  expect(focus).not.toHaveBeenCalled();
  fireEvent.keyDown(search, { key: 'Escape' });
  expect(removeListener.mock.calls.map(([event]) => event)).toEqual(['pointerdown', 'keydown', 'resize', 'scroll']);
  unmount();
});
