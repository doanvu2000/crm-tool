import Chart from 'chart.js/auto';
import type { ChartType, Plugin } from 'chart.js';
import { fmt0, pct } from '@/shared/lib/format';

export interface ValueLabelsOptions {
  enabled?: boolean;
  color?: string;
  total?: number;
}

export interface GuideLinesOptions {
  enabled?: boolean;
  color?: string;
  x?: number[];
  y?: number[];
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    valueLabels?: ValueLabelsOptions;
    guideLines?: GuideLinesOptions;
  }
}

const FONT_FAMILY = '"Google Sans", "Google Sans Flex", Roboto, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Ghi "số lượng · %" ở đầu mỗi cột. Đọc màu từ options nên đổi theme chỉ cần chart.update(). */
const valueLabels: Plugin = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, opts: ValueLabelsOptions) {
    if (!opts.enabled) return;
    const { ctx } = chart;
    const horizontal = chart.options.indexAxis === 'y';
    const values = chart.data.datasets[0]?.data ?? [];
    const total = opts.total ?? values.reduce<number>((s, v) => s + (Number(v) || 0), 0);
    ctx.save();
    ctx.font = `500 12px ${FONT_FAMILY}`;
    ctx.fillStyle = opts.color ?? '#475569';
    chart.getDatasetMeta(0).data.forEach((el, i) => {
      const v = Number(values[i]) || 0;
      if (!v) return;
      const text = `${fmt0(v)} · ${pct(total ? v / total : 0, 0)}`;
      if (horizontal) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, el.x + 6, el.y);
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, el.x, el.y - 4);
      }
    });
    ctx.restore();
  }
};

/** Vạch ngưỡng nét đứt (vd ranh giới DOS) vẽ dưới dữ liệu. */
const guideLines: Plugin = {
  id: 'guideLines',
  beforeDatasetsDraw(chart, _args, opts: GuideLinesOptions) {
    if (!opts.enabled) return;
    const { ctx, chartArea: area, scales } = chart;
    ctx.save();
    ctx.strokeStyle = opts.color ?? '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const v of opts.x ?? []) {
      const px = scales.x.getPixelForValue(v);
      ctx.beginPath();
      ctx.moveTo(px, area.top);
      ctx.lineTo(px, area.bottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const v of opts.y ?? []) {
      const py = scales.y.getPixelForValue(v);
      ctx.beginPath();
      ctx.moveTo(area.left, py);
      ctx.lineTo(area.right, py);
      ctx.stroke();
    }
    ctx.restore();
  }
};

export function setupChartDefaults() {
  Chart.register(valueLabels, guideLines);
  Chart.defaults.font.family = FONT_FAMILY;
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.display = false;
}
