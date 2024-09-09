<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex flex-row items-center gap-4">
      <slot />
    </div>
    <div class="flex flex-row items-center gap-4">
      <UPopover
        v-if="selected?.query === 'custom'"
        :popper="{ placement: 'bottom-start' }"
      >
        <UButton
          size="sm"
          icon="i-heroicons-calendar-days-20-solid"
          variant="outline"
        >
          {{ new Date(tempDateRange.start).toLocaleDateString() }} -
          {{ new Date(tempDateRange.end).toLocaleDateString() }}
        </UButton>

        <template #panel="{ close }">
          <div class="flex flex-col items-center divide-gray-200 sm:flex-row sm:divide-x dark:divide-gray-800">
            <UIDatePicker
              v-model="tempDateRange"
              @close="onDatePickerClose(close)"
            />
            <div />
          </div>
        </template>
      </UPopover>
      <USelectMenu v-model="selected" :options="rangeOptions" color="primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, sub } from 'date-fns'

const route = useRoute()
const router = useRouter()

const rangeOptions = [
  { label: 'All time', duration: { years: 100 }, query: 'all' },
  { label: 'Last year', duration: { years: 1 }, query: 'year' },
  { label: 'Last 6 months', duration: { months: 6 }, query: '6m' },
  { label: 'Last 3 months', duration: { months: 3 }, query: '3m' },
  { label: 'Last 30 days', duration: { days: 30 }, query: '30d' },
  { label: 'Last 14 days', duration: { days: 14 }, query: '14d' },
  { label: 'Last 7 days', duration: { days: 7 }, query: '7d' },
  { label: 'Last day', duration: { days: 1 }, query: '1d' },
  { label: 'Custom', duration: { days: 1 }, query: 'custom' },
]

const dateRange = defineModel<DateRange>('dateRange', { required: true, default: { start: new Date(), end: new Date() } })
const tempDateRange = ref({ ...dateRange.value })

const selected = ref(route.query.range ? rangeOptions.find(option => option.query === route.query.range) : rangeOptions[0])

watch(selected, (newValue) => {
  if (newValue) {
    if (newValue.query === 'custom') {
      const query = { ...route.query, range: newValue.query, start: format(dateRange.value.start, 'yyyy-MM-dd'), end: format(dateRange.value.end, 'yyyy-MM-dd') }
      tempDateRange.value = { ...dateRange.value }
      router.replace({ query })
    }
    else {
      const query = { ...route.query, range: newValue.query, start: undefined, end: undefined }
      router.replace({ query })
      dateRange.value = { start: sub(new Date(), newValue.duration), end: new Date() }
      tempDateRange.value = { ...dateRange.value }
    }
  }
}, { immediate: true })

function onDatePickerClose(close: () => void) {
  dateRange.value = { ...tempDateRange.value }
  const query = { ...route.query, start: format(tempDateRange.value.start, 'yyyy-MM-dd'), end: format(tempDateRange.value.end, 'yyyy-MM-dd') }
  router.replace({ query })
  close()
}
</script>
