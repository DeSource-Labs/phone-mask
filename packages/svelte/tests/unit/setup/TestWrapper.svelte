<script lang="ts">
  let { composable }: { composable: () => void } = $props();
  const runComposable = () => composable();
  runComposable();
</script>
