<template>
  <ClientOnly>
    <button
      v-if="variant === 'small'"
      ref="triggerRef"
      class="context7__button small"
      type="button"
      aria-label="Open documentation AI chat"
      :disabled="!ready"
      @click="emit('toggle')"
    >
      <span class="context7__label">AI</span>
    </button>
    <LiquidGlass v-else actionable :width="variant === 'big' ? 184 : 124">
      <button
        ref="triggerRef"
        class="context7__button"
        :class="variant"
        type="button"
        aria-label="Open documentation AI chat"
        :disabled="!ready"
        @click="emit('toggle')"
      >
        <span class="context7__label">Ask Docs AI</span>
        <span class="context7__dot" aria-hidden="true" />
      </button>
    </LiquidGlass>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { ShallowRef } from 'vue';

interface Context7ButtonProps {
  variant?: 'big' | 'medium' | 'small';
  ready?: boolean;
}

type Context7ButtonExpose = {
  triggerRef: Readonly<ShallowRef<HTMLButtonElement | null>>;
};

withDefaults(defineProps<Context7ButtonProps>(), {
  variant: 'medium',
  ready: false
});

const emit = defineEmits<{ (e: 'toggle'): void }>();

const triggerRef = useTemplateRef('triggerRef');

defineExpose<Context7ButtonExpose>({
  triggerRef
});
</script>

<style scoped lang="scss">
.context7 {
  &__button {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 22px;
    background: transparent;
    color: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 0;
    cursor: pointer;
    font-weight: 500;
    letter-spacing: 0.01em;

    &:disabled {
      opacity: 0.45;
      cursor: wait;
    }

    &.big {
      padding: 1rem 2rem;
    }

    &.small {
      padding: 0;
      background-color: var(--color-secondary);
      color: var(--color-background);
      font-size: 0.75rem;
      font-weight: 900;
      border-radius: 4px;
      width: 1.2rem;
      height: 1.2rem;
      animation: context7-pulse 1.5s ease-out infinite;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &__label {
    white-space: nowrap;
  }

  &__dot {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
    animation: context7-pulse 1.5s ease-out infinite;
  }
}

@keyframes context7-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
  }
  70% {
    box-shadow: 0 0 0 9px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
