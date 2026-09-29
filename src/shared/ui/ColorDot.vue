<script setup lang="ts">
defineProps<{ color: string }>();
</script>

<template>
  <span class="inline-block size-2 flex-none rounded-full" :style="{ background: color }" aria-hidden="true" />
</template>
