import { customRef } from 'vue';

export function useDebouncedRef<T>(initial: T, delay = 200) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let value = initial;
  return customRef<T>((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(next) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        value = next;
        trigger();
      }, delay);
    }
  }));
}
