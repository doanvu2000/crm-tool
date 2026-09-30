<script setup lang="ts">
defineProps<{ title: string; hint?: string }>();
</script>

<template>
  <div class="mb-4 mt-10 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5">
    <h2 class="text-xl font-semibold tracking-tight sm:text-[22px]">{{ title }}</h2>
    <div class="flex items-center gap-2">
      <span v-if="hint" class="eyebrow">{{ hint }}</span>
      <slot />
    </div>
  </div>
</template>
