<script lang="ts">
</script>

<main class="app-main">
  <header class="app-header">
    <h1 class="app-title">@desource/phone-mask-svelte</h1>
    <p class="app-subtitle">Interactive Component Demo &amp; Playground</p>
  </header>

  <div class="app-content">
  </div>

  <footer class="app-footer">
    <p>Tip: Open console to see event logs</p>
  </footer>
</main>

<style>
.app-main {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #0f0f1e 100%);
  color: #fff;
  font-family: 'Nunito', sans-serif;
  overflow: auto;
  padding: 40px 20px;
}

.app-header {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto 48px;
}

.app-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff 0%, #a0a0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 18px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
}

.app-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-footer {
  margin-top: 48px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  font-weight: 300;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  max-width: 1200px;
  margin: 48px auto 0;
}
</style>
