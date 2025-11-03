<template>
  <Galaxy
    mouse-repulsion
    mouse-interaction
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
  <div class="none">
    <NuxtPage />
  </div>
</template>

<style scoped>
.none {
  user-select: none;
  pointer-events: none;
}
</style>
