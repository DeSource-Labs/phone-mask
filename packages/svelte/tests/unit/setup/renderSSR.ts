import { render as renderComponent } from 'svelte/server';
import type { SsrOptions } from '@common/tests/unit/PhoneInput.ssr';
import SSR from './SSR.svelte';

export const render = (options: SsrOptions): string => renderComponent(SSR, { props: options }).body;
