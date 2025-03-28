<template>
  <div class="flex flex-col gap-4 p-2">
    <ClipHeader v-model:date-range="dateRange">
      <div class="flex flex-row items-center gap-4">
        <NuxtLink :to="`https://twitch.tv/${channel?.login}`" target="_blank" class="flex-none transition-all hover:opacity-80">
          <UAvatar
            :ui="{ root: ringStyle }"
            :src="channel?.profile_image_url"
            :alt="channel?.display_name"
            size="2xl"
          />
        </NuxtLink>
        <div class="flex flex-col">
          <NuxtLink :to="`https://twitch.tv/${channel?.login}`" target="_blank" class="text-(--ui-primary) flex flex-row items-center gap-1 transition-all hover:opacity-80">
            <span class="text-xl font-bold">{{ channel?.display_name }}</span>
            <UIcon v-if="channel?.broadcaster_type === 'partner'" name="pajamas:partner-verified" class="text-(--ui-primary) text-sm" />
          </NuxtLink>
          <span class="text-(--ui-text-muted) text-sm">{{ channel?.description }}</span>
        </div>
      </div>
    </ClipHeader>
    <ClipContainer v-model:clips="compiledClips" v-model:status="status" :title="channel?.display_name" :instance-id="channel?.id" @scroll-end="onScrollEnd" />
  </div>
</template>

<script setup lang="ts">
import { sub } from 'date-fns'

const route = useRoute('channel-name')

const { name } = route.params

const dateRange = useState(`dateRange${useId()}`, () => {
  let startDate = route.query.startDate ? new Date(route.query.startDate as string) : sub(new Date(), { years: 100 })
  let endDate = route.query.endDate ? new Date(route.query.endDate as string) : new Date()

  const matchedRange = rangeOptions.find(range => range.query === route.query.range)
  if (matchedRange) {
    startDate = sub(new Date(), matchedRange.duration)
    endDate = new Date()
  }

  return {
    start: startDate,
    end: endDate,
  }
})

const { data: channelData, error } = await useFetch<TwitchAPIResponse<TwitchUser>>(`/api/twitch/channels/${name}`)
if (error.value || !channelData.value || !channelData.value.data || channelData.value.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: 'Channel not found' })
}

const channel = ref(channelData.value.data[0])

useSeoMeta({
  title: `${channel.value?.display_name}`,
  description: channel.value?.description,
  ogTitle: `${channel.value?.display_name} • Better Clips🎬`,
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
      const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.id}&parent=meta.tag&autoplay=true`
      const clipDescription = `Watch this clip from ${channel.value?.display_name}: "${clip.title}". Better Clips🎬`
      useSeoMeta({
        title: `${clip.title} - ${channel.value?.display_name}`,
        description: clipDescription,
        ogTitle: `${clip.title} - ${channel.value?.display_name}`,
        ogDescription: clipDescription,
        ogType: 'video.other',
        // @ts-expect-error type is wrong
        ogVideo: {
          url: iframeSrc,
          type: 'text/html',
          width: 1280,
          height: 720,
        },
        ogImage: clip.thumbnail_url,
        ogSiteName: 'Better Clips🎬',
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

const params = computed(() => {
  return {
    broadcaster_id: channelID.value,
    after: cursor.value,
    started_at: dateRange.value.start.toISOString(),
    ended_at: dateRange.value.end.toISOString(),
  }
})
const { data, status } = await useLazyFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips`, {
  params,
})

if (data.value) {
  compiledClips.value.push(...data.value.data)
}

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

const ringStyle = computed(() => {
  if (channel.value?.broadcaster_type === 'partner') {
    return 'ring-2 ring-(--ui-primary)'
  }
  else {
    return 'ring-2 ring-(--ui-neutral)'
  }
})

onMounted(() => {
  const visitedPagesStore = useVisitedPagesStore()
  visitedPagesStore.addVisitedPage(
    `/channel/${channel.value?.display_name}`,
    channel.value?.display_name ?? '',
    channel.value?.profile_image_url ?? '',
  )
})
</script>
