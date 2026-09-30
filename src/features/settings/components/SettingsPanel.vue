<script setup lang="ts">
import { useAnalysisStore, type VelocityBasis } from '@/features/analysis';
import BaseCard from '@/shared/ui/BaseCard.vue';

const store = useAnalysisStore();

const onBasis = (e: Event) => store.updateSettings({ basis: (e.target as HTMLSelectElement).value as VelocityBasis });
</script>

<template>
  <BaseCard data-tour="settings" eyebrow="Bước 2" title="Chuẩn ABC CVS" subtitle="Một chuẩn chung để so sánh và quản lý SKU nhất quán.">
    <div class="grid gap-3">
      <div class="grid gap-2 sm:grid-cols-3" role="list" aria-label="Chuẩn tính ABC">
        <div class="rounded-xl border border-line bg-sunken p-3" role="listitem">
          <div class="eyebrow">Chỉ số</div>
          <div class="mt-1 text-sm font-semibold">Sales</div>
          <p class="mt-0.5 text-xs text-ink-3">Doanh thu bán thực tế</p>
        </div>
        <div class="rounded-xl border border-line bg-sunken p-3" role="listitem">
          <div class="eyebrow">Cửa sổ</div>
          <div class="mt-1 text-sm font-semibold">8 tuần</div>
          <p class="mt-0.5 text-xs text-ink-3">Rolling 56 ngày</p>
        </div>
        <div class="rounded-xl border border-line bg-sunken p-3" role="listitem">
          <div class="eyebrow">Phạm vi</div>
          <div class="mt-1 text-sm font-semibold">Ngành hàng</div>
          <p class="mt-0.5 text-xs text-ink-3">Không trộn ngành</p>
        </div>
      </div>

      <div class="grid gap-1">
        <label for="velocity-basis" class="field-label">Chỉ số bổ sung cho business rule</label>
        <select id="velocity-basis" class="control" :value="store.settings.basis" @change="onBasis">
          <option value="ads">ADS tuyệt đối (sp/ngày)</option>
          <option value="index">ADS Index so với ngành hàng</option>
        </select>
      </div>
      <p class="rounded-xl border border-tag/30 bg-tag/10 px-3 py-2.5 text-xs leading-5 text-ink-2">
        <b class="text-ink">A 70%</b> doanh thu đầu tiên, <b class="text-ink">B 20%</b> tiếp theo, <b class="text-ink">C 10%</b> còn lại. ABC xác định mức ưu tiên, business rule quyết định hành động cuối cùng.
      </p>
    </div>
  </BaseCard>
</template>
