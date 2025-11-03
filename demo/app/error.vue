<template>
  <Galaxy
    :mouse-repulsion="true"
    :mouse-interaction="true"
    :density="1"
    :glow-intensity="0.3"
    :saturation="0"
    :hue-shift="140"
    :twinkle-intensity="0.3"
    :rotation-speed="0.1"
    :repulsion-strength="2"
    :auto-center-repulsion="0"
    :star-speed="0.5"
    :speed="1"
  />
  <main>
    <section class="content">
      <h1>
        Error {{ error.statusCode }}<br />
        <span>{{ error.statusMessage }}</span>
      </h1>
      <button class="error-button" href="/" @click.prevent="handleError">Home</button>
    </section>
  </main>
</template>

<script setup lang="ts">
const { error } = defineProps<{
  error: {
    url: string;
    statusCode: number;
    statusMessage: string;
    message: string;
    description: string;
    data: any;
  };
}>();

const handleError = () => clearError({ redirect: '/' });
</script>

<style scoped>
main {
  position: fixed;
  top: 0;
  left: 0;
  width: 100svw;
  min-height: 100svh;
  display: grid;
  grid-template-rows: 1fr auto;
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-button {
  pointer-events: all;
  margin-top: 2rem;
}
</style>
