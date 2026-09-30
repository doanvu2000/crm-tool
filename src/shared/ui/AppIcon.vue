<script setup lang="ts">
export type IconName = 'chart' | 'sun' | 'moon' | 'upload' | 'download' | 'arrow-right' | 'empty' | 'help' | 'undo' | 'close' | 'edit';

defineProps<{ name: IconName }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'chart'"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </template>
    <path v-else-if="name === 'moon'" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    <template v-else-if="name === 'upload'"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></template>
    <template v-else-if="name === 'download'"><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></template>
    <path v-else-if="name === 'arrow-right'" d="M5 12h14M12 5l7 7-7 7" />
    <template v-else-if="name === 'help'"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><path d="M12 17h.01" /></template>
    <template v-else-if="name === 'undo'"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></template>
    <path v-else-if="name === 'close'" d="M6 6l12 12M18 6L6 18" />
    <template v-else-if="name === 'edit'"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></template>
    <template v-else-if="name === 'empty'"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 16v-4M12 16V8M16 16v-6" /></template>
  </svg>
</template>
