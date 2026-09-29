import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** Theo dõi section đang đọc để tô mục lục. rootMargin lệch lên trên để mục đổi khi tiêu đề chạm nửa trên màn hình. */
export function useActiveSection(ids: Ref<readonly string[]>) {
  const active = ref(ids.value[0] ?? '');
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!('IntersectionObserver' in window)) return;
    const visible = new Set<string>();
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = ids.value.find((id) => visible.has(id));
        if (first) active.value = first;
      },
      { rootMargin: '-80px 0px -55% 0px' }
    );
    for (const id of ids.value) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
  });

  onBeforeUnmount(() => observer?.disconnect());

  return active;
}
