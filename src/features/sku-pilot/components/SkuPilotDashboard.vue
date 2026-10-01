<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import { analyzePilotSkus, type PilotSkuInput, type PilotSkuResult } from '@/features/analysis';
import { readSheet } from '@/features/import';
import { fmt0, fmt1, money, pct, signedPct } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { downloadPilotTemplate, mapPilotRows } from '../lib/pilotImport';
import { generatePilotSample } from '../lib/sampleData';
import { loadPilotData, savePilotData } from '../lib/pilotPersistence';
import { usePilotTheme } from '../composables/usePilotTheme';

type FilterKey = 'sku' | 'category' | 'abc' | 'growthStatus' | 'marginStatus' | 'priceSegment' | 'dosStatus' | 'dioBasis' | 'status' | 'sales3m' | 'growth' | 'margin' | 'marginIndex' | 'priceIndex' | 'dos' | 'dio';
type CrossFilter = { key: FilterKey; value: string } | null;
const monthLabels = ['M1', 'M2', 'M3'];
const growthLabels = ['Strong Growth', 'Growth', 'Stable', 'Decline', 'Sharp Decline', 'N/A'];
const growthNames = ['Tăng mạnh', 'Tăng', 'Ổn định', 'Giảm', 'Giảm mạnh', 'Chưa đủ dữ liệu'];
const dosLabels = ['Very Low Stock', 'Low Stock', 'Healthy Stock', 'High Stock', 'Overstock', 'N/A'];
const dosNames = ['≤7 ngày', '8–15 ngày', '16–30 ngày', '31–60 ngày', '>60 ngày', 'Chưa có DOS'];
const priceLabels = ['Premium', 'Mid-High', 'Mid-Low', 'Entry', 'N/A'];
const statuses = ['CORE', 'GROWTH AT RISK', 'CORE / OVERSTOCK', 'SALES DRIVER / LOW MARGIN', 'DECLINE', 'SLOW / EXCESS', 'Regular'];
const rows = shallowRef<PilotSkuInput[]>([]);
const source = ref('Dữ liệu mẫu Pilot');
const loading = ref(true);
const importError = ref('');
const search = ref('');
const categorySearch = ref('');
const categoryFilter = ref('');
const abcFilter = ref('');
const statusFilter = ref('');
const crossFilter = ref<CrossFilter>(null);
const selectedMonths = ref([0, 1, 2]);
const detailFilterKey = ref<FilterKey | ''>('');
const detailFilterValue = ref('');
const categorySortKey = ref<'category' | 'sales' | 'growth' | 'profit' | 'dio'>('category');
const categorySortDirection = ref<'asc' | 'desc'>('asc');
const page = ref(1);
const { palette } = usePilotTheme();

const canSelectMonths = computed(() => rows.value.length === 0 || rows.value.every((row) => row.monthlyAvailable));
const analyzed = computed(() => analyzePilotSkus(rows.value, selectedMonths.value));
const categories = computed(() => [...new Set(analyzed.value.map((row) => row.category))].sort((a, b) => a.localeCompare(b, 'vi')));
const activeFilterText = computed(() => {
  if (!crossFilter.value) return '';
  const names: Record<FilterKey, string> = { sku: 'SKU', category: 'Category', abc: 'ABC', growthStatus: 'Tăng trưởng', marginStatus: 'Margin', priceSegment: 'Phân khúc giá', dosStatus: 'DOS', dioBasis: 'DIO', status: 'Trạng thái', sales3m: 'Doanh số', growth: 'Growth', margin: 'Margin', marginIndex: 'Margin Index', priceIndex: 'Price Index', dos: 'DOS', dio: 'DIO' };
  return `${names[crossFilter.value.key]}: ${crossFilter.value.value}`;
});
const globalRows = computed(() => analyzed.value.filter((row) =>
  (!categoryFilter.value || row.category === categoryFilter.value) &&
  (!abcFilter.value || row.abc === abcFilter.value) &&
  (!statusFilter.value || row.status === statusFilter.value) &&
  (!crossFilter.value || String(row[crossFilter.value.key] ?? 'N/A') === crossFilter.value.value) &&
  (!detailFilterKey.value || !detailFilterValue.value || row[detailFilterKey.value] === detailFilterValue.value) &&
  (!search.value || `${row.sku} ${row.name}`.toLocaleLowerCase('vi').includes(search.value.toLocaleLowerCase('vi')))
));
const filtered = globalRows;
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 10)));
const pageRows = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10));
const hasMonthlyData = computed(() => filtered.value.length > 0 && filtered.value.every((row) => row.monthlyAvailable));
const selectedPeriodDays = computed(() => selectedMonths.value.length * 30);
const selectedMonthTitle = computed(() => selectedMonths.value.map((month) => monthLabels[month]).join(' + '));
const growthComparisonMonths = computed(() => {
  const currentMonth = selectedMonths.value.at(-1);
  if (currentMonth == null) return null;
  const previousMonth = selectedMonths.value.length >= 2 ? selectedMonths.value.at(-2) : currentMonth - 1;
  return previousMonth == null || previousMonth < 0 ? null : { previousMonth, currentMonth };
});
const growthComparisonLabel = computed(() => growthComparisonMonths.value
  ? `${monthLabels[growthComparisonMonths.value.currentMonth]} so với ${monthLabels[growthComparisonMonths.value.previousMonth]}`
  : 'Không có tháng trước để so sánh Growth');
