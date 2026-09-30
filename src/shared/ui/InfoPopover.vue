<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import AppIcon from './AppIcon.vue';

const props = withDefaults(defineProps<{ title: string; label?: string; iconOnly?: boolean }>(), { label: 'Cách tính' });

const open = ref(false);
const btn = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const pos = ref({ top: 0, left: 0 });
const id = useId();
const EDGE = 12;
const WIDTH = 340;

function place() {
  const b = btn.value?.getBoundingClientRect();
  if (!b) return;
  const width = Math.min(WIDTH, window.innerWidth - EDGE * 2);
  const left = Math.min(Math.max(b.right - width, EDGE), window.innerWidth - width - EDGE);
  const h = panel.value?.offsetHeight ?? 0;
  const below = b.bottom + 8;
  const top = below + h > window.innerHeight - EDGE && b.top - 8 - h > 72 ? b.top - 8 - h : below;
  pos.value = { top, left };
}

function onOutside(e: PointerEvent) {
  const t = e.target as Node;
  if (!panel.value?.contains(t) && !btn.value?.contains(t)) open.value = false;
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false;
    btn.value?.focus();
  }
}

function bind(on: boolean) {
  const fn = on ? window.addEventListener : window.removeEventListener;
  fn('scroll', place, true);
  fn('resize', place);
  fn('pointerdown', onOutside as EventListener, true);
  fn('keydown', onKey as EventListener);
}

watch(open, async (v) => {
  bind(v);
  if (!v) return;
  await nextTick();
  place();
  panel.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => bind(false));
defineExpose({ close: () => (open.value = false) });
</script>

<template>
  <button
    ref="btn"
    type="button"
    class="inline-flex min-h-8 flex-none items-center gap-1 rounded-lg text-xs font-medium text-ink-3 transition-colors hover:text-ink"
    :class="[iconOnly ? 'min-w-8 justify-center' : 'px-1.5', open ? 'text-ink' : '']"
    :aria-label="iconOnly ? `${label}: ${props.title}` : undefined"
    :aria-expanded="open"
    :aria-controls="id"
    @click="open = !open"
  >
    <AppIcon name="info" class="size-4" />
    <span v-if="!iconOnly">{{ label }}</span>
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      :id="id"
      ref="panel"
      role="dialog"
      :aria-label="props.title"
      tabindex="-1"
      class="fixed z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-surface p-3.5 text-left text-[13px] font-normal leading-relaxed text-ink-2 shadow-xl focus:outline-none"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px`, width: `min(${WIDTH}px, calc(100vw - ${EDGE * 2}px))`, animation: 'tour-in 160ms ease-out both' }"
    >
      <p class="mb-1.5 font-semibold text-ink">{{ props.title }}</p>
      <slot />
    </div>
  </Teleport>
</template>
