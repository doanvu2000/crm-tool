import { PILOT_THRESHOLDS as T } from '../model/thresholds';
import type { PilotSkuInput, PilotSkuResult, PilotSkuStatus } from '../model/types';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** Pure selected-period dashboard calculation. It reports measures and status only. */
export function analyzePilotSkus(rows: readonly PilotSkuInput[], selectedMonths: readonly number[] = [0, 1, 2]): PilotSkuResult[] {
  const months = [...new Set(selectedMonths)].filter((month) => Number.isInteger(month) && month >= 0 && month < 3).sort((a, b) => a - b);
  const periodDays = Math.max(1, months.length) * 30;
  const selectedRevenue = (row: PilotSkuInput) => months.reduce((total, month) => total + row.revenue[month], 0);
  const selectedQty = (row: PilotSkuInput) => months.reduce((total, month) => total + row.salesQty[month], 0);
  const selectedProfit = (row: PilotSkuInput) => months.reduce((total, month) => total + row.profit[month], 0);
  const currentMonth = months.at(-1);
  const previousMonth = months.length >= 2 ? months.at(-2) : currentMonth != null && currentMonth > 0 ? currentMonth - 1 : undefined;
  const category = new Map<string, { revenue: number; qty: number; profit: number }>();
  for (const row of rows) {
    const current = category.get(row.category) ?? { revenue: 0, qty: 0, profit: 0 };
    current.revenue += selectedRevenue(row);
    current.qty += selectedQty(row);
    current.profit += selectedProfit(row);
    category.set(row.category, current);
  }

  const totalSales = rows.reduce((total, row) => total + selectedRevenue(row), 0);
  const ranked = [...rows].map((row) => ({ row, sales3m: selectedRevenue(row), totalQty3m: selectedQty(row), selectedProfit: selectedProfit(row) }))
    .sort((a, b) => b.sales3m - a.sales3m);
  let cumulative = 0;

  return ranked.map(({ row, sales3m, totalQty3m, selectedProfit: profitTotal }) => {
    const salesShare = totalSales > 0 ? sales3m / totalSales : 0;
    cumulative += salesShare;
    const abc = totalSales <= 0 || sales3m <= 0 ? 'C' : cumulative <= T.abc.a ? 'A' : cumulative <= T.abc.b ? 'B' : 'C';
    const growth = row.monthlyAvailable && previousMonth != null && currentMonth != null && row.revenue[previousMonth] > 0
      ? (row.revenue[currentMonth] - row.revenue[previousMonth]) / row.revenue[previousMonth] : null;
    const growthStatus = growth == null ? 'N/A' : growth > T.growth.strong ? 'Strong Growth'
      : growth >= T.growth.growth ? 'Growth' : growth >= T.growth.decline ? 'Stable'
        : growth >= T.growth.sharpDecline ? 'Decline' : 'Sharp Decline';

    const currentCategory = category.get(row.category)!;
    const margin = sales3m !== 0 ? profitTotal / sales3m : null;
    const categoryMargin = currentCategory.revenue !== 0 ? currentCategory.profit / currentCategory.revenue : null;
    const marginIndex = margin != null && categoryMargin != null && categoryMargin !== 0 ? margin / categoryMargin : null;
    const marginStatus = marginIndex == null ? 'N/A' : marginIndex >= T.marginIndex.high ? 'High Margin'
      : marginIndex >= T.marginIndex.healthy ? 'Healthy' : marginIndex >= T.marginIndex.low ? 'Low Margin' : 'Very Low Margin';

    const asp = row.sellingPrice > 0 ? row.sellingPrice : totalQty3m > 0 ? sales3m / totalQty3m : null;
    const categoryAsp = currentCategory.qty > 0 ? currentCategory.revenue / currentCategory.qty : null;
    const priceIndex = asp != null && categoryAsp != null && categoryAsp > 0 ? asp / categoryAsp : null;
    const priceSegment = priceIndex == null ? 'N/A' : priceIndex > T.priceIndex.premium ? 'Premium'
      : priceIndex >= T.priceIndex.midHigh ? 'Mid-High' : priceIndex >= T.priceIndex.midLow ? 'Mid-Low' : 'Entry';

    const averageDailySales = totalQty3m / periodDays;
    const dos = averageDailySales > 0 ? row.inventoryQty / averageDailySales : null;
    const dosStatus = dos == null ? 'N/A' : dos <= T.dos.veryLow ? 'Very Low Stock' : dos <= T.dos.low ? 'Low Stock'
      : dos <= T.dos.healthy ? 'Healthy Stock' : dos <= T.dos.high ? 'High Stock' : 'Overstock';
    const inventoryBase = row.openingInventoryValue == null ? row.inventoryValue : (row.openingInventoryValue + row.inventoryValue) / 2;
    // When the import has only one 3-month COGS value, estimate selected-period COGS
    // proportionally from revenue; imports with monthly COGS can be added later.
    const revenue3m = sum(row.revenue);
    const selectedCogs = row.cogs3m * (revenue3m > 0 ? sales3m / revenue3m : months.length / 3);
    const dio = selectedCogs > 0 ? inventoryBase / selectedCogs * periodDays : null;
    const dioBasis = dio == null ? 'N/A' : row.openingInventoryValue == null ? 'Inventory Days' : 'DIO';

    let status: PilotSkuStatus = 'Regular';
    if (abc === 'A' && growth != null && growth >= T.status.coreGrowthFloor && dosStatus === 'Healthy Stock') status = 'CORE';
    else if ((abc === 'A' || abc === 'B') && growth != null && growth > T.status.growthAtRiskFloor && dos != null && dos <= T.status.growthAtRiskMaxDos) status = 'GROWTH AT RISK';
    else if (abc === 'A' && dos != null && dos > T.status.overstockDosFloor) status = 'CORE / OVERSTOCK';
    else if (abc === 'A' && marginIndex != null && marginIndex < T.status.lowMarginCeiling) status = 'SALES DRIVER / LOW MARGIN';
    else if ((abc === 'A' || abc === 'B') && growth != null && growth < T.status.declineCeiling) status = 'DECLINE';
    else if (abc === 'C' && growth != null && growth < T.status.slowExcessGrowthCeiling && dos != null && dos > T.status.overstockDosFloor) status = 'SLOW / EXCESS';

    return {
      ...row, sales3m, totalQty3m, salesShare, cumulativeSalesShare: cumulative, abc,
      growth, growthStatus, margin, categoryMargin, marginIndex, marginStatus, asp, priceIndex, priceSegment,
      averageDailySales, dos, dosStatus, dio, dioBasis, status
    };
  });
}
