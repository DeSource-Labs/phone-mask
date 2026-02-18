import { ref } from 'vue';
import { useTimer } from './useTimer';

export function useClipboard() {
  const copied = ref(false);
  const isCopying = ref(false);
  const copyTimer = useTimer();

  const copy = async (text: string) => {
    if (isCopying.value) return false;
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    isCopying.value = true;
    try {
      await navigator.clipboard.writeText(trimmedText);
      copied.value = true;
      copyTimer.set(() => {
        copied.value = false;
      }, 1_800);
      return true;
    } catch (err) {
      console.warn('Copy failed', err);
      return false;
    } finally {
      isCopying.value = false;
    }
  };

  return { copied, isCopying, copy };
}
