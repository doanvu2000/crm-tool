<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string; eyebrow?: string; tag?: string }>();
</script>

<template>
  <component :is="tag ?? 'section'" class="card">
    <div v-if="$slots.info" class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p v-if="eyebrow" class="eyebrow mb-1">{{ eyebrow }}</p>
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-sub">{{ subtitle }}</p>
      </div>
      <div class="-mr-1.5 -mt-1">
        <slot name="info" />
      </div>
    </div>
    <template v-else>
      <p v-if="eyebrow" class="eyebrow mb-1">{{ eyebrow }}</p>
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <p v-if="subtitle" class="card-sub">{{ subtitle }}</p>
    </template>
    <slot />
  </component>
</template>
