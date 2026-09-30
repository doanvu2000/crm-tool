<script setup lang="ts">
import { computed } from 'vue';
import type { SkuResult } from '@/features/analysis';
import { fmt0 } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[] }>();

const items = computed(() => [
  { title: 'New SKU', n: props.rows.filter((r) => r.isNew && r.lifecycle !== 'EOL').length, desc: 'Chưa đủ lịch sử, không áp ABC' },
  { title: 'EOL', n: props.rows.filter((r) => r.lifecycle === 'EOL').length, desc: 'Stop PO, xả tồn' },
  { title: 'Seasonal', n: props.rows.filter((r) => r.seasonal).length, desc: 'Đánh giá theo mùa vụ' },
  { title: 'Severe OOS', n: props.rows.filter((r) => r.oosStatus === 'Severe OOS').length, desc: 'Tính lại nhu cầu dự kiến' }
]);
</script>

<template>
  <BaseCard title="Exception cần xử lý trước khi kết luận" subtitle="SKU bất thường không áp Action theo ABC thông thường">
    <template #info><MethodInfo topic="exceptions" /></template>
    <div class="grid grid-cols-2 gap-2.5">
      <div v-for="it in items" :key="it.title" class="rounded-xl border border-line bg-sunken p-3">
        <div class="num text-[22px] font-semibold">{{ fmt0(it.n) }}</div>
        <div class="text-[13px] font-medium">{{ it.title }}</div>
        <div class="muted mt-0.5 text-xs">{{ it.desc }}</div>
      </div>
    </div>
  </BaseCard>
</template>
