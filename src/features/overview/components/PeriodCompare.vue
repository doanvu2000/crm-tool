<script setup lang="ts">
import { computed } from 'vue';
import { sumBy, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, money, pct, signedFmt0, signedMoney, signedPct } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const palette = usePalette();

interface Totals {
  units: number;
  unitsPrev: number;
  revenue: number;
  prevRevenue: number;
  volume: number;
  price: number;
}

function totals(list: readonly SkuResult[]): Totals {
  return {
    units: sumBy(list, (r) => r.units),
    unitsPrev: sumBy(list, (r) => r.unitsPrev),
    revenue: sumBy(list, (r) => r.revenue),
    prevRevenue: sumBy(list, (r) => r.prevRevenue),
    volume: sumBy(list, (r) => r.volumeEffect),
    price: sumBy(list, (r) => r.priceEffect)
  };
}

const ratio = (now: number, prev: number) => (prev > 0 ? (now - prev) / prev : null);

const all = computed(() => totals(props.rows));
const estimated = computed(() => props.rows.filter((r) => r.prevRevenueEstimated).length);
const hasPrev = computed(() => all.value.unitsPrev > 0 || all.value.prevRevenue > 0);

const lines = computed(() => {
  const t = all.value;
  return [
    { label: 'Số lượng bán', prev: fmt0(t.unitsPrev), now: fmt0(t.units), delta: `${signedFmt0(t.units - t.unitsPrev)} sp`, change: ratio(t.units, t.unitsPrev) },
    { label: 'Doanh thu', prev: money(t.prevRevenue), now: money(t.revenue), delta: signedMoney(t.revenue - t.prevRevenue), change: ratio(t.revenue, t.prevRevenue) }
  ];
});

const tone = (v: number | null) => (v == null || Math.abs(v) < 1e-9 ? palette.value.muted : v > 0 ? palette.value.trend[0] : palette.value.trend[4]);

const effects = computed(() => {
  const t = all.value;
  const max = Math.max(Math.abs(t.volume), Math.abs(t.price), 1);
  return [
    { label: 'Do số lượng bán', value: t.volume, width: Math.abs(t.volume) / max },
    { label: 'Do giá bán', value: t.price, width: Math.abs(t.price) / max }
  ];
});

const verdict = computed(() => {
  const t = all.value;
  const unitsChange = ratio(t.units, t.unitsPrev);
  const volumeWord = t.volume < 0 ? 'giảm' : 'tăng';
  const unitsWord = (unitsChange ?? 0) < 0 ? 'giảm' : 'tăng';
  const head = `Số lượng bán ${unitsWord} ${pct(Math.abs(unitsChange ?? 0))} làm doanh thu ${volumeWord} ${money(Math.abs(t.volume))}`;
  if (Math.abs(t.price) < 1) return `${head}.`;
  return `${head}; giá bán thay đổi làm doanh thu ${t.price < 0 ? 'giảm' : 'tăng'} thêm ${money(Math.abs(t.price))}.`;
});

const byCategory = computed(() => {
  const groups = new Map<string, SkuResult[]>();
  for (const r of props.rows) {
    const list = groups.get(r.category) ?? [];
    list.push(r);
    groups.set(r.category, list);
  }
  return [...groups]
    .map(([category, list]) => ({ category, ...totals(list) }))
    .sort((a, b) => a.revenue - a.prevRevenue - (b.revenue - b.prevRevenue));
});

const topLosers = computed(() =>
  props.rows
    .filter((r) => r.revenueDelta < 0)
    .sort((a, b) => a.revenueDelta - b.revenueDelta)
    .slice(0, 5)
);

const cell = 'border-t border-line px-2.5 py-2 whitespace-nowrap';
const numCell = `${cell} num text-right`;
</script>

