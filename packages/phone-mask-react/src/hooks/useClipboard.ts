import { useState, useCallback } from 'react';
import { useTimer } from './useTimer';

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const copyTimer = useTimer();

  const copy = useCallback(
    async (text: string) => {
      if (isCopying) return false;
      const trimmedText = text.trim();
      if (!trimmedText) return false;
      setIsCopying(true);
      try {
        await navigator.clipboard.writeText(trimmedText);
        setCopied(true);
        copyTimer.set(() => {
          setCopied(false);
        }, 1_800);
        return true;
      } catch (err) {
        console.warn('Copy failed', err);
        return false;
      } finally {
        setIsCopying(false);
      }
    },
    [isCopying, copyTimer]
  );

  return { copied, isCopying, copy };
}
