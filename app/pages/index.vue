<template>
  <div v-if="!loggedIn" class="relative -my-2 min-h-[calc(100vh-123px)]">
    <BackgroundGradient />
    <div class="relative flex size-full flex-col items-center justify-center gap-16 px-2 py-16">
      <img src="/og.png" class="relative mx-auto size-32">
      <span class="text-center text-4xl font-semibold text-gray-900 dark:text-gray-200">
        An improved experience for browsing Twitch clips
      </span>
      <div class="grid w-full max-w-screen-xl grid-cols-1 gap-8 lg:grid-cols-3">
        <UISpotlightCard>
          <div class="flex size-full flex-col rounded-lg bg-gray-100 p-8 shadow dark:bg-gray-900">
            <UIcon name="fa6-solid:fire" size="2xl" class="text-primary-500 dark:text-primary-400" />
            <span class="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Trending Clips</span>
            <span class="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Quickly discover the latest and most viral clips from Twitch.
            </span>
          </div>
        </UISpotlightCard>
        <UISpotlightCard>
          <div class="flex size-full flex-col rounded-lg bg-gray-100 p-8 shadow dark:bg-gray-900">
            <UIcon name="fa6-solid:user-group" size="2xl" class="text-primary-500 dark:text-primary-400" />
            <span class="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Personalized Feed</span>
            <span class="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Get clips from your favorite streamers and games, and stay up-to-date with their latest moments.
            </span>
          </div>
        </UISpotlightCard>
        <UISpotlightCard>
          <div class="flex size-full flex-col rounded-lg bg-gray-100 p-8 shadow dark:bg-gray-900">
            <UIcon name="fa6-solid:magnifying-glass" size="2xl" class="text-primary-500 dark:text-primary-400" />
            <span class="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Easy Discovery</span>
            <span class="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Find exactly what you're looking for with our powerful search and filter options. Explore clips by game, streamer.
            </span>
          </div>
        </UISpotlightCard>
      </div>
      <a href="/auth/twitch">
        <UButton icon="fa6-brands:twitch" color="purple" size="lg" class="px-8 py-4">
          Login with Twitch
        </UButton>
      </a>
    </div>
  </div>
  <div v-else class="flex flex-col gap-6 px-2">
    <UHorizontalNavigation :links="links" class="border-b border-gray-200 dark:border-gray-800" :ui="{ base: '!text-md md:text-lg' }" />
    <UTabs
      v-model="selected"
      :items="tabs"
      :default-index="0"
      :ui="{
        wrapper: 'space-y-0',
        list: {
          base: 'hidden',
        },
      }"
      class="w-full"
    >
      <template #top-clips>
        <TopClips />
      </template>
      <template #followed-channels>
        <FollowedChannels />
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()

useSeoMeta({
  title: '',
})

const route = useRoute()
const router = useRouter()

const tabs = ref([
  {
    slot: 'top-clips',
    id: 'top-clips',
    label: 'Trending Clips',
  },
  {
    slot: 'followed-channels',
    id: 'followed-channels',
    label: 'Followed Channels',
  },
])

const selected = computed({
  get() {
    const index = tabs.value.findIndex(item => item.id === route.query.tab)
    if (index === -1)
      return 0

    return index
  },
  set(value) {
    if (tabs.value[value]) {
      if (value === 0) {
        router.replace({
          query: { },
          hash: '',
        })
      }
      else {
        router.replace({
          query: { tab: tabs.value[value].id },
          hash: '',
        })
      }
    }
  },
})

const links = computed(() => {
  return tabs.value.map((tab, index) => ({
    ...tab,
    active: selected.value === index,
    click: () => selected.value = index,
  }))
})

if (route.query.clip) {
  const { data: clipData } = await useFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${route.query.clip}`)
  const clip = clipData.value?.data?.[0]
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
    if (!loggedIn.value) {
      router.replace({ path: `/channel/${clip.broadcaster_name}`, query: { clip: clip.id } })
    }
  }
}
</script>
