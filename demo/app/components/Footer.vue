<template>
  <footer class="footer">
    <a class="animated-link h3" :href="Links.org" rel="nofollow noopener">DESOURCE LABS</a>
    <LiquidGlass>
      <div v-once class="footer__socials">
        <Social
          v-for="social in socials"
          :key="social.type"
          size="1.2rem"
          :aria-label="`Visit DeSource Labs ${social.type}`"
          :type="social.type"
          :href="social.href"
        />
      </div>
    </LiquidGlass>
    <a class="legal animated-link p4" :href="Links.org" rel="nofollow noopener">2026, DESOURCE LABS LTD</a>
  </footer>
</template>

<script setup lang="ts">
const socials = socialMediaArray;
</script>

<style scoped>
.footer {
  padding: 0.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.footer > * {
  pointer-events: all;
}
.footer__socials {
  color: var(--color-secondary);
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
}
.p4 {
  color: var(--color-secondary);
  letter-spacing: 0.03em;
}
@media (max-width: 768px) {
  .legal {
    display: none;
  }
}
@media (max-width: 480px) {
  .footer {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
}
</style>
