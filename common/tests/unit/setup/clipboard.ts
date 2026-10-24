/// <reference types="vitest/globals" />

export function setupClipboardMock() {
  const mockWriteText = vi.fn();

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    });
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  return mockWriteText;
}
