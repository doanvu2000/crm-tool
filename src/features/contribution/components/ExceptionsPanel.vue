<script setup lang="ts">
import { computed } from 'vue';
import type { SkuResult } from '@/features/analysis';
import { fmt0 } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[] }>();

const items = computed(() => [
  { title: 'New Product', n: props.rows.filter((r) => r.isNew && r.lifecycle !== 'EOL').length, desc: 'Cho thời gian test, không dùng ABC làm căn cứ action cuối cùng' },
  { title: 'Seasonal', n: props.rows.filter((r) => r.seasonal).length, desc: 'Đánh giá theo mùa vụ' },
  { title: 'Strategic Product', n: null, desc: 'Cần gắn cờ riêng trong file' },
  { title: 'Traffic Product', n: null, desc: 'Cần gắn cờ riêng trong file' },
  { title: 'Promotion', n: null, desc: 'Cần gắn cờ riêng trong file' }
]);
</script>

<template>
  <BaseCard title="Ngoại lệ trước quyết định listing" subtitle="Không giảm hoặc delist chỉ dựa trên ABC khi SKU thuộc nhóm này.">
    <template #info><MethodInfo topic="exceptions" /></template>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div v-for="it in items" :key="it.title" class="rounded-xl border border-line bg-sunken p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="text-[13px] font-medium">{{ it.title }}</div>
          <div class="num text-[15px] font-semibold" :class="it.n == null ? 'text-ink-3' : 'text-ink'">{{ it.n == null ? 'Cần cờ' : fmt0(it.n) }}</div>
        </div>
        <div class="muted mt-1 text-xs">{{ it.desc }}</div>
      </div>
    </div>
    <p class="mt-3 text-xs leading-5 text-ink-2">C và C liên tục nhiều kỳ là tín hiệu review, không phải lệnh delist tự động.</p>
  </BaseCard>
</template>