const totalSales = computed(() => filtered.value.reduce((n, row) => n + row.sales3m, 0));
const totalProfit = computed(() => filtered.value.reduce((n, row) => n + selectedMonths.value.reduce((sum, month) => sum + row.profit[month], 0), 0));
const margin = computed(() => totalSales.value ? totalProfit.value / totalSales.value : null);
const totalStockValue = computed(() => filtered.value.reduce((n, row) => n + row.inventoryValue, 0));
const avgDos = computed(() => {
  const values = filtered.value.map((row) => row.dos).filter((v): v is number => v != null && Number.isFinite(v));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
});
const overallRevenueGrowth = computed(() => {
  const comparison = growthComparisonMonths.value;
  if (!comparison) return null;
  const { previousMonth, currentMonth } = comparison;
  const previous = filtered.value.reduce((n, row) => n + row.revenue[previousMonth], 0);
  const current = filtered.value.reduce((n, row) => n + row.revenue[currentMonth], 0);
  return previous > 0 ? current / previous - 1 : null;
});
const totalSelectedCogs = (items: readonly PilotSkuResult[]) => items.reduce((total, row) => {
  const periodRevenue = selectedMonths.value.reduce((sum, month) => sum + row.revenue[month], 0);
  const revenue3m = row.revenue.reduce((sum, value) => sum + value, 0);
  return total + row.cogs3m * (revenue3m > 0 ? periodRevenue / revenue3m : selectedMonths.value.length / 3);
}, 0);
const inventoryBase = (row: PilotSkuResult) => row.openingInventoryValue == null ? row.inventoryValue : (row.openingInventoryValue + row.inventoryValue) / 2;
const totalDioInventory = computed(() => filtered.value.filter((row) => row.dio != null).reduce((sum, row) => sum + inventoryBase(row), 0));
const totalDioCogs = computed(() => totalSelectedCogs(filtered.value.filter((row) => row.dio != null)));
const avgDio = computed(() => totalDioCogs.value > 0 ? totalDioInventory.value / totalDioCogs.value * selectedPeriodDays.value : null);

watch([filtered, categoryFilter, abcFilter, statusFilter, crossFilter, detailFilterKey, detailFilterValue, search, selectedMonths], () => { page.value = 1; });

function setCrossFilter(key: FilterKey, value: string) {
  if (key === 'category') categoryFilter.value = '';
  if (key === 'abc') abcFilter.value = '';
  if (key === 'status') statusFilter.value = '';
  if (detailFilterKey.value === key) { detailFilterKey.value = ''; detailFilterValue.value = ''; }
  crossFilter.value = crossFilter.value?.key === key && crossFilter.value.value === value ? null : { key, value };
}
function toggleMonth(month: number) {
  if (!canSelectMonths.value) return;
  const next = selectedMonths.value.includes(month) ? selectedMonths.value.filter((item) => item !== month) : [...selectedMonths.value, month].sort((a, b) => a - b);
  if (next.length) selectedMonths.value = next;
}
function chartClick(key: FilterKey, values: string[]) {
  return (_event: unknown, elements: Array<{ index: number }>) => {
    const index = elements[0]?.index;
    if (index != null && values[index] != null) setCrossFilter(key, values[index]);
  };
}
function selectMonthFromChart(_event: unknown, elements: Array<{ index: number }>) {
  const month = elements[0]?.index;
  if (month != null && canSelectMonths.value) selectedMonths.value = [month];
}
function toggleCategorySort(key: typeof categorySortKey.value) {
  if (categorySortKey.value === key) categorySortDirection.value = categorySortDirection.value === 'asc' ? 'desc' : 'asc';
  else { categorySortKey.value = key; categorySortDirection.value = key === 'category' ? 'asc' : 'desc'; }
}

