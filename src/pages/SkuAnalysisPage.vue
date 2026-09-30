<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore, type AbcClass } from '@/features/analysis';
import { ActionSection } from '@/features/actions';
import { ContributionSection } from '@/features/contribution';
import { InputEditorSection } from '@/features/editor';
import { InventorySection } from '@/features/inventory';
import { MonthlySalesSection, toAnalysisInputs, useMonthlySalesStore } from '@/features/monthly-sales';
import { TourOverlay } from '@/features/onboarding';
import { CategoryFilter, DecisionHero, DrillBar, KpiGrid, PeriodCompare } from '@/features/overview';
import { MethodInfo, RulesPanel } from '@/features/rules';
import { SettingsPanel } from '@/features/settings';
import { fmt0 } from '@/shared/lib/format';
import { scrollToSection } from '@/shared/lib/scroll';
import AppIcon from '@/shared/ui/AppIcon.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import SectionNav from '@/shared/ui/SectionNav.vue';

const store = useAnalysisStore();
const monthlySales = useMonthlySalesStore();
const { hasData, visibleRows, crossRows, settings, sourceLabel, editedCount, hasDrill, selectedCategories } = storeToRefs(store);
const filtering = computed(() => hasDrill.value);

watch(
  () => [monthlySales.rows, monthlySales.selectedMonth, monthlySales.selectedStores] as const,
  () => store.setDerivedData(toAnalysisInputs(monthlySales.rows, monthlySales.selectedMonth, monthlySales.selectedStores), monthlySales.sourceLabel),
  { immediate: true }
);

// Thứ tự phải khớp thứ tự trên trang để mục lục tô đúng mục đang đọc.
const navItems = computed(() => [
  { id: 'data', label: 'Dữ liệu' },
  { id: 'dashboard', label: 'Quyết định', meta: fmt0(visibleRows.value.length) },
  { id: 'monthly-sales', label: 'Doanh thu tháng' },
  { id: 'overview', label: 'Tổng quan' },
  { id: 'contribution', label: 'Đóng góp' },
  { id: 'inventory', label: 'Tồn kho' },
  { id: 'actions', label: 'Chi tiết Action' },
  { id: 'input', label: 'Dữ liệu đầu vào', meta: editedCount.value ? `${fmt0(editedCount.value)} sửa` : undefined },
  { id: 'rules', label: 'Quy tắc' }
]);

async function pickAbc(abc: AbcClass) {
  store.toggleDrill('abc', abc);
  await nextTick();
  scrollToSection('contribution');
}
</script>

<template>
  <div>
    <h1 class="sr-only">Phân tích SKU và đề xuất PO</h1>

    <div v-if="hasData" class="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-canvas/90 px-4 py-2 backdrop-blur-md">
      <SectionNav :items="navItems" variant="bar" data-tour="nav" />
      <DrillBar v-if="filtering" class="mt-2 border-t border-line pt-2" />
    </div>

    <div class="min-w-0">
      <section id="data" class="scroll-mt-40" aria-labelledby="data-title">
        <h2 id="data-title" class="sr-only">Dữ liệu và thiết lập</h2>
        <MonthlySalesSection v-if="!hasData" />
        <div class="mt-4">
          <SettingsPanel />
        </div>
      </section>

      <div v-if="!hasData" class="mt-6 rounded-2xl border border-dashed border-line px-4 py-14 text-center">
        <AppIcon name="empty" class="mx-auto size-10 text-ink-3" />
        <h2 class="mt-3 text-lg font-semibold tracking-tight">Chưa có dữ liệu để phân tích</h2>
        <p class="mx-auto mt-1 max-w-md text-sm text-ink-2">
          {{ monthlySales.hasData ? 'Tháng và cửa hàng đang chọn chưa có mã SKU. Hãy đổi bộ lọc hoặc thêm đủ dòng dữ liệu cho phạm vi đó.' : 'Tải file dữ liệu tháng ở trên, sau đó chọn tháng và cửa hàng để dùng chung cho biểu đồ và các bảng.' }}
        </p>
      </div>

      <template v-if="hasData">
        <div id="dashboard" class="mt-6 scroll-mt-40">
          <DecisionHero data-tour="decision" :rows="crossRows.abc" :categories="selectedCategories" :source="sourceLabel" @pick="pickAbc" />
          <div class="mt-4">
            <CategoryFilter data-tour="category" />
          </div>
        </div>

        <MonthlySalesSection class="mt-6" />

        <section id="overview" class="scroll-mt-40" aria-label="Tổng quan">
          <SectionHeader title="Tổng quan" :hint="`${fmt0(visibleRows.length)} SKU đang xem`">
            <MethodInfo topic="kpi" />
          </SectionHeader>
          <KpiGrid :rows="visibleRows" />
          <PeriodCompare id="compare" data-tour="compare" :rows="visibleRows" class="mt-4" />
        </section>

        <ContributionSection id="contribution" class="scroll-mt-40" :rows="visibleRows" />
        <InventorySection id="inventory" class="scroll-mt-40" :rows="visibleRows" :basis="settings.basis" />
        <ActionSection id="actions" class="scroll-mt-40" :rows="visibleRows" />
        <InputEditorSection id="input" class="scroll-mt-40" />
        <RulesPanel id="rules" class="scroll-mt-40" :settings="settings" />
      </template>
    </div>
  </div>
  <TourOverlay />
</template>
