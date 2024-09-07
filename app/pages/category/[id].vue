<template>
  <div class="flex flex-col gap-4 p-2">
    <ClipHeader v-model:date-range="dateRange" :is-favorite="isFavorite" @toggle-favorite="toggleFavorite">
      <div class="flex flex-row items-center gap-4">
        <NuxtLink :to="`https://twitch.tv/directory/category/${slugify(category?.name ?? '')}`" target="_blank" class="flex-none transition-all hover:opacity-80">
          <NuxtImg :src="boxArt" class="h-full w-16 flex-none" />
        </NuxtLink>
        <div class="flex flex-col">
          <NuxtLink :to="`https://twitch.tv/directory/category/${slugify(category?.name ?? '')}`" target="_blank" class="text-primary-500 dark:text-primary-400 transition-all hover:opacity-80">
            <span class="text-xl font-bold">{{ category?.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </ClipHeader>
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
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ModalClip } from '#components'

const router = useRouter()
const route = useRoute('category-id')

const { id } = route.params

const dateRange = ref({ start: new Date(), end: new Date() })

const { data: categoryData, error } = await useFetch<TwitchAPIResponse<TwitchCategory>>(`/api/twitch/game/game`, { query: { id } })
if (error.value || !categoryData.value || !categoryData.value.data || categoryData.value.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}

const category = ref(categoryData.value.data[0])

useHead({
  title: category.value?.name,
})

const boxArt = computed(() => category.value?.box_art_url.replace('{width}', '144').replace('{height}', '192'))

const cursor = ref<string | undefined>()
const compiledClips = ref<TwitchClip[]>([])
const gameID = computed(() => category.value?.id)

const startdate = computed(() => dateRange.value.start.toISOString())
const enddate = computed(() => dateRange.value.end.toISOString())

const { data, status, execute } = await useLazyFetch<TwitchAPIResponse<TwitchClip>>(() => `/api/twitch/clips`, {
  query: { game_id: gameID, after: cursor, started_at: startdate, ended_at: enddate },
  watch: [dateRange],
  server: false,
})

watch([dateRange], () => {
  compiledClips.value = []
  cursor.value = undefined
  execute()
}, { deep: true })

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
const isFavorite = computed(() => favorites.value.includes(category.value?.id || ''))

function toggleFavorite() {
  const categoryId = category.value?.id
  if (!categoryId)
    return

  if (isFavorite.value) {
    favorites.value = favorites.value.filter(id => id !== categoryId)
  }
  else {
    favorites.value.push(categoryId)
  }
  localStorage.setItem('favoriteCategories', JSON.stringify(favorites.value))
}

onMounted(() => {
  const storedFavorites = localStorage.getItem('favoriteCategories')
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
