const DIACRITICS = /[\u0300-\u036f]/g;

/** Chuẩn hoá chuỗi để so khớp: bỏ dấu tiếng Việt, chữ thường, chỉ giữ a-z0-9. */
export function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/** Đọc số từ cả định dạng Việt (1.234.567,5) lẫn quốc tế (1,234,567.5). */
export function parseNum(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let s = String(value ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (hasComma) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export const parseBool = (value: unknown) => ['y', 'yes', '1', 'true', 'x', 'co'].includes(normalizeKey(value));
