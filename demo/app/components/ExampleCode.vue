<template>
  <div class="code">
    <div class="code-toolbar">
      <select v-model="framework" class="pkg-select" :aria-label="`Framework for ${props.label} code`">
        <option value="vue">Vue</option>
        <option value="react">React</option>
        <option value="svelte">Svelte</option>
        <option value="angular">Angular</option>
      </select>
      <button
        class="copy-btn"
        type="button"
        :aria-label="`Copy ${props.label} code`"
        :disabled="copying"
        @click="copyCode"
      >
        {{ copied ? '✓ Copied!' : '📋 Copy' }}
      </button>
    </div>
    <pre
      :style="{ '--code-lines': maxLines }"
      tabindex="-1"
      :aria-label="`${props.label} code`"
    ><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import type { ExampleFramework } from '../data/component-examples';

const props = defineProps<{ code: Record<ExampleFramework, string>; label: string }>();
const framework = defineModel<ExampleFramework>('framework', { required: true });
const code = computed(() => props.code[framework.value]);
const maxLines = computed(() => Math.max(...Object.values(props.code).map((snippet) => snippet.split('\n').length)));

const copying = ref(false);
const copied = ref(false);
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let copyRequest = 0;

function resetCopyStatus() {
  copyRequest += 1;
  clearTimeout(feedbackTimer);
  feedbackTimer = undefined;
  copying.value = false;
  copied.value = false;
}

async function copyCode() {
  resetCopyStatus();
  const request = copyRequest;
  const snippet = code.value;
  copying.value = true;

  try {
    await navigator.clipboard.writeText(snippet);
    if (request !== copyRequest) return;
    copied.value = true;
    feedbackTimer = setTimeout(resetCopyStatus, 3000);
  } catch {
    if (request !== copyRequest) return;
    copied.value = false;
  } finally {
    if (request === copyRequest) copying.value = false;
  }
}

watch(code, resetCopyStatus, { flush: 'sync' });
onBeforeUnmount(resetCopyStatus);
</script>

<style scoped lang="scss">
.code {
  min-width: 0;
  max-width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.code-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
}

.pkg-select,
.copy-btn {
  max-width: 100%;
  max-height: 36px;
  padding: 0.5rem 0.75rem;
  backdrop-filter: blur(10px);
  background: #4338caeb;
  border: 1px solid #818cf88c;
  border-radius: 6px;
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
}

.pkg-select {
  color-scheme: dark;
}

.copy-btn {
  min-width: 88px;

  &:disabled {
    cursor: progress;
    opacity: 0.7;
  }
}

.pkg-select:hover,
.copy-btn:hover:not(:disabled) {
  background: #3730a3fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px #4338ca73;
}

pre {
  min-width: 0;
  max-width: 100%;
  margin: 0;
  padding: 1rem 1.5rem 1.5rem;
  // Reserve the longest snippet and one line for a horizontal scrollbar.
  height: calc((var(--code-lines) + 1) * 1lh + 2.5rem);
  overflow-x: auto;
  color: #e2e8f0;
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre;
  user-select: text;
}

@media (max-width: 640px) {
  pre {
    padding: 0.75rem 1rem 1rem;
    height: calc((var(--code-lines) + 1) * 1lh + 1.75rem);
    font-size: 0.75rem;
  }
}
</style>
