<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore, type ActionGroup } from '@/features/analysis';
import { ActionSection } from '@/features/actions';
import { ContributionSection } from '@/features/contribution';
import { ImportPanel } from '@/features/import';
import { InventorySection } from '@/features/inventory';
import { CategoryFilter, DecisionHero, KpiGrid } from '@/features/overview';
import { RulesPanel } from '@/features/rules';
import { SettingsPanel } from '@/features/settings';
import { fmt0 } from '@/shared/lib/format';
import { scrollToSection } from '@/shared/lib/scroll';
import AppIcon from '@/shared/ui/AppIcon.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import SectionNav from '@/shared/ui/SectionNav.vue';

const store = useAnalysisStore();
const { hasData, visibleRows, settings, sourceLabel, actionFilter } = storeToRefs(store);

// Thứ tự phải khớp thứ tự trên trang để mục lục tô đúng mục đang đọc.
const navItems = computed(() => [
  { id: 'data', label: 'Dữ liệu' },
  { id: 'dashboard', label: 'Quyết định', meta: fmt0(visibleRows.value.length) },
  { id: 'overview', label: 'Tổng quan' },
  { id: 'contribution', label: 'Đóng góp' },
  { id: 'inventory', label: 'Tồn kho' },
  { id: 'actions', label: 'Chi tiết Action' },
  { id: 'rules', label: 'Quy tắc' }
]);

async function pickGroup(group: ActionGroup) {
  store.setActionFilter(actionFilter.value === group ? 'all' : group);
  await nextTick();
  scrollToSection('actions');
}
</script>

<template>
  <div class="lg:grid lg:grid-cols-[184px_minmax(0,1fr)] lg:gap-8">
    <aside class="hidden lg:block">
      <div class="sticky top-24">
        <SectionNav v-if="hasData" :items="navItems" />
      </div>
    </aside>

    <div class="min-w-0">
      <h1 class="sr-only">Phân tích SKU và đề xuất PO</h1>

      <div v-if="hasData" class="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-canvas/90 px-4 py-2 backdrop-blur-md lg:hidden">
        <SectionNav :items="navItems" variant="bar" />
      </div>

      <section id="data" class="scroll-mt-36 lg:scroll-mt-24" aria-labelledby="data-title">
        <h2 id="data-title" class="sr-only">Dữ liệu và thiết lập</h2>
        <div class="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <ImportPanel />
          <SettingsPanel />
        </div>
      </section>

      <div v-if="!hasData" class="mt-6 rounded-2xl border border-dashed border-line px-4 py-14 text-center">
        <AppIcon name="empty" class="mx-auto size-10 text-ink-3" />
        <h2 class="mt-3 text-lg font-semibold tracking-tight">Chưa có dữ liệu để phân tích</h2>
        <p class="mx-auto mt-1 max-w-md text-sm text-ink-2">
          Tải file SKU hoặc bấm "Dùng dữ liệu mẫu" để xem SKU nào cần tăng PO, giảm PO hay xả hàng.
        </p>
      </div>

      <template v-else>
        <div id="dashboard" class="mt-6 scroll-mt-36 lg:scroll-mt-24">
          <DecisionHero :rows="visibleRows" :period-days="settings.periodDays" :source="sourceLabel" @pick="pickGroup" />
          <div class="mt-4">
            <CategoryFilter />
          </div>
        </div>

        <section id="overview" class="scroll-mt-36 lg:scroll-mt-24" aria-label="Tổng quan">
          <SectionHeader title="Tổng quan" :hint="`${fmt0(visibleRows.length)} SKU đang xem`" />
          <KpiGrid :rows="visibleRows" />
        </section>

        <ContributionSection id="contribution" class="scroll-mt-36 lg:scroll-mt-24" :rows="visibleRows" :metric="settings.metric" />
        <InventorySection id="inventory" class="scroll-mt-36 lg:scroll-mt-24" :rows="visibleRows" :basis="settings.basis" />
        <ActionSection id="actions" class="scroll-mt-36 lg:scroll-mt-24" :rows="visibleRows" />
        <RulesPanel id="rules" class="scroll-mt-36 lg:scroll-mt-24" :settings="settings" />
      </template>
    </div>
  </div>
</template>
