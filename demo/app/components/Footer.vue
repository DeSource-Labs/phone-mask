<template>
  <footer class="footer">
    <a class="animated-link h3" :href="Links.org" rel="nofollow noopener">DESOURCE LABS</a>
    <div class="footer__center">
      <LiquidGlass>
        <div class="footer__socials">
          <Social
            v-for="social in socials"
            v-once
            :key="social.type"
            size="1.2rem"
            :aria-label="`Visit DeSource Labs ${social.type}`"
            :type="social.type"
            :href="social.href"
          />
          <Context7Button
            ref="context7Small"
            class="context7__small"
            variant="small"
            :ready="context7Ready"
            @toggle="toggleContext7"
          />
        </div>
      </LiquidGlass>
      <Context7Button
        ref="context7Medium"
        class="context7__medium"
        variant="medium"
        :ready="context7Ready"
        @toggle="toggleContext7"
      />
    </div>
    <a class="legal animated-link p4" :href="Links.org" rel="nofollow noopener">2026, DESOURCE LABS LTD</a>
  </footer>
</template>

<script setup lang="ts">
const socials = socialMediaArray;
const context7Small = useTemplateRef<Context7ButtonExpose>('context7Small');
const context7Medium = useTemplateRef<Context7ButtonExpose>('context7Medium');
const { context7Ready, toggleContext7 } = useContext7([context7Small, context7Medium]);
</script>

<style scoped lang="scss">
.footer {
  z-index: 1;
  padding: 0.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  > * {
    pointer-events: all;
  }

  &__center {
    display: flex;
    gap: 0.6rem;
  }

  &__socials {
    color: var(--color-secondary);
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  :deep(.context7__medium) {
    display: flex;
  }

  :deep(.context7__small) {
    display: none;
  }
}
.p4 {
  color: var(--color-secondary);
  letter-spacing: 0.03em;
}
@media (max-width: 839px) {
  .legal {
    display: none;
  }
}
@media (max-width: 565px) {
  .footer {
    flex-direction: column-reverse;
    gap: 0.75rem;

    :deep(.context7__medium) {
      display: none;
    }

    :deep(.context7__small) {
      display: flex;
    }
  }
}

@media (max-height: 560px) {
  .footer {
    padding: 0.25rem 0.5rem;
    gap: 0.5rem;

    &__socials {
      padding: 0.55rem;
      gap: 0.4rem;
    }
  }

  .legal {
    display: none;
  }
}
</style>
