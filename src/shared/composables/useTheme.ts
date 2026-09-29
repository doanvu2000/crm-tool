import { computed, readonly, ref } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sku-theme';
const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
const isDark = computed(() => theme.value === 'dark');

function applyTheme(next: Theme) {
  theme.value = next;
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode có thể chặn storage; theme vẫn đổi trong phiên.
  }
}

export function useTheme() {
  return {
    theme: readonly(theme),
    isDark,
    toggleTheme: () => applyTheme(isDark.value ? 'light' : 'dark')
  };
}
