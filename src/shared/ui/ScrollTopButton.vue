<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

const visible = ref(false);
let raf = 0;

function check() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => (visible.value = window.scrollY > 600));
}

function toTop() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  document.getElementById('main')?.focus({ preventScroll: true });
}

onMounted(() => {
  window.addEventListener('scroll', check, { passive: true });
  check();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('scroll', check);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-y-2 opacity-0"
  >
    <button
      v-if="visible"
      type="button"
      class="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full border border-line bg-surface text-ink shadow-lg transition-colors hover:border-ink-3 sm:bottom-8 sm:right-8"
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      @click="toTop"
    >
      <AppIcon name="arrow-right" class="size-5 -rotate-90" />
    </button>
  </Transition>
</template>
