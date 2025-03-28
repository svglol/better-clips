<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex flex-row items-center gap-4">
      <slot />
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <UPopover
        v-if="selected?.query === 'custom'"
      >
        <UButton
          size="sm"
          icon="i-heroicons-calendar-days-20-solid"
          variant="outline"
        >
          <NuxtTime :datetime="new Date(tempDateRange.start)" locale-matcher="best fit" /> -
          <NuxtTime :datetime="new Date(tempDateRange.end)" locale-matcher="best fit" />
        </UButton>

        <template #content="{ close }">
          <div class="flex flex-col items-center divide-gray-200 sm:flex-row sm:divide-x dark:divide-gray-800">
            <UIDatePicker
              v-model="tempDateRange"
              @close="onDatePickerClose(close)"
            />
            <div />
          </div>
        </template>
      </UPopover>
      <USelectMenu v-model="selected" :items="rangeOptions" color="primary" :search-input="false" highlight />
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, sub } from 'date-fns'

const dateRange = defineModel<DateRange>('dateRange', { required: true, default: { start: sub(new Date(), { years: 100 }), end: new Date() } })

const route = useRoute()
const router = useRouter()

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
})

function onDatePickerClose(close: () => void) {
  dateRange.value = { ...tempDateRange.value }
  const query = { ...route.query, start: format(tempDateRange.value.start, 'yyyy-MM-dd'), end: format(tempDateRange.value.end, 'yyyy-MM-dd') }
  router.replace({ query })
  close()
}
</script>
