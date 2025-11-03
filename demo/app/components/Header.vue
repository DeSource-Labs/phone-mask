<template>
  <header class="header">
    <div class="header__title">
      <LiquidGlass actionable>
        <NuxtLink to="/examples" class="examples"><span class="emoji">🔥</span> Examples</NuxtLink>
      </LiquidGlass>
      <h1>Phone Mask</h1>
      <LiquidGlass actionable>
        <a class="stars" :href="Links.coreRepo" target="_blank" rel="noopener noreferrer">
          Star
          <span ref="starCountRef" class="star" :style="{ opacity: 0 }">
            <span class="emoji">⭐️</span> {{ stars }}
          </span>
        </a>
      </LiquidGlass>
    </div>
    <p class="header__subtitle h3">Phone masks from across the universe (and every country)</p>
  </header>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';

const starCountRef = useTemplateRef('starCountRef');
const stars = useGhStars();

watch(
  stars,
  async (newStars) => {
    await nextTick();
    if (typeof newStars === 'number' && starCountRef.value) {
      gsap.fromTo(
        starCountRef.value,
        {
          scale: 0,
          width: 0,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          width: '100%',
          ease: 'back.out(1)'
        }
      );
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.header {
  margin-top: 1rem;
  margin-bottom: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 0.5rem;
}
.header__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header__title h1 {
  margin: 0;
}
.header__subtitle {
  margin: 0;
  color: var(--color-secondary);
}
.examples,
.stars {
  pointer-events: all;
  padding: 0.7rem;
}
.stars {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.7rem;
  font-weight: 500;
}
.star {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}
@media (max-width: 460px) {
  .header__title {
    display: grid;
    grid-template-areas:
      'examples stars'
      'h1 h1';
    gap: 0.5rem;
  }
  .examples {
    grid-area: examples;
  }
  .stars {
    grid-area: stars;
  }
  .header__title h1 {
    grid-area: h1;
  }
}
</style>
