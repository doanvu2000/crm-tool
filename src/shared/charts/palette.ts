import type { Theme } from '@/shared/composables/useTheme';

/** Hex theo Tailwind palette; Chart.js cần hex/rgb để tự tính màu hover. */
export interface ChartPalette {
  text: string;
  muted: string;
  grid: string;
  surface: string;
  ink: string;
  tooltipBg: string;
  tooltipTitle: string;
  tooltipBody: string;
  abc: [string, string, string];
  compare: [string, string];
  velocity: string[];
  dos: string[];
  oos: string[];
  trend: string[];
  action: string[];
  series: string[];
  heat: string[];
  heatInk: string[];
}

export const PALETTE: Record<Theme, ChartPalette> = {
  light: {
    text: '#4a5866',
    muted: '#5f6c78',
    grid: '#e6ebf1',
    surface: '#ffffff',
    ink: '#0f1b2a',
    tooltipBg: '#0f1b2a',
    tooltipTitle: '#ffffff',
    tooltipBody: '#dfe5ec',
    abc: ['#2563eb', '#f97316', '#10b981'],
    compare: ['#94a3b8', '#2563eb'],
    velocity: ['#1d4ed8', '#3b82f6', '#93c5fd', '#94a3b8'],
    dos: ['#dc2626', '#f97316', '#059669', '#c4b5fd', '#8b5cf6', '#6d28d9'],
    oos: ['#059669', '#f59e0b', '#f97316', '#dc2626'],
    trend: ['#1d4ed8', '#60a5fa', '#cbd5e1', '#f87171', '#b91c1c'],
    action: ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed'],
    series: ['#2563eb', '#ea580c', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#a16207', '#db2777'],
    heat: ['#f1f5f9', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
    heatInk: ['#64748b', '#1e3a8a', '#1e3a8a', '#ffffff', '#ffffff']
  },
  dark: {
    text: '#a9b6c3',
    muted: '#8b99a7',
    grid: '#1d2834',
    surface: '#121a23',
    ink: '#e8edf2',
    tooltipBg: '#e8edf2',
    tooltipTitle: '#111b24',
    tooltipBody: '#4a5866',
    abc: ['#3b82f6', '#f97316', '#10b981'],
    compare: ['#64748b', '#3b82f6'],
    velocity: ['#93c5fd', '#60a5fa', '#2563eb', '#475569'],
    dos: ['#ef4444', '#f97316', '#10b981', '#6d28d9', '#8b5cf6', '#c4b5fd'],
    oos: ['#10b981', '#fbbf24', '#f97316', '#ef4444'],
    trend: ['#60a5fa', '#1d4ed8', '#475569', '#b91c1c', '#f87171'],
    action: ['#3b82f6', '#10b981', '#fbbf24', '#ef4444', '#a78bfa'],
    series: ['#60a5fa', '#fb923c', '#34d399', '#f87171', '#c4b5fd', '#22d3ee', '#facc15', '#f472b6'],
    heat: ['#1e293b', '#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd'],
    heatInk: ['#94a3b8', '#dbeafe', '#ffffff', '#ffffff', '#0f172a']
  }
};
