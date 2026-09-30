import type { ChartConfiguration, ChartOptions, TooltipOptions } from 'chart.js';
import { fmt0, pct } from '@/shared/lib/format';
import type { ChartPalette } from './palette';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const animation = () => (prefersReducedMotion() ? (false as const) : { duration: 300 });

export function tooltipStyle(p: ChartPalette): Partial<TooltipOptions> {
  return {
    backgroundColor: p.tooltipBg,
    titleColor: p.tooltipTitle,
    bodyColor: p.tooltipBody,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4
  };
}

export const valueAxis = (p: ChartPalette) => ({
  beginAtZero: true,
  grid: { color: p.grid },
  border: { display: false },
  ticks: { color: p.muted, precision: 0, callback: (v: string | number) => fmt0(Number(v)) }
});

export const categoryAxis = (p: ChartPalette) => ({
  grid: { display: false },
  border: { color: p.grid },
  ticks: { color: p.muted }
});

/** Bar đếm số SKU theo nhóm, có nhãn "số · %" trên đầu cột. */
export function countBarConfig(
  p: ChartPalette,
  labels: readonly string[],
  data: number[],
  colors: string[],
  horizontal = false,
  active: string | null = null,
  onPick?: (label: string) => void
): ChartConfiguration<'bar'> {
  const total = data.reduce((s, v) => s + v, 0);
  const max = Math.max(1, ...data);
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animation(),
    indexAxis: horizontal ? 'y' : 'x',
    layout: { padding: horizontal ? { right: 64 } : { top: 20 } },
    onClick: onPick ? (_e, els) => { if (els.length) onPick(labels[els[0].index]); } : undefined,
    onHover: onPick ? (e, els) => { const t = e.native?.target as HTMLElement | undefined; if (t) t.style.cursor = els.length ? 'pointer' : 'default'; } : undefined,
    plugins: {
      tooltip: {
        ...tooltipStyle(p),
        callbacks: { label: (ctx) => ` ${fmt0(ctx.parsed[horizontal ? 'x' : 'y'])} SKU (${pct(total ? Number(ctx.raw) / total : 0)})` }
      },
      valueLabels: { enabled: true, color: p.text, total }
    },
    scales: horizontal
      ? { x: { ...valueAxis(p), suggestedMax: max * 1.1 }, y: categoryAxis(p) }
      : { x: categoryAxis(p), y: { ...valueAxis(p), suggestedMax: max * 1.1 } }
  };
  return {
    type: 'bar',
    data: {
      labels: [...labels],
      datasets: [{ data, backgroundColor: active ? colors.map((c, i) => (labels[i] === active ? c : c + '40')) : colors, borderRadius: 4, borderSkipped: false, maxBarThickness: 48 }]
    },
    options
  };
}
