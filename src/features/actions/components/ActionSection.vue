<script setup lang="ts">
import { computed } from 'vue';
import { ACTION_GROUPS, countBy, type SkuResult } from '@/features/analysis';
import CountBarChart from '@/shared/charts/CountBarChart.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import SkuTable from './SkuTable.vue';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const counts = computed(() => countBy(props.rows, 'group', ACTION_GROUPS));
</script>

<template>
  <section aria-label="Action đề xuất">
    <SectionHeader title="Action đề xuất" hint="ABC kết hợp Demand, Inventory, Trend, Lifecycle" />
    <!-- Bảng 11 cột cần full chiều ngang; đặt cạnh chart sẽ phải cuộn ngang trên desktop. -->
    <div class="grid grid-cols-1 gap-4">
      <CountBarChart
        title="Phân bổ Action"
        subtitle="Số SKU theo nhóm hành động"
        :labels="ACTION_GROUPS"
        :data="counts"
        color-key="action"
        horizontal
      />
      <SkuTable :rows="rows" />
    </div>
  </section>
</template>
