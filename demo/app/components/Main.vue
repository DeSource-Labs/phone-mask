<template>
  <main class="main">
    <LibContainer />
    <CardSwap :card-distance="60" :vertical-distance="70" :delay="5000" :skew-amount="6">
      <!-- Card 0: Always Fresh Data (cloud icon) -->
      <template #card-0>
        <div class="card">
          <div class="card-header">
            <span class="header-logo">
              <NuxtImg
                src="/img/cards/cloud.svg"
                alt="Cloud Icon"
                quality="75"
                width="16px"
                format="webp"
                loading="lazy"
              />
            </span>
            <p class="card-title h3">Always fresh data</p>
          </div>
          <div class="card-body secondary p4">
            Country dialing rules and formats are synced from
            <a class="animated-link card-link" :href="Links.googleLib" target="_blank" rel="noopener noreferrer">
              Google's library
            </a>
            — automatically. Keep your inputs accurate without manual updates or stale data.
          </div>
          <NuxtImg
            class="card-image img-google"
            src="/img/cards/google.png"
            alt="Google Logo"
            quality="75"
            width="140px"
            format="webp"
            loading="lazy"
          />
        </div>
      </template>
      <!-- Card 1: Tiny & Fast (code icon) -->
      <template #card-1>
        <div class="card">
          <div class="card-header">
            <span class="header-logo">
              <NuxtImg
                src="/img/cards/code.svg"
                alt="Code Icon"
                quality="100"
                width="20px"
                format="webp"
                loading="lazy"
              />
            </span>
            <p class="card-title h3">Tiny & fast — 13 KB</p>
          </div>
          <div class="card-body secondary p4">
            <a class="animated-link card-link" :href="NpmLinks.typescript" target="_blank" rel="noopener noreferrer">
              Extremely small
            </a>
            footprint (13 KB / 4 KB gzip). Optimized for performance on web and mobile — no bloat.
          </div>
          <NuxtImg
            class="card-image img-npm"
            src="/img/cards/npm.webp"
            alt="File Size Icon"
            loading="lazy"
            quality="75"
            width="200px"
          />
        </div>
      </template>
      <!-- Card 2: Easy to integrate (sliders icon) -->
      <template #card-2>
        <div class="card">
          <div class="card-header">
            <span class="header-logo">
              <NuxtImg
                src="/img/cards/sliders.svg"
                alt="Sliders Icon"
                quality="100"
                width="16px"
                format="webp"
                loading="lazy"
              />
            </span>
            <p class="card-title h3">Easy to integrate</p>
          </div>
          <div class="card-body secondary p4">
            <a class="animated-link card-link" :href="Links.packages" target="_blank" rel="noopener noreferrer">
              Ready-made plugins
            </a>
            for Vue, Nuxt, React and vanilla JS. Flexible masks, flags and locale helpers — plug & play.
          </div>
          <div class="card-images">
            <NuxtImg
              class="img-nuxt"
              src="/img/cards/nuxtjs.svg"
              alt="Nuxt.js Logo"
              quality="75"
              width="200px"
              format="webp"
              loading="lazy"
            />
            <NuxtImg
              class="img-react"
              src="/img/cards/react.png"
              alt="React Logo"
              quality="75"
              format="webp"
              loading="lazy"
              width="120px"
            />
            <NuxtImg
              class="img-vue"
              src="/img/cards/vue.png"
              alt="Vue.js Logo"
              quality="75"
              format="webp"
              loading="lazy"
              width="180px"
            />
          </div>
        </div>
      </template>
    </CardSwap>
  </main>
</template>

<script setup></script>

<style scoped>
.main {
  flex: 1;
  display: flex;
  justify-content: start;
  align-items: baseline;
  padding: 0 2rem;
}
.card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* header */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.card-title {
  margin: 0;
}

.card-body {
  margin-top: 4px;
  margin-right: 2rem;
}

.card-image,
.card-images {
  opacity: 0.4;
  filter: grayscale(100%) contrast(0.95) blur(0.35px) saturate(0.6);
}

.card-image {
  transform: rotate(-5deg) translateY(-3rem);
  align-self: center;
}

.card-image.img-google {
  opacity: 1;
  transform: rotate(0deg) translateY(-1rem);
}

.card-images {
  display: flex;
  align-items: start;
}

.card-images .img-nuxt {
  transform: translateY(-4rem);
}

.card-images .img-react {
  transform: rotate(-12deg);
}

.card-images .img-vue {
  transform: rotate(-15deg);
}

.card-link {
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .main {
    justify-content: center;
  }
  .card-body {
    margin-right: 3rem;
  }
}
</style>
