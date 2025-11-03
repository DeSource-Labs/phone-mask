<template>
  <a class="social" :href="href" :target="target" rel="noopener noreferrer">
    <svg
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :viewBox="icon.viewBox"
      :width="size"
      :height="size"
      :style="styles"
    >
      <path :d="icon.path"></path>
    </svg>
  </a>
</template>

<script setup lang="ts">
import type { SocialMediaKey } from '~~/shared/types';

const props = withDefaults(
  defineProps<{
    href: string;
    type: SocialMediaKey;
    size?: string;
    color?: string;
    background?: string;
  }>(),
  {
    size: '1rem',
    color: 'currentColor',
    background: 'var(--color-background)'
  }
);

const icon = computed(() => icons[props.type]);

const target = computed(() => (props.href.startsWith('mailto:') ? '_self' : '_blank'));

const styles = computed(() => {
  switch (props.type) {
    case 'email':
      return {
        background: props.color,
        fill: 'none',
        stroke: props.background,
        padding: '1px'
      };
    case 'x':
      return {
        background: props.color,
        fill: props.background,
        padding: '2px'
      };
    case 'github':
    case 'telegram':
      return {
        background: props.color,
        fill: props.background
      };
    case 'linkedin':
      return {
        fill: props.color
      };
    default:
      return {};
  }
});
</script>

<style scoped>
.social {
  display: inline-flex;
  cursor: pointer;
}

svg {
  transition:
    transform 0.3s ease,
    fill 0.3s ease;
  border-radius: 4px;
}

svg:hover {
  transform: scale(1.1);
}
</style>
