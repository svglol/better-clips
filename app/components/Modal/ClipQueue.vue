<template>
  <div
    v-if="clips && clips.length > 0"
    ref="container"
    class="relative w-full h-screen overflow-y-auto snap-y snap-mandatory !outline-none"
    tabindex="0"
    @scroll="handleScroll"
  >
    <div
      v-for="(clip, index) in clips"
      :key="clip.id"
      class="w-full h-screen flex justify-center items-center relative  snap-center"
      :style="{
        backgroundImage: `url(${clip.thumbnail_url || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
      <div class="absolute inset-0 backdrop-blur-xl bg-black/30 size-full" />

      <Transition name="fade">
        <video
          v-if="index === currentIndex - 1 || index === currentIndex + 1"
          class="w-full aspect-video my-auto relative z-10"
          :src="videoUrls.get(clip.id)"
          muted
        />

        <video
          v-else-if="index === currentIndex"
          ref="videoRefs"
          class="w-full aspect-video my-auto relative z-10 "
          :src="videoUrls.get(clip.id)"
          :volume="volume / 100"
          autoplay
          :loop="!autoPlayEnabled"
          :muted="isMuted"
          @timeupdate="updateProgress"
          @click="togglePlayPause"
          @ended="handleVideoEnded(index)"
        />
      </Transition>
    </div>
  </div>

  <div v-else class="flex justify-center items-center h-screen">
    No clips available
  </div>

  <div v-if="clips && clips.length > 0" class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full bg-(--ui-bg-elevated)/75 backdrop-blur flex flex-col z-20">
    <UProgress v-model="currentTime" :max="duration" :ui="{ base: 'rounded-none' }" animation="carousel" size="xs" />
    <div class="flex flex-row items-start justify-between gap-4 p-4">
      <div class="flex max-w-full flex-col gap-1 overflow-hidden">
        <span class="text-(--ui-text-muted) text-xs">{{ formatTime(new Date(clips[currentIndex]?.created_at || Date.now())) }}</span>
        <h2 class="text-(--ui-text-highlighted) max-w-full truncate text-base font-semibold leading-tight">
          {{ clips[currentIndex]?.title }}
        </h2>
        <p class="text-(--ui-text-dimmed) text-xs leading-tight">
          <span class="inline-flex flex-wrap items-center gap-x-1">
            Clipped by
            <NuxtLink :to="`https://twitch.tv/${clips[currentIndex]?.creator_name.replace(' ', '')}`" target="_blank" class="text-primary hover:underline">
              {{ clips[currentIndex]?.creator_name }}
            </NuxtLink>
            on
            <NuxtLink :to="`/channel/${clips[currentIndex]?.broadcaster_name.replace(' ', '')}`" target="_blank" class="text-primary hover:underline">
              {{ clips[currentIndex]?.broadcaster_name }}
            </NuxtLink>
            •
            <span>{{ formatNumberWithCommas(clips[currentIndex]?.view_count ?? 0) }} views</span>
          </span>
        </p>
      </div>
      <div class="flex flex-shrink-0 flex-row gap-2">
        <UTooltip v-if="videoUrls.get(clips[currentIndex]?.id || '')" text="Download">
          <UButton icon="i-heroicons-arrow-down-tray" color="primary" :to="videoUrls.get(clips[currentIndex]?.id || '')" target="_blank" variant="ghost" />
        </UTooltip>
        <UTooltip text="Share">
          <UButton
            icon="i-heroicons-share" color="primary" variant="ghost" @click=" share({
              title: clips[currentIndex]?.title,
              url: clips[currentIndex]?.url,
            })"
          />
        </UTooltip>
        <UTooltip v-if="clips[currentIndex]?.url" text="Open on Twitch">
          <UButton icon="ic:sharp-launch" color="primary" variant="ghost" :to="clips[currentIndex]?.url" target="_blank" />
        </UTooltip>
      </div>
    </div>
    <div class="flex gap-2 rounded-lg justify-between pb-2 px-4">
      <div class="flex flex-row gap-2">
        <UTooltip :text="autoPlayEnabled ? 'Disable Autoplay' : 'Enable Autoplay'">
          <UButton
            variant="ghost"
            :icon="autoPlayEnabled ? 'i-heroicons-pause-circle' : 'i-heroicons-play-circle'"
            @click="toggleAutoPlay"
          />
        </UTooltip>
        <UTooltip :text="isPlaying ? 'Pause' : 'Play'">
          <UButton
            variant="ghost"
            :icon="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
            @click="togglePlayPause"
          />
        </UTooltip>
      </div>
      <div class="flex flex-row gap-2">
        <UTooltip :text="isMuted ? 'Unmute' : 'Mute'">
          <UButton
            variant="ghost"
            :icon="isMuted ? 'heroicons:speaker-x-mark' : 'heroicons:speaker-wave'"
            @click="toggleMute"
          />
        </UTooltip>
        <USlider v-model="volume" class="hidden md:flex  md:w-48" size="sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const props = defineProps<{
  clips: TwitchClip[]
}>()

