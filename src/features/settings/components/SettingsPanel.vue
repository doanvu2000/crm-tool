<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAnalysisStore, type AbcMetric, type VelocityBasis } from '@/features/analysis';
import { parseNum } from '@/shared/lib/parse';
import BaseCard from '@/shared/ui/BaseCard.vue';

const store = useAnalysisStore();

// Ô số giữ bản nháp dạng chuỗi, chỉ commit khi blur/Enter để không tính lại toàn bộ theo từng phím.
const draft = ref({ period: '', cutA: '', cutB: '' });
watch(
  () => store.settings,
  (s) => {
    draft.value = { period: String(s.periodDays), cutA: String(Math.round(s.cutA * 100)), cutB: String(Math.round(s.cutB * 100)) };
  },
  { immediate: true }
);

function commitNumbers() {
  store.updateSettings({
    periodDays: parseNum(draft.value.period),
    cutA: parseNum(draft.value.cutA) / 100,
    cutB: parseNum(draft.value.cutB) / 100
  });
}

const onMetric = (e: Event) => store.updateSettings({ metric: (e.target as HTMLSelectElement).value as AbcMetric });
const onBasis = (e: Event) => store.updateSettings({ basis: (e.target as HTMLSelectElement).value as VelocityBasis });
</script>

<template>
  <BaseCard data-tour="settings" eyebrow="Bước 2" title="Thiết lập phân tích" subtitle="Ngưỡng hiện là baseline Pilot, hiệu chỉnh theo từng ngành hàng.">
    <div class="grid gap-3">
      <div class="grid gap-1">
        <label for="abc-metric" class="field-label">ABC theo chỉ số</label>
        <select id="abc-metric" class="control" :value="store.settings.metric" @change="onMetric">
          <option value="revenue">Doanh thu</option>
          <option value="gp">Lợi nhuận gộp (GP)</option>
          <option value="units">Số lượng bán</option>
        </select>
      </div>

      <div class="grid gap-1">
        <label for="velocity-basis" class="field-label">Phân loại tốc độ bán theo</label>
        <select id="velocity-basis" class="control" :value="store.settings.basis" @change="onBasis">
          <option value="ads">ADS tuyệt đối (sp/ngày)</option>
          <option value="index">ADS Index so với ngành hàng</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-1">
          <label for="period-days" class="field-label">Kỳ báo cáo (ngày)</label>
          <input
            id="period-days"
            v-model="draft.period"
            type="number"
            min="1"
            max="366"
            inputmode="numeric"
            class="control"
            @blur="commitNumbers"
            @keydown.enter="commitNumbers"
          />
        </div>
        <div class="grid gap-1">
          <span class="field-label">Ngưỡng A / B (%)</span>
          <div class="flex gap-2">
            <input
              v-model="draft.cutA"
              type="number"
              min="1"
              max="99"
              inputmode="numeric"
              aria-label="Ngưỡng tích luỹ class A (%)"
              class="control"
              @blur="commitNumbers"
              @keydown.enter="commitNumbers"
            />
            <input
              v-model="draft.cutB"
              type="number"
              min="2"
              max="100"
              inputmode="numeric"
              aria-label="Ngưỡng tích luỹ class B (%)"
              class="control"
              @blur="commitNumbers"
              @keydown.enter="commitNumbers"
            />
          </div>
        </div>
      </div>
      <p class="muted text-xs">A = tích luỹ đến {{ draft.cutA }}%, B = {{ draft.cutA }}% đến {{ draft.cutB }}%, C = phần còn lại.</p>
    </div>
  </BaseCard>
</template>
