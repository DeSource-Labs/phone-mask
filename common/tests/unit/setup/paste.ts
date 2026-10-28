export function makePasteEvent(text: string): ClipboardEvent {
  // ClipboardEvent is not implemented in JSDOM.
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
  return event;
}

export const internationalPasteCases = [
  { text: '+7 12345 6 77 88', country: 'KZ', digits: '1234567788', display: '123 456 7788' },
  { text: '+71234567788', country: 'RU', digits: '1234567788', display: '123 456-77-88' },
  { text: '+4915123456789', country: 'DE', digits: '15123456789', display: '1512 3456789' },
  { text: '+33 (1) 23 45 67 89', country: 'FR', digits: '123456789', display: '1 23 45 67 89' },
  { text: '+390212345678', country: 'IT', digits: '0212345678', display: '021 234 5678' },
  { text: '+2901234', country: 'TA', digits: '1234', display: '1234' },
  { text: '+11234567890', country: 'US', digits: '1234567890', display: '123-456-7890' }
];
