import { ref } from 'vue';

export function useClipboard() {
  const copied = ref(false);
  const isCopying = ref(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (copyTimer) {
      clearTimeout(copyTimer);
      copyTimer = null;
    }
  };

  const copy = async (text: string) => {
    if (isCopying.value) return false;
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    isCopying.value = true;
    try {
      await navigator.clipboard.writeText(trimmedText);
      copied.value = true;
      clearTimer();
      copyTimer = setTimeout(() => {
        copied.value = false;
        copyTimer = null;
      }, 1_800);
      return true;
    } catch (err) {
      console.warn('Copy failed', err);
      return false;
    } finally {
      isCopying.value = false;
    }
  };

  const onUnmount = () => {
    clearTimer();
  };

  return { copied, isCopying, copy, onUnmount };
}