const categoryOverview = computed(() => {
  const base = categories.value.filter((category) => !categoryFilter.value || category === categoryFilter.value)
    .map((category) => {
      const items = filtered.value.filter((row) => row.category === category);
      const rev = [0, 1, 2].map((month) => items.reduce((n, row) => n + row.revenue[month], 0));
      const profit = [0, 1, 2].map((month) => items.reduce((n, row) => n + (selectedMonths.value.includes(month) ? row.profit[month] : 0), 0));
      const comparison = growthComparisonMonths.value;
      const revenueGrowth = !comparison || rev[comparison.previousMonth] <= 0 ? null : rev[comparison.currentMonth] / rev[comparison.previousMonth] - 1;
      const currentRevenue = selectedMonths.value.reduce((n, month) => n + rev[month], 0);
      const currentProfit = selectedMonths.value.reduce((n, month) => n + profit[month], 0);
      const marginCurrent = currentRevenue > 0 ? currentProfit / currentRevenue : null;
      const dosValues = items.map((row) => row.dos).filter((value): value is number => value != null && Number.isFinite(value));
      const dioInventory = items.filter((row) => row.dio != null).reduce((n, row) => n + inventoryBase(row), 0);
      const dioCogs = totalSelectedCogs(items.filter((row) => row.dio != null));
      return {
        category, items, rev, profit, revenueGrowth, marginCurrent,
        abc: ['A', 'B', 'C'].map((key) => items.filter((row) => row.abc === key).reduce((n, row) => n + row.sales3m, 0)),
        stockValue: items.reduce((n, row) => n + row.inventoryValue, 0),
        avgDos: dosValues.length ? dosValues.reduce((a, b) => a + b, 0) / dosValues.length : null,
        avgDio: dioCogs > 0 ? dioInventory / dioCogs * selectedPeriodDays.value : null,
        growthSku: items.filter((row) => row.growthStatus === 'Growth' || row.growthStatus === 'Strong Growth').length,
        overstockSku: items.filter((row) => row.dosStatus === 'Overstock').length,
        lowStockSku: items.filter((row) => row.dosStatus === 'Very Low Stock' || row.dosStatus === 'Low Stock').length,
        declineSku: items.filter((row) => row.growthStatus === 'Decline' || row.growthStatus === 'Sharp Decline').length
      };
    }).filter((item) => item.items.length > 0 && (!categorySearch.value || item.category.toLocaleLowerCase('vi').includes(categorySearch.value.toLocaleLowerCase('vi'))));
  const direction = categorySortDirection.value === 'asc' ? 1 : -1;
  return base.sort((a, b) => {
    const value = (item: typeof base[number]): string | number | null => {
      if (categorySortKey.value === 'sales') return selectedMonths.value.reduce((sum, month) => sum + item.rev[month], 0);
      if (categorySortKey.value === 'growth') return item.revenueGrowth;
      if (categorySortKey.value === 'profit') return item.profit.reduce((sum, part) => sum + part, 0);
      if (categorySortKey.value === 'dio') return item.avgDio;
      return item.category;
    };
    const left = value(a); const right = value(b);
    if (left == null) return 1;
    if (right == null) return -1;
    return (typeof left === 'string' ? left.localeCompare(right as string, 'vi') : left - (right as number)) * direction;
  });
});

const detailFilterOptions = computed(() => {
  const key = detailFilterKey.value;
  if (!key) return [];
  return [...new Set(analyzed.value.map((row) => String(row[key] ?? 'N/A')))].sort((a, b) => a.localeCompare(b, 'vi'));
});
watch(detailFilterKey, () => { detailFilterValue.value = ''; });

