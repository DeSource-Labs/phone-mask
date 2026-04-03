<template>
  <section class="page">
    <Header />
    <Main />
    <Footer />
  </section>
</template>

<style scoped>
.page {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

@media (max-height: 560px) {
  .page {
    padding: 0.5rem 0.75rem 0.35rem;
  }
}
</style>
