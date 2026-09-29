<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string; eyebrow?: string; tag?: string }>();
</script>

<template>
  <component :is="tag ?? 'section'" class="card">
    <p v-if="eyebrow" class="eyebrow mb-1">{{ eyebrow }}</p>
    <h3 v-if="title" class="card-title">{{ title }}</h3>
    <p v-if="subtitle" class="card-sub">{{ subtitle }}</p>
    <slot />
  </component>
</template>
