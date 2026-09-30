import type { Lifecycle, SkuInput } from '@/features/analysis';

const CATEGORIES: Record<string, { subcat1: string; subcat2: string[] }[]> = {
  'Sữa': [
    { subcat1: 'Sữa nước', subcat2: ['Sữa tươi', 'Sữa tiệt trùng'] },
    { subcat1: 'Sữa lên men', subcat2: ['Sữa chua ăn', 'Sữa chua uống'] },
    { subcat1: 'Sữa thực vật', subcat2: ['Sữa hạt', 'Sữa đậu nành'] }
  ],
  'Bánh kẹo': [
    { subcat1: 'Bánh', subcat2: ['Bánh quy', 'Bánh xốp'] },
    { subcat1: 'Kẹo', subcat2: ['Kẹo dẻo', 'Kẹo cứng'] },
    { subcat1: 'Snack', subcat2: ['Snack mặn', 'Socola'] }
  ],
  'Đồ uống': [
    { subcat1: 'Nước đóng chai', subcat2: ['Nước suối', 'Nước khoáng'] },
    { subcat1: 'Trà', subcat2: ['Trà xanh', 'Trà trái cây'] },
    { subcat1: 'Nước giải khát', subcat2: ['Nước ngọt', 'Cà phê lon'] }
  ],
  'Chăm sóc cá nhân': [
    { subcat1: 'Chăm sóc tóc', subcat2: ['Dầu gội', 'Dầu xả'] },
    { subcat1: 'Chăm sóc cơ thể', subcat2: ['Sữa tắm', 'Khăn giấy'] },
    { subcat1: 'Chăm sóc răng miệng', subcat2: ['Kem đánh răng', 'Nước súc miệng'] }
  ]
};
const SIZES = ['180ml', '500g', '1L', 'Hộp 6', 'Gói lớn'];
const DOS_POOL = [3, 5, 9, 12, 18, 22, 25, 28, 35, 45, 55, 70, 85, 120, 160];

/** PRNG mulberry32: seed cố định để dữ liệu mẫu giống nhau mỗi lần. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSampleData(perCategory = 20, seed = 20260930): SkuInput[] {
  const rnd = seeded(seed);
  const out: SkuInput[] = [];
  let i = 0;
  for (const [category, groups] of Object.entries(CATEGORIES)) {
    for (let j = 0; j < perCategory; j++) {
      i++;
      const group = groups[j % groups.length];
      const subcat2 = group.subcat2[j % group.subcat2.length];
      const units = Math.round(Math.exp(1.6 + rnd() * 5.2));
      const price = Math.round((12 + rnd() * 230) * 1000);
      const oosDays = rnd() < 0.7 ? Math.floor(rnd() * 2) : Math.floor(rnd() * 11);
      const ads = units / Math.max(1, 56 - oosDays);
      const lifecycle: Lifecycle = rnd() < 0.06 ? 'New' : rnd() < 0.06 ? 'EOL' : 'Active';
      const unitsPrev = lifecycle === 'New' ? 0 : Math.round(units * (0.55 + rnd() * 0.9));
      const prevPrice = Math.round(price * (0.92 + rnd() * 0.14));
      out.push({
        sku: 'SKU' + String(i).padStart(4, '0'),
        name: `${subcat2} ${SIZES[j % SIZES.length]}`,
        category,
        subcat1: group.subcat1,
        subcat2,
        revenue: units * price,
        revenuePrev: unitsPrev * prevPrice,
        gp: Math.round(units * price * (0.12 + rnd() * 0.23)),
        units,
        unitsPrev,
        oosDays,
        stock: Math.round(ads * DOS_POOL[Math.floor(rnd() * DOS_POOL.length)] * (0.8 + rnd() * 0.4)),
        lifecycle,
        seasonal: rnd() < 0.04,
        days: 0
      });
    }
  }
  return out;
}
