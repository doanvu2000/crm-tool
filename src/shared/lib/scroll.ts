const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cuộn tới section + ghi hash lên URL để link chia sẻ mở đúng chỗ. Tôn trọng reduced motion. */
export function scrollToSection(id: string, { updateHash = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (updateHash) history.replaceState(history.state, '', `#${id}`);
}
