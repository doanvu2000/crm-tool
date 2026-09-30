<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import { ACCEPTED_FILE, readSheet } from '@/features/import';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { animation, categoryAxis, tooltipStyle, valueAxis } from '@/shared/charts/options';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, money } from '@/shared/lib/format';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import { mapMonthlySales, MonthlySalesImportError } from '../lib/importMonthlySales';
import { downloadMonthlySalesTemplate } from '../lib/template';
import { useMonthlySalesStore } from '../store/monthlySalesStore';

const store = useMonthlySalesStore();
const palette = usePalette();
const status = ref<{ text: string; error: boolean }>({ text: '', error: false });
const loading = ref(false);
const dragDepth = ref(0);
const dragging = computed(() => dragDepth.value > 0);
const selectedCount = computed(() => store.selectedStores.length);
const periodLabel = computed(() => store.months.length
  ? `${formatMonth(store.months[0])} đến ${formatMonth(store.months[store.months.length - 1])}`
  : '');

function formatMonth(month: string) {
  const [year, value] = month.split('-');
  return `${value}/${year}`;
}

onMounted(() => store.restoreSavedData());

async function handleFile(file?: File | null) {
  if (!file || loading.value) return;
  if (!ACCEPTED_FILE.test(file.name)) {
    status.value = { text: 'Chỉ hỗ trợ file .csv, .xlsx, .xls.', error: true };
    return;
  }
  loading.value = true;
  status.value = { text: `Đang đọc ${file.name}...`, error: false };
  try {
    const rows = mapMonthlySales(await readSheet(file));
    store.setData(rows, file.name);
    status.value = { text: `Đã nạp ${fmt0(rows.length)} dòng từ ${file.name}.`, error: false };
  } catch (error) {
    status.value = {
      text: error instanceof MonthlySalesImportError ? error.message : 'Không đọc được file. Kiểm tra file rồi thử lại.',
      error: true
    };
  } finally {
    loading.value = false;
  }
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  handleFile(input.files?.[0]);
  input.value = '';
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0;
  handleFile(event.dataTransfer?.files[0]);
}

const chartData = computed(() => {
  const selected = new Set(store.selectedStores);
  const totals = new Map<string, Map<string, number>>();
  for (const row of store.rows) {
    if (!selected.has(row.store)) continue;
    const byMonth = totals.get(row.store) ?? new Map<string, number>();
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.revenue);
    totals.set(row.store, byMonth);
  }
  return store.stores.filter((name) => selected.has(name)).map((name) => ({
    name,
    values: store.months.map((month) => totals.get(name)?.get(month) ?? null)
  }));
});

