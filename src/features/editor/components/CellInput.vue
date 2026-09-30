<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { fmt1 } from '@/shared/lib/format';

const props = defineProps<{ value: string | number; numeric?: boolean; edited?: boolean; label: string; cellId?: string; field?: boolean; inputId?: string }>();
const emit = defineEmits<{ commit: [value: string]; next: [] }>();

const draft = ref(String(props.value));
const focused = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const shown = computed(() => (focused.value || !props.numeric ? draft.value : fmt1(Number(props.value))));

watch(
  () => props.value,
  (v) => {
    if (!focused.value) draft.value = String(v);
  }
);

function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (draft.value !== String(props.value)) emit('commit', draft.value);
}

function onFocus(e: FocusEvent) {
  focused.value = true;
  draft.value = String(props.value);
  const el = e.target as HTMLInputElement;
  requestAnimationFrame(() => el.select());
}

function onInput(e: Event) {
  draft.value = (e.target as HTMLInputElement).value;
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
}

function onBlur() {
  focused.value = false;
  flush();
  draft.value = String(props.value);
}

function onEnter() {
  flush();
  emit('next');
}

function onEscape(e: KeyboardEvent) {
  clearTimeout(timer);
  draft.value = String(props.value);
  (e.target as HTMLInputElement).blur();
}

onBeforeUnmount(flush);
</script>

<template>
  <input
    :value="shown"
    :data-cell="cellId"
    :id="inputId"
    :aria-label="inputId ? undefined : label"
    :inputmode="numeric ? 'decimal' : 'text'"
    type="text"
    autocomplete="off"
    spellcheck="false"
    class="w-full min-w-0 border text-base transition-colors hover:border-ink-3 focus:bg-surface"
    :class="[
      field ? 'min-h-11 rounded-xl px-3 sm:text-sm' : 'h-9 rounded-lg bg-transparent px-2 sm:text-[13px]',
      numeric ? 'num text-right' : '',
      edited ? 'border-edit/70 bg-edit/5 font-semibold text-ink' : field ? 'border-line bg-sunken text-ink' : 'border-transparent text-ink'
    ]"
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
    @keydown.enter.prevent="onEnter"
    @keydown.esc="onEscape"
  />
</template>
