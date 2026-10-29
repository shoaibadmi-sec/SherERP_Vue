<script setup lang="ts">
/**
 * The original, unmodified HisabIQ React application is compiled from
 * vendor/hisabiq_ui to /hisabiq-pos/. Keep it in an iframe so the source's
 * own font, CSS, shell, routes, and responsive rules remain exactly intact.
 *
 * IMPORTANT: this React app uses its upstream preview stores. It is not wired
 * to SherERP's authenticated transactional API. The legacy Vue POS remains
 * available at /pos/vue until the backend adapter is implemented and audited.
 */
</script>

<template>
  <iframe
    class="hisabiq-original-pos"
    title="HisabIQ original React POS — design preview only, no live posting"
    src="/hisabiq-pos/index.html#/app/pos"
    allow="clipboard-read; clipboard-write"
  />
</template>

<style scoped>
.hisabiq-original-pos {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: block;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  border: 0;
  background: #fff;
}
</style>