const config = computed<ChartConfiguration<'line'>>(() => {
  const p = palette.value;
  return {
    type: 'line',
    data: {
      labels: store.months.map(formatMonth),
      datasets: chartData.value.map((series) => {
        const storeIndex = store.stores.indexOf(series.name);
        const color = p.series[storeIndex % p.series.length];
        const dashes = [[], [6, 3], [2, 3], [10, 4, 2, 4]];
        return {
          label: series.name,
          data: series.values,
          borderColor: color,
          backgroundColor: color,
          borderDash: dashes[storeIndex % dashes.length],
          borderWidth: 2,
          pointRadius: store.months.length > 24 ? 1 : 3,
          pointHoverRadius: 5,
          tension: 0.25,
          spanGaps: false
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animation(),
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle(p),
          callbacks: { label: (context) => ` ${context.dataset.label}: ${money(Number(context.raw ?? 0))} đồng` }
        }
      },
      scales: {
        x: { ...categoryAxis(p), ticks: { ...categoryAxis(p).ticks, maxRotation: 0, autoSkip: true } },
        y: {
          ...valueAxis(p),
          ticks: { ...valueAxis(p).ticks, callback: (value) => money(Number(value)) }
        }
      }
    }
  };
});
</script>

<template>
  <section id="monthly-sales" class="scroll-mt-40" aria-label="Doanh thu theo tháng">
    <BaseCard title="Doanh thu theo tháng" :subtitle="store.hasData ? `${periodLabel} · ${fmt0(store.rows.length)} dòng dữ liệu` : 'Theo dõi doanh thu từ tháng 3 đến hiện tại, tách theo cửa hàng.'">
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <label
          for="monthly-sales-file"
          class="btn btn-primary cursor-pointer has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
          :class="loading ? 'pointer-events-none opacity-60' : ''"
          :aria-busy="loading"
          @dragenter.prevent="dragDepth++"
          @dragover.prevent
          @dragleave="dragDepth = Math.max(0, dragDepth - 1)"
          @drop.prevent="onDrop"
        >
          <AppIcon name="upload" class="size-4" />
          {{ loading ? 'Đang xử lý...' : dragging ? 'Thả file để nhập' : store.hasData ? 'Thay file dữ liệu tháng' : 'Chọn file dữ liệu tháng' }}
          <input id="monthly-sales-file" type="file" accept=".csv,.xlsx,.xls" class="sr-only" :disabled="loading" @change="onInputChange" />
        </label>
        <button type="button" class="btn" @click="downloadMonthlySalesTemplate">
          <AppIcon name="download" class="size-4" />
          Tải file mẫu
        </button>
      </div>
      <p class="mt-2 min-h-5 text-[13px]" :class="status.error ? 'text-ink' : 'text-ink-2'" :role="status.error ? 'alert' : 'status'" aria-live="polite">{{ status.text }}</p>

      <template v-if="store.hasData">
        <fieldset class="mt-3 rounded-xl border border-line bg-sunken/50 p-3">
          <legend class="px-1 text-sm font-semibold">Cửa hàng ({{ selectedCount }}/{{ store.stores.length }})</legend>
          <div class="mb-2 flex flex-wrap gap-2">
            <button type="button" class="btn" @click="store.selectAllStores">Chọn tất cả</button>
            <button type="button" class="btn" @click="store.clearStores">Bỏ chọn</button>
          </div>
          <div class="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            <label v-for="shop in store.stores" :key="shop" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-sunken focus-within:outline-2 focus-within:outline-focus">
              <input type="checkbox" class="size-4 accent-ink" :checked="store.selectedStores.includes(shop)" @change="store.toggleStore(shop)" />
              <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: palette.series[store.stores.indexOf(shop) % palette.series.length] }" aria-hidden="true" />
              <span class="truncate">{{ shop }}</span>
            </label>
          </div>
        </fieldset>
        <p class="sr-only" aria-live="polite" aria-atomic="true">Đang chọn {{ selectedCount }} trên {{ store.stores.length }} cửa hàng.</p>

        <p v-if="!selectedCount" class="mt-5 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-2">Chọn ít nhất một cửa hàng để xem biểu đồ.</p>
        <template v-else>
          <ChartCanvas :config="config" label="Biểu đồ đường doanh thu theo tháng cho các cửa hàng đang chọn" tall class="mt-3" />
          <details class="mt-3 border-t border-line pt-2">
            <summary class="flex min-h-11 cursor-pointer items-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Xem số liệu dạng bảng</summary>
            <div class="mt-2 overflow-x-auto">
              <table class="min-w-full border-collapse text-left text-xs">
                <caption class="sr-only">Doanh thu theo tháng của các cửa hàng đang chọn</caption>
                <thead class="bg-sunken text-ink-2">
                  <tr>
                    <th scope="col" class="sticky left-0 whitespace-nowrap px-3 py-2">Cửa hàng</th>
                    <th v-for="month in store.months" :key="month" scope="col" class="whitespace-nowrap px-3 py-2">{{ formatMonth(month) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="series in chartData" :key="series.name" class="border-t border-line">
                    <th scope="row" class="sticky left-0 whitespace-nowrap bg-surface px-3 py-2 font-medium text-ink">{{ series.name }}</th>
                    <td v-for="(value, index) in series.values" :key="store.months[index]" class="whitespace-nowrap px-3 py-2 text-ink-2">{{ value == null ? '-' : `${money(value)} đồng` }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </template>
      </template>
      <div v-else class="mt-2 rounded-xl border border-dashed border-line bg-sunken/50 px-4 py-8 text-center text-sm text-ink-2">
        Tải file gồm các cột <code class="rounded bg-sunken px-1 font-mono text-xs text-ink">month, store, sku, revenue, units</code> để bắt đầu.
      </div>
    </BaseCard>
  </section>
</template>
