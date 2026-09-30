<script setup lang="ts">
import { computed } from 'vue';
import { useActiveSection } from '@/shared/composables/useActiveSection';
import { scrollToSection } from '@/shared/lib/scroll';

const props = withDefaults(
  defineProps<{ items: { id: string; label: string; meta?: string }[]; variant?: 'rail' | 'bar' }>(),
  { variant: 'rail' }
);

const ids = computed(() => props.items.map((i) => i.id));
const active = useActiveSection(ids);

function go(id: string) {
  scrollToSection(id);
  active.value = id;
}
</script>

<template>
  <!-- rail: cột dọc desktop. bar: thanh ngang trượt trên mobile, cuộn riêng để trang không bị tràn ngang. -->
  <nav aria-label="Mục lục phân tích">
    <p v-if="variant === 'rail'" class="eyebrow mb-3 px-3">Mục lục</p>
    <ul :class="variant === 'rail' ? 'grid gap-0.5' : 'flex snap-x gap-1.5 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible'">
      <li v-for="item in items" :key="item.id" :class="variant === 'bar' && 'flex-none snap-start'">
        <a
          :href="`#${item.id}`"
          class="relative flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors lg:min-h-10"
          :class="[
            active === item.id ? 'bg-surface font-medium text-ink' : 'text-ink-2 hover:bg-surface/60 hover:text-ink',
            variant === 'bar' && 'whitespace-nowrap border border-line'
          ]"
          :aria-current="active === item.id ? 'location' : undefined"
          @click.prevent="go(item.id)"
        >
          <span
            class="absolute rounded-full transition-colors"
            :class="[
              variant === 'rail' ? 'inset-y-2 left-0 w-1' : 'inset-x-3 bottom-0 h-0.5',
              active === item.id ? 'bg-tag' : 'bg-transparent'
            ]"
            aria-hidden="true"
          />
          {{ item.label }}
          <span v-if="item.meta" class="num text-xs text-ink-3">{{ item.meta }}</span>
        </a>
      </li>
    </ul>
  </nav>
</template>
