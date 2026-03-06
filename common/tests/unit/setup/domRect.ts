export function createRect(top: number, bottom: number, left = 0, width = 100): DOMRect {
  return {
    x: left,
    y: top,
    top,
    bottom,
    left,
    right: left + width,
    width,
    height: bottom - top,
    toJSON: () => ({})
  } as DOMRect;
}
