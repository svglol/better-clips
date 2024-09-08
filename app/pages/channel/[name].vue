<template>
  <div class="flex flex-col gap-4 p-2">
    <ClipHeader v-model:date-range="dateRange">
      <div class="flex flex-row items-center gap-4">
        <NuxtLink :to="`https://twitch.tv/${channel?.login}`" target="_blank" class="flex-none transition-all hover:opacity-80">
          <NuxtImg :src="channel?.profile_image_url" class="size-16 flex-none rounded-full" />
        </NuxtLink>
        <div class="flex flex-col">
          <NuxtLink :to="`https://twitch.tv/${channel?.login}`" target="_blank" class="text-primary-500 dark:text-primary-400 transition-all hover:opacity-80">
            <span class="text-xl font-bold">{{ channel?.display_name }}</span>
          </NuxtLink>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ channel?.description }}</span>
        </div>
      </div>
    </ClipHeader>
    <ClipContainer v-model:clips="compiledClips" v-model:status="status" :title="channel?.display_name" @scroll-end="onScrollEnd" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute('channel-name')

const { name } = route.params

const dateRange = ref<DateRange>({ start: route.query.start ? new Date(route.query.start.toString()) : new Date(), end: route.query.end ? new Date(route.query.end.toString()) : new Date() })

const { data: channelData, error } = await useFetch<TwitchAPIResponse<TwitchUser>>(`/api/twitch/channels/${name}`)
if (error.value || !channelData.value || !channelData.value.data || channelData.value.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: 'Channel not found' })
}

const channel = ref(channelData.value.data[0])

useSeoMeta({
  title: `${channel.value?.display_name}`,
  description: channel.value?.description,
  ogTitle: `${channel.value?.display_name} • Better Twitch Clips🎬`,
  ogDescription: channel.value?.description,
  ogImage: channel.value?.profile_image_url,
  twitterCard: 'summary',
  twitterTitle: channel.value?.display_name,
  twitterImage: channel.value?.profile_image_url,
  twitterDescription: channel.value?.description,
  ogUrl: `https://better-clips.trotman.xyz/${channel.value?.display_name}`,
})

if (route.query.clip) {
  const clipId = route.query.clip.toString()
  const { data: clipData } = await useFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${clipId}`)
  if (clipData.value && clipData.value.data && clipData.value.data.length > 0) {
    const clip = clipData.value.data[0]
    if (clip) {
      const videoUrl = clip.thumbnail_url.replace('-preview-480x272.jpg', '.mp4')
      const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.id}&parent=meta.tag&autoplay=true`
      const clipDescription = `Watch this clip from ${channel.value?.display_name}: "${clip.title}". Better Twitch Clips🎬`
      useSeoMeta({
        title: `${clip.title} - ${channel.value?.display_name}`,
        description: clipDescription,
        ogTitle: `${clip.title} - ${channel.value?.display_name}`,
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
        ogSiteName: 'Better Twitch Clips🎬',
        twitterCard: 'player',
        twitterTitle: `${clip.title} - ${channel.value?.display_name}`,
        twitterDescription: clipDescription,
        twitterImage: clip.thumbnail_url,
        twitterPlayer: `https://clips.twitch.tv/embed?clip=${clip.id}`,
        twitterPlayerWidth: 1280,
        twitterPlayerHeight: 720,
        ogUrl: `https://better-clips.trotman.xyz/${channel.value?.display_name}?clip=${clip.id}`,
      })
    }
  }
}

const cursor = ref<string | undefined>()
const compiledClips = ref<TwitchClip[]>([])
const channelID = computed(() => channel.value?.id)

const startdate = computed(() => dateRange.value.start.toISOString())
const enddate = computed(() => dateRange.value.end.toISOString())

const { data, status } = await useAsyncData('fetchClips', () => $fetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips`, {
  params: { broadcaster_id: channelID.value, after: cursor.value, started_at: startdate.value, ended_at: enddate.value },
}), { watch: [dateRange, cursor, channelID], server: false })

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
