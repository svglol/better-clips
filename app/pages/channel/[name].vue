<template>
  <div class="flex flex-col gap-4 p-2">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-4">
        <NuxtLink :to="`https://twitch.tv/${channel?.display_name}`" target="_blank" class="flex-none transition-all hover:opacity-80">
          <NuxtImg :src="channel?.profile_image_url" class="size-16 flex-none rounded-full" />
        </NuxtLink>
        <div class="flex flex-col">
          <NuxtLink :to="`https://twitch.tv/${channel?.display_name}`" target="_blank" class="text-primary-500 dark:text-primary-400 transition-all hover:opacity-80">
            <span class="text-xl font-bold">{{ channel?.display_name }}</span>
          </NuxtLink>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ channel?.description }}</span>
        </div>
      </div>
      <div class="flex flex-row gap-4">
        <USelectMenu v-model="selected" :options="rangeOptions" color="primary" />
        <UButton
          :icon="isFavorite ? 'material-symbols:star' : 'material-symbols:star-outline'"
          variant="ghost"
          color="primary"
          @click="toggleFavorite"
        />
      </div>
    </div>
    <div ref="clipsContainer">
      <ClientOnly>
        <DynamicScroller
          :items="clips"
          page-mode
          :min-item-size="200"
          @scroll-end="onScrollEnd"
        >
          <template #default="{ item, index, active }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :data-index="index"
            >
              <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }">
                <TwitchClipPreview v-for="clip in item.items" :key="clip.id" :clip="clip" @open-clip="openClip" />
              </div>
            </DynamicScrollerItem>
          </template>
          <template #after>
            <div v-if="status === 'pending'" class="py-auto my-auto flex size-full items-center justify-center">
              <div class="border-primary-200 dark:border-primary-800 m-2 size-12 animate-spin rounded-full border-y-2 p-2" />
            </div>
            <div v-else-if="clips.length === 0" class="py-auto my-auto flex size-full flex-col items-center justify-center">
              <UIcon name="mdi:robot-confused" class="text-primary-500 dark:text-primary-400 text-9xl" />
              <span class="text-2xl text-gray-500 dark:text-gray-400">No clips found!</span>
            </div>
          </template>
        </DynamicScroller>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sub } from 'date-fns'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ModalClip } from '#components'

const router = useRouter()
const route = useRoute('channel-name')

const { name } = route.params

const rangeOptions = [
  { label: 'All time', duration: { years: 100 }, query: 'all' },
  { label: 'Last year', duration: { years: 1 }, query: 'year' },
  { label: 'Last 6 months', duration: { months: 6 }, query: '6m' },
  { label: 'Last 3 months', duration: { months: 3 }, query: '3m' },
  { label: 'Last 30 days', duration: { days: 30 }, query: '30d' },
  { label: 'Last 14 days', duration: { days: 14 }, query: '14d' },
  { label: 'Last 7 days', duration: { days: 7 }, query: '7d' },
  { label: 'Last day', duration: { days: 1 }, query: '1d' },
]

const selected = ref(route.query.range ? rangeOptions.find(option => option.query === route.query.range) : rangeOptions[0])
const dateRange = ref({ start: sub(new Date(), rangeOptions?.[0]?.duration ?? { years: 100 }), end: new Date() })

watch(selected, (newValue) => {
  if (newValue) {
    const query = { ...route.query, range: newValue.query }
    router.replace({ query })
    dateRange.value = { start: sub(new Date(), newValue.duration), end: new Date() }
  }
}, { immediate: true })

const { data: channelData, error } = await useFetch<TwitchAPIResponse<TwitchUser>>(`/api/twitch/channels/${name}`)
if (error.value || !channelData.value || !channelData.value.data || channelData.value.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: 'Channel not found' })
}

const channel = ref(channelData.value.data[0])

useHead({
  title: channel.value?.display_name,
})

const cursor = ref<string | undefined>()
const compiledClips = ref<TwitchClip[]>([])
const channelID = computed(() => channel.value?.id)

const startdate = computed(() => dateRange.value.start.toISOString())
const enddate = computed(() => dateRange.value.end.toISOString())

const { data, status, execute } = await useLazyFetch<TwitchAPIResponse<TwitchClip>>(() => `/api/twitch/clips`, {
  query: { broadcaster_id: channelID, after: cursor, started_at: startdate, ended_at: enddate.value },
  watch: [],
  server: false,
})

watch([dateRange], () => {
  compiledClips.value = []
  cursor.value = undefined
}, { immediate: true, deep: true })

const clipsContainer = ref<HTMLElement>()

const breakpoints = useBreakpoints(breakpointsTailwind)
const activeBreakpoint = breakpoints.active()
const itemsPerRow = computed(() => {
  switch (activeBreakpoint.value) {
    case 'sm':
      return 2
    case 'md':
      return 3
    case 'lg':
      return 4
    case 'xl':
      return 5
    case '2xl':
      return 6
    default: return 1
  }
})

const favorites = ref<string[]>([])
const isFavorite = computed(() => favorites.value.includes(channel.value?.display_name || ''))

function toggleFavorite() {
  const channelName = channel.value?.display_name
  if (!channelName)
    return

  if (isFavorite.value) {
    favorites.value = favorites.value.filter(name => name !== channelName)
  }
  else {
    favorites.value.push(channelName)
  }
  localStorage.setItem('favoriteChannels', JSON.stringify(favorites.value))
}

onMounted(() => {
  const storedFavorites = localStorage.getItem('favoriteChannels')
  if (storedFavorites) {
    favorites.value = JSON.parse(storedFavorites)
  }

  execute()
  if (route.query.clip) {
    openClip(String(route.query.clip))
  }
})

watchDeep(data, () => {
  if (data.value) {
    compiledClips.value.push(...data.value.data)
  }
  else {
    compiledClips.value = []
  }
})

const clips = computed(() => {
  const clipsArray = compiledClips.value.map((clip, index) => ({
    index,
    ...clip,
  })) ?? []
  return chunkArray(clipsArray, itemsPerRow.value)
})

function onScrollEnd() {
  if (data.value?.pagination?.cursor) {
    cursor.value = data.value.pagination.cursor
  }
}

function chunkArray(array: any[], size: number) {
  const result: { id: number, items: any[] }[] = []
  for (let i = 0; i < array.length; i += size) {
    result.push({
      id: Math.floor(i / size),
      items: array.slice(i, i + size),
    })
  }
  return result
}

const modal = useModal()

function openClip(id: string) {
  const query = { ...route.query, clip: id }
  router.push({ query })

  modal.open(ModalClip, {
    id,
    onClose: () => {
      const { clip, ...remainingQuery } = route.query
      router.push({ query: remainingQuery })
    },
  })
}
</script>