const abcChart = computed<ChartConfiguration>(() => {
  const labels = ['A', 'B', 'C'];
  const values = labels.map((key) => filtered.value.filter((row) => row.abc === key).reduce((n, row) => n + row.sales3m, 0));
  return { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: palette.value.abc, borderWidth: 0 }] }, options: { maintainAspectRatio: false, onClick: chartClick('abc', labels), plugins: { legend: { position: 'bottom', labels: { color: palette.value.text, usePointStyle: true, padding: 18 } } } } };
});
const salesTrendChart = computed<ChartConfiguration>(() => {
  const monthly = [0, 1, 2].map((month) => filtered.value.reduce((n, row) => n + row.revenue[month], 0));
  return { type: 'line', data: { labels: monthLabels, datasets: [{ label: 'Doanh số', data: monthly, borderColor: palette.value.series[0], backgroundColor: `${palette.value.series[0]}33`, fill: true, tension: 0.25, pointRadius: 5 }] }, options: { maintainAspectRatio: false, onClick: selectMonthFromChart, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.value.text }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: palette.value.text, callback: (value) => money(Number(value)) }, grid: { color: palette.value.grid } } } } };
});
const growthChart = computed<ChartConfiguration>(() => {
  const values = growthLabels.map((label) => filtered.value.filter((row) => row.growthStatus === label).length);
  return { type: 'bar', data: { labels: growthNames, datasets: [{ data: values, backgroundColor: palette.value.trend, borderRadius: 6, maxBarThickness: 34 }] }, options: { maintainAspectRatio: false, onClick: chartClick('growthStatus', growthLabels), plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.value.text }, grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0, color: palette.value.text }, grid: { color: palette.value.grid } } } } };
});
const inventoryChart = computed<ChartConfiguration>(() => {
  const values = dosLabels.map((label) => filtered.value.filter((row) => row.dosStatus === label).length);
  return { type: 'bar', data: { labels: dosNames, datasets: [{ data: values, backgroundColor: palette.value.dos, borderRadius: 6, maxBarThickness: 34 }] }, options: { maintainAspectRatio: false, onClick: chartClick('dosStatus', dosLabels), plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.value.text }, grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0, color: palette.value.text }, grid: { color: palette.value.grid } } } } };
});
const priceChart = computed<ChartConfiguration>(() => {
  return { type: 'bar', data: { labels: priceLabels, datasets: [{ data: priceLabels.map((key) => filtered.value.filter((row) => row.priceSegment === key).length), backgroundColor: palette.value.series, borderRadius: 6, maxBarThickness: 34 }] }, options: { maintainAspectRatio: false, onClick: chartClick('priceSegment', priceLabels), indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0, color: palette.value.text }, grid: { color: palette.value.grid } }, y: { ticks: { color: palette.value.text }, grid: { display: false } } } } };
});
const dioCategories = computed(() => categoryOverview.value.map((item) => item.category));
const dioChart = computed<ChartConfiguration>(() => ({
  type: 'bar', data: { labels: dioCategories.value, datasets: [{ label: 'DIO bình quân (ngày)', data: categoryOverview.value.map((item) => item.avgDio), backgroundColor: palette.value.series, borderRadius: 6, maxBarThickness: 34 }] },
  options: { maintainAspectRatio: false, onClick: chartClick('category', dioCategories.value), plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.value.text }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: palette.value.text }, grid: { color: palette.value.grid } } } }
}));

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importError.value = '';
  try {
    rows.value = mapPilotRows(await readSheet(file)); source.value = file.name;
    selectedMonths.value = [0, 1, 2]; crossFilter.value = null; detailFilterKey.value = ''; detailFilterValue.value = '';
    await savePilotData(rows.value, source.value); categoryFilter.value = ''; page.value = 1;
  } catch (error) { importError.value = error instanceof Error ? error.message : 'Không thể đọc file này.'; }
  finally { input.value = ''; }
}
async function useSample() {
  rows.value = generatePilotSample(); source.value = 'Dữ liệu mẫu Pilot'; selectedMonths.value = [0, 1, 2];
  crossFilter.value = null; detailFilterKey.value = ''; detailFilterValue.value = '';
  await savePilotData(rows.value, source.value); importError.value = ''; page.value = 1;
}

onMounted(async () => {
  const saved = await loadPilotData(); rows.value = saved?.rows ?? generatePilotSample(); source.value = saved?.source ?? 'Dữ liệu mẫu Pilot'; loading.value = false;
});
</script>

