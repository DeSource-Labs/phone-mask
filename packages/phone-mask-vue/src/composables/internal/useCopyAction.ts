import { computed, type Ref, type TemplateRef } from 'vue';
import { useClipboard } from '../utility/useClipboard';
import { useTimer } from '../utility/useTimer';

interface UseCopyActionOptions {
  liveRef: Ref<HTMLElement | null>;
  fullFormatted: Ref<string>;
  onCopy: (value: string) => void;
}

const DELAY = 1_800;

export function useCopyAction({ liveRef, fullFormatted, onCopy }: UseCopyActionOptions) {
  const liveTimer = useTimer();
  const { copied, copy } = useClipboard(DELAY);

  const copyAriaLabel = computed(() => (copied.value ? 'Copied' : `Copy ${fullFormatted.value}`));
  const copyButtonTitle = computed(() => (copied.value ? 'Copied' : 'Copy phone number'));

  const announceToScreenReader = (message: string) => {
    if (!liveRef.value) return;
    liveRef.value.textContent = message;
    liveTimer.set(() => {
      if (liveRef.value) liveRef.value.textContent = '';
    }, DELAY);
  };

  const onCopyClick = async () => {
    const valueToCopy = fullFormatted.value.trim();
    const success = await copy(valueToCopy);
    if (success) {
      onCopy(valueToCopy);
      announceToScreenReader('Phone number copied to clipboard');
    }
  };

  return {
    copied,
    copyAriaLabel,
    copyButtonTitle,
    onCopyClick
  };
}
