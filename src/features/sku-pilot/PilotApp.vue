<script setup lang="ts">
import PilotHeader from './components/PilotHeader.vue';
import SkuPilotDashboard from './components/SkuPilotDashboard.vue';
</script>

<template>
  <a href="#main" class="absolute -left-[999px] top-2 z-50 rounded-lg bg-ink px-3 py-2 text-canvas focus:left-4">Bỏ qua tới nội dung</a>
  <PilotHeader />
  <main id="main" tabindex="-1" class="focus:outline-none mx-auto max-w-[1320px] px-4 pb-16 pt-6">
    <SkuPilotDashboard />
  </main>
</template>
