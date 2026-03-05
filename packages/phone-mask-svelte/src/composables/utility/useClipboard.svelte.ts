import { useTimer } from './useTimer.svelte';

export function useClipboard(delay = 1_800) {
  let copied = $state(false);
  let isCopying = $state(false);
  const copyTimer = useTimer();

  const copy = async (text: string) => {
    if (isCopying) return false;
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    isCopying = true;
    try {
      await navigator.clipboard.writeText(trimmedText);
      copied = true;
      copyTimer.set(() => {
        copied = false;
      }, delay);
      return true;
    } catch (err) {
      console.warn('Copy failed', err);
      return false;
    } finally {
      isCopying = false;
    }
  };

  return {
    get copied() {
      return copied;
    },
    get isCopying() {
      return isCopying;
    },
    copy
  };
}
