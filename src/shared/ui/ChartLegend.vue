<script setup lang="ts">
defineProps<{ items: { label: string; color: string }[] }>();
</script>

<template>
  <div class="mb-2.5 flex min-h-5 flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-ink-2">
    <span v-for="item in items" :key="item.label" class="inline-flex items-center gap-1.5">
      <i class="inline-block size-2.5 rounded-[3px]" :style="{ background: item.color }" />
      {{ item.label }}
    </span>
  </div>
</template>
