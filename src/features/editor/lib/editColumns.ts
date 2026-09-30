import type { SkuInput } from '@/features/analysis';
import { parseNum } from '@/shared/lib/parse';

export type EditKind = 'text' | 'number' | 'lifecycle' | 'bool';

export interface EditColumn {
  key: keyof SkuInput;
  label: string;
  kind: EditKind;
  width: string;
}

export const EDIT_COLUMNS: EditColumn[] = [
  { key: 'name', label: 'Tên', kind: 'text', width: 'min-w-44' },
  { key: 'category', label: 'Ngành', kind: 'text', width: 'min-w-32' },
  { key: 'revenue', label: 'Doanh thu', kind: 'number', width: 'min-w-32' },
  { key: 'revenuePrev', label: 'DT kỳ trước', kind: 'number', width: 'min-w-32' },
  { key: 'gp', label: 'GP', kind: 'number', width: 'min-w-28' },
  { key: 'units', label: 'SL bán', kind: 'number', width: 'min-w-24' },
  { key: 'unitsPrev', label: 'SL kỳ trước', kind: 'number', width: 'min-w-24' },
  { key: 'oosDays', label: 'Ngày OOS', kind: 'number', width: 'min-w-20' },
  { key: 'stock', label: 'Tồn', kind: 'number', width: 'min-w-24' },
  { key: 'lifecycle', label: 'Lifecycle', kind: 'lifecycle', width: 'min-w-28' },
  { key: 'seasonal', label: 'Mùa vụ', kind: 'bool', width: 'min-w-16' },
  { key: 'days', label: 'Số ngày kỳ', kind: 'number', width: 'min-w-20' }
];

export const EDIT_GROUPS: { title: string; keys: (keyof SkuInput)[] }[] = [
  { title: 'Thông tin', keys: ['name', 'category', 'lifecycle', 'seasonal'] },
  { title: 'Kỳ này', keys: ['revenue', 'gp', 'units', 'oosDays', 'stock', 'days'] },
  { title: 'Kỳ trước', keys: ['revenuePrev', 'unitsPrev'] }
];

export function parseEdit(col: EditColumn, value: string): Partial<SkuInput> {
  if (col.kind === 'number') return { [col.key]: Math.max(0, parseNum(value)) };
  const text = value.trim();
  return { [col.key]: col.key === 'category' ? text || 'Khác' : text };
}