const emit = defineEmits(['loadMore'])

const currentIndex = ref(0)
const container = ref<HTMLElement | null>(null)
const videoRefs = ref<HTMLVideoElement[]>([])
const autoPlayEnabled = ref(true)
const isPlaying = ref(true)
const isMuted = ref(true)
const volume = useState('volume', () => 100)

const duration = ref(0)
const currentTime = ref(0)
const { undo: undoVolume } = useRefHistory(volume)

const videoUrls = ref(new Map<string, string>())

watchImmediate(currentIndex, async () => {
  duration.value = 0

  if (currentIndex.value === props.clips.length - 5) {
    emit('loadMore')
  }
  if (currentIndex.value >= videoUrls.value.size - 3) {
    await loadVideoUrlsForRange(videoUrls.value.size, 3)
  }
})

watchEffect(() => {
  if (volume.value === 0) {
    isMuted.value = true
  }
  else {
    isMuted.value = false
  }
})

async function loadVideoUrlsForRange(startIndex: number, count: number) {
  const clipsToLoad = props.clips.slice(startIndex, startIndex + count)
  for (const clip of clipsToLoad) {
    if (!videoUrls.value.has(clip.id)) {
      try {
        const url = await getUrl(clip.id)
        if (url) {
          videoUrls.value.set(clip.id, url)
        }
      }
      catch (error) {
        console.error(`Failed to load URL for clip ${clip.id}:`, error)
      }
    }
  }
}

async function getUrl(clipId: string) {
  try {
    const data = await $fetch(`/api/twitch/clips/video/${clipId}`)
    return data
  }
  catch (error) {
    console.error(`Error fetching URL for clip ${clipId}:`, error)
    throw error
  }
}

function nextClip() {
  if (currentIndex.value < props.clips.length - 1) {
    currentIndex.value++
    scrollToCurrentClip()
  }
}

function scrollToCurrentClip() {
  if (container.value) {
    const nextElement = container.value.children[currentIndex.value]
    nextElement?.scrollIntoView({ behavior: 'smooth' })
  }
}

function toggleAutoPlay() {
  autoPlayEnabled.value = !autoPlayEnabled.value
}

function togglePlayPause() {
  isPlaying.value = !isPlaying.value
  const video = videoRefs.value[0]
  if (video) {
    isPlaying.value ? video.play() : video.pause()
  }
}

watchDeep(videoRefs, () => {
  const video = videoRefs.value[0]
  if (video) {
    isPlaying.value ? video.play() : video.pause()
  }
})

function toggleMute() {
  isMuted.value = !isMuted.value

  if (isMuted.value) {
    volume.value = 0
  }
  else {
    undoVolume()
  }
}

function handleVideoEnded(endedIndex: number) {
  if (!props.clips || props.clips.length === 0)
    return

  if (autoPlayEnabled.value && endedIndex === currentIndex.value && currentIndex.value < props.clips.length - 1) {
    nextClip()
  }
}

function handleScroll() {
  if (!container.value || !props.clips || props.clips.length === 0)
    return

  const containerRect = container.value.getBoundingClientRect()
  const centerY = containerRect.height / 4

  for (let i = 0; i < container.value.children.length; i++) {
    const element = container.value.children[i]
    const elementRect = element?.getBoundingClientRect()

    if (elementRect && elementRect.top <= centerY && elementRect.bottom >= centerY) {
      currentIndex.value = i
      break
    }
  }
}

onMounted(() => {
  if (container.value) {
    container.value.addEventListener('scroll', handleScroll)
    container.value.focus()
  }
})

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('scroll', handleScroll)
  }
})

function formatTime(time: Date | undefined): string {
  if (!time)
    return ''

  const now = new Date()
  const hoursDiff = (now.getTime() - time.getTime()) / (1000 * 60 * 60)

  if (hoursDiff < 20) {
    return formatTimeAgo(time)
  }
  else {
    return time.toLocaleDateString()
  }
}

function formatNumberWithCommas(number: number): string {
  return new Intl.NumberFormat().format(number)
}

const { share } = useShare()

function updateProgress() {
  const video = videoRefs.value[0]
  if (video) {
    duration.value = video.duration
    currentTime.value = video.currentTime
  }
}
</script>

<style scoped>
video::-webkit-media-controls-cast-button {
    display: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  position: absolute;
}
</style>
