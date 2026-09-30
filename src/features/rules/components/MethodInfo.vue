<script setup lang="ts">
import { computed } from 'vue';
import { ALL_CATEGORIES, useAnalysisStore } from '@/features/analysis';
import InfoPopover from '@/shared/ui/InfoPopover.vue';
import { methodNote, type MethodTopic } from '../lib/methods';

const props = defineProps<{ topic: MethodTopic; iconOnly?: boolean }>();
const store = useAnalysisStore();

const note = computed(() =>
  methodNote(props.topic, {
    settings: store.settings,
    total: store.rows.length,
    visible: store.visibleRows.length,
    category: store.category === ALL_CATEGORIES ? null : store.category
  })
);
</script>

<template>
  <InfoPopover :title="note.title" :icon-only="iconOnly">
    <dl class="grid gap-2">
      <div v-for="it in note.items" :key="it.label">
        <dt class="text-xs font-semibold uppercase tracking-wide text-ink-3">{{ it.label }}</dt>
        <dd class="text-ink-2">{{ it.text }}</dd>
      </div>
    </dl>
  </InfoPopover>
</template>
