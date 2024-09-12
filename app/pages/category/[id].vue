<template>
  <div class="flex flex-col gap-4 p-2">
    <ClipHeader v-model:date-range="dateRange">
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
    <ClipContainer v-model:clips="compiledClips" v-model:status="status" :title="category?.name" @scroll-end="onScrollEnd" />
  </div>
</template>

<script setup lang="ts">
import { formatISO, roundToNearestMinutes } from 'date-fns'

const route = useRoute('category-id')

const { id } = route.params

const dateRange = ref<DateRange>({ start: route.query.start ? new Date(route.query.start.toString()) : new Date(), end: route.query.end ? new Date(route.query.end.toString()) : new Date() })

const { data: categoryData, error } = await useFetch<TwitchAPIResponse<TwitchCategory>>(`/api/twitch/game/game`, { query: { id } })
if (error.value || !categoryData.value || !categoryData.value.data || categoryData.value.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}

const category = ref(categoryData.value.data[0])

useSeoMeta({
  title: `${category.value?.name}`,
  ogTitle: `${category.value?.name} • Better Clips🎬`,
  ogImage: category.value?.box_art_url.replace('{width}', '576').replace('{height}', '768'),
  twitterCard: 'summary',
  twitterTitle: `${category.value?.name} • Better Clips🎬`,
  twitterImage: category.value?.box_art_url.replace('{width}', '576').replace('{height}', '768'),
  ogUrl: `https://better-clips.trotman.xyz/category/${category.value?.id}`,
})

if (route.query.clip) {
  const clipId = route.query.clip.toString()
  const { data: clipData } = await useFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${clipId}`)
  if (clipData.value && clipData.value.data && clipData.value.data.length > 0) {
    const clip = clipData.value.data[0]
    if (clip) {
      const videoUrl = clip.thumbnail_url.replace('-preview-480x272.jpg', '.mp4')
      const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.id}&parent=meta.tag&autoplay=true`
      const clipDescription = `Watch this clip from ${clip.broadcaster_name}: "${clip.title}". Better Clips🎬`
      useSeoMeta({
        title: `${clip.title} - ${clip.broadcaster_name}`,
        description: clipDescription,
        ogTitle: `${clip.title} - ${clip.broadcaster_name}`,
        ogDescription: clipDescription,
        ogType: 'video.other',
        // @ts-expect-error type is wrong
        ogVideo: videoUrl.endsWith('.mp4')
          ? {
              url: videoUrl,
              type: 'video/mp4',
              width: 1280,
              height: 720,
            }
          : {
              url: iframeSrc,
              type: 'text/html',
              width: 1280,
              height: 720,
            },
        ogImage: clip.thumbnail_url,
        ogSiteName: 'Better Clips🎬',
        twitterCard: 'player',
        twitterTitle: `${clip.title} - ${clip.broadcaster_name}`,
        twitterDescription: clipDescription,
        twitterImage: clip.thumbnail_url,
        twitterPlayer: `https://clips.twitch.tv/embed?clip=${clip.id}`,
        twitterPlayerWidth: 1280,
        twitterPlayerHeight: 720,
        ogUrl: `https://better-clips.trotman.xyz/${clip.broadcaster_name}?clip=${clip.id}`,
      })
    }
  }
}

const boxArt = computed(() => category.value?.box_art_url.replace('{width}', '144').replace('{height}', '192'))

const cursor = ref<string | undefined>()
const compiledClips = ref<TwitchClip[]>([])
const gameID = computed(() => category.value?.id)

const startdate = computed(() => {
  const rounded = roundToNearestMinutes(dateRange.value.start, { nearestTo: 15 })
  return formatISO(rounded)
})

const enddate = computed(() => {
  const rounded = roundToNearestMinutes(dateRange.value.end, { nearestTo: 15 })
  return formatISO(rounded)
})

const { data, status } = await useAsyncData('fetchClips', () => $fetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips`, {
  params: { game_id: gameID.value, after: cursor.value, started_at: startdate.value, ended_at: enddate.value },
}), { watch: [dateRange, cursor, gameID], server: false })

watch([dateRange], () => {
  compiledClips.value = []
  cursor.value = undefined
}, { deep: true })

watch(data, () => {
  if (data.value) {
    compiledClips.value.push(...data.value.data)
  }
  else {
    compiledClips.value = []
  }
})

function onScrollEnd() {
  if (data.value?.pagination?.cursor) {
    cursor.value = data.value.pagination.cursor
  }
}
</script>
