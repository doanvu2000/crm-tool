import { computed } from 'vue';
import { PALETTE } from '@/shared/charts/palette';
import { useTheme } from './useTheme';

export function usePalette() {
  const { theme } = useTheme();
  return computed(() => PALETTE[theme.value]);
}
