const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

type Num = number | null | undefined;

const valid = (v: Num): v is number => v != null && Number.isFinite(v);

export const fmt0 = (v: Num) => (valid(v) ? nf0.format(v) : '-');
export const fmt1 = (v: Num) => (valid(v) ? nf1.format(v) : '-');

export const pct = (v: Num, digits = 1) => (valid(v) ? nf1.format(+(v * 100).toFixed(digits)) + '%' : '-');

export function money(v: Num) {
  if (!valid(v)) return '-';
  const abs = Math.abs(v);
  if (abs >= 1e9) return nf1.format(v / 1e9) + ' tỷ';
  if (abs >= 1e6) return nf1.format(v / 1e6) + ' tr';
  return nf0.format(v);
}
