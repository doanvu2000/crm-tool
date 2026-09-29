<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useAnalysisStore } from '@/features/analysis';
import { fmt0 } from '@/shared/lib/format';
import { scrollToSection } from '@/shared/lib/scroll';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import { COLUMNS } from '../lib/columns';
import { ImportError, mapRows } from '../lib/mapRows';
import { ACCEPTED_FILE, readSheet } from '../lib/readSheet';
import { generateSampleData } from '../lib/sampleData';
import { downloadTemplate } from '../lib/template';

const store = useAnalysisStore();
const status = ref<{ text: string; error: boolean }>({ text: '', error: false });
// Đếm enter/leave vì dragleave bắn cả khi rê qua phần tử con, gây nháy viền.
const dragDepth = ref(0);
const dragging = computed(() => dragDepth.value > 0);
const loading = ref(false);
const columnsOpen = ref(false);

const setStatus = (text: string, error = false) => (status.value = { text, error });

async function scrollToDashboard() {
  await nextTick();
  scrollToSection('dashboard', { updateHash: false });
}

async function handleFile(file?: File | null) {
  if (!file || loading.value) return;
  if (!ACCEPTED_FILE.test(file.name)) return setStatus('Chỉ hỗ trợ file .csv, .xlsx, .xls.', true);
  loading.value = true;
  setStatus(`Đang đọc ${file.name}...`);
  try {
    const rows = mapRows(await readSheet(file));
    store.setData(rows, file.name);
    setStatus(`Đã nạp ${fmt0(rows.length)} SKU từ ${file.name}.`);
    scrollToDashboard();
  } catch (err) {
    // Lỗi thiếu cột: mở sẵn danh sách cột để người dùng đối chiếu ngay.
    if (err instanceof ImportError) columnsOpen.value = true;
    setStatus(err instanceof ImportError ? err.message : 'Không đọc được file. Kiểm tra file có mở được bằng Excel rồi thử lại.', true);
  } finally {
    loading.value = false;
  }
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  handleFile(input.files?.[0]);
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragDepth.value = 0;
  handleFile(e.dataTransfer?.files[0]);
}

function useSample() {
  const rows = generateSampleData();
  store.setData(rows, 'Dữ liệu mẫu');
  setStatus(`Đang dùng dữ liệu mẫu: ${rows.length} SKU, 4 ngành hàng.`);
  scrollToDashboard();
}
</script>

<template>
  <BaseCard eyebrow="Bước 1" title="Nhập dữ liệu SKU" subtitle="File CSV hoặc Excel, mỗi dòng là 1 SKU trong cùng 1 kỳ. File chỉ đọc trên máy, không gửi đi đâu.">
    <label
      for="file-input"
      class="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
      :class="dragging
        ? 'border-ink bg-sunken'
        : 'border-line hover:border-ink-3 hover:bg-sunken'"
      :aria-busy="loading"
      @dragenter.prevent="dragDepth++"
      @dragover.prevent
      @dragleave="dragDepth = Math.max(0, dragDepth - 1)"
      @drop.prevent="onDrop"
    >
      <AppIcon name="upload" class="size-9 text-ink-2" />
      <strong class="text-[15px] font-semibold">{{ loading ? 'Đang xử lý...' : 'Kéo thả file vào đây hoặc bấm để chọn' }}</strong>
      <small class="muted text-[13px]">.csv, .xlsx, .xls</small>
      <input id="file-input" type="file" accept=".csv,.xlsx,.xls" class="sr-only" :disabled="loading" @change="onInputChange" />
    </label>

    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" class="btn btn-primary" :disabled="loading" @click="useSample">
        <AppIcon name="arrow-right" class="size-4" />
        Dùng dữ liệu mẫu
      </button>
      <button type="button" class="btn" @click="downloadTemplate">
        <AppIcon name="download" class="size-4" />
        Tải file mẫu CSV
      </button>
    </div>

    <p
      class="mt-2.5 min-h-5 text-[13px]"
      :class="status.error ? 'text-red-600 dark:text-red-400' : 'text-ink-2'"
      :role="status.error ? 'alert' : 'status'"
      aria-live="polite"
    >{{ status.text }}</p>

    <details class="mt-3 border-t border-line pt-2.5" :open="columnsOpen" @toggle="columnsOpen = ($event.target as HTMLDetailsElement).open">
      <summary class="flex min-h-8 cursor-pointer items-center text-sm font-medium">Cột dữ liệu cần có</summary>
      <ul class="mt-2.5 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
        <li v-for="col in COLUMNS" :key="col.key">
          <code class="rounded-md bg-sunken px-1.5 py-px font-mono text-xs text-ink">{{ col.aliases[0] }}</code>
          {{ col.label }}
          <span v-if="!col.required" class="muted">(tuỳ chọn)</span>
        </li>
      </ul>
    </details>
  </BaseCard>
</template>
