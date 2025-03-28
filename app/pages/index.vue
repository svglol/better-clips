<template>
  <Transition name="fade" mode="out-in">
    <div v-if="!loggedIn && !guestAccess" class="-my-4 min-h-[calc(100vh-123px)]">
      <BackgroundGradient />
      <div class="relative z-10 flex size-full flex-col items-center justify-center gap-16 px-2 py-16">
        <img src="/og.png" class="relative mx-auto size-32">
        <span class="text-center text-4xl font-semibold text-(--ui-text-highlighted)">
          An improved experience for browsing Twitch clips
        </span>
        <div class="flex md:flex-row flex-col gap-2 items-center">
          <a href="/auth/twitch">
            <UButton icon="fa6-brands:twitch" color="primary" size="xl">
              Login with Twitch
            </UButton>
          </a>
          <UButton color="neutral" size="xl" variant="link" @click="guestAccess = true">
            Continue Without Account
          </UButton>
        </div>
        <div class="grid w-full max-w-screen-xl grid-cols-1 gap-8 lg:grid-cols-3">
          <UISpotlightCard>
            <div class="bg-(--ui-bg-elevated) flex size-full flex-col rounded-lg p-8 shadow ">
              <UIcon name="fa6-solid:fire" size="2xl" class="text-primary-500 dark:text-primary-400" />
              <span class="mt-2 text-xl font-semibold text-(--ui-text-highlighted)">Trending Clips</span>
              <span class="mt-4 text-sm font-semibold text-(--ui-text-dimmed)">
                Quickly discover the latest and most viral clips from Twitch.
              </span>
            </div>
          </UISpotlightCard>
          <UISpotlightCard>
            <div class="bg-(--ui-bg-elevated) flex size-full flex-col rounded-lg  p-8 shadow ">
              <UIcon name="fa6-solid:user-group" size="2xl" class="text-primary-500 dark:text-primary-400" />
              <span class="mt-2 text-xl font-semibold text-(--ui-text-highlighted)">Personalized Feed</span>
              <span class="mt-4 text-sm font-semibold text-(--ui-text-dimmed)">
                Get clips from your favorite streamers and games, and stay up-to-date with their latest moments.
              </span>
            </div>
          </UISpotlightCard>
          <UISpotlightCard>
            <div class="bg-(--ui-bg-elevated) flex size-full flex-col rounded-lg p-8 shadow ">
              <UIcon name="fa6-solid:magnifying-glass" size="2xl" class="text-primary-500 dark:text-primary-400" />
              <span class="mt-2 text-xl font-semibold text-(--ui-text-highlighted)">Easy Discovery</span>
              <span class="mt-4 text-sm font-semibold text-(--ui-text-dimmed)">
                Find exactly what you're looking for with our powerful search and filter options. Explore clips by game, streamer.
              </span>
            </div>
          </UISpotlightCard>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col gap-4 px-2">
      <UNavigationMenu :items="links" highlight highlight-color="primary" variant="link" class="max-w-[calc(100vw-2rem)] border-b border-(--ui-border) justify-center" />
      <UTabs v-model="selected" :items="tabs" variant="link" class="w-full gap-4" :ui="{ trigger: 'flex-1', list: 'hidden' }">
        <template #search>
          <LazySearch hydrate-on-visible />
        </template>
        <template #trending-clips>
          <LazyTrendingClips hydrate-on-visible />
        </template>
        <template #top-clips>
          <LazyTopClips hydrate-on-visible />
        </template>
        <template #followed-channels>
          <LazyFollowedChannels hydrate-on-visible />
        </template>
      </UTabs>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()

const visitedPagesStore = useVisitedPagesStore()
const guestAccess = ref(false)

onMounted(() => {
  if (visitedPagesStore.pages.length > 0) {
    guestAccess.value = true
  }
})

useSeoMeta({
  title: '',
})

const route = useRoute()
const router = useRouter()

const tabs = computed(() => {
  const baseTabs = [
    {
      id: 'search',
      label: 'Search',
      icon: 'i-heroicons-magnifying-glass',
      slot: 'search',
    },
    {
      slot: 'trending-clips',
      id: 'trending-clips',
      label: 'Trending Clips',
      icon: 'i-heroicons-fire',
    },
  ]
  if (loggedIn.value) {
    baseTabs.push(
      {
        slot: 'top-clips',
        id: 'top-clips',
        label: 'Personalized Feed',
        icon: 'i-heroicons-sparkles',
      },
      {
        slot: 'followed-channels',
        id: 'followed-channels',
        label: 'Followed Channels',
        icon: 'i-heroicons-heart',
      },
    )
  }
  return baseTabs
})

const selected = computed({
  get() {
    const index = tabs.value.findIndex(item => item.id === route.query.tab)
    if (index === -1)
      return '0'

    return index.toString()
  },
  set(value) {
    if (tabs.value[Number(value)]) {
      if (value === '0') {
        router.replace({
          query: { },
          hash: '',
        })
      }
      else {
        router.replace({
          query: { tab: tabs.value[Number(value)]?.id ?? '' },
          hash: '',
        })
      }
    }
  },
})

const links = computed(() => {
  return tabs.value.map((tab, index) => ({
    ...tab,
    active: selected.value === index.toString(),
    onSelect: () => selected.value = index.toString(),
  }))
})

if (route.query.clip) {
  const { data: clipData } = await useFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${route.query.clip}`)
  const clip = clipData.value?.data?.[0]
  if (clip) {
    const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.id}&parent=meta.tag&autoplay=true`
    const clipDescription = `Watch this clip from ${clip.broadcaster_name}: "${clip.title}". Better Clips🎬`
    useSeoMeta({
      title: `${clip.title} - ${clip.broadcaster_name}`,
      description: clipDescription,
      ogTitle: `${clip.title} - ${clip.broadcaster_name}`,
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

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