<template>
  <BaseCard
    eyebrow="So với kỳ trước"
    title="Doanh thu đổi vì số lượng bán hay vì giá"
    subtitle="Chênh lệch doanh thu tách thành phần do số lượng bán (tính theo giá kỳ trước) và phần do giá bán."
  >
    <p v-if="!hasPrev" class="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
      File chưa có số lượng hoặc doanh thu kỳ trước. Thêm cột <code class="font-mono text-ink">units_prev</code> và
      <code class="font-mono text-ink">revenue_prev</code> để so sánh.
    </p>

    <template v-else>
      <div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <dl class="grid gap-2">
          <div v-for="l in lines" :key="l.label" class="grid grid-cols-[1fr_auto] items-end gap-x-3 rounded-xl bg-sunken px-3.5 py-3">
            <dt class="text-[13px] text-ink-2">{{ l.label }}</dt>
            <dd class="row-span-2 text-right">
              <span class="num block text-lg font-semibold leading-tight" :style="{ color: tone(l.change) }">{{ signedPct(l.change) }}</span>
              <span class="num block text-xs text-ink-3">{{ l.delta }}</span>
            </dd>
            <dd class="num text-sm text-ink">
              <span class="text-ink-3">{{ l.prev }}</span>
              <span class="mx-1.5 text-ink-3" aria-hidden="true">→</span>
              <span class="sr-only">sang</span>
              <b class="font-semibold">{{ l.now }}</b>
            </dd>
          </div>
        </dl>

        <div class="rounded-xl border border-line px-3.5 py-3">
          <p class="text-[13px] text-ink-2">
            Doanh thu thay đổi
            <b class="num font-semibold" :style="{ color: tone(all.revenue - all.prevRevenue) }">{{ signedMoney(all.revenue - all.prevRevenue) }}</b>, gồm:
          </p>
          <ul class="mt-2.5 grid gap-2.5">
            <li v-for="e in effects" :key="e.label" class="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-[13px]">
              <span class="text-ink-2">{{ e.label }}</span>
              <span class="h-2.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                <span class="block h-full rounded-full" :style="{ width: `${Math.max(e.width * 100, e.value ? 2 : 0)}%`, background: tone(e.value) }" />
              </span>
              <b class="num min-w-16 text-right font-semibold" :style="{ color: tone(e.value) }">{{ signedMoney(e.value) }}</b>
            </li>
          </ul>
          <p class="mt-3 text-sm leading-snug text-ink">{{ verdict }}</p>
          <p v-if="estimated" class="mt-1.5 text-xs text-ink-3">
            {{ fmt0(estimated) }} SKU chưa có doanh thu kỳ trước, đã ước tính bằng số lượng kỳ trước x giá kỳ này (phần do giá của các SKU này = 0).
          </p>
        </div>
      </div>

      <div class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div class="overflow-x-auto rounded-xl border border-line">
          <table class="w-full min-w-[540px] border-collapse text-[13px]">
            <caption class="sr-only">So sánh kỳ trước theo ngành hàng</caption>
            <thead class="bg-sunken text-ink-2">
              <tr>
                <th scope="col" class="px-2.5 py-2 text-left font-medium">Ngành hàng</th>
                <th scope="col" class="px-2.5 py-2 text-right font-medium">Số lượng</th>
                <th scope="col" class="px-2.5 py-2 text-right font-medium">Doanh thu</th>
                <th scope="col" class="px-2.5 py-2 text-right font-medium">Do số lượng</th>
                <th scope="col" class="px-2.5 py-2 text-right font-medium">Do giá</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in byCategory" :key="c.category">
                <th scope="row" :class="[cell, 'text-left font-medium text-ink']">{{ c.category }}</th>
                <td :class="numCell">
                  <span :style="{ color: tone(ratio(c.units, c.unitsPrev)) }">{{ signedPct(ratio(c.units, c.unitsPrev)) }}</span>
                  <div class="text-xs text-ink-3">{{ fmt0(c.unitsPrev) }} → {{ fmt0(c.units) }}</div>
                </td>
                <td :class="numCell">
                  <span :style="{ color: tone(c.revenue - c.prevRevenue) }">{{ signedMoney(c.revenue - c.prevRevenue) }}</span>
                  <div class="text-xs text-ink-3">{{ signedPct(ratio(c.revenue, c.prevRevenue)) }}</div>
                </td>
                <td :class="numCell" :style="{ color: tone(c.volume) }">{{ signedMoney(c.volume) }}</td>
                <td :class="numCell" :style="{ color: tone(c.price) }">{{ signedMoney(c.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="text-[13px] font-medium text-ink-2">SKU giảm doanh thu nhiều nhất</h4>
          <ol v-if="topLosers.length" class="mt-2 grid gap-1.5">
            <li v-for="r in topLosers" :key="r.sku" class="flex items-center justify-between gap-3 rounded-lg bg-sunken px-3 py-2 text-[13px]">
              <span class="min-w-0">
                <span class="num block font-medium text-ink">{{ r.sku }}</span>
                <span class="block truncate text-xs text-ink-3">
                  Số lượng {{ signedPct(r.unitsChange) }} · {{ r.name || r.category }}
                </span>
              </span>
              <span class="num flex-none text-right">
                <b class="block font-semibold" :style="{ color: tone(r.revenueDelta) }">{{ signedMoney(r.revenueDelta) }}</b>
                <span class="block text-xs text-ink-3">{{ signedPct(r.revenueGrowth) }}</span>
              </span>
            </li>
          </ol>
          <p v-else class="mt-2 text-sm text-ink-3">Không SKU nào giảm doanh thu so với kỳ trước.</p>
        </div>
      </div>
    </template>
  </BaseCard>
</template>
