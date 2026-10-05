import type { PilotSkuInput } from '@/features/analysis';

const names = [
  ['Sữa tươi ít đường 1L', 'Sữa hạt óc chó 180ml', 'Sữa chua uống 4 lốc', 'Phô mai lát 200g', 'Bơ lạt 200g', 'Kem vani 450ml'],
  ['Nước giặt dịu nhẹ 2.4kg', 'Nước rửa chén trà xanh', 'Khăn giấy hộp 180 tờ', 'Túi rác cuộn 3 cuộn', 'Nước lau sàn 1L', 'Nước xả vải 1.8L'],
  ['Mì gói vị bò 5 gói', 'Gạo thơm 5kg', 'Dầu ăn đậu nành 1L', 'Nước mắm 750ml', 'Yến mạch cán 500g', 'Bánh quy bơ 300g'],
  ['Dầu gội phục hồi 650ml', 'Sữa rửa mặt dịu nhẹ', 'Kem chống nắng SPF50', 'Bàn chải lông mềm 2 chiếc', 'Tăm bông 200 que', 'Kem dưỡng ẩm 50ml']
];
const categories = ['Thực phẩm mát', 'Chăm sóc nhà cửa', 'Thực phẩm khô', 'Chăm sóc cá nhân'];
const multipliers = [8, 5.8, 4.7, 3.9, 3.2, 2.7, 2.2, 1.9, 1.6, 1.4, 1.2, 1, 0.88, 0.76, 0.65, 0.55, 0.46, 0.38, 0.31, 0.25, 0.2, 0.15, 0.1, 0.06];

export function generatePilotSample(): PilotSkuInput[] {
  return categories.flatMap((category, group) => names[group].map((name, item) => {
    const i = group * 6 + item;
    const qtyBase = Math.round(45 * multipliers[i] * (1 + group * 0.08));
    const price = [42000, 37000, 30000, 56000][group] + item * 3500;
    const trend = [0.34, 0.12, 0.01, -0.08, -0.26, -0.12][item];
    const salesQty: [number, number, number] = [Math.round(qtyBase * 0.92), Math.round(qtyBase * (1 - trend * 0.45)), Math.round(qtyBase * (1 + trend))];
    const revenue: [number, number, number] = salesQty.map((qty, month) => qty * price * (month === 2 && item === 1 ? 1.04 : 1)) as [number, number, number];
    const margin = [0.23, 0.18, 0.14, 0.08, 0.06, 0.16][item];
    const profit: [number, number, number] = revenue.map((value, month) => Math.round(value * (margin + (month === 2 ? (item === 0 ? 0.02 : 0) : 0)))) as [number, number, number];
    const inventoryQty = Math.max(0, Math.round((salesQty.reduce((a, b) => a + b, 0) / 90) * [5, 12, 24, 48, 78, 104][item]));
    const inventoryValue = inventoryQty * price * (1 - margin);
    return {
      sku: `PIL-${String(i + 1).padStart(3, '0')}`, name, category, salesQty, revenue, profit,
      monthlyAvailable: true, sellingPrice: price, inventoryQty, inventoryValue,
    };
  }));
}
