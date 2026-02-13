<template>
  <div class="lib">
    <LiquidGlass>
      <div class="lib-container">
        <div class="lib-selector">
          <button
            v-for="item in LibItems"
            :key="item.id"
            class="lib-item"
            :class="{ selected: selected === item.id }"
            :disabled="item.id === 'react'"
            @click="onSelected(item.id)"
          >
            {{ item.name }}
          </button>
        </div>
        <div class="lib-command" @click="copy(selectedNpmCommand)">
          <pre><code>{{ selectedNpmCommand }}</code></pre>
          <button class="lib-copy" aria-label="Copy npm command to clipboard" :disabled="isCopying">
            <span v-if="!copied && !isCopying" aria-hidden="true">📋</span>
            <span v-else-if="copied" aria-hidden="true">✓</span>
            <span v-else aria-hidden="true">⏳</span>
          </button>
        </div>
        <div class="lib-links">
          <a :href="selectedDocLink" target="_blank" rel="noopener noreferrer" class="animated-link p4">
            Documentation
          </a>
          |
          <a :href="selectedNpmLink" target="_blank" rel="noopener noreferrer" class="animated-link p4">
            View on NPM
          </a>
        </div>
      </div>
    </LiquidGlass>
    <LiquidGlass>
      <PhoneInput
        v-model="testPhone"
        class="phone-input-main"
        dropdown-class="phone-dropdown-main"
        theme="dark"
        :with-validity="false"
      />
    </LiquidGlass>
  </div>
</template>

<script setup lang="ts">
const testPhone = ref('1234567890');

const selected = ref<Library>('vue');
const { copied, isCopying, copy } = useCopy();

const selectedNpmLink = computed(() => NpmLinks[selected.value]);
const selectedDocLink = computed(() => DocLinks[selected.value]);
const selectedNpmCommand = computed(() => NpmCommands[selected.value]);

function onSelected(lib: Library) {
  if (lib === selected.value) return;
  selected.value = lib;
}
</script>

<style lang="scss">
.phone-input-main.phone-input,
.phone-dropdown-main.phone-dropdown {
  &,
  &.theme-dark {
    pointer-events: all;
    --pi-radius: 20px;
    --pi-border: transparent;
    --pi-border-focus: white;
    --pi-disabled-bg: #333333b8;
  }
}
.phone-input-main.phone-input {
  &,
  &.theme-dark {
    --pi-bg: #22222266;
  }
}
.phone-dropdown-main.phone-dropdown {
  &,
  &.theme-dark {
    --pi-bg: #222222e6;
  }
}
</style>

<style scoped lang="scss">
.lib {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  min-width: 400px;

  &-container {
    padding: 0.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
  }

  &-selector {
    pointer-events: all;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-links {
    pointer-events: all;
    text-align: center;
    font-size: 0.9rem;
    color: var(--color-secondary);
  }
}
.lib-item {
  flex: 1;
  text-align: center;
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #5555555e;
  }

  &.selected {
    background-color: #444444b8;
  }

  &:not(:last-child) {
    border-right: 1px solid #444444b8;
  }

  &:first-child {
    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
  }

  &:last-child {
    border-top-right-radius: 1rem;
    border-bottom-right-radius: 1rem;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
.lib-command {
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #222222b8;
  border-radius: 0.5rem;
  padding: 0.5rem;

  pre {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-primary);
  }
}
@media (max-width: 480px) {
  .lib {
    flex: 1;
  }
}
@media (max-width: 412px) {
  .lib {
    min-width: unset;
  }
  .lib-command pre {
    font-size: 0.6rem;
  }
}
</style>
