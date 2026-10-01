<script setup lang="ts">
import AppIcon from '@/shared/ui/AppIcon.vue';
import { usePilotTheme } from '../composables/usePilotTheme';

const { isDark, toggleTheme } = usePilotTheme();
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-3 px-4">
      <div class="flex min-w-0 items-center gap-3">
        <span class="relative grid h-9 w-8 flex-none place-items-end rounded-md bg-tag pb-1.5 text-tag-ink" aria-hidden="true">
          <span class="absolute left-1/2 top-1.5 size-1.5 -translate-x-1/2 rounded-full bg-canvas" />
          <AppIcon name="chart" class="mx-auto size-4" />
        </span>
        <span class="min-w-0">
          <span class="block whitespace-nowrap text-[17px] font-semibold leading-tight tracking-tight">SKU Review Pilot</span>
          <span class="eyebrow hidden truncate sm:block">ABC · GROWTH · PROFIT · PRICE · INVENTORY</span>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn min-h-10 rounded-full px-3.5" :aria-label="isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'" @click="toggleTheme">
          <AppIcon :name="isDark ? 'sun' : 'moon'" class="size-4" />
          <span class="hidden sm:inline">{{ isDark ? 'Giao diện sáng' : 'Giao diện tối' }}</span>
        </button>
        <a href="/" class="btn min-h-10 rounded-full bg-surface px-3.5">Web SKU Analysis cũ</a>
      </div>
    </div>
  </header>
</template>