<template>
  <div class="mx-auto max-w-[1440px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">SKU REVIEW · DASHBOARD THỬ NGHIỆM</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard ABC Analysis</h1>
        <p class="mt-1 max-w-3xl text-sm text-ink-2">Theo dõi doanh số, tăng trưởng, lợi nhuận và tồn kho. Chọn một nhóm dữ liệu để lọc đồng bộ toàn dashboard.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn" @click="downloadPilotTemplate">Tải file mẫu</button>
        <label class="btn btn-primary relative cursor-pointer has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus">
          <span>{{ loading ? 'Đang nạp dữ liệu' : 'Tải dữ liệu lên' }}</span><input class="sr-only" type="file" accept=".csv,.xlsx,.xls" :disabled="loading" aria-label="Chọn file dữ liệu CSV hoặc Excel" @change="importFile" />
        </label>
        <button type="button" class="btn" @click="useSample">Dữ liệu mẫu</button>
      </div>
    </div>
    <div v-if="importError" class="mb-4 rounded-xl border border-line bg-sunken px-4 py-3 text-sm text-ink" role="alert">Lỗi nhập dữ liệu: {{ importError }}</div>

    <BaseCard class="mb-4" title="Phạm vi dữ liệu" :subtitle="`${fmt0(analyzed.length)} SKU · ${source} · ${selectedMonths.length} tháng được chọn`">
      <div class="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Chọn tháng dữ liệu">
        <span class="field-label mr-1">Tháng:</span>
        <button v-for="(month, index) in monthLabels" :key="month" type="button" class="chip" :aria-pressed="selectedMonths.includes(index)" :disabled="!canSelectMonths" @click="toggleMonth(index)">{{ month }}</button>
        <span class="text-sm text-ink-2">Tổng {{ selectedMonths.length }} tháng: {{ selectedMonthTitle }}</span>
        <span v-if="!canSelectMonths" class="text-xs text-ink-3">File chỉ có tổng doanh số kỳ, không có số liệu từng tháng.</span>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="field-label">Category<select v-model="categoryFilter" class="control mt-1"><option value="">Tất cả Category</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></label>
        <label class="field-label">Nhóm ABC<select v-model="abcFilter" class="control mt-1"><option value="">Tất cả nhóm</option><option value="A">A · 0–80%</option><option value="B">B · &gt;80–95%</option><option value="C">C · &gt;95–100%</option></select></label>
        <label class="field-label">Trạng thái SKU<select v-model="statusFilter" class="control mt-1"><option value="">Tất cả trạng thái</option><option v-for="status in statuses" :key="status" :value="status">{{ status }}</option></select></label>
      </div>
      <div v-if="crossFilter" class="mt-3 flex flex-wrap items-center gap-2 text-sm" aria-live="polite"><span class="text-ink-2">Đang lọc:</span><span class="pill">{{ activeFilterText }}</span><button type="button" class="btn min-h-9 px-3" @click="crossFilter = null">Xóa lọc chéo</button></div>
    </BaseCard>

    <div v-if="loading" class="card py-12 text-center text-sm text-ink-2" role="status">Đang khôi phục dữ liệu trên trình duyệt…</div>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div class="card"><p class="eyebrow">Doanh số {{ selectedMonths.length }} tháng</p><p class="num mt-2 text-2xl font-semibold">{{ money(totalSales) }} ₫</p><p class="mt-1 text-xs text-ink-2">{{ growthComparisonMonths ? `${growthComparisonLabel}: ${signedPct(overallRevenueGrowth)}` : growthComparisonLabel }}</p></div>
        <div class="card"><p class="eyebrow">Lợi nhuận {{ selectedMonths.length }} tháng</p><p class="num mt-2 text-2xl font-semibold">{{ money(totalProfit) }} ₫</p><p class="mt-1 text-xs text-ink-2">Tổng Profit trong khoảng chọn</p></div>
        <div class="card"><p class="eyebrow">Margin {{ selectedMonths.length }} tháng</p><p class="num mt-2 text-2xl font-semibold">{{ pct(margin) }}</p><p class="mt-1 text-xs text-ink-2">Profit kỳ chọn / Revenue kỳ chọn</p></div>
        <div class="card"><p class="eyebrow">Giá trị tồn kho</p><p class="num mt-2 text-2xl font-semibold">{{ money(totalStockValue) }} ₫</p><p class="mt-1 text-xs text-ink-2">Tổng Inventory Value hiện tại</p></div>
        <div class="card"><p class="eyebrow">DOS bình quân</p><p class="num mt-2 text-2xl font-semibold">{{ avgDos == null ? '—' : `${fmt1(avgDos)} ngày` }}</p><p class="mt-1 text-xs text-ink-2">Theo {{ selectedPeriodDays }} ngày bán</p></div>
      </div>

      <SectionHeader title="Phân tích danh mục" :hint="`${fmt0(filtered.length)} SKU đang xem`" />
      <div class="grid gap-4 lg:grid-cols-2">
        <BaseCard title="Doanh số theo tháng" subtitle="Bấm một tháng để chuyển kỳ phân tích"><ChartCanvas v-if="hasMonthlyData" :config="salesTrendChart" label="Biểu đồ doanh số ba tháng; bấm tháng để chọn kỳ" /><p v-else class="rounded-xl bg-sunken px-4 py-6 text-sm text-ink-2">File hiện tại chỉ có tổng số theo kỳ, chưa có dữ liệu doanh số từng tháng.</p></BaseCard>
        <BaseCard title="Đóng góp doanh số ABC" subtitle="Chọn nhóm để lọc các bảng và biểu đồ"><ChartCanvas :config="abcChart" label="Biểu đồ tỷ trọng doanh số theo nhóm ABC" /><div class="mt-2 flex flex-wrap gap-2"><button v-for="key in ['A', 'B', 'C']" :key="key" type="button" class="chip" @click="setCrossFilter('abc', key)">{{ key }} · {{ fmt0(filtered.filter(row => row.abc === key).length) }} SKU</button></div></BaseCard>
        <BaseCard title="Xu hướng doanh số" :subtitle="`Growth ${growthComparisonLabel}`"><ChartCanvas :config="growthChart" label="Biểu đồ số SKU theo nhóm tăng trưởng; bấm cột để lọc" /><div class="mt-2 flex flex-wrap gap-2"><button v-for="(label, index) in growthLabels" :key="label" type="button" class="chip" @click="setCrossFilter('growthStatus', label)">{{ growthNames[index] }} · {{ fmt0(filtered.filter(row => row.growthStatus === label).length) }}</button></div></BaseCard>
        <BaseCard title="Phân khúc giá" subtitle="Price Index = ASP SKU / ASP Category"><ChartCanvas :config="priceChart" label="Biểu đồ số SKU theo phân khúc giá; bấm thanh để lọc" /><div class="mt-2 flex flex-wrap gap-2"><button v-for="key in priceLabels" :key="key" type="button" class="chip" @click="setCrossFilter('priceSegment', key)">{{ key }} · {{ fmt0(filtered.filter(row => row.priceSegment === key).length) }}</button></div></BaseCard>
      </div>

      <SectionHeader title="DIO Dashboard" hint="Số ngày tồn kho theo giá vốn" />
      <div class="grid gap-4 lg:grid-cols-2">
        <BaseCard title="DIO bình quân danh mục" :subtitle="`Tồn kho bình quân / COGS ${selectedMonths.length} tháng × ${selectedPeriodDays} ngày`">
          <div class="mb-3 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-sunken p-3"><p class="eyebrow">DIO bình quân</p><p class="num mt-1 text-xl font-semibold">{{ avgDio == null ? '—' : `${fmt1(avgDio)} ngày` }}</p></div><div class="rounded-xl bg-sunken p-3"><p class="eyebrow">Tồn kho bình quân</p><p class="num mt-1 text-lg font-semibold">{{ money(totalDioInventory) }} ₫</p></div><div class="rounded-xl bg-sunken p-3"><p class="eyebrow">COGS kỳ chọn</p><p class="num mt-1 text-lg font-semibold">{{ money(totalDioCogs) }} ₫</p></div></div>
          <ChartCanvas :config="dioChart" label="Biểu đồ DIO theo Category; bấm thanh để lọc Category" />
        </BaseCard>
        <BaseCard title="DIO theo Category" subtitle="Bảng tổng hợp tồn kho và giá vốn dùng để tính DIO">
          <div class="overflow-x-auto"><table class="w-full min-w-[520px] text-left text-sm"><thead class="bg-sunken text-xs text-ink-2"><tr><th class="px-3 py-3">Category</th><th class="px-3 py-3">Tồn kho bình quân</th><th class="px-3 py-3">COGS kỳ chọn</th><th class="px-3 py-3">DIO</th></tr></thead><tbody><tr v-for="item in categoryOverview" :key="item.category" class="border-t border-line"><th scope="row" class="px-3 py-3"><button type="button" class="text-left underline-offset-2 hover:underline" @click="setCrossFilter('category', item.category)">{{ item.category }}</button></th><td class="num px-3 py-3">{{ money(item.items.filter(row => row.dio != null).reduce((sum, row) => sum + inventoryBase(row), 0)) }} ₫</td><td class="num px-3 py-3">{{ money(totalSelectedCogs(item.items.filter(row => row.dio != null))) }} ₫</td><td class="num px-3 py-3">{{ item.avgDio == null ? '—' : `${fmt1(item.avgDio)} ngày` }}</td></tr><tr v-if="!categoryOverview.length"><td colspan="4" class="px-3 py-6 text-center text-ink-3">Không có dữ liệu phù hợp.</td></tr></tbody></table></div>
          <p class="mt-3 text-xs leading-relaxed text-ink-3">Nếu file chỉ có COGS 3 tháng, COGS của khoảng tháng được chọn được ước tính theo tỷ trọng doanh thu. DIO không có ngưỡng phân loại trong nguyên tắc hiện tại.</p>
        </BaseCard>
      </div>

      <div class="mt-4">
        <BaseCard title="Tình trạng DOS" subtitle="DOS = tồn cuối kỳ / doanh số bình quân ngày"><ChartCanvas :config="inventoryChart" label="Biểu đồ số SKU theo mức DOS; bấm thanh để lọc" /><div class="mt-2 flex flex-wrap gap-2"><button v-for="(label, index) in dosLabels" :key="label" type="button" class="chip" @click="setCrossFilter('dosStatus', label)">{{ dosNames[index] }} · {{ fmt0(filtered.filter(row => row.dosStatus === label).length) }}</button></div></BaseCard>
      </div>

      <SectionHeader title="Category Overview" hint="Tổng hợp doanh số, profit và tồn kho" />
      <div class="mb-3 flex flex-wrap items-end justify-between gap-3"><label class="w-full sm:max-w-xs"><span class="field-label">Tìm Category</span><input v-model="categorySearch" class="control mt-1" type="search" placeholder="Nhập tên Category" /></label><span class="text-xs text-ink-3">Bấm tên Category trong bảng để lọc toàn dashboard</span></div>
      <div class="overflow-x-auto rounded-2xl border border-line bg-surface"><table class="w-full min-w-[1400px] text-left text-sm">
        <thead class="bg-sunken text-xs text-ink-2"><tr>
          <th v-for="column in [{ key: 'category', label: 'Category' }, { key: 'sales', label: 'Total Sales' }, { key: 'growth', label: 'Growth' }, { key: 'abc', label: 'ABC Contribution' }, { key: 'profit', label: 'Total Profit' }, { key: 'margin', label: 'Margin' }, { key: 'stock', label: 'Stock Value' }, { key: 'dos', label: 'Avg DOS' }, { key: 'dio', label: 'Avg DIO' }, { key: 'sku', label: 'SKU' }, { key: 'growthSku', label: 'Growth SKU' }, { key: 'overstock', label: 'Overstock' }, { key: 'lowStock', label: 'Low Stock' }, { key: 'decline', label: 'Decline' }]" :key="column.key" class="px-3 py-3"><button v-if="['category', 'sales', 'growth', 'profit', 'dio'].includes(column.key)" type="button" class="whitespace-nowrap hover:text-ink" :aria-label="`Sắp xếp theo ${column.label}`" @click="toggleCategorySort(column.key as 'category' | 'sales' | 'growth' | 'profit' | 'dio')">{{ column.label }}<span v-if="categorySortKey === column.key"> {{ categorySortDirection === 'asc' ? '↑' : '↓' }}</span></button><span v-else class="whitespace-nowrap">{{ column.label }}</span></th>
        </tr></thead><tbody><tr v-for="item in categoryOverview" :key="item.category" class="border-t border-line hover:bg-sunken/70">
          <th scope="row" class="px-3 py-3 font-medium"><button type="button" class="text-left underline-offset-2 hover:underline" @click="setCrossFilter('category', item.category)">{{ item.category }}</button></th><td class="num px-3 py-3">{{ money(selectedMonths.reduce((sum, month) => sum + item.rev[month], 0)) }} ₫</td><td class="num px-3 py-3">{{ signedPct(item.revenueGrowth) }}</td><td class="num px-3 py-3">A {{ money(item.abc[0]) }} / B {{ money(item.abc[1]) }} / C {{ money(item.abc[2]) }}</td><td class="num px-3 py-3">{{ money(item.profit.reduce((a,b)=>a+b,0)) }} ₫</td><td class="num px-3 py-3">{{ pct(item.marginCurrent) }}</td><td class="num px-3 py-3">{{ money(item.stockValue) }} ₫</td><td class="num px-3 py-3">{{ fmt1(item.avgDos) }}</td><td class="num px-3 py-3">{{ fmt1(item.avgDio) }}</td><td class="num px-3 py-3">{{ item.items.length }}</td><td class="num px-3 py-3">{{ item.growthSku }}</td><td class="num px-3 py-3">{{ item.overstockSku }}</td><td class="num px-3 py-3">{{ item.lowStockSku }}</td><td class="num px-3 py-3">{{ item.declineSku }}</td>
        </tr><tr v-if="!categoryOverview.length"><td colspan="14" class="px-4 py-8 text-center text-ink-3">Không có dữ liệu phù hợp.</td></tr></tbody>
      </table></div>

      <SectionHeader title="SKU Detail" :hint="`${fmt0(filtered.length)} dòng`" />
      <div class="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="w-full"><span class="field-label">Tìm SKU hoặc tên</span><input v-model="search" class="control mt-1" type="search" placeholder="Tìm SKU hoặc tên sản phẩm" /></label>
        <label class="field-label">Lọc theo trường<select v-model="detailFilterKey" class="control mt-1"><option value="">Không lọc thêm</option><option value="category">Category</option><option value="abc">ABC</option><option value="growthStatus">Tăng trưởng</option><option value="marginStatus">Margin</option><option value="priceSegment">Phân khúc giá</option><option value="dosStatus">DOS</option><option value="dioBasis">DIO</option><option value="status">Trạng thái SKU</option></select></label>
        <label class="field-label sm:col-span-2">Giá trị<select v-model="detailFilterValue" class="control mt-1" :disabled="!detailFilterKey"><option value="">Tất cả giá trị</option><option v-for="value in detailFilterOptions" :key="value" :value="value">{{ value }}</option></select></label>
      </div>
      <p class="mb-3 text-sm text-ink-2">Bấm Category, ABC, Growth, Margin, phân khúc giá, DOS hoặc Status trong bảng để lọc toàn dashboard.</p>
      <div class="overflow-x-auto rounded-2xl border border-line bg-surface"><table class="w-full min-w-[1380px] text-left text-sm">
        <thead class="bg-sunken text-xs text-ink-2"><tr><th class="px-3 py-3">SKU</th><th class="px-3 py-3">Sản phẩm</th><th class="px-3 py-3">Category</th><th class="px-3 py-3">ABC</th><th class="px-3 py-3">Sales {{ selectedMonths.length }}M</th><th class="px-3 py-3">Sales Qty {{ selectedMonths.length }}M</th><th class="px-3 py-3">Growth</th><th class="px-3 py-3">Margin<br><span class="font-normal text-ink-3">Margin TB</span></th><th class="px-3 py-3">Price Index</th><th class="px-3 py-3">Phân khúc</th><th class="px-3 py-3">Stock Qty</th><th class="px-3 py-3">Stock Value</th><th class="px-3 py-3">DOS</th><th class="px-3 py-3">DIO</th><th class="px-3 py-3">Status</th></tr></thead>
        <tbody><tr v-for="row in pageRows" :key="row.sku" class="border-t border-line hover:bg-sunken/70">
          <th scope="row" class="px-3 py-3 font-mono text-xs font-medium"><button type="button" @click="setCrossFilter('sku', row.sku)">{{ row.sku }}</button></th><td class="px-3 py-3"><button type="button" class="text-left" @click="setCrossFilter('sku', row.sku)">{{ row.name }}</button></td>
          <td class="px-3 py-3"><button type="button" class="text-left underline-offset-2 hover:underline" @click="setCrossFilter('category', row.category)">{{ row.category }}</button></td>
          <td class="px-3 py-3"><button type="button" class="pill font-semibold" @click="setCrossFilter('abc', row.abc)">{{ row.abc }} · {{ pct(row.salesShare) }}</button></td>
          <td class="num px-3 py-3"><button type="button" @click="setCrossFilter('sales3m', String(row.sales3m))">{{ money(row.sales3m) }} ₫</button></td><td class="num px-3 py-3">{{ fmt0(row.totalQty3m) }}</td><td class="num px-3 py-3"><button type="button" class="text-left" @click="setCrossFilter('growthStatus', row.growthStatus)">{{ signedPct(row.growth) }} <span class="text-xs text-ink-3">{{ row.growthStatus }}</span></button></td>
          <td class="num px-3 py-3"><button type="button" class="text-left" @click="setCrossFilter('marginStatus', row.marginStatus)">{{ pct(row.margin) }} <span class="block text-xs text-ink-3">{{ row.marginStatus }}</span><span class="block text-xs text-ink-3">TB ngành: {{ pct(row.categoryMargin) }}</span></button></td><td class="num px-3 py-3"><button type="button" @click="setCrossFilter('priceIndex', String(row.priceIndex ?? 'N/A'))">{{ row.priceIndex == null ? '-' : pct(row.priceIndex) }}</button></td>
          <td class="px-3 py-3"><button type="button" @click="setCrossFilter('priceSegment', row.priceSegment)">{{ row.priceSegment }}</button></td><td class="num px-3 py-3">{{ fmt0(row.inventoryQty) }}</td><td class="num px-3 py-3">{{ money(row.inventoryValue) }} ₫</td><td class="num px-3 py-3"><button type="button" class="text-left" @click="setCrossFilter('dosStatus', row.dosStatus)">{{ row.dos == null ? '-' : fmt1(row.dos) }} <span class="text-xs text-ink-3">{{ row.dosStatus }}</span></button></td>
          <td class="num px-3 py-3"><button type="button" class="text-left" @click="setCrossFilter('dioBasis', row.dioBasis)">{{ row.dio == null ? '-' : `${fmt1(row.dio)} ngày` }} <span class="text-xs text-ink-3">{{ row.dioBasis }}</span></button></td><td class="px-3 py-3"><button type="button" class="pill" @click="setCrossFilter('status', row.status)">{{ row.status }}</button></td>
        </tr><tr v-if="!pageRows.length"><td colspan="15" class="px-4 py-8 text-center text-ink-3">Không có dữ liệu phù hợp.</td></tr></tbody>
      </table></div>
      <div class="mt-3 flex items-center justify-between gap-3 text-sm text-ink-2"><span>Trang {{ page }} / {{ pageCount }}</span><div class="flex gap-2"><button class="btn min-h-10 px-3" :disabled="page <= 1" @click="page--">Trước</button><button class="btn min-h-10 px-3" :disabled="page >= pageCount" @click="page++">Tiếp</button></div></div>
      <p class="mt-5 rounded-xl bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-2">ABC tính theo doanh số trong các tháng đã chọn; Growth so sánh tháng được chọn gần nhất với tháng liền trước (nếu chọn nhiều tháng thì so sánh hai tháng được chọn gần nhất); DOS dùng số ngày của khoảng chọn. DIO dùng tồn kho bình quân chia COGS kỳ chọn. Nếu chỉ có COGS 3 tháng, COGS kỳ con được ước tính theo doanh thu.</p>
    </template>
  </div>
</template>
