import { computed, ref } from 'vue';
import { useAnalysisStore } from '@/features/analysis';
import { TOUR_STEPS, type TourPhase, type TourStep } from '../lib/steps';

const STORAGE_KEY = 'sku-tour';

type Seen = Record<TourPhase, boolean>;

function loadSeen(): Seen {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { intro: parsed.intro === true, data: parsed.data === true };
  } catch {
    return { intro: false, data: false };
  }
}

const seen = ref<Seen>(loadSeen());
const phase = ref<TourPhase | null>(null);
const steps = ref<TourStep[]>([]);
const index = ref(0);

function saveSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen.value));
  } catch {
    return;
  }
}

export function findTarget(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function start(next: TourPhase) {
  const available = TOUR_STEPS[next].filter((s) => findTarget(s.target));
  if (!available.length) return;
  steps.value = available;
  index.value = 0;
  phase.value = next;
}

function finish() {
  if (phase.value) seen.value = { ...seen.value, [phase.value]: true };
  saveSeen();
  phase.value = null;
}

function skipAll() {
  seen.value = { intro: true, data: true };
  saveSeen();
  phase.value = null;
}

export function useTour() {
  const store = useAnalysisStore();
  const active = computed(() => phase.value !== null);
  const step = computed(() => steps.value[index.value]);
  const isLast = computed(() => index.value === steps.value.length - 1);

  function next() {
    if (isLast.value) finish();
    else index.value++;
  }

  function prev() {
    if (index.value > 0) index.value--;
  }

  function restart() {
    start(store.hasData ? 'data' : 'intro');
  }

  return { seen, phase, steps, index, active, step, isLast, start, next, prev, finish, skipAll, restart };
}
