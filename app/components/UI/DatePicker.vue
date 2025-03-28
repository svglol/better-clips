<template>
  <VCalendarDatePicker
    v-if="isRange"
    v-model.range="date"
    :columns="2"
    mode="date"
    v-bind="{ ...attrs, ...$attrs }"
  />
  <VCalendarDatePicker
    v-else
    v-model="date"
    v-bind="{ ...attrs, ...$attrs }"
    mode="date"
  />
</template>

<script setup lang="ts">
import { DatePicker as VCalendarDatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

interface DatePickerRangeObject {
  start: Date
  end: Date
}

const props = defineProps({
  modelValue: {
    type: [Date, Object] as PropType<Date | DatePickerRangeObject | null>,
    default: null,
  },
})

const emit = defineEmits(['update:model-value', 'close'])

const date = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:model-value', value)
    emit('close')
  },
})

const attrs = {
  'transparent': true,
  'borderless': true,
  'color': 'primary',
  'is-dark': { selector: 'html', darkClass: 'dark' },
  'first-day-of-week': 2,
}

const isRange = computed(() => {
  return (
    date.value
    && typeof date.value === 'object'
    && 'start' in date.value
    && 'end' in date.value
  )
})
</script>

  <style>
:root {
    --vc-gray-50: var(--ui-color-neutral-50);
    --vc-gray-100: var(--ui-color-neutral-100);
    --vc-gray-200: var(--ui-color-neutral-200);
    --vc-gray-300: var(--ui-color-neutral-300);
    --vc-gray-400: var(--ui-color-neutral-400);
    --vc-gray-500: var(--ui-color-neutral-500);
    --vc-gray-600: var(--ui-color-neutral-600);
    --vc-gray-700: var(--ui-color-neutral-700);
    --vc-gray-800: var(--ui-color-neutral-800);
    --vc-gray-900: var(--ui-color-neutral-900);
}

.vc-primary {
    --vc-accent-50: var(--ui-color-primary-50);
    --vc-accent-100: var(--ui-color-primary-100);
    --vc-accent-200: var(--ui-color-primary-200);
    --vc-accent-300: var(--ui-color-primary-300);
    --vc-accent-400: var(--ui-color-primary-400);
    --vc-accent-500: var(--ui-color-primary-500);
    --vc-accent-600: var(--ui-color-primary-600);
    --vc-accent-700: var(--ui-color-primary-700);
    --vc-accent-800: var(--ui-color-primary-800);
    --vc-accent-900: var(--ui-color-primary-900);
}
  </style>
