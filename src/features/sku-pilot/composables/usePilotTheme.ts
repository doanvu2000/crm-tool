import { computed, readonly, ref } from 'vue';
import { PALETTE } from '@/shared/charts/palette';
import type { Theme } from '@/shared/composables/useTheme';

const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
const isDark = computed(() => theme.value === 'dark');
const palette = computed(() => PALETTE[theme.value]);

function applyTheme(next: Theme) {
  theme.value = next;
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem('sku-pilot-theme', next);
  } catch {
    // The theme still works for this page if storage is unavailable.
  }
}

export function usePilotTheme() {
  return {
    theme: readonly(theme),
    isDark,
    palette,
    toggleTheme: () => applyTheme(isDark.value ? 'light' : 'dark')
  };
}
