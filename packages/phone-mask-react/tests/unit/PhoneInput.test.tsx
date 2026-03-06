/// <reference types="vitest/globals" />
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PhoneInput } from '../../src/components/PhoneInput';
import type { PhoneInputRef } from '../../src/types';

describe('PhoneInput ref API', () => {
  it('exposes imperative methods through forwarded ref', async () => {
    const onChange = vi.fn();
    const inputRef = createRef<PhoneInputRef>();

    render(<PhoneInput ref={inputRef} value="20255501" onChange={onChange} country="US" detect={false} />);

    const input = screen.getByRole('textbox');

    expect(inputRef.current).not.toBeNull();
    expect(inputRef.current?.getDigits()).toBe('20255501');
    expect(typeof inputRef.current?.isComplete()).toBe('boolean');
    expect(inputRef.current?.isValid()).toBe(inputRef.current?.isComplete());

    inputRef.current?.clear();
    expect(onChange).toHaveBeenCalledWith('');

    inputRef.current?.focus();
    await waitFor(() => expect(document.activeElement).toBe(input));

    inputRef.current?.blur();
    await waitFor(() => expect(document.activeElement).not.toBe(input));
  });
});
